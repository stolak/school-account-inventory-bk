import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode } from "../utils/assessmentHttp";
import { Prisma } from "@prisma/client";

const include = {
  vehicleRoutes: {
    select: {
      id: true,
      vehicleId: true,
      vehicle: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          status: true,
        },
      },
    },
  },
  routeBustops: {
    select: {
      id: true,
      bustopId: true,
      stopOrder: true,
      bustop: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          status: true,
        },
      },
    },
    orderBy: { stopOrder: "asc" as const },
  },
  _count: {
    select: {
      vehicleRoutes: true,
      routeBustops: true,
      studentTransports: true,
      vehicleTrips: true,
    },
  },
} satisfies Prisma.RouteInclude;

type Row = Prisma.RouteGetPayload<{ include: typeof include }>;

export interface RouteData {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  vehicleRoutes: Row["vehicleRoutes"];
  routeBustops: Row["routeBustops"];
  _count: Row["_count"];
}

function mapRow(row: Row): RouteData {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    vehicleRoutes: row.vehicleRoutes,
    routeBustops: row.routeBustops,
    _count: row._count,
  };
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export class RouteService {
  private prisma = prisma;

  async create(input: { name: string; description?: string | null }): Promise<RouteData> {
    const name = input.name.trim();
    if (!name) throw new Error("name is required");

    try {
      const row = await this.prisma.route.create({
        data: {
          name,
          description:
            input.description === undefined || input.description === null
              ? null
              : String(input.description).trim() || null,
        },
        include,
      });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Route name already exists");
      }
      throw e;
    }
  }

  async list(params: {
    q?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    routes: RouteData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.RouteWhereInput = {};
    if (params.q?.trim()) {
      const q = params.q.trim();
      where.OR = [{ name: { contains: q } }, { description: { contains: q } }];
    }

    const [total, rows] = await Promise.all([
      this.prisma.route.count({ where }),
      this.prisma.route.findMany({
        where,
        include,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      routes: rows.map(mapRow),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getById(id: string): Promise<RouteData | null> {
    const row = await this.prisma.route.findUnique({ where: { id }, include });
    return row ? mapRow(row) : null;
  }

  async update(
    id: string,
    input: { name?: string; description?: string | null }
  ): Promise<RouteData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Route not found");

    if (input.name !== undefined && !input.name.trim()) {
      throw new Error("name cannot be empty");
    }

    try {
      const row = await this.prisma.route.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.description !== undefined
            ? {
                description:
                  input.description === null ? null : String(input.description).trim() || null,
              }
            : {}),
        },
        include,
      });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Route not found");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Route name already exists");
      }
      throw e;
    }
  }

  async delete(id: string): Promise<RouteData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Route not found");

    const assignmentCount = await this.prisma.vehicleRoute.count({ where: { routeId: id } });
    if (assignmentCount > 0) {
      throw new Error(
        `Cannot delete route because it is assigned to vehicles (${assignmentCount})`
      );
    }

    try {
      const row = await this.prisma.route.delete({ where: { id }, include });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Route not found");
      }
      throw e;
    }
  }
}

export const routeService = new RouteService();
