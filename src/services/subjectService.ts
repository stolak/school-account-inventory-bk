import prisma from "../utils/prisma";
import { isPrismaKnownErrorWithCode } from "../utils/assessmentHttp";
import { Prisma } from "@prisma/client";

export type SubjectData = Prisma.SubjectGetPayload<Record<string, never>>;

export class SubjectService {
  private prisma = prisma;

  private async assertCodeUnique(code: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.subject.findFirst({
      where: { code, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (existing) throw new Error("A subject with this code already exists");
  }

  async create(input: { code: string; name: string }): Promise<SubjectData> {
    const code = input.code.trim().toUpperCase();
    const name = input.name.trim();
    if (!code) throw new Error("code is required");
    if (!name) throw new Error("name is required");
    await this.assertCodeUnique(code);
    return this.prisma.subject.create({ data: { code, name } });
  }

  async list(params: { q?: string }) {
    const where: Prisma.SubjectWhereInput = {};
    if (params.q?.trim()) {
      const q = params.q.trim();
      where.OR = [{ code: { contains: q } }, { name: { contains: q } }];
    }
    const rows = await this.prisma.subject.findMany({
      where,
      orderBy: [{ code: "asc" }],
    });
    return { subjects: rows, count: rows.length };
  }

  async getById(id: string): Promise<SubjectData | null> {
    return this.prisma.subject.findUnique({ where: { id } });
  }

  async update(id: string, input: { code?: string; name?: string }): Promise<SubjectData> {
    if (input.code !== undefined && !input.code.trim()) throw new Error("code cannot be empty");
    if (input.name !== undefined && !input.name.trim()) throw new Error("name cannot be empty");
    const existing = await this.getById(id);
    if (!existing) throw new Error("Subject not found");
    if (input.code !== undefined) await this.assertCodeUnique(input.code.trim().toUpperCase(), id);

    try {
      return await this.prisma.subject.update({
        where: { id },
        data: {
          ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") throw new Error("Subject not found");
      throw e;
    }
  }

  async delete(id: string): Promise<SubjectData> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Subject not found");
    try {
      return await this.prisma.subject.delete({ where: { id } });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") throw new Error("Subject not found");
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2003") {
        throw new Error("Cannot delete: subject is referenced by other records");
      }
      throw e;
    }
  }
}

export const subjectService = new SubjectService();
