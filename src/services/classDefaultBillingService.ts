import prisma from "../utils/prisma";
import { Prisma } from "@prisma/client";

export type ClassDefaultBillingRow = Prisma.ClassDefaultBillingGetPayload<Record<string, never>>;

export interface ListClassDefaultBillingsParams {
  classId?: string;
  subclassId?: string;
  session?: string;
  term?: string;
  billingId?: number;
}

type CreateClassDefaultBillingInput = {
  classId: string;
  subclassId?: string | null;
  session: string;
  term: string;
  billingId: number;
  amount: number;
};

type UpdateClassDefaultBillingInput = Partial<CreateClassDefaultBillingInput>;

export class ClassDefaultBillingService {
  private prisma = prisma;

  private normalizeStringRequired(value: string, fieldName: string): string {
    const normalized = value.trim();
    if (!normalized) {
      throw new Error(`${fieldName} is required`);
    }
    return normalized;
  }

  private normalizeStringOptional(value?: string | null): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
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

  private async validateBillingItemExists(billingId: number): Promise<void> {
    const row = await this.prisma.billingItem.findUnique({
      where: { id: billingId },
      select: { id: true },
    });
    if (!row) {
      throw new Error(`Billing item not found for billingId ${billingId}`);
    }
  }

  private async validateBillingItemsExist(billingIds: number[]): Promise<void> {
    const uniqueIds = [...new Set(billingIds)];
    if (uniqueIds.length === 0) {
      return;
    }
    const count = await this.prisma.billingItem.count({
      where: { id: { in: uniqueIds } },
    });
    if (count !== uniqueIds.length) {
      throw new Error("One or more billingId values are invalid");
    }
  }

  async create(input: CreateClassDefaultBillingInput): Promise<ClassDefaultBillingRow> {
    this.validateBillingId(input.billingId);
    this.validateAmount(input.amount);
    await this.validateBillingItemExists(input.billingId);

    return this.prisma.classDefaultBilling.create({
      data: {
        classId: this.normalizeStringRequired(input.classId, "classId"),
        subclassId: this.normalizeStringOptional(input.subclassId),
        session: this.normalizeStringRequired(input.session, "session"),
        term: this.normalizeStringRequired(input.term, "term"),
        billingId: input.billingId,
        amount: input.amount,
      },
    });
  }

  async createMany(input: {
    classId: string;
    subclassId?: string | null;
    session: string;
    term: string;
    items: Array<{ billingId: number; amount: number }>;
  }): Promise<{ count: number; rows: ClassDefaultBillingRow[] }> {
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new Error("items must be a non-empty array");
    }

    for (const item of input.items) {
      this.validateBillingId(item.billingId);
      this.validateAmount(item.amount);
    }

    await this.validateBillingItemsExist(input.items.map((x) => x.billingId));

    const classId = this.normalizeStringRequired(input.classId, "classId");
    const subclassId = this.normalizeStringOptional(input.subclassId);
    const session = this.normalizeStringRequired(input.session, "session");
    const term = this.normalizeStringRequired(input.term, "term");

    const rows = await this.prisma.$transaction(
      input.items.map((item) =>
        this.prisma.classDefaultBilling.create({
          data: {
            classId,
            subclassId,
            session,
            term,
            billingId: item.billingId,
            amount: item.amount,
          },
        })
      )
    );

    return { count: rows.length, rows };
  }

  async list(filters: ListClassDefaultBillingsParams = {}): Promise<ClassDefaultBillingRow[]> {
    const where: Prisma.ClassDefaultBillingWhereInput = {};

    if (filters.classId !== undefined) {
      where.classId = filters.classId.trim();
    }
    if (filters.subclassId !== undefined) {
      where.subclassId = filters.subclassId.trim();
    }
    if (filters.session !== undefined) {
      where.session = filters.session.trim();
    }
    if (filters.term !== undefined) {
      where.term = filters.term.trim();
    }
    if (filters.billingId !== undefined) {
      where.billingId = filters.billingId;
    }

    const finalWhere = Object.keys(where).length ? where : undefined;

    return this.prisma.classDefaultBilling.findMany({
      where: finalWhere,
      orderBy: [
        { classId: "asc" },
        { session: "asc" },
        { term: "asc" },
        { billingId: "asc" },
        { id: "asc" },
      ],
      include: {
        billing: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getById(id: number): Promise<ClassDefaultBillingRow | null> {
    return this.prisma.classDefaultBilling.findUnique({ where: { id } });
  }

  async update(id: number, input: UpdateClassDefaultBillingInput): Promise<ClassDefaultBillingRow> {
    if (input.billingId !== undefined) {
      this.validateBillingId(input.billingId);
      await this.validateBillingItemExists(input.billingId);
    }
    if (input.amount !== undefined) {
      this.validateAmount(input.amount);
    }

    const data: Prisma.ClassDefaultBillingUpdateInput = {};

    if (input.classId !== undefined) {
      data.classId = this.normalizeStringRequired(input.classId, "classId");
    }
    if (input.subclassId !== undefined) {
      data.subclassId = this.normalizeStringOptional(input.subclassId);
    }
    if (input.session !== undefined) {
      data.session = this.normalizeStringRequired(input.session, "session");
    }
    if (input.term !== undefined) {
      data.term = this.normalizeStringRequired(input.term, "term");
    }
    if (input.amount !== undefined) {
      data.amount = input.amount;
    }

    return this.prisma.classDefaultBilling.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<ClassDefaultBillingRow> {
    return this.prisma.classDefaultBilling.delete({ where: { id } });
  }
}

export const classDefaultBillingService = new ClassDefaultBillingService();
