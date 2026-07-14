import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode } from "../utils/assessmentHttp";
import { Prisma } from "@prisma/client";

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
  route: { select: { id: true, name: true } },
  bustop: { select: { id: true, name: true } },
  driver: { select: { id: true, StaffNumber: true, name: true, email: true } },
  vehicle: {
    select: { id: true, vehicleNumber: true, vehicleType: true, status: true },
  },
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
    routeId: string;
    bustopId: string;
    driverId: string;
    vehicleId: string;
  }): Promise<void> {
    const [student, route, bustop, driver, vehicle] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: input.studentId }, select: { id: true } }),
      this.prisma.route.findUnique({ where: { id: input.routeId }, select: { id: true } }),
      this.prisma.bustop.findUnique({ where: { id: input.bustopId }, select: { id: true } }),
      this.prisma.staff.findUnique({ where: { id: input.driverId }, select: { id: true } }),
      this.prisma.vehicle.findUnique({ where: { id: input.vehicleId }, select: { id: true } }),
    ]);
    if (!student) throw new Error("Invalid studentId");
    if (!route) throw new Error("Invalid routeId");
    if (!bustop) throw new Error("Invalid bustopId");
    if (!driver) throw new Error("Invalid driverId");
    if (!vehicle) throw new Error("Invalid vehicleId");
  }

  async create(input: {
    studentId: string;
    routeId: string;
    bustopId: string;
    driverId: string;
    vehicleId: string;
    startTime: Date | string;
    endTime?: Date | string | null;
  }): Promise<StudentTransportHistoryData> {
    const studentId = input.studentId.trim();
    const routeId = input.routeId.trim();
    const bustopId = input.bustopId.trim();
    const driverId = input.driverId.trim();
    const vehicleId = input.vehicleId.trim();

    if (!studentId || !routeId || !bustopId || !driverId || !vehicleId) {
      throw new Error("studentId, routeId, bustopId, driverId, and vehicleId are required");
    }
    if (input.startTime === undefined || input.startTime === null) {
      throw new Error("startTime is required");
    }

    await this.assertRefs({ studentId, routeId, bustopId, driverId, vehicleId });

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
        routeId,
        bustopId,
        driverId,
        vehicleId,
        startTime,
        endTime,
      },
      include,
    });
  }

  async list(params: {
    studentId?: string;
    routeId?: string;
    bustopId?: string;
    driverId?: string;
    vehicleId?: string;
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
    if (params.routeId?.trim()) where.routeId = params.routeId.trim();
    if (params.bustopId?.trim()) where.bustopId = params.bustopId.trim();
    if (params.driverId?.trim()) where.driverId = params.driverId.trim();
    if (params.vehicleId?.trim()) where.vehicleId = params.vehicleId.trim();

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
    input: { endTime?: Date | string | null }
  ): Promise<StudentTransportHistoryData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student transport history not found");

    if (input.endTime === undefined) {
      throw new Error("endTime is required for update");
    }

    const endTime =
      input.endTime === null ? null : parseDateTime(input.endTime, "endTime");
    if (endTime && endTime < existing.startTime) {
      throw new Error("endTime must be greater than or equal to startTime");
    }

    try {
      return await this.prisma.studentTransportHistory.update({
        where: { id },
        data: { endTime },
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
