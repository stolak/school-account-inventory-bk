import prisma from "../utils/prisma";
import { Prisma, Status } from "@prisma/client";

export interface SchoolClassData {
  id: string;
  name: string;
  status: Status;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { firstName: string | null; lastName: string | null } | null;
}

export interface ListSchoolClassesParams {
  q?: string;
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

export class SchoolClassService {
  private prisma = prisma;

  async createSchoolClass(input: {
    name: string;
    createdById: string;
    status?: Status;
  }): Promise<SchoolClassData> {
    try {
      return await this.prisma.schoolClass.create({
        data: {
          name: input.name,
          createdById: input.createdById,
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("School class name already exists");
      }
      throw e;
    }
  }

  async listSchoolClasses(params: ListSchoolClassesParams = {}): Promise<{
    schoolClasses: SchoolClassData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.SchoolClassWhereInput = {};

    // Default behavior: only Active unless explicitly overridden.
    if (params.status === undefined) {
      where.status = Status.Active;
    } else if (params.status !== "All") {
      where.status = params.status;
    }

    if (params.q) {
      where.OR = [{ name: { contains: params.q } }];
    }

    const finalWhere = Object.keys(where).length ? where : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.schoolClass.count({ where: finalWhere }),
      this.prisma.schoolClass.findMany({
        where: finalWhere,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Keep behavior predictable if MySQL collation differs.
    const q = params.q?.toLowerCase();
    const schoolClasses = q ? rows.filter((c) => c.name.toLowerCase().includes(q)) : rows;

    return { schoolClasses, pagination: { page, limit, total, totalPages } };
  }

  async getSchoolClassById(id: string): Promise<SchoolClassData | null> {
    return await this.prisma.schoolClass.findUnique({
      where: { id },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
  }

  async updateSchoolClass(
    id: string,
    input: { name?: string; status?: Status }
  ): Promise<SchoolClassData> {
    try {
      return await this.prisma.schoolClass.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date(),
        },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("School class name already exists");
      }
      throw e;
    }
  }

  async deleteSchoolClass(id: string): Promise<SchoolClassData> {
    const [subClassCount, studentCount, inventoryTransactionCount, studentBillingCount, studentDiscountCount] =
      await Promise.all([
        this.prisma.subClass.count({ where: { classId: id } }),
        this.prisma.student.count({ where: { classId: id } }),
        this.prisma.inventoryTransaction.count({ where: { classId: id } }),
        this.prisma.studentBilling.count({ where: { classId: id } }),
        this.prisma.studentConcessionDiscount.count({ where: { classId: id } }),
      ]);

    if (
      subClassCount > 0 ||
      studentCount > 0 ||
      inventoryTransactionCount > 0 ||
      studentBillingCount > 0 ||
      studentDiscountCount > 0
    ) {
      const blockers: string[] = [];
      if (subClassCount > 0) blockers.push(`subclasses (${subClassCount})`);
      if (studentCount > 0) blockers.push(`students (${studentCount})`);
      if (inventoryTransactionCount > 0)
        blockers.push(`inventory transactions (${inventoryTransactionCount})`);
      if (studentBillingCount > 0) blockers.push(`student billings (${studentBillingCount})`);
      if (studentDiscountCount > 0) blockers.push(`student discounts (${studentDiscountCount})`);

      throw new Error(`Cannot delete school class because it is referenced by: ${blockers.join(", ")}`);
    }

    return await this.prisma.schoolClass.delete({
      where: { id },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
  }
}

export const schoolClassService = new SchoolClassService();

