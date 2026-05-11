import { BatchStatus, JournalTransferType, Prisma, Status } from "@prisma/client";
import prisma from "../utils/prisma";
import { randomUUID } from "crypto";

const tempJournalTransferInclude = {
  account: { select: { id: true, accountDescription: true, accountNo: true } },
  project: { select: { id: true, name: true } },
} satisfies Prisma.TempJournalTransferInclude;

export type TempJournalTransferRow = Prisma.TempJournalTransferGetPayload<
  Record<string, never>
>;

export interface ListTempJournalTransfersParams {
  transType?: JournalTransferType;
  accountId?: number;
  status?: Status | "All";
  batchStatus?: BatchStatus;
  projectId?: string;
  page?: number;
  limit?: number;
}

type CreateTempJournalTransferInput = {
  createdById: string;
  transType: JournalTransferType;
  accountId: number;
  debit?: number;
  credit?: number;
  status?: Status;
  batchStatus?: BatchStatus;
  referenceNo?: string | null;
  manualReferenceNo?: string | null;
  transactionDate: Date;
  postedAt?: Date | null;
  postedBy?: string | null;
  remarks?: string | null;
  finalPostedAt?: Date | null;
  finalPostedBy?: string | null;
  projectId?: string | null;
};

type UpdateTempJournalTransferInput = Partial<CreateTempJournalTransferInput>;
type CreateManyTempJournalTransferInput = {
  createdById: string;
  referenceNo?: string | null;
  entries: Array<Omit<CreateTempJournalTransferInput, "createdById">>;
};

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function generateReferenceNo(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `TJT-${y}${m}${day}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export class TempJournalTransferService {
  private prisma = prisma;

  private normalizeOptionalString(value?: string | null): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeOptionalProjectId(value?: string | null): string | null | undefined {
    const normalized = this.normalizeOptionalString(value);
    if (normalized === undefined || normalized === null) {
      return normalized;
    }
    return normalized;
  }

  private validatePositiveInt(value: number, fieldName: string): void {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`${fieldName} must be a positive integer`);
    }
  }

  private validateAmount(value: number, fieldName: "debit" | "credit"): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${fieldName} must be a valid number greater than or equal to 0`);
    }
  }

  private validateDebitCreditRule(debit: number, credit: number): void {
    const debitPositive = debit > 0;
    const creditPositive = credit > 0;
    if (debitPositive === creditPositive) {
      throw new Error(
        "Exactly one of debit or credit must be greater than 0, while the other must be 0",
      );
    }
  }

  private validateDate(value: Date, fieldName: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error(`${fieldName} must be a valid date`);
    }
  }

  private async validateAccountExists(accountId: number): Promise<void> {
    const row = await this.prisma.accountChart.findUnique({
      where: { id: accountId },
      select: { id: true },
    });
    if (!row) {
      throw new Error("Invalid accountId: account chart not found");
    }
  }

  private async validateProjectExists(projectId?: string | null): Promise<void> {
    if (projectId === undefined || projectId === null) {
      return;
    }
    const row = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!row) {
      throw new Error("Invalid projectId: project not found");
    }
  }

  private resolveReferenceNo(referenceNo?: string | null): string {
    const normalizedReferenceNo = this.normalizeOptionalString(referenceNo);
    return normalizedReferenceNo && normalizedReferenceNo.length > 0
      ? normalizedReferenceNo
      : generateReferenceNo();
  }

  private normalizeRequiredUserId(value: string): string {
    const normalized = value.trim();
    if (!normalized) {
      throw new Error("createdById is required");
    }
    return normalized;
  }

  async create(input: CreateTempJournalTransferInput): Promise<TempJournalTransferRow> {
    const createdById = this.normalizeRequiredUserId(input.createdById);
    this.validatePositiveInt(input.accountId, "accountId");
    await this.validateAccountExists(input.accountId);

    const debit = input.debit ?? 0;
    const credit = input.credit ?? 0;
    this.validateAmount(debit, "debit");
    this.validateAmount(credit, "credit");
    this.validateDebitCreditRule(debit, credit);
    this.validateDate(input.transactionDate, "transactionDate");
    if (input.postedAt !== undefined && input.postedAt !== null) {
      this.validateDate(input.postedAt, "postedAt");
    }
    if (input.finalPostedAt !== undefined && input.finalPostedAt !== null) {
      this.validateDate(input.finalPostedAt, "finalPostedAt");
    }

    const projectId = this.normalizeOptionalProjectId(input.projectId);
    const finalReferenceNo = this.resolveReferenceNo(input.referenceNo);
    await this.validateProjectExists(projectId);

    return this.prisma.tempJournalTransfer.create({
      data: {
        transType: input.transType,
        accountId: input.accountId,
        debit,
        credit,
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.batchStatus !== undefined ? { batchStatus: input.batchStatus } : {}),
        referenceNo: finalReferenceNo,
        ...(input.manualReferenceNo !== undefined
          ? { manualReferenceNo: this.normalizeOptionalString(input.manualReferenceNo) }
          : {}),
        transactionDate: input.transactionDate,
        ...(input.postedAt !== undefined ? { postedAt: input.postedAt } : {}),
        ...(input.postedBy !== undefined
          ? { postedBy: this.normalizeOptionalString(input.postedBy) }
          : {}),
        ...(input.remarks !== undefined ? { remarks: this.normalizeOptionalString(input.remarks) } : {}),
        ...(input.finalPostedAt !== undefined ? { finalPostedAt: input.finalPostedAt } : {}),
        ...(input.finalPostedBy !== undefined
          ? { finalPostedBy: this.normalizeOptionalString(input.finalPostedBy) }
          : {}),
        ...(projectId !== undefined ? { projectId } : {}),
        createdById,
      },
    });
  }

  async createMany(
    input: CreateManyTempJournalTransferInput,
  ): Promise<{ referenceNo: string; rows: TempJournalTransferRow[] }> {
    const createdById = this.normalizeRequiredUserId(input.createdById);
    if (!Array.isArray(input.entries) || input.entries.length === 0) {
      throw new Error("entries must be a non-empty array");
    }

    const finalReferenceNo = this.resolveReferenceNo(input.referenceNo);

    const normalizedEntries = input.entries.map((entry) => {
      this.validatePositiveInt(entry.accountId, "accountId");

      const debit = entry.debit ?? 0;
      const credit = entry.credit ?? 0;
      this.validateAmount(debit, "debit");
      this.validateAmount(credit, "credit");
      this.validateDebitCreditRule(debit, credit);

      this.validateDate(entry.transactionDate, "transactionDate");
      if (entry.postedAt !== undefined && entry.postedAt !== null) {
        this.validateDate(entry.postedAt, "postedAt");
      }
      if (entry.finalPostedAt !== undefined && entry.finalPostedAt !== null) {
        this.validateDate(entry.finalPostedAt, "finalPostedAt");
      }

      return {
        transType: entry.transType,
        accountId: entry.accountId,
        debit,
        credit,
        ...(entry.status !== undefined ? { status: entry.status } : {}),
        ...(entry.batchStatus !== undefined ? { batchStatus: entry.batchStatus } : {}),
        ...(entry.manualReferenceNo !== undefined
          ? { manualReferenceNo: this.normalizeOptionalString(entry.manualReferenceNo) }
          : {}),
        transactionDate: entry.transactionDate,
        ...(entry.postedAt !== undefined ? { postedAt: entry.postedAt } : {}),
        ...(entry.postedBy !== undefined
          ? { postedBy: this.normalizeOptionalString(entry.postedBy) }
          : {}),
        ...(entry.remarks !== undefined ? { remarks: this.normalizeOptionalString(entry.remarks) } : {}),
        ...(entry.finalPostedAt !== undefined ? { finalPostedAt: entry.finalPostedAt } : {}),
        ...(entry.finalPostedBy !== undefined
          ? { finalPostedBy: this.normalizeOptionalString(entry.finalPostedBy) }
          : {}),
        projectId: this.normalizeOptionalProjectId(entry.projectId),
      };
    });

    const accountIds = [...new Set(normalizedEntries.map((entry) => entry.accountId))];
    const accountCount = await this.prisma.accountChart.count({
      where: { id: { in: accountIds } },
    });
    if (accountCount !== accountIds.length) {
      throw new Error("One or more accountId values are invalid");
    }

    const projectIds = [
      ...new Set(
        normalizedEntries
          .map((entry) => entry.projectId)
          .filter((projectId): projectId is string => projectId !== null),
      ),
    ];
    if (projectIds.length > 0) {
      const projectCount = await this.prisma.project.count({
        where: { id: { in: projectIds } },
      });
      if (projectCount !== projectIds.length) {
        throw new Error("One or more projectId values are invalid");
      }
    }

    const rows = await this.prisma.$transaction(
      normalizedEntries.map((entry) =>
        this.prisma.tempJournalTransfer.create({
          data: {
            ...entry,
            referenceNo: finalReferenceNo,
            createdById,
          },
        }),
      ),
    );

    return { referenceNo: finalReferenceNo, rows };
  }

  async list(params: ListTempJournalTransfersParams = {}): Promise<{
    tempJournalTransfers: Array<
      Prisma.TempJournalTransferGetPayload<{ include: typeof tempJournalTransferInclude }>
    >;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TempJournalTransferWhereInput = {};
    if (params.transType !== undefined) where.transType = params.transType;
    if (params.accountId !== undefined) where.accountId = params.accountId;
    if (params.batchStatus !== undefined) where.batchStatus = params.batchStatus;
    if (params.projectId !== undefined) where.projectId = params.projectId;

    if (params.status === undefined) {
      where.status = Status.Active;
    } else if (params.status !== "All") {
      where.status = params.status;
    }

    const finalWhere = Object.keys(where).length ? where : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.tempJournalTransfer.count({ where: finalWhere }),
      this.prisma.tempJournalTransfer.findMany({
        where: finalWhere,
        include: tempJournalTransferInclude,
        orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    return {
      tempJournalTransfers: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getById(id: number): Promise<TempJournalTransferRow | null> {
    return this.prisma.tempJournalTransfer.findUnique({ where: { id } });
  }

  async update(id: number, input: UpdateTempJournalTransferInput): Promise<TempJournalTransferRow> {
    if (input.accountId !== undefined) {
      this.validatePositiveInt(input.accountId, "accountId");
      await this.validateAccountExists(input.accountId);
    }
    if (input.debit !== undefined) this.validateAmount(input.debit, "debit");
    if (input.credit !== undefined) this.validateAmount(input.credit, "credit");
    if (input.transactionDate !== undefined) this.validateDate(input.transactionDate, "transactionDate");
    if (input.postedAt !== undefined && input.postedAt !== null) this.validateDate(input.postedAt, "postedAt");
    if (input.finalPostedAt !== undefined && input.finalPostedAt !== null) {
      this.validateDate(input.finalPostedAt, "finalPostedAt");
    }

    if (input.debit !== undefined || input.credit !== undefined) {
      const existing = await this.prisma.tempJournalTransfer.findUnique({
        where: { id },
        select: { debit: true, credit: true },
      });
      if (!existing) {
        throw new Error("Temp journal transfer not found");
      }
      const effectiveDebit = input.debit ?? Number(existing.debit);
      const effectiveCredit = input.credit ?? Number(existing.credit);
      this.validateDebitCreditRule(effectiveDebit, effectiveCredit);
    }

    let projectId: string | null | undefined = undefined;
    if (input.projectId !== undefined) {
      projectId = this.normalizeOptionalProjectId(input.projectId);
      await this.validateProjectExists(projectId);
    }

    return this.prisma.tempJournalTransfer.update({
      where: { id },
      data: {
        ...(input.transType !== undefined ? { transType: input.transType } : {}),
        ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
        ...(input.debit !== undefined ? { debit: input.debit } : {}),
        ...(input.credit !== undefined ? { credit: input.credit } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.batchStatus !== undefined ? { batchStatus: input.batchStatus } : {}),
        ...(input.referenceNo !== undefined
          ? { referenceNo: this.normalizeOptionalString(input.referenceNo) }
          : {}),
        ...(input.manualReferenceNo !== undefined
          ? { manualReferenceNo: this.normalizeOptionalString(input.manualReferenceNo) }
          : {}),
        ...(input.transactionDate !== undefined ? { transactionDate: input.transactionDate } : {}),
        ...(input.postedAt !== undefined ? { postedAt: input.postedAt } : {}),
        ...(input.postedBy !== undefined
          ? { postedBy: this.normalizeOptionalString(input.postedBy) }
          : {}),
        ...(input.remarks !== undefined ? { remarks: this.normalizeOptionalString(input.remarks) } : {}),
        ...(input.finalPostedAt !== undefined ? { finalPostedAt: input.finalPostedAt } : {}),
        ...(input.finalPostedBy !== undefined
          ? { finalPostedBy: this.normalizeOptionalString(input.finalPostedBy) }
          : {}),
        ...(projectId !== undefined ? { projectId } : {}),
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: number): Promise<TempJournalTransferRow> {
    return this.prisma.tempJournalTransfer.delete({ where: { id } });
  }
}

export const tempJournalTransferService = new TempJournalTransferService();
