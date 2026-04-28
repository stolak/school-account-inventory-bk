import prisma from "../utils/prisma";
import { Prisma, Status } from "@prisma/client";

export interface SubClassData {
  id: string;
  name: string;
  status: Status;
  classId: string | null;
  createdAt: Date;
  updatedAt: Date;
  class?: { id: string; name: string } | null;
}

export interface ListSubClassesParams {
  q?: string;
  classId?: string;
  status?: Status | "All";
  page?: number;
  limit?: number;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isPrismaKnownErrorWithCode(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as any).code === "string";
}

export class SubClassService {
  private prisma = prisma;

  private async assertClassExists(classId: string) {
    const cls = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      select: { id: true },
    });
    if (!cls) throw new Error("Invalid classId");
  }

  async createSubClass(input: {
    name: string;
    classId?: string | null;
    status?: Status;
  }): Promise<SubClassData> {
    if (input.classId) await this.assertClassExists(input.classId);

    try {
      return await this.prisma.subClass.create({
        data: {
          name: input.name,
          classId: input.classId ?? null,
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
        include: { class: { select: { id: true, name: true } } },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("SubClass name already exists for this class");
      }
      throw e;
    }
  }

  async listSubClasses(params: ListSubClassesParams = {}): Promise<{
    subClasses: SubClassData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.SubClassWhereInput = {};

    // Default behavior: only Active unless explicitly overridden.
    if (params.status === undefined) {
      where.status = Status.Active;
    } else if (params.status !== "All") {
      where.status = params.status;
    }

    if (params.classId) {
      where.classId = params.classId;
    }

    if (params.q) {
      where.OR = [{ name: { contains: params.q } }];
    }

    const finalWhere = Object.keys(where).length ? where : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.subClass.count({ where: finalWhere }),
      this.prisma.subClass.findMany({
        where: finalWhere,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: { class: { select: { id: true, name: true } } },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Keep behavior predictable if MySQL collation differs.
    const qLower = params.q?.toLowerCase();
    const subClasses = qLower ? rows.filter((s) => s.name.toLowerCase().includes(qLower)) : rows;

    return { subClasses, pagination: { page, limit, total, totalPages } };
  }

  async getSubClassById(id: string): Promise<SubClassData | null> {
    return await this.prisma.subClass.findUnique({
      where: { id },
      include: { class: { select: { id: true, name: true } } },
    });
  }

  async updateSubClass(
    id: string,
    input: { name?: string; classId?: string | null; status?: Status }
  ): Promise<SubClassData> {
    if (input.classId) await this.assertClassExists(input.classId);

    try {
      return await this.prisma.subClass.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.classId !== undefined ? { classId: input.classId } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date(),
        },
        include: { class: { select: { id: true, name: true } } },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("SubClass name already exists for this class");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Record to update not found");
      }
      throw e;
    }
  }

  async deleteSubClass(id: string): Promise<SubClassData> {
    try {
      return await this.prisma.subClass.delete({
        where: { id },
        include: { class: { select: { id: true, name: true } } },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Record to delete does not exist");
      }
      throw e;
    }
  }
}

export const subClassService = new SubClassService();

