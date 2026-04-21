import type { ScoringInputSnapshot } from "@prisma/client";
import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";
import type {
  LiquidityBufferInput,
  MonthlyScores,
  ScoringInput,
} from "./scoringService";

export interface CreateScoringInputSnapshotInput {
  buyerId?: string | null;
  scoringInput: ScoringInput;
}

export interface UpdateScoringInputSnapshotInput {
  buyerId?: string | null;
  scoringInput?: ScoringInput;
}

/** When `id` is set and a row exists, it is updated; when set and absent, a row is created with that id; when omitted, a new row is created (same as {@link create}). */
export interface UpsertScoringInputSnapshotInput extends CreateScoringInputSnapshotInput {
  id?: string;
}

export type ScoringInputSnapshotApiRecord = {
  id: string;
  buyerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  scoringInput: ScoringInput;
};

function parseMonthlyIncomes(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => Number(x));
}

export function snapshotRowToApi(row: ScoringInputSnapshot): ScoringInputSnapshotApiRecord {
  return {
    id: row.id,
    buyerId: row.buyerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    scoringInput: {
      incomeRecurrent: {
        incomeMonths: row.incomeMonths,
        dominantSourceCount: row.dominantSourceCount,
        isFiftMonth: row.isFiftMonth,
        isSixtMonth: row.isSixtMonth,
      },
      incomeStability: {
        averageIncome: Number(row.averageIncome),
        monthlyIncomes: parseMonthlyIncomes(row.monthlyIncomes),
      },
      netCashFlowPositiveCount: row.netCashFlowPositiveCount,
      liquidityBuffer: row.liquidityBuffer as unknown as LiquidityBufferInput,
      creditHistory: row.creditHistory,
      riskFactor: row.riskFactor as unknown as MonthlyScores,
      overdraftEvents: row.overdraftEvents ?? undefined,
      overdraftDeepestNegativeBalance:
        row.overdraftDeepestNegativeBalance != null
          ? Number(row.overdraftDeepestNegativeBalance)
          : undefined,
      overdraftNegativeDays: row.overdraftNegativeDays ?? undefined,
      overdraftRecent: row.overdraftRecent,
      existingLoanRepayment: Number(row.existingLoanRepayment),
    },
  };
}

function scoringInputToCreateFields(
  input: ScoringInput
): Omit<Prisma.ScoringInputSnapshotUncheckedCreateInput, "id" | "buyerId"> {
  return {
    incomeMonths: input.incomeRecurrent.incomeMonths,
    dominantSourceCount: input.incomeRecurrent.dominantSourceCount,
    isFiftMonth: input.incomeRecurrent.isFiftMonth,
    isSixtMonth: input.incomeRecurrent.isSixtMonth,
    averageIncome: input.incomeStability.averageIncome,
    monthlyIncomes: input.incomeStability
      .monthlyIncomes as unknown as Prisma.InputJsonValue,
    netCashFlowPositiveCount: input.netCashFlowPositiveCount,
    liquidityBuffer: input.liquidityBuffer as unknown as Prisma.InputJsonValue,
    creditHistory: input.creditHistory,
    riskFactor: input.riskFactor as unknown as Prisma.InputJsonValue,
    overdraftEvents: input.overdraftEvents ?? null,
    overdraftDeepestNegativeBalance: input.overdraftDeepestNegativeBalance ?? null,
    overdraftNegativeDays: input.overdraftNegativeDays ?? null,
    overdraftRecent: input.overdraftRecent,
    existingLoanRepayment: input.existingLoanRepayment,
  };
}

export class ScoringInputSnapshotService {
  async create(input: CreateScoringInputSnapshotInput) {
    const { buyerId, scoringInput } = input;

    if (buyerId) {
      const buyer = await prisma.buyer.findUnique({ where: { id: buyerId } });
      if (!buyer) {
        throw new Error("Buyer not found");
      }
    }

    const row = await prisma.scoringInputSnapshot.create({
      data: {
        buyerId: buyerId ?? null,
        ...scoringInputToCreateFields(scoringInput),
      } satisfies Prisma.ScoringInputSnapshotUncheckedCreateInput,
    });

    return {
      success: true,
      message: "Scoring input snapshot created successfully",
      data: snapshotRowToApi(row),
    };
  }

  async upsert(input: UpsertScoringInputSnapshotInput) {
    const { id, buyerId, scoringInput } = input;

    if (id) {
      const existing = await prisma.scoringInputSnapshot.findUnique({
        where: { id },
      });

      if (existing) {
        const updated = await this.update(id, {
          ...(buyerId !== undefined ? { buyerId } : {}),
          scoringInput,
        });
        return { ...updated, wasCreated: false };
      }

      if (buyerId) {
        const buyer = await prisma.buyer.findUnique({ where: { id: buyerId } });
        if (!buyer) {
          throw new Error("Buyer not found");
        }
      }

      const row = await prisma.scoringInputSnapshot.create({
        data: {
          id,
          buyerId: buyerId ?? null,
          ...scoringInputToCreateFields(scoringInput),
        } satisfies Prisma.ScoringInputSnapshotUncheckedCreateInput,
      });

      return {
        success: true,
        message: "Scoring input snapshot created successfully",
        data: snapshotRowToApi(row),
        wasCreated: true,
      };
    }

    const created = await this.create({ buyerId, scoringInput });
    return { ...created, wasCreated: true };
  }

  async list(buyerId?: string) {
    const where = buyerId ? { buyerId } : {};

    const rows = await prisma.scoringInputSnapshot.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      message: "Scoring input snapshots retrieved successfully",
      data: rows.map(snapshotRowToApi),
    };
  }

  async getById(id: string) {
    const row = await prisma.scoringInputSnapshot.findUnique({
      where: { id },
    });

    if (!row) {
      throw new Error("Scoring input snapshot not found");
    }

    return {
      success: true,
      message: "Scoring input snapshot retrieved successfully",
      data: snapshotRowToApi(row),
    };
  }

  async getByBuyerId(buyerId: string) {
    const buyer = await prisma.buyer.findUnique({ where: { id: buyerId } });
    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const rows = await prisma.scoringInputSnapshot.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      message: "Scoring input snapshots retrieved successfully",
      data: rows.map(snapshotRowToApi),
    };
  }

  async getLatestByBuyerId(buyerId: string) {
    const buyer = await prisma.buyer.findUnique({ where: { id: buyerId } });
    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const row = await prisma.scoringInputSnapshot.findFirst({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
    });

    if (!row) {
      throw new Error("No scoring input snapshot found for this buyer");
    }

    return {
      success: true,
      message: "Latest scoring input snapshot retrieved successfully",
      data: snapshotRowToApi(row),
    };
  }

  async update(id: string, input: UpdateScoringInputSnapshotInput) {
    const existing = await prisma.scoringInputSnapshot.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Scoring input snapshot not found");
    }

    if (input.buyerId !== undefined && input.buyerId !== null) {
      const buyer = await prisma.buyer.findUnique({
        where: { id: input.buyerId },
      });
      if (!buyer) {
        throw new Error("Buyer not found");
      }
    }

    const data: Prisma.ScoringInputSnapshotUncheckedUpdateInput = {};

    if (input.buyerId !== undefined) {
      data.buyerId = input.buyerId;
    }

    if (input.scoringInput) {
      Object.assign(data, scoringInputToCreateFields(input.scoringInput));
    }

    const row = await prisma.scoringInputSnapshot.update({
      where: { id },
      data,
    });

    return {
      success: true,
      message: "Scoring input snapshot updated successfully",
      data: snapshotRowToApi(row),
    };
  }

  async remove(id: string) {
    const existing = await prisma.scoringInputSnapshot.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Scoring input snapshot not found");
    }

    await prisma.scoringInputSnapshot.delete({ where: { id } });

    return {
      success: true,
      message: "Scoring input snapshot deleted successfully",
    };
  }
}

export const scoringInputSnapshotService = new ScoringInputSnapshotService();
