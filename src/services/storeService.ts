import prisma from "../utils/prisma";
import { Prisma, Status } from "@prisma/client";

export interface StoreData {
  id: string;
  name: string;
  description: string | null;
  status: Status;
  managerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  manager?: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  _count?: { inventoryTransactions: number };
}

export interface ListStoresParams {
  q?: string;
  status?: Status | "All";
  managerId?: string;
  page?: number;
  limit?: number;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isPrismaKnownErrorWithCode(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as { code: unknown }).code === "string";
}

const storeInclude = {
  manager: { select: { id: true, firstName: true, lastName: true, email: true } },
  _count: { select: { inventoryTransactions: true } },
} satisfies Prisma.StoreInclude;

export class StoreService {
  private prisma = prisma;

  private async assertManagerExists(managerId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: managerId }, select: { id: true } });
    if (!u) throw new Error("Invalid managerId");
  }

  async createStore(input: {
    name: string;
    description?: string | null;
    status?: Status;
    managerId?: string | null;
  }): Promise<StoreData> {
    const name = input.name.trim();
    if (!name) throw new Error("name is required");

    if (input.managerId) await this.assertManagerExists(input.managerId);

    try {
      return await this.prisma.store.create({
        data: {
          name,
          description: input.description === undefined || input.description === null ? null : String(input.description),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.managerId !== undefined ? { managerId: input.managerId } : {}),
        },
        include: storeInclude,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Store name already exists");
      }
      throw e;
    }
  }

  async listStores(params: ListStoresParams = {}): Promise<{
    stores: StoreData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.StoreWhereInput = {};

    if (params.status === undefined) {
      where.status = Status.Active;
    } else if (params.status !== "All") {
      where.status = params.status;
    }

    if (params.managerId) {
      where.managerId = params.managerId;
    }

    if (params.q?.trim()) {
      const q = params.q.trim();
      where.OR = [{ name: { contains: q } }, { description: { contains: q } }];
    }

    const [total, rows] = await Promise.all([
      this.prisma.store.count({ where }),
      this.prisma.store.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: storeInclude,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { stores: rows, pagination: { page, limit, total, totalPages } };
  }

  async getStoreById(id: string): Promise<StoreData | null> {
    return await this.prisma.store.findUnique({
      where: { id },
      include: storeInclude,
    });
  }

  async updateStore(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      status?: Status;
      managerId?: string | null;
    }
  ): Promise<StoreData> {
    if (input.name !== undefined && !input.name.trim()) {
      throw new Error("name cannot be empty");
    }

    if (input.managerId) await this.assertManagerExists(input.managerId);

    const existing = await this.getStoreById(id);
    if (!existing) throw new Error("Store not found");

    try {
      return await this.prisma.store.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.description !== undefined
            ? { description: input.description === null ? null : String(input.description) }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.managerId !== undefined ? { managerId: input.managerId } : {}),
          updatedAt: new Date(),
        },
        include: storeInclude,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Store not found");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Store name already exists");
      }
      throw e;
    }
  }

  async deleteStore(id: string): Promise<StoreData> {
    const existing = await this.getStoreById(id);
    if (!existing) throw new Error("Store not found");

    try {
      return await this.prisma.store.delete({
        where: { id },
        include: storeInclude,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2003") {
        throw new Error("Store cannot be deleted while inventory transactions reference it");
      }
      throw e;
    }
  }
}

export const storeService = new StoreService();
