import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode } from "../utils/assessmentHttp";
import { Prisma, Status, TransportSubscriptionType } from "@prisma/client";

const include = {
  student: {
    select: {
      id: true,
      admissionNumber: true,
      firstName: true,
      lastName: true,
      status: true,
      classId: true,
    },
  },
  route: { select: { id: true, name: true } },
  bustop: {
    select: { id: true, name: true, latitude: true, longitude: true, status: true },
  },
} satisfies Prisma.StudentTransportInclude;

export type StudentTransportData = Prisma.StudentTransportGetPayload<{ include: typeof include }>;

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export class StudentTransportService {
  private prisma = prisma;

  private async assertRefs(input: {
    studentId: string;
    routeId: string;
    bustopId: string;
  }): Promise<void> {
    const [student, route, bustop, routeBustop] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: input.studentId }, select: { id: true } }),
      this.prisma.route.findUnique({ where: { id: input.routeId }, select: { id: true } }),
      this.prisma.bustop.findUnique({ where: { id: input.bustopId }, select: { id: true } }),
      this.prisma.routeBustop.findUnique({
        where: {
          routeId_bustopId: { routeId: input.routeId, bustopId: input.bustopId },
        },
        select: { id: true },
      }),
    ]);
    if (!student) throw new Error("Invalid studentId");
    if (!route) throw new Error("Invalid routeId");
    if (!bustop) throw new Error("Invalid bustopId");
    if (!routeBustop) {
      throw new Error("bustopId is not assigned to the specified routeId");
    }
  }

  async create(input: {
    studentId: string;
    routeId: string;
    bustopId: string;
    status?: Status;
    subscriptionType?: TransportSubscriptionType;
  }): Promise<StudentTransportData> {
    const studentId = input.studentId.trim();
    const routeId = input.routeId.trim();
    const bustopId = input.bustopId.trim();
    if (!studentId || !routeId || !bustopId) {
      throw new Error("studentId, routeId, and bustopId are required");
    }

    await this.assertRefs({ studentId, routeId, bustopId });

    try {
      return await this.prisma.studentTransport.create({
        data: {
          studentId,
          routeId,
          bustopId,
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.subscriptionType !== undefined
            ? { subscriptionType: input.subscriptionType }
            : {}),
        },
        include,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Student already has a transport assignment");
      }
      throw e;
    }
  }

  async upsert(input: {
    studentId: string;
    routeId: string;
    bustopId: string;
    status?: Status;
    subscriptionType?: TransportSubscriptionType;
  }): Promise<StudentTransportData> {
    const studentId = input.studentId.trim();
    const routeId = input.routeId.trim();
    const bustopId = input.bustopId.trim();
    if (!studentId || !routeId || !bustopId) {
      throw new Error("studentId, routeId, and bustopId are required");
    }

    await this.assertRefs({ studentId, routeId, bustopId });

    return this.prisma.studentTransport.upsert({
      where: { studentId },
      create: {
        studentId,
        routeId,
        bustopId,
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.subscriptionType !== undefined
          ? { subscriptionType: input.subscriptionType }
          : {}),
      },
      update: {
        routeId,
        bustopId,
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.subscriptionType !== undefined
          ? { subscriptionType: input.subscriptionType }
          : {}),
      },
      include,
    });
  }

  async list(params: {
    studentId?: string;
    routeId?: string;
    bustopId?: string;
    status?: Status | "All";
    subscriptionType?: TransportSubscriptionType;
    page?: number;
    limit?: number;
  } = {}) {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.StudentTransportWhereInput = {};
    if (params.studentId?.trim()) where.studentId = params.studentId.trim();
    if (params.routeId?.trim()) where.routeId = params.routeId.trim();
    if (params.bustopId?.trim()) where.bustopId = params.bustopId.trim();
    if (params.subscriptionType !== undefined) where.subscriptionType = params.subscriptionType;
    if (params.status === undefined) where.status = Status.Active;
    else if (params.status !== "All") where.status = params.status;

    const [total, rows] = await Promise.all([
      this.prisma.studentTransport.count({ where }),
      this.prisma.studentTransport.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      studentTransports: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async getById(id: string): Promise<StudentTransportData | null> {
    return this.prisma.studentTransport.findUnique({ where: { id }, include });
  }

  async getByStudentId(studentId: string): Promise<StudentTransportData | null> {
    return this.prisma.studentTransport.findUnique({
      where: { studentId: studentId.trim() },
      include,
    });
  }

  async update(
    id: string,
    input: {
      routeId?: string;
      bustopId?: string;
      status?: Status;
      subscriptionType?: TransportSubscriptionType;
    }
  ): Promise<StudentTransportData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student transport assignment not found");

    const routeId = input.routeId?.trim() || existing.routeId;
    const bustopId = input.bustopId?.trim() || existing.bustopId;
    if (input.routeId !== undefined || input.bustopId !== undefined) {
      await this.assertRefs({
        studentId: existing.studentId,
        routeId,
        bustopId,
      });
    }

    try {
      return await this.prisma.studentTransport.update({
        where: { id },
        data: {
          ...(input.routeId !== undefined ? { routeId } : {}),
          ...(input.bustopId !== undefined ? { bustopId } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.subscriptionType !== undefined
            ? { subscriptionType: input.subscriptionType }
            : {}),
        },
        include,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student transport assignment not found");
      }
      throw e;
    }
  }

  async delete(id: string): Promise<StudentTransportData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student transport assignment not found");

    try {
      return await this.prisma.studentTransport.delete({ where: { id }, include });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student transport assignment not found");
      }
      throw e;
    }
  }
}

export const studentTransportService = new StudentTransportService();
