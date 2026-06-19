import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode } from "../utils/assessmentHttp";
import { Prisma } from "@prisma/client";

const include = {
  class: { select: { id: true, name: true } },
  subclass: { select: { id: true, name: true } },
  subject: { select: { id: true, code: true, name: true } },
  session: { select: { id: true, name: true } },
} satisfies Prisma.ClassSubjectInclude;

export type ClassSubjectData = Prisma.ClassSubjectGetPayload<{ include: typeof include }>;

export class ClassSubjectService {
  private prisma = prisma;

  private async assertRefs(input: {
    classId: string;
    subclassId?: string | null;
    subjectId: string;
    sessionId: string;
  }): Promise<void> {
    const [cls, subject, session] = await Promise.all([
      this.prisma.schoolClass.findUnique({ where: { id: input.classId }, select: { id: true } }),
      this.prisma.subject.findUnique({ where: { id: input.subjectId }, select: { id: true } }),
      this.prisma.session.findUnique({ where: { id: input.sessionId }, select: { id: true } }),
    ]);
    if (!cls) throw new Error("Invalid classId");
    if (!subject) throw new Error("Invalid subjectId");
    if (!session) throw new Error("Invalid sessionId");
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
    classId: string;
    subclassId?: string | null;
    subjectId: string;
    sessionId: string;
  }): Promise<ClassSubjectData> {
    const classId = input.classId.trim();
    const subjectId = input.subjectId.trim();
    const sessionId = input.sessionId.trim();
    const subclassId = input.subclassId?.trim() || null;
    if (!classId || !subjectId || !sessionId) {
      throw new Error("classId, subjectId, and sessionId are required");
    }
    await this.assertRefs({ classId, subclassId, subjectId, sessionId });
    try {
      return await this.prisma.classSubject.create({
        data: { classId, subclassId, subjectId, sessionId },
        include,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("This subject is already assigned to the class for the session");
      }
      throw e;
    }
  }

  async list(params: {
    classId?: string;
    subclassId?: string;
    subjectId?: string;
    sessionId?: string;
  }) {
    const where: Prisma.ClassSubjectWhereInput = {};
    if (params.classId?.trim()) where.classId = params.classId.trim();
    if (params.subclassId?.trim()) where.subclassId = params.subclassId.trim();
    if (params.subjectId?.trim()) where.subjectId = params.subjectId.trim();
    if (params.sessionId?.trim()) where.sessionId = params.sessionId.trim();

    const rows = await this.prisma.classSubject.findMany({
      where,
      include,
      orderBy: [{ sessionId: "desc" }, { classId: "asc" }],
    });
    return { classSubjects: rows, count: rows.length };
  }

  async getById(id: string): Promise<ClassSubjectData | null> {
    return this.prisma.classSubject.findUnique({ where: { id }, include });
  }

  async update(
    id: string,
    input: {
      classId?: string;
      subclassId?: string | null;
      subjectId?: string;
      sessionId?: string;
    }
  ): Promise<ClassSubjectData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Class subject not found");

    const payload = {
      classId: (input.classId ?? existing.classId).trim(),
      subclassId:
        input.subclassId !== undefined ? input.subclassId?.trim() || null : existing.subclassId,
      subjectId: (input.subjectId ?? existing.subjectId).trim(),
      sessionId: (input.sessionId ?? existing.sessionId).trim(),
    };
    await this.assertRefs(payload);

    try {
      return await this.prisma.classSubject.update({
        where: { id },
        data: {
          ...(input.classId !== undefined ? { classId: payload.classId } : {}),
          ...(input.subclassId !== undefined ? { subclassId: payload.subclassId } : {}),
          ...(input.subjectId !== undefined ? { subjectId: payload.subjectId } : {}),
          ...(input.sessionId !== undefined ? { sessionId: payload.sessionId } : {}),
        },
        include,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") throw new Error("Class subject not found");
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("This subject is already assigned to the class for the session");
      }
      throw e;
    }
  }

  async delete(id: string): Promise<ClassSubjectData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Class subject not found");
    try {
      return await this.prisma.classSubject.delete({ where: { id }, include });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") throw new Error("Class subject not found");
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2003") {
        throw new Error("Cannot delete: class subject is referenced by other records");
      }
      throw e;
    }
  }
}

export const classSubjectService = new ClassSubjectService();
