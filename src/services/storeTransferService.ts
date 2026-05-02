import prisma from "../utils/prisma";
import { activePeriodService } from "./activePeriodService";
import { InventoryTransactionStatus, InventoryTransactionType, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

export interface StoreTransferTransactionRow {
  id: string;
  itemId: string;
  transactionType: InventoryTransactionType;
  qtyIn: unknown;
  qtyOut: unknown;
  status: InventoryTransactionStatus;
  referenceNo: string | null;
  notes: string | null;
  sessionId: string | null;
  termId: string | null;
  storeId: string | null;
  transactionDate: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  item?: { name: string } | null;
  store?: { id: string; name: string } | null;
  createdBy?: { firstName: string | null; lastName: string | null } | null;
}

export type StoreTransferInsufficientDetail = {
  itemId: string;
  itemName: string;
  available: string;
  requested: string;
};

export class InsufficientStoreTransferError extends Error {
  readonly details: StoreTransferInsufficientDetail[];

  constructor(details: StoreTransferInsufficientDetail[]) {
    super("Insufficient quantity at the source store for one or more items.");
    this.name = "InsufficientStoreTransferError";
    this.details = details;
  }
}

const transferInclude = {
  item: { select: { name: true } },
  store: { select: { id: true, name: true } },
  createdBy: { select: { firstName: true, lastName: true } },
} satisfies Prisma.InventoryTransactionInclude;

function generateReferenceNo(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `TRF-${y}${m}${day}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function toPositiveDecimal(qty: string | number): Prisma.Decimal {
  const d = new Prisma.Decimal(typeof qty === "string" ? qty.trim() : qty);
  if (d.isNaN() || !d.isFinite() || d.lte(0)) {
    throw new Error("Each item quantity must be a positive number");
  }
  return d;
}

export class StoreTransferService {
  private prisma = prisma;

  /**
   * Available quantity at a store for an item: sum(qtyIn) − sum(qtyOut) for completed transactions with that storeId.
   */
  async transferBetweenStores(input: {
    sourceStoreId: string;
    destStoreId: string;
    items: Array<{ itemId: string; qty: string | number }>;
    referenceNo?: string | null;
    notes?: string | null;
    transactionDate?: Date;
    createdById: string;
  }): Promise<{
    referenceNo: string;
    transactions: StoreTransferTransactionRow[];
  }> {
    const sourceStoreId = input.sourceStoreId.trim();
    const destStoreId = input.destStoreId.trim();
    if (sourceStoreId === destStoreId) {
      throw new Error("sourceStoreId and destStoreId must be different");
    }
    if (!input.items.length) {
      throw new Error("items must not be a non-empty array");
    }

    const requestedByItem = new Map<string, Prisma.Decimal>();
    const orderedItemIds: string[] = [];
    for (const line of input.items) {
      const itemId = line.itemId.trim();
      const qty = toPositiveDecimal(line.qty);
      const prev = requestedByItem.get(itemId) ?? new Prisma.Decimal(0);
      requestedByItem.set(itemId, prev.plus(qty));
      if (!orderedItemIds.includes(itemId)) orderedItemIds.push(itemId);
    }

    const uniqueItemIds = [...requestedByItem.keys()];
    const itemsFound = await this.prisma.inventoryItem.findMany({
      where: { id: { in: uniqueItemIds } },
      select: { id: true, name: true },
    });
    if (itemsFound.length !== uniqueItemIds.length) {
      const found = new Set(itemsFound.map((r) => r.id));
      const missing = uniqueItemIds.filter((id) => !found.has(id));
      throw new Error(`Invalid itemId(s): ${missing.join(", ")}`);
    }
    const itemNameById = new Map(itemsFound.map((i) => [i.id, i.name]));

    const finalReferenceNo =
      input.referenceNo === undefined || input.referenceNo === null || String(input.referenceNo).trim() === ""
        ? generateReferenceNo()
        : String(input.referenceNo).trim();

    const txDate = input.transactionDate ?? new Date();
    const notesVal = input.notes === undefined || input.notes === null ? null : String(input.notes);

    return await this.prisma.$transaction(
      async (tx) => {
        const [lockFirst, lockSecond] = [sourceStoreId, destStoreId].sort();
        const gotFirst = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id FROM stores WHERE id = ${lockFirst} FOR UPDATE
        `);
        const gotSecond = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id FROM stores WHERE id = ${lockSecond} FOR UPDATE
        `);
        if (!gotFirst.length) {
          throw new Error(lockFirst === sourceStoreId ? "Invalid sourceStoreId" : "Invalid destStoreId");
        }
        if (!gotSecond.length) {
          throw new Error(lockSecond === sourceStoreId ? "Invalid sourceStoreId" : "Invalid destStoreId");
        }

        const storeRows = await tx.store.findMany({
          where: { id: { in: [sourceStoreId, destStoreId] } },
          select: { id: true, managerId: true, name: true },
        });
        if (storeRows.length !== 2) {
          const have = new Set(storeRows.map((s) => s.id));
          if (!have.has(sourceStoreId)) throw new Error("Invalid sourceStoreId");
          throw new Error("Invalid destStoreId");
        }

        const sourceRow = storeRows.find((s) => s.id === sourceStoreId)!;
        const destRow = storeRows.find((s) => s.id === destStoreId)!;

        if (sourceRow.managerId !== input.createdById) {
          throw new Error(
            "You are not authorized to transfer from this store because you are not assigned as its manager."
          );
        }
        if (destRow.managerId !== input.createdById) {
          throw new Error(
            "You are not authorized to transfer to this store because you are not assigned as its manager."
          );
        }

        const grouped = await tx.inventoryTransaction.groupBy({
          by: ["itemId"],
          where: {
            storeId: sourceStoreId,
            itemId: { in: uniqueItemIds },
            status: InventoryTransactionStatus.completed,
          },
          _sum: { qtyIn: true, qtyOut: true },
        });

        const availableByItem = new Map<string, Prisma.Decimal>();
        for (const id of uniqueItemIds) {
          availableByItem.set(id, new Prisma.Decimal(0));
        }
        for (const g of grouped) {
          const sumIn = g._sum.qtyIn ?? new Prisma.Decimal(0);
          const sumOut = g._sum.qtyOut ?? new Prisma.Decimal(0);
          availableByItem.set(g.itemId, sumIn.minus(sumOut));
        }

        const insufficient: StoreTransferInsufficientDetail[] = [];
        for (const itemId of uniqueItemIds) {
          const requested = requestedByItem.get(itemId)!;
          const available = availableByItem.get(itemId)!;
          if (available.lt(requested)) {
            insufficient.push({
              itemId,
              itemName: itemNameById.get(itemId) ?? itemId,
              available: available.toString(),
              requested: requested.toString(),
            });
          }
        }

        if (insufficient.length) {
          throw new InsufficientStoreTransferError(insufficient);
        }

        const active = await activePeriodService.getActivePeriod();
        const sessionId = active?.sessionId ?? null;
        const termId = active?.termId ?? null;

        const created: StoreTransferTransactionRow[] = [];

        for (const itemId of orderedItemIds) {
          const qty = requestedByItem.get(itemId)!;
          const qtyDec = qty;

          const outRow = await tx.inventoryTransaction.create({
            data: {
              itemId,
              transactionType: InventoryTransactionType.store_transfer,
              qtyIn: new Prisma.Decimal(0),
              qtyOut: qtyDec as any,
              status: InventoryTransactionStatus.completed,
              referenceNo: finalReferenceNo,
              notes: notesVal,
              sessionId,
              termId,
              storeId: sourceStoreId,
              transactionDate: txDate,
              createdById: input.createdById,
            },
            include: transferInclude,
          });

          const inRow = await tx.inventoryTransaction.create({
            data: {
              itemId,
              transactionType: InventoryTransactionType.store_transfer,
              qtyIn: qtyDec as any,
              qtyOut: new Prisma.Decimal(0),
              status: InventoryTransactionStatus.completed,
              referenceNo: finalReferenceNo,
              notes: notesVal,
              sessionId,
              termId,
              storeId: destStoreId,
              transactionDate: txDate,
              createdById: input.createdById,
            },
            include: transferInclude,
          });

          created.push(outRow as StoreTransferTransactionRow, inRow as StoreTransferTransactionRow);
        }

        return { referenceNo: finalReferenceNo, transactions: created };
      },
      {
        maxWait: 10000,
        timeout: 60000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
  }
}

export const storeTransferService = new StoreTransferService();
