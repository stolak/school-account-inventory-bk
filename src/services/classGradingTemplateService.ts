import prisma from "../utils/prisma";
import { applyStatusFilter, isPrismaKnownErrorWithCode } from "../utils/assessmentHttp";
import { Prisma, Status } from "@prisma/client";

const include = {
  class: { select: { id: true, name: true, status: true } },
  session: { select: { id: true, name: true, status: true } },
  term: { select: { id: true, name: true, status: true } },
  gradingTemplate: { select: { id: true, name: true, version: true, isLocked: true } },
} satisfies Prisma.ClassGradingTemplateInclude;

export type ClassGradingTemplateData = Prisma.ClassGradingTemplateGetPayload<{
  include: typeof include;
}>;

export class ClassGradingTemplateService {
  private prisma = prisma;

  private async assertRefs(input: {
    classId: string;
    sessionId: string;
    termId: string;
    gradingTemplateId: string;
  }): Promise<void> {
    const [cls, session, term, template] = await Promise.all([
      this.prisma.schoolClass.findUnique({ where: { id: input.classId }, select: { id: true } }),
      this.prisma.session.findUnique({ where: { id: input.sessionId }, select: { id: true } }),
      this.prisma.term.findUnique({ where: { id: input.termId }, select: { id: true } }),
      this.prisma.gradingTemplate.findUnique({
        where: { id: input.gradingTemplateId },
        select: { id: true },
      }),
    ]);
    if (!cls) throw new Error("Invalid classId");
    if (!session) throw new Error("Invalid sessionId");
    if (!term) throw new Error("Invalid termId");
    if (!template) throw new Error("Invalid gradingTemplateId");
  }

  async create(input: {
    name: string;
    classId: string;
    sessionId: string;
    termId: string;
    gradingTemplateId: string;
    status?: Status;
  }): Promise<ClassGradingTemplateData> {
    const name = input.name.trim();
    const payload = {
      name,
      classId: input.classId.trim(),
      sessionId: input.sessionId.trim(),
      termId: input.termId.trim(),
      gradingTemplateId: input.gradingTemplateId.trim(),
    };
    if (!name) throw new Error("name is required");
    if (!payload.classId || !payload.sessionId || !payload.termId || !payload.gradingTemplateId) {
      throw new Error("classId, sessionId, termId, and gradingTemplateId are required");
    }
    await this.assertRefs(payload);
    try {
      return await this.prisma.classGradingTemplate.create({
        data: { ...payload, ...(input.status !== undefined ? { status: input.status } : {}) },
        include,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("This class already has this grading template for the session and term");
      }
      throw e;
    }
  }

  async list(params: {
    q?: string;
    status?: Status | "All";
    classId?: string;
    sessionId?: string;
    termId?: string;
    gradingTemplateId?: string;
  }) {
    const where: Prisma.ClassGradingTemplateWhereInput = {};
    applyStatusFilter(where, params.status);
    if (params.classId?.trim()) where.classId = params.classId.trim();
    if (params.sessionId?.trim()) where.sessionId = params.sessionId.trim();
    if (params.termId?.trim()) where.termId = params.termId.trim();
    if (params.gradingTemplateId?.trim()) where.gradingTemplateId = params.gradingTemplateId.trim();
    if (params.q?.trim()) where.name = { contains: params.q.trim() };

    const rows = await this.prisma.classGradingTemplate.findMany({
      where,
      include,
      orderBy: [{ sessionId: "desc" }, { termId: "asc" }, { classId: "asc" }],
    });
    return { classGradingTemplates: rows, count: rows.length };
  }

  async getById(id: string): Promise<ClassGradingTemplateData | null> {
    return this.prisma.classGradingTemplate.findUnique({ where: { id }, include });
  }

  async update(
    id: string,
    input: {
      name?: string;
      classId?: string;
      sessionId?: string;
      termId?: string;
      gradingTemplateId?: string;
      status?: Status;
    }
  ): Promise<ClassGradingTemplateData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Class grading template not found");

    const payload = {
      name: (input.name ?? existing.name).trim(),
      classId: (input.classId ?? existing.classId).trim(),
      sessionId: (input.sessionId ?? existing.sessionId).trim(),
      termId: (input.termId ?? existing.termId).trim(),
      gradingTemplateId: (input.gradingTemplateId ?? existing.gradingTemplateId).trim(),
    };
    if (!payload.name) throw new Error("name cannot be empty");
    await this.assertRefs(payload);

    try {
      return await this.prisma.classGradingTemplate.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: payload.name } : {}),
          ...(input.classId !== undefined ? { classId: payload.classId } : {}),
          ...(input.sessionId !== undefined ? { sessionId: payload.sessionId } : {}),
          ...(input.termId !== undefined ? { termId: payload.termId } : {}),
          ...(input.gradingTemplateId !== undefined
            ? { gradingTemplateId: payload.gradingTemplateId }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
        include,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Class grading template not found");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("This class already has this grading template for the session and term");
      }
      throw e;
    }
  }

  async delete(id: string): Promise<ClassGradingTemplateData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Class grading template not found");
    try {
      return await this.prisma.classGradingTemplate.delete({ where: { id }, include });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Class grading template not found");
      }
      throw e;
    }
  }
}

export const classGradingTemplateService = new ClassGradingTemplateService();
