import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode, parseDecimalNonNegative } from "../utils/assessmentHttp";
import { Prisma } from "@prisma/client";

const include = {
  studentSubjectRegistration: {
    select: {
      id: true,
      studentId: true,
      student: { select: { id: true, admissionNumber: true, firstName: true, lastName: true } },
    },
  },
  class: { select: { id: true, name: true } },
  subclass: { select: { id: true, name: true } },
  subject: { select: { id: true, code: true, name: true } },
  component: { select: { id: true, name: true, maxScore: true, isLocked: true } },
  term: { select: { id: true, name: true } },
  session: { select: { id: true, name: true } },
} satisfies Prisma.StudentAssessmentScoreInclude;

type Row = Prisma.StudentAssessmentScoreGetPayload<{ include: typeof include }>;

export interface StudentAssessmentScoreData {
  id: string;
  studentSubjectRegistrationId: string;
  studentSubjectRegistration: Row["studentSubjectRegistration"];
  classId: string;
  class: Row["class"];
  subclassId: string | null;
  subclass: Row["subclass"];
  subjectId: string;
  subject: Row["subject"];
  componentId: string;
  component: Row["component"];
  termId: string;
  term: Row["term"];
  sessionId: string;
  session: Row["session"];
  score: string;
}

function mapRow(row: Row): StudentAssessmentScoreData {
  return {
    id: row.id,
    studentSubjectRegistrationId: row.studentSubjectRegistrationId,
    studentSubjectRegistration: row.studentSubjectRegistration,
    classId: row.classId,
    class: row.class,
    subclassId: row.subclassId,
    subclass: row.subclass,
    subjectId: row.subjectId,
    subject: row.subject,
    componentId: row.componentId,
    component: row.component,
    termId: row.termId,
    term: row.term,
    sessionId: row.sessionId,
    session: row.session,
    score: row.score.toString(),
  };
}

export class StudentAssessmentScoreService {
  private prisma = prisma;

  private async resolveRegistration(registrationId: string) {
    const reg = await this.prisma.studentSubjectRegistration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        classId: true,
        subclassId: true,
        subjectId: true,
        sessionId: true,
        termId: true,
        studentId: true,
      },
    });
    if (!reg) throw new Error("Invalid studentSubjectRegistrationId");
    return reg;
  }

  private async assertComponent(componentId: string, score: Prisma.Decimal): Promise<void> {
    const component = await this.prisma.assessmentComponent.findUnique({
      where: { id: componentId },
      select: { id: true, maxScore: true },
    });
    if (!component) throw new Error("Invalid componentId");
    if (score.gt(component.maxScore)) {
      throw new Error(`score cannot exceed component maxScore (${component.maxScore.toString()})`);
    }
  }

  async create(input: {
    studentSubjectRegistrationId: string;
    componentId: string;
    score: string | number;
  }): Promise<StudentAssessmentScoreData> {
    const registrationId = input.studentSubjectRegistrationId.trim();
    const componentId = input.componentId.trim();
    if (!registrationId) throw new Error("studentSubjectRegistrationId is required");
    if (!componentId) throw new Error("componentId is required");

    const reg = await this.resolveRegistration(registrationId);
    const score = parseDecimalNonNegative(input.score, "score");
    await this.assertComponent(componentId, score);

    const row = await this.prisma.studentAssessmentScore.create({
      data: {
        studentSubjectRegistrationId: registrationId,
        componentId,
        score,
        classId: reg.classId,
        subclassId: reg.subclassId,
        subjectId: reg.subjectId,
        termId: reg.termId,
        sessionId: reg.sessionId,
        studentId: reg.studentId,
      },
      include,
    });
    return mapRow(row);
  }

  async list(params: {
    studentSubjectRegistrationId?: string;
    classId?: string;
    subclassId?: string;
    subjectId?: string;
    componentId?: string;
    sessionId?: string;
    termId?: string;
    studentId?: string;
  }) {
    const where: Prisma.StudentAssessmentScoreWhereInput = {};
    if (params.studentSubjectRegistrationId?.trim()) {
      where.studentSubjectRegistrationId = params.studentSubjectRegistrationId.trim();
    }
    if (params.classId?.trim()) where.classId = params.classId.trim();
    if (params.subclassId?.trim()) where.subclassId = params.subclassId.trim();
    if (params.subjectId?.trim()) where.subjectId = params.subjectId.trim();
    if (params.componentId?.trim()) where.componentId = params.componentId.trim();
    if (params.sessionId?.trim()) where.sessionId = params.sessionId.trim();
    if (params.termId?.trim()) where.termId = params.termId.trim();
    if (params.studentId?.trim()) {
      where.studentSubjectRegistration = { studentId: params.studentId.trim() };
    }

    const rows = await this.prisma.studentAssessmentScore.findMany({
      where,
      include,
      orderBy: [{ sessionId: "desc" }, { termId: "asc" }, { classId: "asc" }],
    });
    return { studentAssessmentScores: rows.map(mapRow), count: rows.length };
  }

  async getById(id: string): Promise<StudentAssessmentScoreData | null> {
    const row = await this.prisma.studentAssessmentScore.findUnique({ where: { id }, include });
    return row ? mapRow(row) : null;
  }

  async update(
    id: string,
    input: { score?: string | number; componentId?: string }
  ): Promise<StudentAssessmentScoreData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student assessment score not found");
    if (existing.component.isLocked) throw new Error("Cannot update score: component is locked");

    const componentId = input.componentId?.trim() || existing.componentId;
    const score =
      input.score !== undefined
        ? parseDecimalNonNegative(input.score, "score")
        : new Prisma.Decimal(existing.score);
    if (input.componentId !== undefined) await this.assertComponent(componentId, score);
    else if (input.score !== undefined) await this.assertComponent(existing.componentId, score);

    try {
      const row = await this.prisma.studentAssessmentScore.update({
        where: { id },
        data: {
          ...(input.score !== undefined ? { score } : {}),
          ...(input.componentId !== undefined ? { componentId } : {}),
        },
        include,
      });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student assessment score not found");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("A score already exists for this registration and component");
      }
      throw e;
    }
  }

  async delete(id: string): Promise<StudentAssessmentScoreData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student assessment score not found");
    if (existing.component.isLocked) throw new Error("Cannot delete score: component is locked");

    try {
      const row = await this.prisma.studentAssessmentScore.delete({ where: { id }, include });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student assessment score not found");
      }
      throw e;
    }
  }
}

export const studentAssessmentScoreService = new StudentAssessmentScoreService();
