import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode, parseDecimalNonNegative } from "../utils/assessmentHttp";
import { Prisma } from "@prisma/client";

const include = {
  vehicle: {
    select: { id: true, vehicleNumber: true, vehicleType: true, status: true },
  },
  route: { select: { id: true, name: true } },
  driver: { select: { id: true, StaffNumber: true, name: true, email: true } },
} satisfies Prisma.VehicleTripInclude;

type Row = Prisma.VehicleTripGetPayload<{ include: typeof include }>;

export interface VehicleTripData {
  id: string;
  vehicleId: string;
  vehicle: Row["vehicle"];
  routeId: string;
  route: Row["route"];
  driverId: string;
  driver: Row["driver"];
  startTime: Date;
  endTime: Date | null;
  latitude: string | null;
  longitude: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapRow(row: Row): VehicleTripData {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    vehicle: row.vehicle,
    routeId: row.routeId,
    route: row.route,
    driverId: row.driverId,
    driver: row.driver,
    startTime: row.startTime,
    endTime: row.endTime,
    latitude: row.latitude?.toString() ?? null,
    longitude: row.longitude?.toString() ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseDateTime(value: Date | string, fieldName: string): Date {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid ${fieldName}`);
  return parsed;
}

function parseOptionalCoordinate(
  value: string | number | null | undefined,
  fieldName: string
): Prisma.Decimal | null {
  if (value === undefined || value === null || value === "") return null;
  return parseDecimalNonNegative(value, fieldName);
}

export class VehicleTripService {
  private prisma = prisma;

  private async assertRefs(input: {
    vehicleId: string;
    routeId: string;
    driverId: string;
  }): Promise<void> {
    const [vehicle, route, driver] = await Promise.all([
      this.prisma.vehicle.findUnique({ where: { id: input.vehicleId }, select: { id: true } }),
      this.prisma.route.findUnique({ where: { id: input.routeId }, select: { id: true } }),
      this.prisma.staff.findUnique({ where: { id: input.driverId }, select: { id: true } }),
    ]);
    if (!vehicle) throw new Error("Invalid vehicleId");
    if (!route) throw new Error("Invalid routeId");
    if (!driver) throw new Error("Invalid driverId");
  }

  async create(input: {
    vehicleId: string;
    routeId: string;
    driverId: string;
    startTime: Date | string;
    endTime?: Date | string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
  }): Promise<VehicleTripData> {
    const vehicleId = input.vehicleId.trim();
    const routeId = input.routeId.trim();
    const driverId = input.driverId.trim();
    if (!vehicleId || !routeId || !driverId) {
      throw new Error("vehicleId, routeId, and driverId are required");
    }
    if (input.startTime === undefined || input.startTime === null) {
      throw new Error("startTime is required");
    }

    await this.assertRefs({ vehicleId, routeId, driverId });

    const startTime = parseDateTime(input.startTime, "startTime");
    const endTime =
      input.endTime === undefined || input.endTime === null
        ? null
        : parseDateTime(input.endTime, "endTime");
    if (endTime && endTime < startTime) {
      throw new Error("endTime must be greater than or equal to startTime");
    }

    const row = await this.prisma.vehicleTrip.create({
      data: {
        vehicleId,
        routeId,
        driverId,
        startTime,
        endTime,
        latitude: parseOptionalCoordinate(input.latitude, "latitude"),
        longitude: parseOptionalCoordinate(input.longitude, "longitude"),
      },
      include,
    });
    return mapRow(row);
  }

  async list(params: {
    vehicleId?: string;
    routeId?: string;
    driverId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.VehicleTripWhereInput = {};
    if (params.vehicleId?.trim()) where.vehicleId = params.vehicleId.trim();
    if (params.routeId?.trim()) where.routeId = params.routeId.trim();
    if (params.driverId?.trim()) where.driverId = params.driverId.trim();

    const startTime: Prisma.DateTimeFilter = {};
    if (params.fromDate?.trim()) startTime.gte = parseDateTime(params.fromDate.trim(), "fromDate");
    if (params.toDate?.trim()) startTime.lte = parseDateTime(params.toDate.trim(), "toDate");
    if (Object.keys(startTime).length > 0) where.startTime = startTime;

    const [total, rows] = await Promise.all([
      this.prisma.vehicleTrip.count({ where }),
      this.prisma.vehicleTrip.findMany({
        where,
        include,
        orderBy: { startTime: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      vehicleTrips: rows.map(mapRow),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async getById(id: string): Promise<VehicleTripData | null> {
    const row = await this.prisma.vehicleTrip.findUnique({ where: { id }, include });
    return row ? mapRow(row) : null;
  }

  async update(
    id: string,
    input: {
      endTime?: Date | string | null;
      latitude?: string | number | null;
      longitude?: string | number | null;
      driverId?: string;
      routeId?: string;
    }
  ): Promise<VehicleTripData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Vehicle trip not found");

    if (input.driverId !== undefined) {
      if (!input.driverId.trim()) throw new Error("driverId cannot be empty");
      const driver = await this.prisma.staff.findUnique({
        where: { id: input.driverId.trim() },
        select: { id: true },
      });
      if (!driver) throw new Error("Invalid driverId");
    }
    if (input.routeId !== undefined) {
      if (!input.routeId.trim()) throw new Error("routeId cannot be empty");
      const route = await this.prisma.route.findUnique({
        where: { id: input.routeId.trim() },
        select: { id: true },
      });
      if (!route) throw new Error("Invalid routeId");
    }

    const endTime =
      input.endTime === undefined
        ? undefined
        : input.endTime === null
          ? null
          : parseDateTime(input.endTime, "endTime");
    if (endTime && endTime < existing.startTime) {
      throw new Error("endTime must be greater than or equal to startTime");
    }

    try {
      const row = await this.prisma.vehicleTrip.update({
        where: { id },
        data: {
          ...(endTime !== undefined ? { endTime } : {}),
          ...(input.latitude !== undefined
            ? { latitude: parseOptionalCoordinate(input.latitude, "latitude") }
            : {}),
          ...(input.longitude !== undefined
            ? { longitude: parseOptionalCoordinate(input.longitude, "longitude") }
            : {}),
          ...(input.driverId !== undefined ? { driverId: input.driverId.trim() } : {}),
          ...(input.routeId !== undefined ? { routeId: input.routeId.trim() } : {}),
        },
        include,
      });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Vehicle trip not found");
      }
      throw e;
    }
  }

  async delete(id: string): Promise<VehicleTripData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Vehicle trip not found");

    try {
      const row = await this.prisma.vehicleTrip.delete({ where: { id }, include });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Vehicle trip not found");
      }
      throw e;
    }
  }
}

export const vehicleTripService = new VehicleTripService();
