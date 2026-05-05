import prisma from "../utils/prisma";
import {
  ConcessionDiscountCalculationType,
  ConcessionDiscountType,
  Prisma,
  Status,
} from "@prisma/client";

const concessionInclude = {
  appliesTo: true,
} satisfies Prisma.ConcessionDiscountInclude;

export type ConcessionDiscountRow = Prisma.ConcessionDiscountGetPayload<{
  include: typeof concessionInclude;
}>;

export interface ListConcessionDiscountsParams {
  q?: string;
  type?: ConcessionDiscountType;
  calculationType?: ConcessionDiscountCalculationType;
  accountId?: number;
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

export class ConcessionDiscountService {
  private prisma = prisma;

  private async validateAccountId(accountId?: number | null): Promise<void> {
    if (accountId === undefined || accountId === null) {
      return;
    }
    if (!Number.isInteger(accountId) || accountId < 1) {
      throw new Error("accountId must be a positive integer when provided");
    }
    const account = await this.prisma.accountChart.findUnique({
      where: { id: accountId },
      select: { id: true },
    });
    if (!account) {
      throw new Error("Invalid accountId: account chart not found");
    }
  }

  private async validateBillingItemIds(billingItemIds: number[]): Promise<number[]> {
    const uniqueIds = [...new Set(billingItemIds)];
    if (uniqueIds.length === 0) {
      return uniqueIds;
    }
    const count = await this.prisma.billingItem.count({
      where: { id: { in: uniqueIds } },
    });
    if (count !== uniqueIds.length) {
      throw new Error("One or more appliesTo billing item IDs are invalid");
    }
    return uniqueIds;
  }

  async createConcessionDiscount(input: {
    code: string;
    name: string;
    type: ConcessionDiscountType;
    calculationType: ConcessionDiscountCalculationType;
    value: number;
    appliesToIds?: number[];
    accountId?: number | null;
    maxLimit?: number | null;
    status?: Status;
  }): Promise<ConcessionDiscountRow> {
    try {
      const appliesToIds = await this.validateBillingItemIds(input.appliesToIds ?? []);
      await this.validateAccountId(input.accountId);

      return await this.prisma.concessionDiscount.create({
        data: {
          code: input.code,
          name: input.name,
          type: input.type,
          calculationType: input.calculationType,
          value: input.value,
          ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
          ...(input.maxLimit !== undefined ? { maxLimit: input.maxLimit } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(appliesToIds.length > 0
            ? { appliesTo: { connect: appliesToIds.map((id) => ({ id })) } }
            : {}),
        },
        include: concessionInclude,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Concession/discount code already exists");
      }
      throw e;
    }
  }

  async listConcessionDiscounts(params: ListConcessionDiscountsParams = {}): Promise<{
    concessionDiscounts: ConcessionDiscountRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ConcessionDiscountWhereInput = {};

    if (params.type !== undefined) {
      where.type = params.type;
    }
    if (params.calculationType !== undefined) {
      where.calculationType = params.calculationType;
    }
    if (params.accountId !== undefined) {
      where.accountId = params.accountId;
    }
    if (params.status === undefined) {
      where.status = Status.Active;
    } else if (params.status !== "All") {
      where.status = params.status;
    }
    if (params.q) {
      where.OR = [
        { name: { contains: params.q } },
        { code: { contains: params.q } },
      ];
    }

    const finalWhere = Object.keys(where).length ? where : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.concessionDiscount.count({ where: finalWhere }),
      this.prisma.concessionDiscount.findMany({
        where: finalWhere,
        include: concessionInclude,
        orderBy: [{ type: "asc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      concessionDiscounts: rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async getConcessionDiscountById(id: number): Promise<ConcessionDiscountRow | null> {
    return this.prisma.concessionDiscount.findUnique({
      where: { id },
      include: concessionInclude,
    });
  }

  async updateConcessionDiscount(
    id: number,
    input: {
      code?: string;
      name?: string;
      type?: ConcessionDiscountType;
      calculationType?: ConcessionDiscountCalculationType;
      value?: number;
      appliesToIds?: number[];
      accountId?: number | null;
      maxLimit?: number | null;
      status?: Status;
    },
  ): Promise<ConcessionDiscountRow> {
    try {
      let appliesToSet: number[] | undefined;
      if (input.appliesToIds !== undefined) {
        appliesToSet = await this.validateBillingItemIds(input.appliesToIds);
      }
      if (input.accountId !== undefined) {
        await this.validateAccountId(input.accountId);
      }

      return await this.prisma.concessionDiscount.update({
        where: { id },
        data: {
          ...(input.code !== undefined ? { code: input.code } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.calculationType !== undefined
            ? { calculationType: input.calculationType }
            : {}),
          ...(input.value !== undefined ? { value: input.value } : {}),
          ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
          ...(input.maxLimit !== undefined ? { maxLimit: input.maxLimit } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(appliesToSet !== undefined
            ? { appliesTo: { set: appliesToSet.map((billingItemId) => ({ id: billingItemId })) } }
            : {}),
        },
        include: concessionInclude,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Concession/discount code already exists");
      }
      throw e;
    }
  }

  async deleteConcessionDiscount(id: number): Promise<ConcessionDiscountRow> {
    return this.prisma.concessionDiscount.delete({
      where: { id },
      include: concessionInclude,
    });
  }
}

export const concessionDiscountService = new ConcessionDiscountService();
