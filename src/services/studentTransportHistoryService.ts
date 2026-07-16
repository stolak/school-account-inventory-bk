import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode, parseDecimalNonNegative } from "../utils/assessmentHttp";
import { Direction, Prisma } from "@prisma/client";

const include = {
  student: {
    select: {
      id: true,
      admissionNumber: true,
      firstName: true,
      lastName: true,
      status: true,
    },
  },
  bustop: { select: { id: true, name: true, latitude: true, longitude: true } },
  vehicleTrip: {
    select: {
      id: true,
      vehicleId: true,
      routeId: true,
      driverId: true,
      startTime: true,
      endTime: true,
      status: true,
      tripDirection: true,
      vehicle: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          vehicleMake: true,
          status: true,
        },
      },
      route: { select: { id: true, name: true, status: true } },
      driver: { select: { id: true, StaffNumber: true, name: true, email: true } },
    },
  },
} satisfies Prisma.StudentTransportHistoryInclude;

type Row = Prisma.StudentTransportHistoryGetPayload<{ include: typeof include }>;

export interface StudentTransportHistoryData {
  id: string;
  studentId: string;
  student: Row["student"];
  nearestBustopId: string;
  bustop: Row["bustop"];
  vehicleTripId: string;
  vehicleTrip: Row["vehicleTrip"];
  startTime: Date;
  endTime: Date | null;
  direction: Direction;
  pickUpLatitude: string | null;
  pickUpLongitude: string | null;
  dropOffLatitude: string | null;
  dropOffLongitude: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapRow(row: Row): StudentTransportHistoryData {
  return {
    id: row.id,
    studentId: row.studentId,
    student: row.student,
    nearestBustopId: row.nearestBustopId,
    bustop: row.bustop,
    vehicleTripId: row.vehicleTripId,
    vehicleTrip: row.vehicleTrip,
    startTime: row.startTime,
    endTime: row.endTime,
    direction: row.direction,
    pickUpLatitude: row.pickUpLatitude?.toString() ?? null,
    pickUpLongitude: row.pickUpLongitude?.toString() ?? null,
    dropOffLatitude: row.dropOffLatitude?.toString() ?? null,
    dropOffLongitude: row.dropOffLongitude?.toString() ?? null,
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

export class StudentTransportHistoryService {
  private prisma = prisma;

  private async assertRefs(input: {
    studentId: string;
    nearestBustopId: string;
    vehicleTripId: string;
  }): Promise<void> {
    const [student, bustop, vehicleTrip] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: input.studentId }, select: { id: true } }),
      this.prisma.bustop.findUnique({ where: { id: input.nearestBustopId }, select: { id: true } }),
      this.prisma.vehicleTrip.findUnique({
        where: { id: input.vehicleTripId },
        select: { id: true, routeId: true },
      }),
    ]);
    if (!student) throw new Error("Invalid studentId");
    if (!bustop) throw new Error("Invalid nearestBustopId");
    if (!vehicleTrip) throw new Error("Invalid vehicleTripId");

    const routeBustop = await this.prisma.routeBustop.findUnique({
      where: {
        routeId_bustopId: { routeId: vehicleTrip.routeId, bustopId: input.nearestBustopId },
      },
      select: { id: true },
    });
    if (!routeBustop) {
      throw new Error("nearestBustopId is not assigned to the vehicle trip route");
    }
  }

  async create(input: {
    studentId: string;
    nearestBustopId: string;
    vehicleTripId: string;
    startTime: Date | string;
    endTime?: Date | string | null;
    direction?: Direction;
    pickUpLatitude?: string | number | null;
    pickUpLongitude?: string | number | null;
    dropOffLatitude?: string | number | null;
    dropOffLongitude?: string | number | null;
  }): Promise<StudentTransportHistoryData> {
    const studentId = input.studentId.trim();
    const nearestBustopId = input.nearestBustopId.trim();
    const vehicleTripId = input.vehicleTripId.trim();

    if (!studentId || !nearestBustopId || !vehicleTripId) {
      throw new Error("studentId, nearestBustopId, and vehicleTripId are required");
    }
    if (input.startTime === undefined || input.startTime === null) {
      throw new Error("startTime is required");
    }

    await this.assertRefs({ studentId, nearestBustopId, vehicleTripId });

    const startTime = parseDateTime(input.startTime, "startTime");
    const endTime =
      input.endTime === undefined || input.endTime === null
        ? null
        : parseDateTime(input.endTime, "endTime");
    if (endTime && endTime < startTime) {
      throw new Error("endTime must be greater than or equal to startTime");
    }

    const row = await this.prisma.studentTransportHistory.create({
      data: {
        studentId,
        nearestBustopId,
        vehicleTripId,
        startTime,
        endTime,
        ...(input.direction !== undefined ? { direction: input.direction } : {}),
        pickUpLatitude: parseOptionalCoordinate(input.pickUpLatitude, "pickUpLatitude"),
        pickUpLongitude: parseOptionalCoordinate(input.pickUpLongitude, "pickUpLongitude"),
        dropOffLatitude: parseOptionalCoordinate(input.dropOffLatitude, "dropOffLatitude"),
        dropOffLongitude: parseOptionalCoordinate(input.dropOffLongitude, "dropOffLongitude"),
      },
      include,
    });
    return mapRow(row);
  }

  async list(
    params: {
      studentId?: string;
      nearestBustopId?: string;
      vehicleTripId?: string;
      direction?: Direction;
      fromDate?: string;
      toDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.StudentTransportHistoryWhereInput = {};
    if (params.studentId?.trim()) where.studentId = params.studentId.trim();
    if (params.nearestBustopId?.trim()) where.nearestBustopId = params.nearestBustopId.trim();
    if (params.vehicleTripId?.trim()) where.vehicleTripId = params.vehicleTripId.trim();
    if (params.direction !== undefined) where.direction = params.direction;

    const startTime: Prisma.DateTimeFilter = {};
    if (params.fromDate?.trim()) startTime.gte = parseDateTime(params.fromDate.trim(), "fromDate");
    if (params.toDate?.trim()) startTime.lte = parseDateTime(params.toDate.trim(), "toDate");
    if (Object.keys(startTime).length > 0) where.startTime = startTime;

    const [total, rows] = await Promise.all([
      this.prisma.studentTransportHistory.count({ where }),
      this.prisma.studentTransportHistory.findMany({
        where,
        include,
        orderBy: { startTime: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      studentTransportHistories: rows.map(mapRow),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async getById(id: string): Promise<StudentTransportHistoryData | null> {
    const row = await this.prisma.studentTransportHistory.findUnique({ where: { id }, include });
    return row ? mapRow(row) : null;
  }

  async update(
    id: string,
    input: {
      endTime?: Date | string | null;
      direction?: Direction;
      pickUpLatitude?: string | number | null;
      pickUpLongitude?: string | number | null;
      dropOffLatitude?: string | number | null;
      dropOffLongitude?: string | number | null;
    }
  ): Promise<StudentTransportHistoryData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student transport history not found");

    if (
      input.endTime === undefined &&
      input.direction === undefined &&
      input.pickUpLatitude === undefined &&
      input.pickUpLongitude === undefined &&
      input.dropOffLatitude === undefined &&
      input.dropOffLongitude === undefined
    ) {
      throw new Error(
        "At least one of endTime, direction, pickUpLatitude, pickUpLongitude, dropOffLatitude, or dropOffLongitude must be provided"
      );
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
      const row = await this.prisma.studentTransportHistory.update({
        where: { id },
        data: {
          ...(endTime !== undefined ? { endTime } : {}),
          ...(input.direction !== undefined ? { direction: input.direction } : {}),
          ...(input.pickUpLatitude !== undefined
            ? { pickUpLatitude: parseOptionalCoordinate(input.pickUpLatitude, "pickUpLatitude") }
            : {}),
          ...(input.pickUpLongitude !== undefined
            ? { pickUpLongitude: parseOptionalCoordinate(input.pickUpLongitude, "pickUpLongitude") }
            : {}),
          ...(input.dropOffLatitude !== undefined
            ? { dropOffLatitude: parseOptionalCoordinate(input.dropOffLatitude, "dropOffLatitude") }
            : {}),
          ...(input.dropOffLongitude !== undefined
            ? {
                dropOffLongitude: parseOptionalCoordinate(
                  input.dropOffLongitude,
                  "dropOffLongitude"
                ),
              }
            : {}),
        },
        include,
      });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student transport history not found");
      }
      throw e;
    }
  }

  async delete(id: string): Promise<StudentTransportHistoryData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student transport history not found");

    try {
      const row = await this.prisma.studentTransportHistory.delete({ where: { id }, include });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student transport history not found");
      }
      throw e;
    }
  }
}

export const studentTransportHistoryService = new StudentTransportHistoryService();
