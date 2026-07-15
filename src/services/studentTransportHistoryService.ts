import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode } from "../utils/assessmentHttp";
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
      vehicle: {
        select: { id: true, vehicleNumber: true, vehicleType: true, vehicleMake: true, status: true },
      },
      route: { select: { id: true, name: true, status: true } },
      driver: { select: { id: true, StaffNumber: true, name: true, email: true } },
    },
  },
  staff: { select: { id: true, StaffNumber: true, name: true, email: true } },
} satisfies Prisma.StudentTransportHistoryInclude;

export type StudentTransportHistoryData = Prisma.StudentTransportHistoryGetPayload<{
  include: typeof include;
}>;

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseDateTime(value: Date | string, fieldName: string): Date {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid ${fieldName}`);
  return parsed;
}

export class StudentTransportHistoryService {
  private prisma = prisma;

  private async assertRefs(input: {
    studentId: string;
    bustopId: string;
    vehicleTripId: string;
    staffId?: string | null;
  }): Promise<void> {
    const [student, bustop, vehicleTrip] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: input.studentId }, select: { id: true } }),
      this.prisma.bustop.findUnique({ where: { id: input.bustopId }, select: { id: true } }),
      this.prisma.vehicleTrip.findUnique({
        where: { id: input.vehicleTripId },
        select: { id: true, routeId: true },
      }),
    ]);
    if (!student) throw new Error("Invalid studentId");
    if (!bustop) throw new Error("Invalid bustopId");
    if (!vehicleTrip) throw new Error("Invalid vehicleTripId");

    const routeBustop = await this.prisma.routeBustop.findUnique({
      where: {
        routeId_bustopId: { routeId: vehicleTrip.routeId, bustopId: input.bustopId },
      },
      select: { id: true },
    });
    if (!routeBustop) {
      throw new Error("bustopId is not assigned to the vehicle trip route");
    }

    if (input.staffId) {
      const staff = await this.prisma.staff.findUnique({
        where: { id: input.staffId },
        select: { id: true },
      });
      if (!staff) throw new Error("Invalid staffId");
    }
  }

  async create(input: {
    studentId: string;
    bustopId: string;
    vehicleTripId: string;
    startTime: Date | string;
    endTime?: Date | string | null;
    direction?: Direction;
    staffId?: string | null;
  }): Promise<StudentTransportHistoryData> {
    const studentId = input.studentId.trim();
    const bustopId = input.bustopId.trim();
    const vehicleTripId = input.vehicleTripId.trim();
    const staffId =
      input.staffId === undefined || input.staffId === null
        ? null
        : String(input.staffId).trim() || null;

    if (!studentId || !bustopId || !vehicleTripId) {
      throw new Error("studentId, bustopId, and vehicleTripId are required");
    }
    if (input.startTime === undefined || input.startTime === null) {
      throw new Error("startTime is required");
    }

    await this.assertRefs({ studentId, bustopId, vehicleTripId, staffId });

    const startTime = parseDateTime(input.startTime, "startTime");
    const endTime =
      input.endTime === undefined || input.endTime === null
        ? null
        : parseDateTime(input.endTime, "endTime");
    if (endTime && endTime < startTime) {
      throw new Error("endTime must be greater than or equal to startTime");
    }

    return this.prisma.studentTransportHistory.create({
      data: {
        studentId,
        bustopId,
        vehicleTripId,
        startTime,
        endTime,
        ...(input.direction !== undefined ? { direction: input.direction } : {}),
        staffId,
      },
      include,
    });
  }

  async list(params: {
    studentId?: string;
    bustopId?: string;
    vehicleTripId?: string;
    staffId?: string;
    direction?: Direction;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.StudentTransportHistoryWhereInput = {};
    if (params.studentId?.trim()) where.studentId = params.studentId.trim();
    if (params.bustopId?.trim()) where.bustopId = params.bustopId.trim();
    if (params.vehicleTripId?.trim()) where.vehicleTripId = params.vehicleTripId.trim();
    if (params.staffId?.trim()) where.staffId = params.staffId.trim();
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
      studentTransportHistories: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async getById(id: string): Promise<StudentTransportHistoryData | null> {
    return this.prisma.studentTransportHistory.findUnique({ where: { id }, include });
  }

  async update(
    id: string,
    input: {
      endTime?: Date | string | null;
      direction?: Direction;
      staffId?: string | null;
    }
  ): Promise<StudentTransportHistoryData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student transport history not found");

    if (
      input.endTime === undefined &&
      input.direction === undefined &&
      input.staffId === undefined
    ) {
      throw new Error("At least one of endTime, direction, or staffId must be provided");
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

    let staffId: string | null | undefined = undefined;
    if (input.staffId !== undefined) {
      staffId =
        input.staffId === null ? null : String(input.staffId).trim() || null;
      if (staffId) {
        const staff = await this.prisma.staff.findUnique({
          where: { id: staffId },
          select: { id: true },
        });
        if (!staff) throw new Error("Invalid staffId");
      }
    }

    try {
      return await this.prisma.studentTransportHistory.update({
        where: { id },
        data: {
          ...(endTime !== undefined ? { endTime } : {}),
          ...(input.direction !== undefined ? { direction: input.direction } : {}),
          ...(staffId !== undefined ? { staffId } : {}),
        },
        include,
      });
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
      return await this.prisma.studentTransportHistory.delete({ where: { id }, include });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student transport history not found");
      }
      throw e;
    }
  }
}

export const studentTransportHistoryService = new StudentTransportHistoryService();
