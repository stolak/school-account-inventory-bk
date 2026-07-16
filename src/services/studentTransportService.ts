import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode } from "../utils/assessmentHttp";
import { Prisma, Status, TransportSubscriptionType } from "@prisma/client";
import { activePeriodService } from "./activePeriodService";

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
  route: { select: { id: true, name: true, status: true } },
  bustop: {
    select: { id: true, name: true, latitude: true, longitude: true, status: true },
  },
  session: { select: { id: true, name: true, status: true } },
  term: { select: { id: true, name: true, status: true } },
  class: { select: { id: true, name: true, status: true } },
} satisfies Prisma.StudentTransportInclude;

export type StudentTransportData = Prisma.StudentTransportGetPayload<{ include: typeof include }>;

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export class StudentTransportService {
  private prisma = prisma;

  private async resolveSessionAndTerm(input: {
    sessionId?: string;
    termId?: string;
  }): Promise<{ sessionId: string; termId: string }> {
    const providedSessionId = input.sessionId?.trim() || "";
    const providedTermId = input.termId?.trim() || "";

    if (providedSessionId && providedTermId) {
      return { sessionId: providedSessionId, termId: providedTermId };
    }

    const activePeriod = await activePeriodService.getActivePeriod();
    if (!activePeriod) {
      throw new Error("No active period configured; sessionId and termId are required");
    }

    return {
      sessionId: providedSessionId || activePeriod.sessionId,
      termId: providedTermId || activePeriod.termId,
    };
  }

  private async assertRefs(input: {
    studentId: string;
    routeId: string;
    bustopId: string;
    sessionId: string;
    termId: string;
    classId: string;
  }): Promise<void> {
    const [student, route, bustop, routeBustop, session, term, schoolClass] = await Promise.all([
      this.prisma.student.findUnique({
        where: { id: input.studentId },
        select: { id: true, classId: true },
      }),
      this.prisma.route.findUnique({ where: { id: input.routeId }, select: { id: true } }),
      this.prisma.bustop.findUnique({ where: { id: input.bustopId }, select: { id: true } }),
      this.prisma.routeBustop.findUnique({
        where: {
          routeId_bustopId: { routeId: input.routeId, bustopId: input.bustopId },
        },
        select: { id: true },
      }),
      this.prisma.session.findUnique({ where: { id: input.sessionId }, select: { id: true } }),
      this.prisma.term.findUnique({ where: { id: input.termId }, select: { id: true } }),
      this.prisma.schoolClass.findUnique({ where: { id: input.classId }, select: { id: true } }),
    ]);
    if (!student) throw new Error("Invalid studentId");
    if (!route) throw new Error("Invalid routeId");
    if (!bustop) throw new Error("Invalid bustopId");
    if (!routeBustop) {
      throw new Error("bustopId is not assigned to the specified routeId");
    }
    if (!session) throw new Error("Invalid sessionId");
    if (!term) throw new Error("Invalid termId");
    if (!schoolClass) throw new Error("Invalid classId");
  }

  private async resolveClassId(studentId: string, classId?: string | null): Promise<string> {
    if (classId?.trim()) return classId.trim();

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });
    if (!student) throw new Error("Invalid studentId");
    if (!student.classId) {
      throw new Error("classId is required because the student has no assigned class");
    }
    return student.classId;
  }

  private async saveSubscription(input: {
    studentId: string;
    routeId: string;
    bustopId: string;
    sessionId: string;
    termId: string;
    classId: string;
    status: Status;
    subscriptionType?: TransportSubscriptionType;
  }): Promise<StudentTransportData> {
    await this.assertRefs({
      studentId: input.studentId,
      routeId: input.routeId,
      bustopId: input.bustopId,
      sessionId: input.sessionId,
      termId: input.termId,
      classId: input.classId,
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.studentTransport.findUnique({
          where: {
            studentId_sessionId_termId: {
              studentId: input.studentId,
              sessionId: input.sessionId,
              termId: input.termId,
            },
          },
          select: { id: true },
        });

        if (input.status === Status.Active) {
          const activeOthers = await tx.studentTransport.findMany({
            where: {
              studentId: input.studentId,
              status: Status.Active,
              ...(existing ? { id: { not: existing.id } } : {}),
            },
            select: { id: true },
          });

          if (activeOthers.length > 0) {
            const activePeriod = await activePeriodService.getActivePeriod();
            const isCurrentPeriod =
              !!activePeriod &&
              activePeriod.sessionId === input.sessionId &&
              activePeriod.termId === input.termId;

            if (!isCurrentPeriod) {
              throw new Error(
                "Student already has an active transport subscription; set it to Inactive before creating a new one"
              );
            }

            await tx.studentTransport.updateMany({
              where: { id: { in: activeOthers.map((row) => row.id) } },
              data: { status: Status.Inactive },
            });
          }
        }

        return tx.studentTransport.upsert({
          where: {
            studentId_sessionId_termId: {
              studentId: input.studentId,
              sessionId: input.sessionId,
              termId: input.termId,
            },
          },
          create: {
            studentId: input.studentId,
            routeId: input.routeId,
            bustopId: input.bustopId,
            sessionId: input.sessionId,
            termId: input.termId,
            classId: input.classId,
            status: input.status,
            ...(input.subscriptionType !== undefined
              ? { subscriptionType: input.subscriptionType }
              : {}),
          },
          update: {
            routeId: input.routeId,
            bustopId: input.bustopId,
            classId: input.classId,
            status: input.status,
            ...(input.subscriptionType !== undefined
              ? { subscriptionType: input.subscriptionType }
              : {}),
          },
          include,
        });
      });
    } catch (e) {
      if (e instanceof Error && e.message.includes("already has an active")) {
        throw e;
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error(
          "A transport subscription already exists for this student, session, and term"
        );
      }
      throw e;
    }
  }

  async create(input: {
    studentId: string;
    routeId: string;
    bustopId: string;
    status?: Status;
    subscriptionType?: TransportSubscriptionType;
    sessionId?: string;
    termId?: string;
    classId?: string;
  }): Promise<StudentTransportData> {
    const studentId = input.studentId.trim();
    const routeId = input.routeId.trim();
    const bustopId = input.bustopId.trim();
    if (!studentId || !routeId || !bustopId) {
      throw new Error("studentId, routeId, and bustopId are required");
    }

    const { sessionId, termId } = await this.resolveSessionAndTerm({
      sessionId: input.sessionId,
      termId: input.termId,
    });
    const classId = await this.resolveClassId(studentId, input.classId);
    const status = input.status ?? Status.Active;

    return this.saveSubscription({
      studentId,
      routeId,
      bustopId,
      sessionId,
      termId,
      classId,
      status,
      ...(input.subscriptionType !== undefined
        ? { subscriptionType: input.subscriptionType }
        : {}),
    });
  }

  async upsert(input: {
    studentId: string;
    routeId: string;
    bustopId: string;
    status?: Status;
    subscriptionType?: TransportSubscriptionType;
    sessionId?: string;
    termId?: string;
    classId?: string;
  }): Promise<StudentTransportData> {
    return this.create(input);
  }

  async list(params: {
    studentId?: string;
    routeId?: string;
    bustopId?: string;
    sessionId?: string;
    termId?: string;
    classId?: string;
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
    if (params.sessionId?.trim()) where.sessionId = params.sessionId.trim();
    if (params.termId?.trim()) where.termId = params.termId.trim();
    if (params.classId?.trim()) where.classId = params.classId.trim();
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

  /** Returns the student's current Active subscription, if any. */
  async getByStudentId(studentId: string): Promise<StudentTransportData | null> {
    return this.prisma.studentTransport.findFirst({
      where: { studentId: studentId.trim(), status: Status.Active },
      include,
      orderBy: { updatedAt: "desc" },
    });
  }

  async update(
    id: string,
    input: {
      routeId?: string;
      bustopId?: string;
      status?: Status;
      subscriptionType?: TransportSubscriptionType;
      sessionId?: string;
      termId?: string;
      classId?: string;
    }
  ): Promise<StudentTransportData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student transport assignment not found");

    const routeId = input.routeId?.trim() || existing.routeId;
    const bustopId = input.bustopId?.trim() || existing.bustopId;
    const sessionId = input.sessionId?.trim() || existing.sessionId;
    const termId = input.termId?.trim() || existing.termId;
    const classId = input.classId?.trim() || existing.classId;
    const status = input.status ?? existing.status;

    if (
      input.routeId !== undefined ||
      input.bustopId !== undefined ||
      input.sessionId !== undefined ||
      input.termId !== undefined ||
      input.classId !== undefined
    ) {
      await this.assertRefs({
        studentId: existing.studentId,
        routeId,
        bustopId,
        sessionId,
        termId,
        classId,
      });
    }

    const periodChanged =
      sessionId !== existing.sessionId || termId !== existing.termId;
    if (periodChanged) {
      const conflict = await this.prisma.studentTransport.findUnique({
        where: {
          studentId_sessionId_termId: {
            studentId: existing.studentId,
            sessionId,
            termId,
          },
        },
        select: { id: true },
      });
      if (conflict && conflict.id !== existing.id) {
        throw new Error(
          "A transport subscription already exists for this student, session, and term"
        );
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (status === Status.Active) {
          const activeOthers = await tx.studentTransport.findMany({
            where: {
              studentId: existing.studentId,
              status: Status.Active,
              id: { not: existing.id },
            },
            select: { id: true },
          });

          if (activeOthers.length > 0) {
            const activePeriod = await activePeriodService.getActivePeriod();
            const isCurrentPeriod =
              !!activePeriod &&
              activePeriod.sessionId === sessionId &&
              activePeriod.termId === termId;

            if (!isCurrentPeriod) {
              throw new Error(
                "Student already has an active transport subscription; set it to Inactive before creating a new one"
              );
            }

            await tx.studentTransport.updateMany({
              where: { id: { in: activeOthers.map((row) => row.id) } },
              data: { status: Status.Inactive },
            });
          }
        }

        return tx.studentTransport.update({
          where: { id },
          data: {
            ...(input.routeId !== undefined ? { routeId } : {}),
            ...(input.bustopId !== undefined ? { bustopId } : {}),
            ...(input.sessionId !== undefined ? { sessionId } : {}),
            ...(input.termId !== undefined ? { termId } : {}),
            ...(input.classId !== undefined ? { classId } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            ...(input.subscriptionType !== undefined
              ? { subscriptionType: input.subscriptionType }
              : {}),
          },
          include,
        });
      });
    } catch (e) {
      if (e instanceof Error && e.message.includes("already has an active")) {
        throw e;
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student transport assignment not found");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error(
          "A transport subscription already exists for this student, session, and term"
        );
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
