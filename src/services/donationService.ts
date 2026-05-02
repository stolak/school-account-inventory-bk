import prisma from "../utils/prisma";
import { activePeriodService } from "./activePeriodService";
import { InventoryTransactionStatus, InventoryTransactionType, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

export interface DonationTransactionData {
  id: string;
  itemId: string;
  transactionType: InventoryTransactionType;
  qtyIn: any;
  status: InventoryTransactionStatus;
  referenceNo: string | null;
  notes: string | null;
  termId: string | null;
  sessionId: string | null;
  transactionDate: Date;
  createdById: string;
  storeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  item?: { name: string } | null;
  store?: { id: string; name: string } | null;
  createdBy?: { firstName: string | null; lastName: string | null } | null;
}

export interface ListDonationsParams {
  q?: string;
  itemId?: string;
  storeId?: string;
  sessionId?: string;
  termId?: string;
  status?: InventoryTransactionStatus;
  transactionDateFrom?: Date;
  transactionDateTo?: Date;
  page?: number;
  limit?: number;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function generateReferenceNo(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `DON-${y}${m}${day}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

const donationInclude = {
  item: { select: { name: true } },
  createdBy: { select: { firstName: true, lastName: true } },
  store: { select: { id: true, name: true } },
} satisfies Prisma.InventoryTransactionInclude;

export class DonationService {
  private prisma = prisma;

  private buildDonationWhere(params: ListDonationsParams): Prisma.InventoryTransactionWhereInput {
    return {
      transactionType: InventoryTransactionType.donation,
      ...(params.itemId ? { itemId: params.itemId } : {}),
      ...(params.storeId ? { storeId: params.storeId } : {}),
      ...(params.sessionId ? { sessionId: params.sessionId } : {}),
      ...(params.termId ? { termId: params.termId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.transactionDateFrom !== undefined || params.transactionDateTo !== undefined
        ? {
            transactionDate: {
              ...(params.transactionDateFrom !== undefined ? { gte: params.transactionDateFrom } : {}),
              ...(params.transactionDateTo !== undefined ? { lte: params.transactionDateTo } : {}),
            },
          }
        : {}),
      ...(params.q ? { OR: [{ referenceNo: { contains: params.q } }, { notes: { contains: params.q } }] } : {}),
    };
  }

  private async assertItemExists(itemId: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: itemId }, select: { id: true } });
    if (!item) throw new Error("Invalid itemId");
  }

  private async assertStoreExists(storeId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
    if (!store) throw new Error("Invalid storeId");
  }

  private async getActivePeriodIdsOrNull(): Promise<{ sessionId: string | null; termId: string | null }> {
    const ap = await activePeriodService.getActivePeriod();
    if (!ap) return { sessionId: null, termId: null };
    return { sessionId: ap.sessionId ?? null, termId: ap.termId ?? null };
  }

  async createDonation(input: {
    itemId: string;
    storeId: string;
    qtyIn: string | number;
    notes: string;
    referenceNo?: string | null;
    transactionDate?: Date;
    createdById: string;
  }): Promise<DonationTransactionData> {
    await this.assertItemExists(input.itemId);
    await this.assertStoreExists(input.storeId);

    const active = await this.getActivePeriodIdsOrNull();
    const finalReferenceNo =
      input.referenceNo === undefined || input.referenceNo === null || input.referenceNo.trim() === ""
        ? generateReferenceNo()
        : input.referenceNo.trim();

    return await this.prisma.inventoryTransaction.create({
      data: {
        itemId: input.itemId,
        storeId: input.storeId,
        transactionType: InventoryTransactionType.donation,
        qtyIn: input.qtyIn as any,
        status: InventoryTransactionStatus.completed,
        referenceNo: finalReferenceNo,
        notes: input.notes.trim(),
        sessionId: active.sessionId,
        termId: active.termId,
        transactionDate: input.transactionDate ?? new Date(),
        createdById: input.createdById,
      },
      include: donationInclude,
    });
  }

  async createBulkDonations(input: {
    storeId: string;
    notes: string;
    referenceNo?: string | null;
    transactionDate?: Date;
    createdById: string;
    items: Array<{ itemId: string; qtyIn: string | number }>;
  }): Promise<DonationTransactionData[]> {
    if (!input.items.length) throw new Error("items must not be empty");

    await this.assertStoreExists(input.storeId);

    const itemIds = [...new Set(input.items.map((i) => i.itemId))];
    const existingItems = await this.prisma.inventoryItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true },
    });
    const existingSet = new Set(existingItems.map((i) => i.id));
    const missing = itemIds.filter((id) => !existingSet.has(id));
    if (missing.length) throw new Error(`Invalid itemId(s): ${missing.join(", ")}`);

    const active = await this.getActivePeriodIdsOrNull();
    const finalReferenceNo =
      input.referenceNo === undefined || input.referenceNo === null || input.referenceNo.trim() === ""
        ? generateReferenceNo()
        : input.referenceNo.trim();
    const txDate = input.transactionDate ?? new Date();

    return await this.prisma.$transaction(
      input.items.map((it) =>
        this.prisma.inventoryTransaction.create({
          data: {
            itemId: it.itemId,
            storeId: input.storeId,
            transactionType: InventoryTransactionType.donation,
            qtyIn: it.qtyIn as any,
            status: InventoryTransactionStatus.completed,
            referenceNo: finalReferenceNo,
            notes: input.notes.trim(),
            sessionId: active.sessionId,
            termId: active.termId,
            transactionDate: txDate,
            createdById: input.createdById,
          },
          include: donationInclude,
        })
      )
    );
  }

  async listDonations(params: ListDonationsParams = {}): Promise<{
    donations: DonationTransactionData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where = this.buildDonationWhere(params);

    const [total, rows] = await Promise.all([
      this.prisma.inventoryTransaction.count({ where }),
      this.prisma.inventoryTransaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        skip,
        take: limit,
        include: donationInclude,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { donations: rows, pagination: { page, limit, total, totalPages } };
  }

  async getDonationById(id: string): Promise<DonationTransactionData | null> {
    return await this.prisma.inventoryTransaction.findFirst({
      where: { id, transactionType: InventoryTransactionType.donation },
      include: donationInclude,
    });
  }

  async updateDonation(
    id: string,
    input: {
      itemId?: string;
      qtyIn?: string | number;
      referenceNo?: string | null;
      notes?: string;
      transactionDate?: Date;
    }
  ): Promise<DonationTransactionData> {
    if (input.itemId !== undefined) await this.assertItemExists(input.itemId);

    const existing = await this.getDonationById(id);
    if (!existing) throw new Error("Donation not found");

    if (input.notes !== undefined && input.notes.trim() === "") {
      throw new Error("notes cannot be empty");
    }

    const active = await this.getActivePeriodIdsOrNull();

    return await this.prisma.inventoryTransaction.update({
      where: { id },
      data: {
        ...(input.itemId !== undefined ? { itemId: input.itemId } : {}),
        ...(input.qtyIn !== undefined ? { qtyIn: input.qtyIn as any } : {}),
        ...(input.referenceNo !== undefined
          ? {
              referenceNo:
                input.referenceNo === null
                  ? null
                  : String(input.referenceNo).trim() === ""
                    ? generateReferenceNo()
                    : String(input.referenceNo).trim(),
            }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() } : {}),
        sessionId: active.sessionId,
        termId: active.termId,
        ...(input.transactionDate !== undefined ? { transactionDate: input.transactionDate } : {}),
        transactionType: InventoryTransactionType.donation,
        status: InventoryTransactionStatus.completed,
        updatedAt: new Date(),
      },
      include: donationInclude,
    });
  }

  async updateBulkDonations(input: {
    updates: Array<{
      id: string;
      itemId?: string;
      qtyIn?: string | number;
      referenceNo?: string | null;
      notes?: string;
      transactionDate?: Date;
    }>;
  }): Promise<DonationTransactionData[]> {
    if (!input.updates.length) throw new Error("updates must not be empty");

    const ids = [...new Set(input.updates.map((u) => u.id))];
    const existing = await this.prisma.inventoryTransaction.findMany({
      where: { id: { in: ids }, transactionType: InventoryTransactionType.donation },
      select: { id: true },
    });
    const existingSet = new Set(existing.map((r) => r.id));
    const missing = ids.filter((id) => !existingSet.has(id));
    if (missing.length) throw new Error(`Donation not found: ${missing.join(", ")}`);

    const itemIds = [...new Set(input.updates.map((u) => u.itemId).filter((v): v is string => !!v))];
    if (itemIds.length) {
      const found = await this.prisma.inventoryItem.findMany({ where: { id: { in: itemIds } }, select: { id: true } });
      const foundSet = new Set(found.map((r) => r.id));
      const missingItemIds = itemIds.filter((id) => !foundSet.has(id));
      if (missingItemIds.length) throw new Error(`Invalid itemId(s): ${missingItemIds.join(", ")}`);
    }

    const active = await this.getActivePeriodIdsOrNull();

    return await this.prisma.$transaction(async (tx) => {
      const out: DonationTransactionData[] = [];
      for (const u of input.updates) {
        if (u.notes !== undefined && u.notes.trim() === "") {
          throw new Error("notes cannot be empty");
        }
        const row = await tx.inventoryTransaction.update({
          where: { id: u.id },
          data: {
            ...(u.itemId !== undefined ? { itemId: u.itemId } : {}),
            ...(u.qtyIn !== undefined ? { qtyIn: u.qtyIn as any } : {}),
            ...(u.referenceNo !== undefined
              ? {
                  referenceNo:
                    u.referenceNo === null
                      ? null
                      : String(u.referenceNo).trim() === ""
                        ? generateReferenceNo()
                        : String(u.referenceNo).trim(),
                }
              : {}),
            ...(u.notes !== undefined ? { notes: u.notes.trim() } : {}),
            sessionId: active.sessionId,
            termId: active.termId,
            ...(u.transactionDate !== undefined ? { transactionDate: u.transactionDate } : {}),
            transactionType: InventoryTransactionType.donation,
            status: InventoryTransactionStatus.completed,
            updatedAt: new Date(),
          },
          include: donationInclude,
        });
        out.push(row);
      }
      return out;
    });
  }

  async deleteDonation(id: string): Promise<DonationTransactionData> {
    const existing = await this.getDonationById(id);
    if (!existing) throw new Error("Donation not found");
    return await this.prisma.inventoryTransaction.delete({
      where: { id },
      include: donationInclude,
    });
  }

  async deleteBulkDonations(input: { ids: string[] }): Promise<DonationTransactionData[]> {
    if (!input.ids.length) throw new Error("ids must not be empty");
    const ids = [...new Set(input.ids)];

    const existing = await this.prisma.inventoryTransaction.findMany({
      where: { id: { in: ids }, transactionType: InventoryTransactionType.donation },
      include: donationInclude,
    });
    const existingSet = new Set(existing.map((r) => r.id));
    const missing = ids.filter((id) => !existingSet.has(id));
    if (missing.length) throw new Error(`Donation not found: ${missing.join(", ")}`);

    await this.prisma.$transaction(ids.map((id) => this.prisma.inventoryTransaction.delete({ where: { id } })));
    return existing;
  }

  async summarizeDonationsByItem(params: ListDonationsParams = {}): Promise<{
    summary: Array<{
      itemId: string;
      totalQtyIn: string;
      item: {
        id: string;
        name: string;
        category: { id: string; name: string } | null;
        subCategory: { id: string; name: string } | null;
        brand: { id: string; name: string } | null;
      } | null;
    }>;
  }> {
    const where = this.buildDonationWhere(params);

    const grouped = await this.prisma.inventoryTransaction.groupBy({
      by: ["itemId"],
      where,
      _sum: { qtyIn: true },
    });

    const itemIds = grouped.map((g) => g.itemId);
    const items = itemIds.length
      ? await this.prisma.inventoryItem.findMany({
          where: { id: { in: itemIds } },
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
            subCategory: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
          },
        })
      : [];
    const itemById = new Map(items.map((i) => [i.id, i]));

    const summary = grouped.map((g) => ({
      itemId: g.itemId,
      totalQtyIn: (g._sum.qtyIn ?? new Prisma.Decimal(0)).toString(),
      item: itemById.get(g.itemId) ?? null,
    }));

    summary.sort((a, b) => {
      const ac = a.item?.category?.name ?? "\uFFFF";
      const bc = b.item?.category?.name ?? "\uFFFF";
      if (ac !== bc) return ac.localeCompare(bc);

      const asc = a.item?.subCategory?.name ?? "\uFFFF";
      const bsc = b.item?.subCategory?.name ?? "\uFFFF";
      if (asc !== bsc) return asc.localeCompare(bsc);

      const ab = a.item?.brand?.name ?? "\uFFFF";
      const bb = b.item?.brand?.name ?? "\uFFFF";
      if (ab !== bb) return ab.localeCompare(bb);

      const an = a.item?.name ?? "\uFFFF";
      const bn = b.item?.name ?? "\uFFFF";
      return an.localeCompare(bn);
    });

    return { summary };
  }
}

export const donationService = new DonationService();
