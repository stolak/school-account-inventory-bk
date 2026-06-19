import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode } from "../utils/assessmentHttp";
import { Prisma } from "@prisma/client";

const include = {
  student: {
    select: { id: true, admissionNumber: true, firstName: true, lastName: true, status: true },
  },
  class: { select: { id: true, name: true } },
  subclass: { select: { id: true, name: true } },
  subject: { select: { id: true, code: true, name: true } },
  session: { select: { id: true, name: true } },
  term: { select: { id: true, name: true } },
  _count: { select: { scores: true } },
} satisfies Prisma.StudentSubjectRegistrationInclude;

type Row = Prisma.StudentSubjectRegistrationGetPayload<{ include: typeof include }>;

export interface StudentSubjectRegistrationData extends Omit<Row, "_count"> {
  scoreCount: number;
}

function mapRow(row: Row): StudentSubjectRegistrationData {
  const { _count, ...rest } = row;
  return { ...rest, scoreCount: _count.scores };
}

export class StudentSubjectRegistrationService {
  private prisma = prisma;

  private async assertRefs(input: {
    studentId: string;
    classId: string;
    subclassId?: string | null;
    subjectId: string;
    sessionId: string;
    termId: string;
  }): Promise<void> {
    const [student, cls, subject, session, term] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: input.studentId }, select: { id: true } }),
      this.prisma.schoolClass.findUnique({ where: { id: input.classId }, select: { id: true } }),
      this.prisma.subject.findUnique({ where: { id: input.subjectId }, select: { id: true } }),
      this.prisma.session.findUnique({ where: { id: input.sessionId }, select: { id: true } }),
      this.prisma.term.findUnique({ where: { id: input.termId }, select: { id: true } }),
    ]);
    if (!student) throw new Error("Invalid studentId");
    if (!cls) throw new Error("Invalid classId");
    if (!subject) throw new Error("Invalid subjectId");
    if (!session) throw new Error("Invalid sessionId");
    if (!term) throw new Error("Invalid termId");
    if (input.subclassId) {
      const sub = await this.prisma.subClass.findUnique({
        where: { id: input.subclassId },
        select: { id: true, classId: true },
      });
      if (!sub) throw new Error("Invalid subclassId");
      if (sub.classId && sub.classId !== input.classId) {
        throw new Error("subclassId does not belong to classId");
      }
    }
  }

  async create(input: {
    studentId: string;
    classId: string;
    subclassId?: string | null;
    subjectId: string;
    sessionId: string;
    termId: string;
  }): Promise<StudentSubjectRegistrationData> {
    const payload = {
      studentId: input.studentId.trim(),
      classId: input.classId.trim(),
      subclassId: input.subclassId?.trim() || null,
      subjectId: input.subjectId.trim(),
      sessionId: input.sessionId.trim(),
      termId: input.termId.trim(),
    };
    if (
      !payload.studentId ||
      !payload.classId ||
      !payload.subjectId ||
      !payload.sessionId ||
      !payload.termId
    ) {
      throw new Error("studentId, classId, subjectId, sessionId, and termId are required");
    }
    await this.assertRefs(payload);
    try {
      const row = await this.prisma.studentSubjectRegistration.create({ data: payload, include });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Student is already registered for this subject in the session and term");
      }
      throw e;
    }
  }

  async list(params: {
    studentId?: string;
    classId?: string;
    subclassId?: string;
    subjectId?: string;
    sessionId?: string;
    termId?: string;
  }) {
    const where: Prisma.StudentSubjectRegistrationWhereInput = {};
    if (params.studentId?.trim()) where.studentId = params.studentId.trim();
    if (params.classId?.trim()) where.classId = params.classId.trim();
    if (params.subclassId?.trim()) where.subclassId = params.subclassId.trim();
    if (params.subjectId?.trim()) where.subjectId = params.subjectId.trim();
    if (params.sessionId?.trim()) where.sessionId = params.sessionId.trim();
    if (params.termId?.trim()) where.termId = params.termId.trim();

    const rows = await this.prisma.studentSubjectRegistration.findMany({
      where,
      include,
      orderBy: [{ sessionId: "desc" }, { termId: "asc" }, { studentId: "asc" }],
    });
    return { studentSubjectRegistrations: rows.map(mapRow), count: rows.length };
  }

  async getById(id: string): Promise<StudentSubjectRegistrationData | null> {
    const row = await this.prisma.studentSubjectRegistration.findUnique({ where: { id }, include });
    return row ? mapRow(row) : null;
  }

  async update(
    id: string,
    input: {
      studentId?: string;
      classId?: string;
      subclassId?: string | null;
      subjectId?: string;
      sessionId?: string;
      termId?: string;
    }
  ): Promise<StudentSubjectRegistrationData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student subject registration not found");
    if (existing.scoreCount > 0) {
      throw new Error("Cannot update registration with existing assessment scores");
    }

    const payload = {
      studentId: (input.studentId ?? existing.studentId).trim(),
      classId: (input.classId ?? existing.classId).trim(),
      subclassId:
        input.subclassId !== undefined ? input.subclassId?.trim() || null : existing.subclassId,
      subjectId: (input.subjectId ?? existing.subjectId).trim(),
      sessionId: (input.sessionId ?? existing.sessionId).trim(),
      termId: (input.termId ?? existing.termId).trim(),
    };
    await this.assertRefs(payload);

    try {
      const row = await this.prisma.studentSubjectRegistration.update({
        where: { id },
        data: {
          ...(input.studentId !== undefined ? { studentId: payload.studentId } : {}),
          ...(input.classId !== undefined ? { classId: payload.classId } : {}),
          ...(input.subclassId !== undefined ? { subclassId: payload.subclassId } : {}),
          ...(input.subjectId !== undefined ? { subjectId: payload.subjectId } : {}),
          ...(input.sessionId !== undefined ? { sessionId: payload.sessionId } : {}),
          ...(input.termId !== undefined ? { termId: payload.termId } : {}),
        },
        include,
      });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student subject registration not found");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Student is already registered for this subject in the session and term");
      }
      throw e;
    }
  }

  async delete(id: string): Promise<StudentSubjectRegistrationData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Student subject registration not found");
    if (existing.scoreCount > 0) {
      throw new Error("Cannot delete registration with assessment scores");
    }
    try {
      const row = await this.prisma.studentSubjectRegistration.delete({ where: { id }, include });
      return mapRow(row);
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Student subject registration not found");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2003") {
        throw new Error("Cannot delete: registration is referenced by other records");
      }
      throw e;
    }
  }
}

export const studentSubjectRegistrationService = new StudentSubjectRegistrationService();
