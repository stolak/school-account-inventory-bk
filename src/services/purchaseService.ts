import prisma from "../utils/prisma";
import { InventoryTransactionStatus, InventoryTransactionType, Prisma } from "@prisma/client";

export interface PurchaseData {
  id: string;
  itemId: string;
  supplierId: string | null;
  transactionType: InventoryTransactionType;
  qtyIn: any;
  inCost: any;
  amountPaid: any;
  status: InventoryTransactionStatus;
  referenceNo: string | null;
  notes: string | null;
  transactionDate: Date;
  createdById: string;
  storeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  item?: { name: string } | null;
  supplier?: { name: string } | null;
  store?: { id: string; name: string } | null;
  createdBy?: { firstName: string | null; lastName: string | null } | null;
}

export interface ListPurchasesParams {
  q?: string;
  itemId?: string;
  supplierId?: string;
  storeId?: string;
  status?: InventoryTransactionStatus;
  /** Inclusive lower bound on transactionDate */
  transactionDateFrom?: Date;
  /** Inclusive upper bound on transactionDate */
  transactionDateTo?: Date;
  page?: number;
  limit?: number;
}

export interface ListGroupedPurchasesParams {
  supplierId?: string;
  storeId?: string;
  /** Inclusive lower bound on transactionDate */
  transactionDateFrom?: Date;
  /** Inclusive upper bound on transactionDate */
  transactionDateTo?: Date;
  page?: number;
  limit?: number;
}

export interface GroupedPurchaseItem {
  id: string;
  itemId: string;
  item: { name: string } | null;
  qtyIn: string;
  inCost: string;
  status: InventoryTransactionStatus;
}

export interface GroupedPurchaseRow {
  supplierId: string | null;
  transactionType: InventoryTransactionType;
  referenceNo: string | null;
  storeId: string | null;
  transactionDate: Date;
  status: InventoryTransactionStatus;
  amountPaid: string;
  supplier: { name: string } | null;
  createdBy: { firstName: string | null; lastName: string | null } | null;
  store: { id: string; name: string } | null;
  notes: string | null;
  items: GroupedPurchaseItem[];
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const purchaseInclude = {
  item: { select: { name: true } },
  supplier: { select: { name: true } },
  createdBy: { select: { firstName: true, lastName: true } },
  store: { select: { id: true, name: true } },
} satisfies Prisma.InventoryTransactionInclude;

export class PurchaseService {
  private prisma = prisma;

  private generatePurchaseReferenceNo(): string {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `PUR-${stamp}-${rand}`;
  }

  private async assertItemExists(itemId: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });
    if (!item) throw new Error("Invalid itemId");
  }

  private async assertSupplierExists(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });
    if (!supplier) throw new Error("Invalid supplierId");
  }

  private async assertStoreExists(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });
    if (!store) throw new Error("Invalid storeId");
  }

  async createPurchase(input: {
    itemId: string;
    storeId: string;
    supplierId?: string | null;
    qtyIn: string | number;
    inCost?: string | number;
    amountPaid?: string | number;
    referenceNo?: string | null;
    notes?: string | null;
    transactionDate?: Date;
    createdById: string;
    status?: InventoryTransactionStatus;
  }): Promise<PurchaseData> {
    await this.assertItemExists(input.itemId);
    await this.assertStoreExists(input.storeId);
    if (input.supplierId) await this.assertSupplierExists(input.supplierId);
    return await this.prisma.inventoryTransaction.create({
      data: {
        itemId: input.itemId,
        storeId: input.storeId,
        supplierId: input.supplierId ?? null,
        transactionType: InventoryTransactionType.purchase,
        qtyIn: input.qtyIn as any,
        ...(input.inCost !== undefined ? { inCost: input.inCost as any } : {}),
        ...(input.amountPaid !== undefined ? { amountPaid: input.amountPaid as any } : {}),
        status: input.status ?? InventoryTransactionStatus.completed,
        referenceNo: input.referenceNo ?? null,
        notes: input.notes ?? null,
        transactionDate: input.transactionDate ?? new Date(),
        createdById: input.createdById,
      },
      include: purchaseInclude,
    });
  }

  async createBulkPurchases(input: {
    storeId: string;
    supplierId?: string | null;
    referenceNo?: string | null;
    notes?: string | null;
    transactionDate?: Date;
    amountPaid?: string | number;
    createdById: string;
    items: Array<{ itemId: string; qtyIn: string | number; inCost: string | number }>;
    status?: InventoryTransactionStatus;
  }): Promise<PurchaseData[]> {
    if (!input.items.length) {
      throw new Error("items must not be empty");
    }
    await this.assertStoreExists(input.storeId);

    const supplierId = input.supplierId ?? null;
    if (supplierId) await this.assertSupplierExists(supplierId);

    const itemIds = [...new Set(input.items.map((i) => i.itemId))];
    const existingItems = await this.prisma.inventoryItem.findMany({
      where: { id: { in: itemIds } },
      select: {
        id: true,
        name: true,
        category: {
          select: {
            id: true,
            name: true,
            consumableAccountId: true,
          },
        },
      },
    });
    const existingSet = new Set(existingItems.map((i) => i.id));
    const missing = itemIds.filter((id) => !existingSet.has(id));
    if (missing.length) {
      throw new Error(`Invalid itemId(s): ${missing.join(", ")}`);
    }

    const txDate = input.transactionDate ?? new Date();
    const status = input.status ?? InventoryTransactionStatus.completed;
    const referenceNo =
      typeof input.referenceNo === "string" && input.referenceNo.trim().length > 0
        ? input.referenceNo.trim()
        : this.generatePurchaseReferenceNo();
    const itemById = new Map(existingItems.map((i) => [i.id, i]));

    const created = await this.prisma.$transaction(async (tx) => {
      // Todo: ensure post will go through before creating the rows
      const createdRows = await Promise.all(
        input.items.map((it) =>
          tx.inventoryTransaction.create({
            data: {
              itemId: it.itemId,
              storeId: input.storeId,
              supplierId,
              transactionType: InventoryTransactionType.purchase,
              qtyIn: it.qtyIn as any,
              inCost: it.inCost as any,
              ...(input.amountPaid !== undefined ? { amountPaid: input.amountPaid as any } : {}),
              status,
              referenceNo,
              notes: input.notes ?? null,
              transactionDate: txDate,
              createdById: input.createdById,
            },
            include: purchaseInclude,
          })
        )
      );
      console.log("createdRows", createdRows);
      // Post ledger entries only for completed purchases.
      if (status === InventoryTransactionStatus.completed) {
        if (!supplierId) {
          console.log("supplierId is required for accounting posting on completed purchases");
          throw new Error("supplierId is required for accounting posting on completed purchases");
        }
        console.log("supplierId", supplierId);
        const supplierAccount = await tx.accountChart.findFirst({
          where: { accountRef: supplierId },
          select: {
            id: true,
            groupId: true,
            headId: true,
            subheadId: true,
            accountNo: true,
            accountDescription: true,
          },
        });
        if (!supplierAccount) {
          throw new Error("Supplier account not found for supplierId");
        }
        const categoryAccountIds = new Set<number>();
        // console.log("input.items", input.items);
        for (const it of input.items) {
          console.log("it", it);
          const item = itemById.get(it.itemId);
          console.log("item", item);
          if (!item) throw new Error(`Invalid itemId(s): ${it.itemId}`);
          if (!item.category) {
            throw new Error(`Category not configured for itemId ${it.itemId}`);
          }
          if (!item.category.consumableAccountId) {
            console.log("item.category.consumableAccountId", item.category.consumableAccountId);
            throw new Error(`Category consumableAccountId not configured for itemId ${it.itemId}`);
          }
          categoryAccountIds.add(item.category.consumableAccountId);
        }

        const categoryAccounts = await tx.accountChart.findMany({
          where: { id: { in: Array.from(categoryAccountIds) } },
          select: {
            id: true,
            groupId: true,
            headId: true,
            subheadId: true,
            accountNo: true,
            accountDescription: true,
          },
        });
        const categoryAccountById = new Map(categoryAccounts.map((a) => [a.id, a]));

        let totalInCost = new Prisma.Decimal(0);
        for (const it of input.items) {
          const amount = new Prisma.Decimal(it.inCost as any);
          totalInCost = totalInCost.plus(amount);

          const item = itemById.get(it.itemId)!;
          const consumableAccountId = item.category!.consumableAccountId!;
          const consumableAccount = categoryAccountById.get(consumableAccountId);
          if (!consumableAccount) {
            throw new Error(`Category consumable account not found for itemId ${it.itemId}`);
          }

          await tx.accountTransaction.create({
            data: {
              groupId: consumableAccount.groupId,
              headId: consumableAccount.headId,
              subheadId: consumableAccount.subheadId,
              accountId: consumableAccount.id,
              accountCode: consumableAccount.accountNo?.trim() || String(consumableAccount.id),
              accountSub: consumableAccount.accountDescription,
              debit: amount,
              credit: new Prisma.Decimal(0),
              ref: referenceNo,
              manualRef: referenceNo,
              transactionDate: txDate,
              postedBy: input.createdById,
              remarks: `Purchase debit - ${item.name} - ${referenceNo}`,
            },
          });
        }

        await tx.accountTransaction.create({
          data: {
            groupId: supplierAccount.groupId,
            headId: supplierAccount.headId,
            subheadId: supplierAccount.subheadId,
            accountId: supplierAccount.id,
            accountCode: supplierAccount.accountNo?.trim() || String(supplierAccount.id),
            accountSub: supplierAccount.accountDescription,
            debit: new Prisma.Decimal(0),
            credit: totalInCost,
            ref: referenceNo,
            manualRef: referenceNo,
            transactionDate: txDate,
            postedBy: input.createdById,
            remarks: `Purchase credit - supplier ${supplierId} - ${referenceNo}`,
          },
        });
      }

      return createdRows;
    });

    return created;
  }

  async listPurchases(params: ListPurchasesParams = {}): Promise<{
    purchases: PurchaseData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = {
      transactionType: InventoryTransactionType.purchase,
      ...(params.itemId ? { itemId: params.itemId } : {}),
      ...(params.supplierId ? { supplierId: params.supplierId } : {}),
      ...(params.storeId ? { storeId: params.storeId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.transactionDateFrom !== undefined || params.transactionDateTo !== undefined
        ? {
            transactionDate: {
              ...(params.transactionDateFrom !== undefined
                ? { gte: params.transactionDateFrom }
                : {}),
              ...(params.transactionDateTo !== undefined ? { lte: params.transactionDateTo } : {}),
            },
          }
        : {}),
      ...(params.q
        ? {
            OR: [
              { referenceNo: { contains: params.q } },
              { notes: { contains: params.q } },
              { supplierReceiver: { contains: params.q } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.inventoryTransaction.count({ where }),
      this.prisma.inventoryTransaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        skip,
        take: limit,
        include: purchaseInclude,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { purchases: rows, pagination: { page, limit, total, totalPages } };
  }

  async listGroupedPurchases(params: ListGroupedPurchasesParams = {}): Promise<{
    purchases: GroupedPurchaseRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);

    const where: Prisma.InventoryTransactionWhereInput = {
      transactionType: InventoryTransactionType.purchase,
      ...(params.supplierId ? { supplierId: params.supplierId } : {}),
      ...(params.storeId ? { storeId: params.storeId } : {}),
      ...(params.transactionDateFrom !== undefined || params.transactionDateTo !== undefined
        ? {
            transactionDate: {
              ...(params.transactionDateFrom !== undefined
                ? { gte: params.transactionDateFrom }
                : {}),
              ...(params.transactionDateTo !== undefined ? { lte: params.transactionDateTo } : {}),
            },
          }
        : {}),
    };

    const rows = await this.prisma.inventoryTransaction.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      include: purchaseInclude,
    });

    const groupedMap = new Map<string, GroupedPurchaseRow>();
    for (const row of rows) {
      const key = row.referenceNo ?? "__NULL__";
      const existing = groupedMap.get(key);
      if (!existing) {
        groupedMap.set(key, {
          supplierId: row.supplierId,
          transactionType: row.transactionType,
          referenceNo: row.referenceNo,
          storeId: row.storeId,
          transactionDate: row.transactionDate,
          status: row.status,
          amountPaid: row.amountPaid.toString(),
          supplier: row.supplier ? { name: row.supplier.name } : null,
          createdBy: row.createdBy
            ? { firstName: row.createdBy.firstName, lastName: row.createdBy.lastName }
            : null,
          store: row.store ? { id: row.store.id, name: row.store.name } : null,
          notes: row.notes,
          items: [],
        });
      }

      groupedMap.get(key)!.items.push({
        id: row.id,
        itemId: row.itemId,
        item: row.item ? { name: row.item.name } : null,
        qtyIn: row.qtyIn.toString(),
        inCost: row.inCost.toString(),
        status: row.status,
      });
    }

    const grouped = Array.from(groupedMap.values());
    const total = grouped.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const purchases = grouped.slice(start, start + limit);

    return {
      purchases,
      pagination: { page, limit, total, totalPages },
    };
  }

  async getPurchaseById(id: string): Promise<PurchaseData | null> {
    return await this.prisma.inventoryTransaction.findFirst({
      where: { id, transactionType: InventoryTransactionType.purchase },
      include: purchaseInclude,
    });
  }

  async updatePurchase(
    id: string,
    input: {
      itemId?: string;
      supplierId?: string | null;
      qtyIn?: string | number;
      inCost?: string | number;
      amountPaid?: string | number;
      status?: InventoryTransactionStatus;
      referenceNo?: string | null;
      notes?: string | null;
      transactionDate?: Date;
    }
  ): Promise<PurchaseData> {
    if (input.itemId !== undefined) await this.assertItemExists(input.itemId);
    if (input.supplierId) await this.assertSupplierExists(input.supplierId);

    // Ensure we never update a non-purchase transaction.
    const existing = await this.getPurchaseById(id);
    if (!existing) throw new Error("Purchase not found");

    return await this.prisma.inventoryTransaction.update({
      where: { id },
      data: {
        ...(input.itemId !== undefined ? { itemId: input.itemId } : {}),
        ...(input.supplierId !== undefined ? { supplierId: input.supplierId } : {}),
        ...(input.qtyIn !== undefined ? { qtyIn: input.qtyIn as any } : {}),
        ...(input.inCost !== undefined ? { inCost: input.inCost as any } : {}),
        ...(input.amountPaid !== undefined ? { amountPaid: input.amountPaid as any } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.referenceNo !== undefined ? { referenceNo: input.referenceNo } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.transactionDate !== undefined ? { transactionDate: input.transactionDate } : {}),
        // locked fields:
        transactionType: InventoryTransactionType.purchase,
        updatedAt: new Date(),
      },
      include: purchaseInclude,
    });
  }

  async deletePurchase(id: string): Promise<PurchaseData> {
    const existing = await this.getPurchaseById(id);
    if (!existing) throw new Error("Purchase not found");

    return await this.prisma.inventoryTransaction.delete({
      where: { id },
      include: purchaseInclude,
    });
  }
}

export const purchaseService = new PurchaseService();
