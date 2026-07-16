import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode, parseDecimalNonNegative } from "../utils/assessmentHttp";
import { Direction, Prisma, VehicleTripStatus } from "@prisma/client";
import { resolveStaffId } from "../utils/staffContext";

const include = {
  vehicle: {
    select: { id: true, vehicleNumber: true, vehicleType: true, vehicleMake: true, status: true },
  },
  vehicleTripRoutes: {
    select: {
      id: true,
      routeId: true,
      route: { select: { id: true, name: true, status: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  driver: { select: { id: true, StaffNumber: true, name: true, email: true } },
  _count: { select: { studentTransportationRegisters: true } },
} satisfies Prisma.VehicleTripInclude;

type Row = Prisma.VehicleTripGetPayload<{ include: typeof include }>;

export interface VehicleTripRouteData {
  id: string;
  routeId: string;
  route: Row["vehicleTripRoutes"][number]["route"];
}

export interface VehicleTripData {
  id: string;
  vehicleId: string;
  vehicle: Row["vehicle"];
  routeIds: string[];
  routes: VehicleTripRouteData[];
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
    routeIds: row.vehicleTripRoutes.map((tripRoute) => tripRoute.routeId),
    routes: row.vehicleTripRoutes.map((tripRoute) => ({
      id: tripRoute.id,
      routeId: tripRoute.routeId,
      route: tripRoute.route,
    })),
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

function parseRouteIds(routeIds: string[]): string[] {
  if (!Array.isArray(routeIds) || routeIds.length === 0) {
    throw new Error("routeIds must be a non-empty array");
  }

  const normalized = routeIds.map((id, index) => {
    if (typeof id !== "string" || !id.trim()) {
      throw new Error(`routeIds[${index}] must be a non-empty string`);
    }
    return id.trim();
  });

  const uniqueRouteIds = [...new Set(normalized)];
  if (uniqueRouteIds.length !== normalized.length) {
    throw new Error("Duplicate routeId in routeIds");
  }

  return uniqueRouteIds;
}

const ACTIVE_TRIP_STATUSES: VehicleTripStatus[] = [
  VehicleTripStatus.Pending,
  VehicleTripStatus.InProgress,
];

function isActiveTripStatus(status: VehicleTripStatus): boolean {
  return ACTIVE_TRIP_STATUSES.includes(status);
}

export class VehicleTripService {
  private prisma = prisma;

  private async assertRefs(input: {
    vehicleId: string;
    routeIds: string[];
    driverId: string;
  }): Promise<void> {
    const [vehicle, driver, routes] = await Promise.all([
      this.prisma.vehicle.findUnique({ where: { id: input.vehicleId }, select: { id: true } }),
      this.prisma.staff.findUnique({ where: { id: input.driverId }, select: { id: true } }),
      this.prisma.route.findMany({
        where: { id: { in: input.routeIds } },
        select: { id: true },
      }),
    ]);
    if (!vehicle) throw new Error("Invalid vehicleId");
    if (!driver) throw new Error("Invalid driverId");
    if (routes.length !== input.routeIds.length) {
      throw new Error("Invalid routeId in routeIds");
    }
  }

  /** Pending and InProgress count as active; a vehicle may have only one. */
  private async assertNoActiveTripForVehicle(
    vehicleId: string,
    excludeTripId?: string
  ): Promise<void> {
    const active = await this.prisma.vehicleTrip.findFirst({
      where: {
        vehicleId,
        status: { in: ACTIVE_TRIP_STATUSES },
        ...(excludeTripId ? { id: { not: excludeTripId } } : {}),
      },
      select: { id: true, status: true },
    });
    if (active) {
      throw new Error(
        "Vehicle already has an active trip (Pending or InProgress). Complete or cancel it before starting a new one"
      );
    }
  }

  private async replaceTripRoutes(vehicleTripId: string, routeIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.vehicleTripRoute.deleteMany({ where: { vehicleTripId } }),
      ...routeIds.map((routeId) =>
        this.prisma.vehicleTripRoute.create({
          data: { vehicleTripId, routeId },
        })
      ),
    ]);
  }

  async create(input: {
    vehicleId: string;
    routeIds: string[];
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
    const routeIds = parseRouteIds(input.routeIds);
    if (!vehicleId) {
      throw new Error("vehicleId and routeIds are required");
    }

    let driverId =
      input.driverId === undefined || input.driverId === null ? "" : String(input.driverId).trim();

    if (!driverId) {
      const userId = input.authenticatedUserId?.trim();
      if (!userId) {
        throw new Error("Unauthorized");
      }
      driverId = await resolveStaffId(userId);
    }

    await this.assertRefs({ vehicleId, routeIds, driverId });

    const status = input.status ?? VehicleTripStatus.Pending;
    if (isActiveTripStatus(status)) {
      await this.assertNoActiveTripForVehicle(vehicleId);
    }

    const startTime =
      input.startTime === undefined || input.startTime === null
        ? null
        : parseDateTime(input.startTime, "startTime");
    const endTime =
      input.endTime === undefined || input.endTime === null
        ? null
        : parseDateTime(input.endTime, "endTime");
    if (startTime && endTime && startTime > endTime) {
      throw new Error("startTime cannot be greater than endTime");
    }

    const row = await this.prisma.vehicleTrip.create({
      data: {
        vehicleId,
        driverId,
        startTime,
        endTime,
        latitude: parseOptionalCoordinate(input.latitude, "latitude"),
        longitude: parseOptionalCoordinate(input.longitude, "longitude"),
        ...(input.tripDirection !== undefined ? { tripDirection: input.tripDirection } : {}),
        status,
        vehicleTripRoutes: {
          create: routeIds.map((routeId) => ({ routeId })),
        },
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
    if (params.routeId?.trim()) {
      where.vehicleTripRoutes = { some: { routeId: params.routeId.trim() } };
    }
    if (params.driverId?.trim()) where.driverId = params.driverId.trim();
    if (params.status !== undefined) where.status = params.status;
    if (params.tripDirection !== undefined) where.tripDirection = params.tripDirection;

    const dateFilter: Prisma.DateTimeFilter = {};
    if (params.fromDate?.trim()) dateFilter.gte = parseDateTime(params.fromDate.trim(), "fromDate");
    if (params.toDate?.trim()) dateFilter.lte = parseDateTime(params.toDate.trim(), "toDate");
    if (Object.keys(dateFilter).length > 0) {
      where.OR = [{ startTime: dateFilter }, { createdAt: dateFilter }];
    }

    const [total, rows] = await Promise.all([
      this.prisma.vehicleTrip.count({ where }),
      this.prisma.vehicleTrip.findMany({
        where,
        include,
        orderBy: [{ startTime: "desc" }, { createdAt: "desc" }],
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
      routeIds?: string[];
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

    let nextRouteIds: string[] | undefined;
    if (input.routeIds !== undefined) {
      nextRouteIds = parseRouteIds(input.routeIds);
      const routes = await this.prisma.route.findMany({
        where: { id: { in: nextRouteIds } },
        select: { id: true },
      });
      if (routes.length !== nextRouteIds.length) {
        throw new Error("Invalid routeId in routeIds");
      }
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
    if (effectiveStart && effectiveEnd && effectiveStart > effectiveEnd) {
      throw new Error("startTime cannot be greater than endTime");
    }

    let nextStatus = input.status ?? existing.status;
    if (effectiveEnd !== null) {
      nextStatus =
        existing._count.studentTransportationRegisters > 0
          ? VehicleTripStatus.Completed
          : VehicleTripStatus.Cancelled;
    }

    if (isActiveTripStatus(nextStatus)) {
      await this.assertNoActiveTripForVehicle(existing.vehicleId, id);
    }

    try {
      if (nextRouteIds !== undefined) {
        await this.replaceTripRoutes(id, nextRouteIds);
      }

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
          ...(input.tripDirection !== undefined ? { tripDirection: input.tripDirection } : {}),
          ...(input.status !== undefined || effectiveEnd !== null ? { status: nextStatus } : {}),
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

    const registerCount = await this.prisma.studentTransportationRegister.count({
      where: { vehicleTripId: id },
    });
    if (registerCount > 0) {
      throw new Error(
        `Cannot delete vehicle trip because it has student transportation registers (${registerCount})`
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
