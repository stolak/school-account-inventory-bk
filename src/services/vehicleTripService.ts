import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode, parseDecimalNonNegative } from "../utils/assessmentHttp";
import { Direction, Prisma, VehicleTripStatus } from "@prisma/client";
import { resolveStaffId } from "../utils/staffContext";

const include = {
  vehicle: {
    select: { id: true, vehicleNumber: true, vehicleType: true, vehicleMake: true, status: true },
  },
  route: { select: { id: true, name: true, status: true } },
  driver: { select: { id: true, StaffNumber: true, name: true, email: true } },
  _count: { select: { studentTransportHistories: true } },
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
  startTime: Date | null;
  endTime: Date | null;
  latitude: string | null;
  longitude: string | null;
  tripDirection: Direction;
  status: VehicleTripStatus;
  createdAt: Date;
  updatedAt: Date;
  _count: Row["_count"];
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
    tripDirection: row.tripDirection,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    _count: row._count,
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
    driverId?: string | null;
    authenticatedUserId?: string | null;
    startTime?: Date | string | null;
    endTime?: Date | string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    tripDirection?: Direction;
    status?: VehicleTripStatus;
  }): Promise<VehicleTripData> {
    const vehicleId = input.vehicleId.trim();
    const routeId = input.routeId.trim();
    if (!vehicleId || !routeId) {
      throw new Error("vehicleId and routeId are required");
    }

    let driverId =
      input.driverId === undefined || input.driverId === null ? "" : String(input.driverId).trim();

    if (!driverId) {
      const userId = input.authenticatedUserId?.trim();
      if (!userId) {
        throw new Error("Unauthorized");
      }
      // Non-staff users are denied by resolveStaffId
      driverId = await resolveStaffId(userId);
    }

    await this.assertRefs({ vehicleId, routeId, driverId });

    const startTime =
      input.startTime === undefined || input.startTime === null
        ? null
        : parseDateTime(input.startTime, "startTime");
    const endTime =
      input.endTime === undefined || input.endTime === null
        ? null
        : parseDateTime(input.endTime, "endTime");
    if (startTime && endTime && endTime < startTime) {
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
        ...(input.tripDirection !== undefined ? { tripDirection: input.tripDirection } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include,
    });
    return mapRow(row);
  }

  async list(
    params: {
      vehicleId?: string;
      routeId?: string;
      driverId?: string;
      status?: VehicleTripStatus;
      tripDirection?: Direction;
      fromDate?: string;
      toDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.VehicleTripWhereInput = {};
    if (params.vehicleId?.trim()) where.vehicleId = params.vehicleId.trim();
    if (params.routeId?.trim()) where.routeId = params.routeId.trim();
    if (params.driverId?.trim()) where.driverId = params.driverId.trim();
    if (params.status !== undefined) where.status = params.status;
    if (params.tripDirection !== undefined) where.tripDirection = params.tripDirection;

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
      startTime?: Date | string | null;
      endTime?: Date | string | null;
      latitude?: string | number | null;
      longitude?: string | number | null;
      driverId?: string;
      routeId?: string;
      tripDirection?: Direction;
      status?: VehicleTripStatus;
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

    const startTime =
      input.startTime === undefined
        ? undefined
        : input.startTime === null
          ? null
          : parseDateTime(input.startTime, "startTime");
    const endTime =
      input.endTime === undefined
        ? undefined
        : input.endTime === null
          ? null
          : parseDateTime(input.endTime, "endTime");

    const effectiveStart = startTime !== undefined ? startTime : existing.startTime;
    const effectiveEnd = endTime !== undefined ? endTime : existing.endTime;
    if (effectiveStart && effectiveEnd && effectiveEnd < effectiveStart) {
      throw new Error("endTime must be greater than or equal to startTime");
    }

    try {
      const row = await this.prisma.vehicleTrip.update({
        where: { id },
        data: {
          ...(startTime !== undefined ? { startTime } : {}),
          ...(endTime !== undefined ? { endTime } : {}),
          ...(input.latitude !== undefined
            ? { latitude: parseOptionalCoordinate(input.latitude, "latitude") }
            : {}),
          ...(input.longitude !== undefined
            ? { longitude: parseOptionalCoordinate(input.longitude, "longitude") }
            : {}),
          ...(input.driverId !== undefined ? { driverId: input.driverId.trim() } : {}),
          ...(input.routeId !== undefined ? { routeId: input.routeId.trim() } : {}),
          ...(input.tripDirection !== undefined ? { tripDirection: input.tripDirection } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
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

    const historyCount = await this.prisma.studentTransportHistory.count({
      where: { vehicleTripId: id },
    });
    if (historyCount > 0) {
      throw new Error(
        `Cannot delete vehicle trip because it has student transport histories (${historyCount})`
      );
    }

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
