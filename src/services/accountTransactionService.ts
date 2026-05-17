import { Prisma, StudentStatus } from "@prisma/client";
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

export interface AccountBalanceAsAtDateParams {
  accountId: string;
  asAtDate?: Date;
}

export interface AccountBalanceAsAtDateResult {
  account: {
    id: number;
    accountNo: string | null;
    accountRef: string | null;
    accountDescription: string;
    group: { id: number; name: string };
    head: { id: number; name: string };
    subhead: { id: number; name: string };
  };
  asAtDate: Date;
  /** Sum(credit) − sum(debit) for rows with transactionDate <= asAtDate. */
  balanceAsAtDate: string;
}

export interface StudentAccountBalanceAsAtDateParams {
  studentId: string;
  asAtDate?: Date;
}

export interface StudentAccountBalanceAsAtDateResult {
  studentId: string;
  asAtDate: Date;
  /** Sum(credit) − sum(debit) for rows with transactionDate <= asAtDate and accountSub = studentId. */
  balanceAsAtDate: string;
  sumCredit: string;
  sumDebit: string;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export interface ListStudentBalancesParams {
  asAtDate?: Date;
  status?: StudentStatus;
  orderBy?: "classId" | "balance";
  orderDirection?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface StudentBalanceRow {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  status: StudentStatus;
  classId: string | null;
  subclassId: string | null;
  classInfo: { id: string; name: string } | null;
  subclassInfo: { id: string; name: string } | null;
  sumCredit: string;
  sumDebit: string;
  balance: string;
}

export interface ListStudentBalancesResult {
  asAtDate: Date;
  status: StudentStatus | "All";
  orderBy: "classId" | "balance";
  orderDirection: "asc" | "desc";
  rows: StudentBalanceRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export type AccountTransactionHeadSubheadRow = {
  name: string;
  headcode: number | string;
  subheads: Array<{
    id: number;
    name: string;
    balance: number;
  }>;
};

export type AccountTransactionByHeadSubheadReportResult = Record<
  string,
  AccountTransactionHeadSubheadRow
>;

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

  async listStudentBalances(params: ListStudentBalancesParams = {}): Promise<ListStudentBalancesResult> {
    const asAtDate = params.asAtDate ?? endOfUtcDay(new Date());
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const orderDirection = params.orderDirection ?? "asc";
    const orderBy = params.orderBy ?? "classId";
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
      ...(params.status !== undefined ? { status: params.status } : {}),
    };

    const total = await this.prisma.student.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limit));

    if (total === 0) {
      return {
        asAtDate,
        status: params.status ?? "All",
        orderBy,
        orderDirection,
        rows: [],
        pagination: { page, limit, total, totalPages },
      };
    }

    const studentSelect = Prisma.validator<Prisma.StudentSelect>()({
      id: true,
      admissionNumber: true,
      firstName: true,
      middleName: true,
      lastName: true,
      status: true,
      classId: true,
      subClassId: true,
      class: { select: { id: true, name: true } },
      subClass: { select: { id: true, name: true } },
    });

    // If sorting by balance, compute globally before pagination.
    const students =
      orderBy === "balance"
        ? await this.prisma.student.findMany({
            where,
            select: studentSelect,
          })
        : await this.prisma.student.findMany({
            where,
            skip,
            take: limit,
            orderBy: [
              { classId: orderDirection },
              { subClassId: orderDirection },
              { id: "asc" },
            ],
            select: studentSelect,
          });

    const studentIds = students.map((x) => x.id);

    const balances =
      studentIds.length === 0
        ? []
        : await this.prisma.accountTransaction.groupBy({
            by: ["accountSub"],
            where: {
              accountSub: { in: studentIds },
              transactionDate: { lte: asAtDate },
            },
            _sum: { credit: true, debit: true },
          });

    const balanceMap = new Map<
      string,
      { credit: Prisma.Decimal; debit: Prisma.Decimal; balance: Prisma.Decimal }
    >();

    for (const row of balances) {
      if (!row.accountSub) continue;
      const credit = row._sum.credit ?? new Prisma.Decimal(0);
      const debit = row._sum.debit ?? new Prisma.Decimal(0);
      balanceMap.set(row.accountSub, {
        credit,
        debit,
        balance: credit.minus(debit),
      });
    }

    const rows: StudentBalanceRow[] = students.map((student) => {
      const sums = balanceMap.get(student.id) ?? {
        credit: new Prisma.Decimal(0),
        debit: new Prisma.Decimal(0),
        balance: new Prisma.Decimal(0),
      };

      return {
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        status: student.status,
        classId: student.classId,
        subclassId: student.subClassId,
        classInfo: student.class ? { id: student.class.id, name: student.class.name } : null,
        subclassInfo: student.subClass
          ? { id: student.subClass.id, name: student.subClass.name }
          : null,
        sumCredit: sums.credit.toString(),
        sumDebit: sums.debit.toString(),
        balance: sums.balance.toString(),
      };
    });

    // Correct global balance sorting.
    if (orderBy === "balance") {
      rows.sort((a, b) => {
        const balanceCmp = new Prisma.Decimal(a.balance).comparedTo(new Prisma.Decimal(b.balance));

        if (balanceCmp !== 0) {
          return orderDirection === "asc" ? balanceCmp : -balanceCmp;
        }

        const classCmp = (a.classId ?? "").localeCompare(b.classId ?? "");
        if (classCmp !== 0) {
          return classCmp;
        }

        const subClassCmp = (a.subclassId ?? "").localeCompare(b.subclassId ?? "");
        if (subClassCmp !== 0) {
          return subClassCmp;
        }

        return a.studentId.localeCompare(b.studentId);
      });
    }

    const pagedRows = orderBy === "balance" ? rows.slice(skip, skip + limit) : rows;

    return {
      asAtDate,
      status: params.status ?? "All",
      orderBy,
      orderDirection,
      rows: pagedRows,
      pagination: { page, limit, total, totalPages },
    };
  }

  /**
   * Student account balance as at a date: sum(credit) − sum(debit) from inception through the selected date (inclusive),
   * filtered by `accountSub = studentId`.
   */
  async getStudentAccountBalanceAsAtDate(
    params: StudentAccountBalanceAsAtDateParams
  ): Promise<StudentAccountBalanceAsAtDateResult> {
    const studentId = params.studentId.trim();
    if (!studentId) throw new Error("studentId is required");

    const asAtDate = params.asAtDate ?? endOfUtcDay(new Date());

    const agg = await this.prisma.accountTransaction.aggregate({
      where: {
        accountSub: studentId,
        transactionDate: { lte: asAtDate },
      },
      _sum: { credit: true, debit: true },
    });

    const sumCredit = agg._sum.credit ?? new Prisma.Decimal(0);
    const sumDebit = agg._sum.debit ?? new Prisma.Decimal(0);
    const balanceAsAtDate = sumCredit.minus(sumDebit).toString();

    return {
      studentId,
      asAtDate,
      balanceAsAtDate,
      sumCredit: sumCredit.toString(),
      sumDebit: sumDebit.toString(),
    };
  }

  /**
   * Account balance as at a date: sum(credit) − sum(debit) from inception through the selected date (inclusive).
   */
  async getAccountBalanceAsAtDate(
    params: AccountBalanceAsAtDateParams
  ): Promise<AccountBalanceAsAtDateResult> {
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

    const asAtDate = params.asAtDate ?? endOfUtcDay(new Date());

    const agg = await this.prisma.accountTransaction.aggregate({
      where: {
        accountId,
        transactionDate: { lte: asAtDate },
      },
      _sum: { credit: true, debit: true },
    });

    const sumCredit = agg._sum.credit ?? null;
    const sumDebit = agg._sum.debit ?? null;
    const balanceAsAtDate = decimalNetBalance(sumDebit, sumCredit);

    return {
      account,
      asAtDate,
      balanceAsAtDate,
    };
  }

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
   * Grouped report by subheadId: sum(credit) − sum(debit), optionally filtered by transaction date range.
   * Response is grouped by AccountHead as `headcodeXX` with nested `subheads`.
   */
  async getAccountTransactionByHeadSubheadReport(
    params: AccountTransactionByAccountReportParams = {}
  ): Promise<AccountTransactionByHeadSubheadReportResult> {
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
      by: ["headId", "subheadId"],
      ...(Object.keys(dateWhere).length ? { where: dateWhere } : {}),
      _sum: { credit: true, debit: true },
    });

    const balanceByHeadSubhead = new Map<string, number>();
    for (const row of grouped) {
      const credit = row._sum.credit ?? new Prisma.Decimal(0);
      const debit = row._sum.debit ?? new Prisma.Decimal(0);
      balanceByHeadSubhead.set(`${row.headId}:${row.subheadId}`, Number(credit.minus(debit).toString()));
    }

    const heads = await this.prisma.accountHead.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        rank: true,
        subHeads: {
          select: { id: true, name: true, rank: true },
        },
      },
      orderBy: [{ rank: "asc" }, { id: "asc" }],
    });

    const data: AccountTransactionByHeadSubheadReportResult = {};
    for (const head of heads) {
      const key = `headcode${head.code}`;
      const parsed = Number.parseInt(head.code, 10);

      if (!data[key]) {
        data[key] = {
          name: head.name,
          headcode: Number.isNaN(parsed) ? head.code : parsed,
          subheads: [],
        };
      }

      const sortedSubheads = [...head.subHeads].sort((a, b) => {
        const byRank = a.rank - b.rank;
        if (byRank !== 0) return byRank;
        return a.id - b.id;
      });

      for (const subhead of sortedSubheads) {
        const balance = balanceByHeadSubhead.get(`${head.id}:${subhead.id}`) ?? 0;
        data[key].subheads.push({
          id: subhead.id,
          name: subhead.name,
          balance,
        });
      }
    }

    return data;
  }

  async getAccountTransactionLog(
    params: AccountTransactionLogParams
  ): Promise<AccountTransactionLogResult> {
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
    const accountSub = input.accountSub?.trim() || account.accountDescription.trim();

    return dbClient.accountTransaction.create({
      data: {
        groupId: account.groupId,
        headId: account.headId,
        subheadId: account.subheadId,
        accountId: account.id,
        accountCode,
        ...(accountSub ? { accountSub } : {}),
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
