import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode } from "../utils/assessmentHttp";
import { Prisma } from "@prisma/client";

const include = {
  class: { select: { id: true, name: true, status: true } },
  template: { select: { id: true, name: true, status: true, versionId: true } },
  session: { select: { id: true, name: true, status: true } },
  term: { select: { id: true, name: true, status: true } },
} satisfies Prisma.ClassAssessmentTemplateInclude;

export type ClassAssessmentTemplateData = Prisma.ClassAssessmentTemplateGetPayload<{
  include: typeof include;
}>;

export class ClassAssessmentTemplateService {
  private prisma = prisma;

  private async assertRefs(input: {
    classId: string;
    templateId: string;
    sessionId: string;
    termId: string;
  }): Promise<void> {
    const [cls, template, session, term] = await Promise.all([
      this.prisma.schoolClass.findUnique({ where: { id: input.classId }, select: { id: true } }),
      this.prisma.assessmentTemplate.findUnique({
        where: { id: input.templateId },
        select: { id: true },
      }),
      this.prisma.session.findUnique({ where: { id: input.sessionId }, select: { id: true } }),
      this.prisma.term.findUnique({ where: { id: input.termId }, select: { id: true } }),
    ]);
    if (!cls) throw new Error("Invalid classId");
    if (!template) throw new Error("Invalid templateId");
    if (!session) throw new Error("Invalid sessionId");
    if (!term) throw new Error("Invalid termId");
  }

  async create(input: {
    classId: string;
    templateId: string;
    sessionId: string;
    termId: string;
  }): Promise<ClassAssessmentTemplateData> {
    const payload = {
      classId: input.classId.trim(),
      templateId: input.templateId.trim(),
      sessionId: input.sessionId.trim(),
      termId: input.termId.trim(),
    };
    if (!payload.classId || !payload.templateId || !payload.sessionId || !payload.termId) {
      throw new Error("classId, templateId, sessionId, and termId are required");
    }
    await this.assertRefs(payload);
    try {
      return await this.prisma.classAssessmentTemplate.create({ data: payload, include });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("This class already has this assessment template for the session and term");
      }
      throw e;
    }
  }

  async list(params: {
    classId?: string;
    templateId?: string;
    sessionId?: string;
    termId?: string;
  }) {
    const where: Prisma.ClassAssessmentTemplateWhereInput = {};
    if (params.classId?.trim()) where.classId = params.classId.trim();
    if (params.templateId?.trim()) where.templateId = params.templateId.trim();
    if (params.sessionId?.trim()) where.sessionId = params.sessionId.trim();
    if (params.termId?.trim()) where.termId = params.termId.trim();

    const rows = await this.prisma.classAssessmentTemplate.findMany({
      where,
      include,
      orderBy: [{ sessionId: "desc" }, { termId: "asc" }, { classId: "asc" }],
    });
    return { classAssessmentTemplates: rows, count: rows.length };
  }

  async getById(id: string): Promise<ClassAssessmentTemplateData | null> {
    return this.prisma.classAssessmentTemplate.findUnique({ where: { id }, include });
  }

  async update(
    id: string,
    input: { classId?: string; templateId?: string; sessionId?: string; termId?: string }
  ): Promise<ClassAssessmentTemplateData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Class assessment template not found");

    const payload = {
      classId: (input.classId ?? existing.classId).trim(),
      templateId: (input.templateId ?? existing.templateId).trim(),
      sessionId: (input.sessionId ?? existing.sessionId).trim(),
      termId: (input.termId ?? existing.termId).trim(),
    };
    await this.assertRefs(payload);

    try {
      return await this.prisma.classAssessmentTemplate.update({
        where: { id },
        data: {
          ...(input.classId !== undefined ? { classId: payload.classId } : {}),
          ...(input.templateId !== undefined ? { templateId: payload.templateId } : {}),
          ...(input.sessionId !== undefined ? { sessionId: payload.sessionId } : {}),
          ...(input.termId !== undefined ? { termId: payload.termId } : {}),
        },
        include,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Class assessment template not found");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("This class already has this assessment template for the session and term");
      }
      throw e;
    }
  }

  async delete(id: string): Promise<ClassAssessmentTemplateData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Class assessment template not found");
    try {
      return await this.prisma.classAssessmentTemplate.delete({ where: { id }, include });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Class assessment template not found");
      }
      throw e;
    }
  }
}

export const classAssessmentTemplateService = new ClassAssessmentTemplateService();
