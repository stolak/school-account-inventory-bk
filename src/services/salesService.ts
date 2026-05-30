import prisma from "../utils/prisma";
import {
  InventoryTransactionStatus,
  InventoryTransactionType,
  Prisma,
} from "@prisma/client";

export interface SaleData {
  id: string;
  itemId: string;
  transactionType: InventoryTransactionType;
  qtyOut: Prisma.Decimal;
  outCost: Prisma.Decimal;
  status: InventoryTransactionStatus;
  referenceNo: string | null;
  notes: string | null;
  customerMame: string | null;
  transactionDate: Date;
  createdById: string;
  storeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  item?: { name: string } | null;
  store?: { id: string; name: string } | null;
  createdBy?: { firstName: string | null; lastName: string | null } | null;
}

export interface ListSalesParams {
  q?: string;
  itemId?: string;
  storeId?: string;
  customerName?: string;
  transactionDateFrom?: Date;
  transactionDateTo?: Date;
  page?: number;
  limit?: number;
}

export interface ListGroupedSalesParams {
  storeId?: string;
  transactionDateFrom?: Date;
  transactionDateTo?: Date;
  page?: number;
  limit?: number;
}

export interface GroupedSaleItem {
  id: string;
  itemId: string;
  item: { name: string } | null;
  qtyOut: string;
  outCost: string;
  status: InventoryTransactionStatus;
}

export interface GroupedSaleRow {
  transactionType: InventoryTransactionType;
  referenceNo: string | null;
  storeId: string | null;
  transactionDate: Date;
  status: InventoryTransactionStatus;
  customerMame: string | null;
  createdBy: { firstName: string | null; lastName: string | null } | null;
  store: { id: string; name: string } | null;
  notes: string | null;
  totalAmount: string;
  items: GroupedSaleItem[];
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const saleInclude = {
  item: { select: { name: true } },
  store: { select: { id: true, name: true } },
  createdBy: { select: { firstName: true, lastName: true } },
} satisfies Prisma.InventoryTransactionInclude;

export class SalesService {
  private prisma = prisma;

  private generateSalesReferenceNo(): string {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `SAL-${stamp}-${rand}`;
  }

  private async assertStoreExists(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });
    if (!store) throw new Error("Invalid storeId");
  }

  async createBulkSales(input: {
    storeId: string;
    referenceNo?: string | null;
    notes?: string | null;
    customerName?: string | null;
    transactionDate?: Date;
    createdById: string;
    items: Array<{ itemId: string; qty: string | number; amount: string | number }>;
  }): Promise<SaleData[]> {
    if (!input.items.length) {
      throw new Error("items must not be empty");
    }

    await this.assertStoreExists(input.storeId);

    const itemIds = [...new Set(input.items.map((i) => i.itemId))];
    const existingItems = await this.prisma.inventoryItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true },
    });
    const existingSet = new Set(existingItems.map((i) => i.id));
    const missing = itemIds.filter((id) => !existingSet.has(id));
    if (missing.length) {
      throw new Error(`Invalid itemId(s): ${missing.join(", ")}`);
    }

    const txDate = input.transactionDate ?? new Date();
    const referenceNo =
      typeof input.referenceNo === "string" && input.referenceNo.trim().length > 0
        ? input.referenceNo.trim()
        : this.generateSalesReferenceNo();
    const customerMame =
      input.customerName === undefined || input.customerName === null
        ? null
        : String(input.customerName).trim() || null;

    const created = await this.prisma.$transaction(async (tx) => {
      const createdRows = await Promise.all(
        input.items.map(async (it) => {
          return tx.inventoryTransaction.create({
            data: {
              itemId: it.itemId,
              storeId: input.storeId,
              transactionType: InventoryTransactionType.sales,
              qtyOut: it.qty as any,
              outCost: it.amount as any,
              status: InventoryTransactionStatus.completed,
              referenceNo,
              notes: input.notes ?? null,
              customerMame,
              transactionDate: txDate,
              createdById: input.createdById,
            },
            include: saleInclude,
          });
        })
      );
      return createdRows;
    });

    return created;
  }

  async listSales(params: ListSalesParams = {}): Promise<{
    sales: SaleData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = {
      transactionType: InventoryTransactionType.sales,
      status: InventoryTransactionStatus.completed,
      ...(params.itemId ? { itemId: params.itemId } : {}),
      ...(params.storeId ? { storeId: params.storeId } : {}),
      ...(params.customerName?.trim()
        ? { customerMame: { contains: params.customerName.trim() } }
        : {}),
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
              { customerMame: { contains: params.q } },
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
        include: saleInclude,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { sales: rows, pagination: { page, limit, total, totalPages } };
  }

  async listGroupedSales(params: ListGroupedSalesParams = {}): Promise<{
    sales: GroupedSaleRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);

    const where: Prisma.InventoryTransactionWhereInput = {
      transactionType: InventoryTransactionType.sales,
      status: InventoryTransactionStatus.completed,
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
      include: saleInclude,
    });

    const groupedMap = new Map<string, GroupedSaleRow>();
    for (const row of rows) {
      const key = row.referenceNo ?? "__NULL__";
      const existing = groupedMap.get(key);
      if (!existing) {
        groupedMap.set(key, {
          transactionType: row.transactionType,
          referenceNo: row.referenceNo,
          storeId: row.storeId,
          transactionDate: row.transactionDate,
          status: row.status,
          customerMame: row.customerMame,
          createdBy: row.createdBy
            ? { firstName: row.createdBy.firstName, lastName: row.createdBy.lastName }
            : null,
          store: row.store ? { id: row.store.id, name: row.store.name } : null,
          notes: row.notes,
          totalAmount: "0",
          items: [],
        });
      }

      const group = groupedMap.get(key)!;
      group.items.push({
        id: row.id,
        itemId: row.itemId,
        item: row.item ? { name: row.item.name } : null,
        qtyOut: row.qtyOut.toString(),
        outCost: row.outCost.toString(),
        status: row.status,
      });
      group.totalAmount = new Prisma.Decimal(group.totalAmount)
        .plus(row.outCost)
        .toString();
    }

    const grouped = Array.from(groupedMap.values());
    const total = grouped.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const sales = grouped.slice(start, start + limit);

    return { sales, pagination: { page, limit, total, totalPages } };
  }

  async getSaleById(id: string): Promise<SaleData | null> {
    return await this.prisma.inventoryTransaction.findFirst({
      where: {
        id,
        transactionType: InventoryTransactionType.sales,
      },
      include: saleInclude,
    });
  }
}

export const salesService = new SalesService();
