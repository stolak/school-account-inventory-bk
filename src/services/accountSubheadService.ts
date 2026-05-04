import { Prisma, Status } from "@prisma/client";
import prisma from "../utils/prisma";

const accountSubheadInclude = {
  group: true,
  head: true,
} satisfies Prisma.AccountSubheadInclude;

export type AccountSubheadWithRelations = Prisma.AccountSubheadGetPayload<{
  include: typeof accountSubheadInclude;
}>;

export type ListAccountSubheadsFilters = {
  groupId?: number;
  headId?: number;
  status?: Status | "All";
};

function isPrismaKnownErrorWithCode(e: unknown): e is { code: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string"
  );
}

export class AccountSubheadService {
  private prisma = prisma;

  async resolveGroupIdFromHeadId(headId: number): Promise<number | null> {
    const head = await this.prisma.accountHead.findUnique({
      where: { id: headId },
      select: { groupId: true },
    });
    return head?.groupId ?? null;
  }

  async create(input: {
    headId: number;
    code: string;
    name: string;
    status?: Status;
    rank?: number;
    afs?: string | null;
    paymentMethod?: string | null;
  }): Promise<AccountSubheadWithRelations> {
    const groupId = await this.resolveGroupIdFromHeadId(input.headId);
    if (groupId === null) {
      throw new Error("Invalid headId: account head not found");
    }

    return this.prisma.accountSubhead.create({
      data: {
        groupId,
        headId: input.headId,
        code: input.code.trim(), // optional: if not provided, it will be generated automatically
        name: input.name.trim(),
        ...(input.status !== undefined ? { status: input.status } : {}),
        rank: input.rank ?? 0,
        afs: input.afs === undefined ? null : input.afs,
        paymentMethod: input.paymentMethod === undefined ? null : input.paymentMethod,
      },
      include: accountSubheadInclude,
    });
  }

  async list(filters: ListAccountSubheadsFilters = {}): Promise<AccountSubheadWithRelations[]> {
    const where: Prisma.AccountSubheadWhereInput = {};
    if (filters.groupId !== undefined) {
      where.groupId = filters.groupId;
    }
    if (filters.headId !== undefined) {
      where.headId = filters.headId;
    }
    if (filters.status === undefined) {
      where.status = Status.Active;
    } else if (filters.status !== "All") {
      where.status = filters.status;
    }

    return this.prisma.accountSubhead.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: accountSubheadInclude,
      orderBy: [{ rank: "asc" }, { id: "asc" }],
    });
  }

  async getById(id: number): Promise<AccountSubheadWithRelations | null> {
    return this.prisma.accountSubhead.findUnique({
      where: { id },
      include: accountSubheadInclude,
    });
  }

  async update(
    id: number,
    input: {
      headId?: number;
      code?: string;
      name?: string;
      status?: Status;
      rank?: number;
      afs?: string | null;
      paymentMethod?: string | null;
    }
  ): Promise<AccountSubheadWithRelations> {
    const data: Prisma.AccountSubheadUpdateInput = {};

    if (input.headId !== undefined) {
      const groupId = await this.resolveGroupIdFromHeadId(input.headId);
      if (groupId === null) {
        throw new Error("Invalid headId: account head not found");
      }
      data.head = { connect: { id: input.headId } };
      data.group = { connect: { id: groupId } };
    }

    if (input.code !== undefined) {
      data.code = input.code.trim();
    }
    if (input.name !== undefined) {
      data.name = input.name.trim();
    }
    if (input.status !== undefined) {
      data.status = input.status;
    }
    if (input.rank !== undefined) {
      data.rank = input.rank;
    }
    if (input.afs !== undefined) {
      data.afs = input.afs;
    }
    if (input.paymentMethod !== undefined) {
      data.paymentMethod = input.paymentMethod;
    }

    try {
      return await this.prisma.accountSubhead.update({
        where: { id },
        data,
        include: accountSubheadInclude,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Account subhead not found");
      }
      throw e;
    }
  }

  async delete(id: number): Promise<AccountSubheadWithRelations> {
    try {
      return await this.prisma.accountSubhead.delete({
        where: { id },
        include: accountSubheadInclude,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Account subhead not found");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2003") {
        throw new Error("Cannot delete: subhead is referenced by account charts or transactions");
      }
      throw e;
    }
  }
}

export const accountSubheadService = new AccountSubheadService();
