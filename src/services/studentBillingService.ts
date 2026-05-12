import { Prisma, StudentBillingStatus } from "@prisma/client";
import prisma from "../utils/prisma";
import { randomUUID } from "crypto";

export type StudentBillingRow = Prisma.StudentBillingGetPayload<Record<string, never>>;

export interface ListStudentBillingsParams {
  studentId?: string;
  classId?: string;
  subclassId?: string;
  session?: string;
  term?: string;
  billingId?: number;
  status?: StudentBillingStatus;
  referentId?: string;
  isPosted?: boolean;
  page?: number;
  limit?: number;
}

type CreateStudentBillingInput = {
  studentId: string;
  classId: string;
  subclassId?: string | null;
  session: string;
  term: string;
  billingId: number;
  amount: number;
  referentId?: string | null;
  createdBy: string;
};

type UpdateStudentBillingInput = {
  studentId?: string;
  classId?: string;
  subclassId?: string | null;
  session?: string;
  term?: string;
  billingId?: number;
  amount?: number;
  referentId?: string | null;
  status?: StudentBillingStatus;
  createdBy?: string | null;
  isPosted?: boolean;
};

type CreateManyStudentBillingInput = {
  studentId: string;
  classId: string;
  subclassId?: string | null;
  session: string;
  term: string;
  referentId?: string | null;
  createdBy: string;
  entries: Array<{ billingId: number; amount: number }>;
};

type BulkUpdateStudentBillingStatusInput = {
  ids: number[];
  status: StudentBillingStatus;
  actedBy: string;
};

type BulkPostStudentBillingInput = {
  ids: number[];
  actedBy: string;
};

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function generateReferentId(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `STB-${y}${m}${day}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export class StudentBillingService {
  private prisma = prisma;

  private normalizeRequiredString(value: string, fieldName: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error(`${fieldName} is required`);
    }
    return trimmed;
  }

  private normalizeOptionalString(value?: string | null): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeReferentId(value?: string | null): string {
    const normalized = this.normalizeOptionalString(value);
    if (normalized === undefined || normalized === null) {
      return generateReferentId();
    }
    return normalized;
  }

  private validateBillingId(billingId: number): void {
    if (!Number.isInteger(billingId) || billingId < 1) {
      throw new Error("billingId must be a positive integer");
    }
  }

  private validateAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("amount must be a valid number greater than or equal to 0");
    }
  }

  async create(input: CreateStudentBillingInput): Promise<StudentBillingRow> {
    this.validateBillingId(input.billingId);
    this.validateAmount(input.amount);

    return this.prisma.studentBilling.create({
      data: {
        studentId: this.normalizeRequiredString(input.studentId, "studentId"),
        classId: this.normalizeRequiredString(input.classId, "classId"),
        subclassId: this.normalizeOptionalString(input.subclassId),
        session: this.normalizeRequiredString(input.session, "session"),
        term: this.normalizeRequiredString(input.term, "term"),
        billingId: input.billingId,
        amount: input.amount,
        referentId: this.normalizeReferentId(input.referentId),
        status: StudentBillingStatus.DRAFT,
        createdBy: this.normalizeRequiredString(input.createdBy, "createdBy"),
        // On creation these fields must always be null/false by business rule.
        approvedBy: null,
        approvedAt: null,
        postedBy: null,
        postedAt: null,
        isPosted: false,
      },
    });
  }

  async createMany(input: CreateManyStudentBillingInput): Promise<{
    referentId: string;
    count: number;
    rows: StudentBillingRow[];
  }> {
    if (!Array.isArray(input.entries) || input.entries.length === 0) {
      throw new Error("entries must be a non-empty array");
    }

    const referentId = this.normalizeReferentId(input.referentId);
    const studentId = this.normalizeRequiredString(input.studentId, "studentId");
    const classId = this.normalizeRequiredString(input.classId, "classId");
    const subclassId = this.normalizeOptionalString(input.subclassId);
    const session = this.normalizeRequiredString(input.session, "session");
    const term = this.normalizeRequiredString(input.term, "term");
    const createdBy = this.normalizeRequiredString(input.createdBy, "createdBy");

    const rows = await this.prisma.$transaction(
      input.entries.map((entry) => {
        this.validateBillingId(entry.billingId);
        this.validateAmount(entry.amount);
        return this.prisma.studentBilling.create({
          data: {
            studentId,
            classId,
            subclassId,
            session,
            term,
            billingId: entry.billingId,
            amount: entry.amount,
            referentId,
            status: StudentBillingStatus.DRAFT,
            createdBy,
            // On creation these fields must always be null/false by business rule.
            approvedBy: null,
            approvedAt: null,
            postedBy: null,
            postedAt: null,
            isPosted: false,
          },
        });
      })
    );

    return { referentId, count: rows.length, rows };
  }

  async list(params: ListStudentBillingsParams = {}): Promise<{
    studentBillings: StudentBillingRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.StudentBillingWhereInput = {};

    if (params.studentId !== undefined) where.studentId = params.studentId;
    if (params.classId !== undefined) where.classId = params.classId;
    if (params.subclassId !== undefined) where.subclassId = params.subclassId;
    if (params.session !== undefined) where.session = params.session;
    if (params.term !== undefined) where.term = params.term;
    if (params.billingId !== undefined) where.billingId = params.billingId;
    if (params.status !== undefined) where.status = params.status;
    if (params.referentId !== undefined) where.referentId = params.referentId;
    if (params.isPosted !== undefined) where.isPosted = params.isPosted;

    const finalWhere = Object.keys(where).length ? where : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.studentBilling.count({ where: finalWhere }),
      this.prisma.studentBilling.findMany({
        where: finalWhere,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          billing: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      studentBillings: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getById(id: number): Promise<StudentBillingRow | null> {
    return this.prisma.studentBilling.findUnique({ where: { id } });
  }

  async update(id: number, input: UpdateStudentBillingInput): Promise<StudentBillingRow> {
    if (input.billingId !== undefined) this.validateBillingId(input.billingId);
    if (input.amount !== undefined) this.validateAmount(input.amount);

    const data: Prisma.StudentBillingUncheckedUpdateInput = {};
    if (input.studentId !== undefined) {
      data.studentId = this.normalizeRequiredString(input.studentId, "studentId");
    }
    if (input.classId !== undefined) {
      data.classId = this.normalizeRequiredString(input.classId, "classId");
    }
    if (input.subclassId !== undefined) {
      data.subclassId = this.normalizeOptionalString(input.subclassId);
    }
    if (input.session !== undefined) {
      data.session = this.normalizeRequiredString(input.session, "session");
    }
    if (input.term !== undefined) {
      data.term = this.normalizeRequiredString(input.term, "term");
    }
    if (input.billingId !== undefined) {
      data.billingId = input.billingId;
    }
    if (input.amount !== undefined) {
      data.amount = input.amount;
    }
    if (input.referentId !== undefined) {
      data.referentId = this.normalizeOptionalString(input.referentId);
    }
    if (input.status !== undefined) {
      data.status = input.status;
    }
    if (input.createdBy !== undefined) {
      data.createdBy = this.normalizeOptionalString(input.createdBy);
    }
    if (input.isPosted !== undefined) {
      data.isPosted = input.isPosted;
    }

    return this.prisma.studentBilling.update({
      where: { id },
      data,
    });
  }

  async updateStatusMany(input: BulkUpdateStudentBillingStatusInput): Promise<{ count: number }> {
    if (!Array.isArray(input.ids) || input.ids.length === 0) {
      throw new Error("ids must be a non-empty array");
    }
    if (input.status !== StudentBillingStatus.DRAFT && input.status !== StudentBillingStatus.APPROVED) {
      throw new Error("status must be APPROVED or DRAFT");
    }

    const ids = [...new Set(input.ids)];
    if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
      throw new Error("ids must contain only positive integers");
    }
    const actedBy = this.normalizeRequiredString(input.actedBy, "actedBy");

    if (input.status === StudentBillingStatus.DRAFT) {
      const postedCount = await this.prisma.studentBilling.count({
        where: {
          id: { in: ids },
          isPosted: true,
        },
      });
      if (postedCount > 0) {
        throw new Error("Posted records cannot be changed to DRAFT");
      }
    }

    const data: Prisma.StudentBillingUncheckedUpdateManyInput =
      input.status === StudentBillingStatus.APPROVED
        ? {
            status: StudentBillingStatus.APPROVED,
            approvedBy: actedBy,
            approvedAt: new Date(),
          }
        : {
            status: StudentBillingStatus.DRAFT,
            approvedBy: null,
            approvedAt: null,
          };

    return this.prisma.studentBilling.updateMany({
      where: { id: { in: ids } },
      data,
    });
  }

  async postMany(input: BulkPostStudentBillingInput): Promise<{ count: number }> {
    if (!Array.isArray(input.ids) || input.ids.length === 0) {
      throw new Error("ids must be a non-empty array");
    }
    const ids = [...new Set(input.ids)];
    if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
      throw new Error("ids must contain only positive integers");
    }
    const actedBy = this.normalizeRequiredString(input.actedBy, "actedBy");

    const nonApprovedCount = await this.prisma.studentBilling.count({
      where: {
        id: { in: ids },
        status: { not: StudentBillingStatus.APPROVED },
      },
    });
    if (nonApprovedCount > 0) {
      throw new Error("Only APPROVED records can be posted");
    }

    return this.prisma.studentBilling.updateMany({
      where: {
        id: { in: ids },
        isPosted: false,
      },
      data: {
        isPosted: true,
        postedBy: actedBy,
        postedAt: new Date(),
      },
    });
  }

  async delete(id: number): Promise<StudentBillingRow> {
    return this.prisma.studentBilling.delete({ where: { id } });
  }
}

export const studentBillingService = new StudentBillingService();
