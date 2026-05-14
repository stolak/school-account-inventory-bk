import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";

export type AccountTransactionRow = Prisma.AccountTransactionGetPayload<Record<string, never>>;

function endOfUtcDay(d: Date): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  return new Date(Date.UTC(y, m, day, 23, 59, 59, 999));
}

function startOfUtcMonthContaining(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

/** Default window: first day of current UTC month 00:00 through end of today UTC. */
function defaultMonthIntervalToToday(): { from: Date; to: Date } {
  const now = new Date();
  return { from: startOfUtcMonthContaining(now), to: endOfUtcDay(now) };
}

function decimalNetBalance(
  sumDebit: Prisma.Decimal | null,
  sumCredit: Prisma.Decimal | null
): string {
  const debit = sumDebit ?? new Prisma.Decimal(0);
  const credit = sumCredit ?? new Prisma.Decimal(0);
  return debit.minus(credit).toString();
}

export interface AccountTransactionLogParams {
  accountId: string;
  transactionDateFrom?: Date;
  transactionDateTo?: Date;
}

export type AccountTransactionLogRow = {
  id: number;
  debit: string;
  credit: string;
  remarks: string | null;
  ref: string | null;
  manualRef: string | null;
  transactionDate: Date;
  postedBy: string | null;
  createdAt: Date;
  project: { id: string; name: string } | null;
};

export interface AccountTransactionLogResult {
  account: {
    id: number;
    accountNo: string | null;
    accountRef: string | null;
    accountDescription: string;
    group: { id: number; name: string };
    head: { id: number; name: string };
    subhead: { id: number; name: string };
  };
  transactionDateFrom: Date;
  transactionDateTo: Date;
  /** Sum(debit) − sum(credit) with transactionDate strictly before `transactionDateFrom`. */
  balanceBeforeFromDate: string;
  transactions: AccountTransactionLogRow[];
}

export interface AccountTransactionByAccountReportParams {
  transactionDateFrom?: Date;
  transactionDateTo?: Date;
}

export type AccountTransactionByAccountReportRow = {
  accountId: number;
  headId: number;
  subheadId: number;
  sumCreditMinusDebit: string;
  account: {
    id: number;
    groupId: number;
    headId: number;
    subheadId: number;
    rank: number;
    accountNo: string | null;
    accountRef: string | null;
    accountDescription: string;
    group: { id: number; name: string };
    head: { id: number; code: string; name: string };
    subhead: { id: number; code: string | null; name: string; rank: number };
  };
};

export interface AccountTransactionByAccountReportResult {
  transactionDateFrom: Date | null;
  transactionDateTo: Date | null;
  rows: AccountTransactionByAccountReportRow[];
}

type EntryInput = {
  accountId: string;
  amount: number;
  ref: string;
  manualRef: string;
  transactionDate: string;
  postedBy: string;
  projectId?: string;
  accountSub?: string;
  remarks: string;
};

type DbClient = Pick<Prisma.TransactionClient, "accountChart" | "project" | "accountTransaction">;

export class AccountTransactionService {
  private prisma = prisma;

  /**
   * Grouped report by accountId: sum(credit) − sum(debit), optionally filtered by transaction date range.
   * Ordered by headId, subhead.rank, subheadId, account.rank, accountId.
   */
  async getAccountTransactionByAccountReport(
    params: AccountTransactionByAccountReportParams = {}
  ): Promise<AccountTransactionByAccountReportResult> {
    const from = params.transactionDateFrom;
    const to = params.transactionDateTo;

    if (from && to && from.getTime() > to.getTime()) {
      throw new Error("transactionDateFrom must be before or equal to transactionDateTo");
    }

    const dateWhere =
      from || to
        ? {
            transactionDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {};

    const grouped = await this.prisma.accountTransaction.groupBy({
      by: ["accountId", "headId", "subheadId"],
      ...(Object.keys(dateWhere).length ? { where: dateWhere } : {}),
      _sum: { credit: true, debit: true },
    });

    if (!grouped.length) {
      return {
        transactionDateFrom: from ?? null,
        transactionDateTo: to ?? null,
        rows: [],
      };
    }

    const accountIds = Array.from(new Set(grouped.map((g) => g.accountId)));

    const accounts = await this.prisma.accountChart.findMany({
      where: { id: { in: accountIds } },
      select: {
        id: true,
        groupId: true,
        headId: true,
        subheadId: true,
        rank: true,
        accountNo: true,
        accountRef: true,
        accountDescription: true,
        group: { select: { id: true, name: true } },
        head: { select: { id: true, code: true, name: true } },
        subhead: { select: { id: true, code: true, name: true, rank: true } },
      },
    });

    const accountById = new Map(accounts.map((a) => [a.id, a]));

    const rows: AccountTransactionByAccountReportRow[] = grouped
      .map((g) => {
        const account = accountById.get(g.accountId);
        if (!account) return null;

        const sumCredit = g._sum.credit ?? new Prisma.Decimal(0);
        const sumDebit = g._sum.debit ?? new Prisma.Decimal(0);
        return {
          accountId: g.accountId,
          headId: g.headId,
          subheadId: g.subheadId,
          sumCreditMinusDebit: sumCredit.minus(sumDebit).toString(),
          account,
        };
      })
      .filter((row): row is AccountTransactionByAccountReportRow => row !== null);

    rows.sort((a, b) => {
      const byHeadId = a.headId - b.headId;
      if (byHeadId !== 0) return byHeadId;

      const bySubheadRank = a.account.subhead.rank - b.account.subhead.rank;
      if (bySubheadRank !== 0) return bySubheadRank;

      const bySubheadId = a.subheadId - b.subheadId;
      if (bySubheadId !== 0) return bySubheadId;

      const byAccountRank = a.account.rank - b.account.rank;
      if (byAccountRank !== 0) return byAccountRank;

      return a.accountId - b.accountId;
    });

    return {
      transactionDateFrom: from ?? null,
      transactionDateTo: to ?? null,
      rows,
    };
  }

  /**
   * Account transactions in a date window. Defaults to current UTC month through today.
   * Opening balance uses rows strictly before the window start.
   */
  async getAccountTransactionLog(
    params: AccountTransactionLogParams
  ): Promise<AccountTransactionLogResult> {
    console.log("params", params);
    const accountIdRaw = params.accountId.trim();
    if (!accountIdRaw) throw new Error("accountId is required");

    const accountId = Number.parseInt(accountIdRaw, 10);
    if (!Number.isFinite(accountId) || accountId < 1) {
      throw new Error("accountId must be a positive integer");
    }

    const account = await this.prisma.accountChart.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        accountNo: true,
        accountRef: true,
        accountDescription: true,
        group: { select: { id: true, name: true } },
        head: { select: { id: true, name: true } },
        subhead: { select: { id: true, name: true } },
      },
    });
    if (!account) throw new Error("Account not found for accountId");

    let from: Date;
    let to: Date;
    if (params.transactionDateFrom !== undefined && params.transactionDateTo !== undefined) {
      from = params.transactionDateFrom;
      to = params.transactionDateTo;
    } else if (params.transactionDateFrom !== undefined) {
      from = params.transactionDateFrom;
      to = endOfUtcDay(new Date());
    } else if (params.transactionDateTo !== undefined) {
      const t = params.transactionDateTo;
      from = startOfUtcMonthContaining(t);
      to = endOfUtcDay(t);
    } else {
      ({ from, to } = defaultMonthIntervalToToday());
    }

    if (from.getTime() > to.getTime()) {
      throw new Error("transactionDateFrom must be before or equal to transactionDateTo");
    }

    const [balanceAgg, rows] = await Promise.all([
      this.prisma.accountTransaction.aggregate({
        where: {
          accountId,
          transactionDate: { lt: from },
        },
        _sum: { debit: true, credit: true },
      }),
      this.prisma.accountTransaction.findMany({
        where: {
          accountId,
          transactionDate: { gte: from, lte: to },
        },
        orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    const balanceBeforeFromDate = decimalNetBalance(
      balanceAgg._sum.debit ?? null,
      balanceAgg._sum.credit ?? null
    );

    const transactions: AccountTransactionLogRow[] = rows.map((row) => ({
      id: row.id,
      debit: row.debit.toString(),
      credit: row.credit.toString(),
      remarks: row.remarks,
      ref: row.ref,
      manualRef: row.manualRef,
      transactionDate: row.transactionDate,
      postedBy: row.postedBy,
      createdAt: row.createdAt,
      project: row.project,
    }));

    return {
      account,
      transactionDateFrom: from,
      transactionDateTo: to,
      balanceBeforeFromDate,
      transactions,
    };
  }

  async rollBack(ref: string): Promise<{ count: number }> {
    const trimmedRef = ref.trim();
    if (!trimmedRef) {
      throw new Error("ref is required");
    }

    const deleted = await this.prisma.accountTransaction.deleteMany({
      where: { ref: trimmedRef },
    });

    return { count: deleted.count };
  }

  private getDbClient(db?: DbClient): DbClient {
    return db ?? this.prisma;
  }

  private async resolveAccount(db: DbClient, accountIdRaw: string) {
    const accountId = Number.parseInt(accountIdRaw, 10);
    if (!Number.isFinite(accountId) || accountId < 1) {
      throw new Error("accountId must be a positive integer");
    }

    const account = await db.accountChart.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        groupId: true,
        headId: true,
        subheadId: true,
        accountNo: true,
        accountDescription: true,
      },
    });
    if (!account) {
      throw new Error("Account not found for accountId");
    }
    return account;
  }

  private parseDateOrThrow(v: string): Date {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      throw new Error("transactionDate must be a valid date string");
    }
    return d;
  }

  private async validateProjectId(db: DbClient, projectId?: string): Promise<void> {
    if (projectId === undefined) return;
    const p = projectId.trim();
    if (!p) {
      throw new Error("projectId cannot be empty when provided");
    }
    const project = await db.project.findUnique({
      where: { id: p },
      select: { id: true },
    });
    if (!project) {
      throw new Error("Invalid projectId: project not found");
    }
  }

  private async postEntry(
    type: "debit" | "credit",
    input: EntryInput,
    db?: DbClient
  ): Promise<AccountTransactionRow> {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error("amount must be a positive number");
    }
    if (!input.ref?.trim()) {
      throw new Error("ref is required");
    }
    if (!input.manualRef?.trim()) {
      throw new Error("manualRef is required");
    }
    if (!input.postedBy?.trim()) {
      throw new Error("postedBy is required");
    }

    const dbClient = this.getDbClient(db);
    const account = await this.resolveAccount(dbClient, input.accountId);
    await this.validateProjectId(dbClient, input.projectId);
    const transactionDate = this.parseDateOrThrow(input.transactionDate);

    const accountCode = account.accountNo?.trim() || String(account.id);
    const accountSub = input.accountSub?.trim() || account.accountDescription;

    return dbClient.accountTransaction.create({
      data: {
        groupId: account.groupId,
        headId: account.headId,
        subheadId: account.subheadId,
        accountId: account.id,
        accountCode,
        accountSub,
        debit: type === "debit" ? input.amount : 0,
        credit: type === "credit" ? input.amount : 0,
        ref: input.ref.trim(),
        manualRef: input.manualRef.trim(),
        transactionDate,
        postedBy: input.postedBy.trim(),
        ...(input.projectId !== undefined ? { projectId: input.projectId.trim() } : {}),
        remarks: input.remarks.trim(),
      },
    });
  }

  async debitAccount(input: EntryInput, db?: DbClient): Promise<AccountTransactionRow> {
    return this.postEntry("debit", input, db);
  }

  async creditAccount(input: EntryInput, db?: DbClient): Promise<AccountTransactionRow> {
    return this.postEntry("credit", input, db);
  }
}

export const accountTransactionService = new AccountTransactionService();
