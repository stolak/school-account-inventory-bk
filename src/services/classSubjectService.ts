import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode } from "../utils/assessmentHttp";
import { Prisma } from "@prisma/client";

const include = {
  class: { select: { id: true, name: true } },
  subclass: { select: { id: true, name: true } },
  subject: { select: { id: true, code: true, name: true, status: true } },
  session: { select: { id: true, name: true } },
} satisfies Prisma.ClassSubjectInclude;

export type ClassSubjectData = Prisma.ClassSubjectGetPayload<{ include: typeof include }>;

export interface ClassSubjectListItem {
  id: string;
  subjectId: string;
  subject: ClassSubjectData["subject"];
}

export interface ClassSubjectGroup {
  classId: string;
  class: ClassSubjectData["class"];
  subclassId: string | null;
  subclass: ClassSubjectData["subclass"];
  sessionId: string;
  session: ClassSubjectData["session"];
  classSubjects: ClassSubjectListItem[];
}

export class ClassSubjectService {
  private prisma = prisma;

  private async assertClassSessionRefs(input: {
    classId: string;
    subclassId?: string | null;
    sessionId: string;
  }): Promise<void> {
    const [cls, session] = await Promise.all([
      this.prisma.schoolClass.findUnique({ where: { id: input.classId }, select: { id: true } }),
      this.prisma.session.findUnique({ where: { id: input.sessionId }, select: { id: true } }),
    ]);
    if (!cls) throw new Error("Invalid classId");
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

  private async resolveSubjects(subjectIds: string[]): Promise<Map<string, { id: string; name: string }>> {
    const uniqueIds = [...new Set(subjectIds)];
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, name: true },
    });
    if (subjects.length !== uniqueIds.length) throw new Error("Invalid subjectId");
    return new Map(subjects.map((s) => [s.id, s]));
  }

  private duplicateNamesInList(
    subjectIds: string[],
    nameById: Map<string, { name: string }>
  ): string[] {
    const seen = new Set<string>();
    const duplicateIds = new Set<string>();
    for (const id of subjectIds) {
      if (seen.has(id)) duplicateIds.add(id);
      seen.add(id);
    }
    return [...duplicateIds].map((id) => nameById.get(id)!.name);
  }

  private async assertSubjectsNotAlreadyAssigned(input: {
    classId: string;
    subclassId: string | null;
    sessionId: string;
    subjectIds: string[];
    nameById: Map<string, { name: string }>;
  }): Promise<void> {
    const existing = await this.prisma.classSubject.findMany({
      where: {
        classId: input.classId,
        sessionId: input.sessionId,
        subclassId: input.subclassId,
        subjectId: { in: [...new Set(input.subjectIds)] },
      },
      select: { subject: { select: { name: true } } },
    });
    if (existing.length === 0) return;

    const names = existing.map((row) => row.subject.name);
    throw new Error(
      `Subject${names.length > 1 ? "s" : ""} already assigned to this class: ${names.join(", ")}`
    );
  }

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
    await this.assertClassSessionRefs({ classId, subclassId, sessionId });
    const nameById = await this.resolveSubjects([subjectId]);
    await this.assertSubjectsNotAlreadyAssigned({
      classId,
      subclassId,
      sessionId,
      subjectIds: [subjectId],
      nameById,
    });
    try {
      return await this.prisma.classSubject.create({
        data: { classId, subclassId, subjectId, sessionId },
        include,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error(
          `Subject already assigned to this class: ${nameById.get(subjectId)!.name}`
        );
      }
      throw e;
    }
  }

  async createMany(input: {
    classId: string;
    subclassId?: string | null;
    sessionId: string;
    subjectIds: string[];
  }): Promise<{ classSubjects: ClassSubjectData[]; count: number }> {
    const classId = input.classId.trim();
    const sessionId = input.sessionId.trim();
    const subclassId = input.subclassId?.trim() || null;

    if (!classId || !sessionId) throw new Error("classId and sessionId are required");
    if (!Array.isArray(input.subjectIds) || input.subjectIds.length === 0) {
      throw new Error("subjectIds must be a non-empty array");
    }

    const subjectIds = input.subjectIds.map((id) => {
      if (typeof id !== "string" || !id.trim()) {
        throw new Error("Each subjectId must be a non-empty string");
      }
      return id.trim();
    });

    await this.assertClassSessionRefs({ classId, subclassId, sessionId });
    const nameById = await this.resolveSubjects(subjectIds);

    const duplicateInRequest = this.duplicateNamesInList(subjectIds, nameById);
    if (duplicateInRequest.length > 0) {
      throw new Error(
        `Duplicate subjects in request: ${duplicateInRequest.join(", ")}`
      );
    }

    const uniqueSubjectIds = [...new Set(subjectIds)];
    await this.assertSubjectsNotAlreadyAssigned({
      classId,
      subclassId,
      sessionId,
      subjectIds: uniqueSubjectIds,
      nameById,
    });

    const rows = await this.prisma.$transaction(
      uniqueSubjectIds.map((subjectId) =>
        this.prisma.classSubject.create({
          data: { classId, subclassId, subjectId, sessionId },
          include,
        })
      )
    );

    return { classSubjects: rows, count: rows.length };
  }

  private groupByClassSubclassAndSession(rows: ClassSubjectData[]): ClassSubjectGroup[] {
    const map = new Map<string, ClassSubjectGroup>();

    for (const row of rows) {
      const key = `${row.classId}:${row.subclassId ?? ""}:${row.sessionId}`;
      let group = map.get(key);
      if (!group) {
        group = {
          classId: row.classId,
          class: row.class,
          subclassId: row.subclassId,
          subclass: row.subclass,
          sessionId: row.sessionId,
          session: row.session,
          classSubjects: [],
        };
        map.set(key, group);
      }
      group.classSubjects.push({
        id: row.id,
        subjectId: row.subjectId,
        subject: row.subject,
      });
    }

    return [...map.values()].sort((a, b) => {
      const bySession = b.session.name.localeCompare(a.session.name);
      if (bySession !== 0) return bySession;
      const byClass = a.class.name.localeCompare(b.class.name);
      if (byClass !== 0) return byClass;
      return (a.subclass?.name ?? "").localeCompare(b.subclass?.name ?? "");
    });
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
      orderBy: [
        { classId: "asc" },
        { subclassId: "asc" },
        { sessionId: "desc" },
        { subject: { code: "asc" } },
      ],
    });

    const groups = this.groupByClassSubclassAndSession(rows);
    return { groups };
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
