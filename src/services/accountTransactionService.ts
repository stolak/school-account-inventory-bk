import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";

export type AccountTransactionRow = Prisma.AccountTransactionGetPayload<Record<string, never>>;

type EntryInput = {
  accountId: string;
  amount: number;
  ref: string;
  manualRef: string;
  transactionDate: string;
  postedBy: string;
  projectId?: string;
  accountSub?: string;
};

export class AccountTransactionService {
  private prisma = prisma;

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

  private async resolveAccount(accountIdRaw: string) {
    const accountId = Number.parseInt(accountIdRaw, 10);
    if (!Number.isFinite(accountId) || accountId < 1) {
      throw new Error("accountId must be a positive integer");
    }

    const account = await this.prisma.accountChart.findUnique({
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

  private async validateProjectId(projectId?: string): Promise<void> {
    if (projectId === undefined) return;
    const p = projectId.trim();
    if (!p) {
      throw new Error("projectId cannot be empty when provided");
    }
    const project = await this.prisma.project.findUnique({
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

    const account = await this.resolveAccount(input.accountId);
    await this.validateProjectId(input.projectId);
    const transactionDate = this.parseDateOrThrow(input.transactionDate);

    const accountCode = account.accountNo?.trim() || String(account.id);
    const accountSub = input.accountSub?.trim() || account.accountDescription;

    return this.prisma.accountTransaction.create({
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
      },
    });
  }

  async debitAccount(input: EntryInput): Promise<AccountTransactionRow> {
    return this.postEntry("debit", input);
  }

  async creditAccount(input: EntryInput): Promise<AccountTransactionRow> {
    return this.postEntry("credit", input);
  }
}

export const accountTransactionService = new AccountTransactionService();
