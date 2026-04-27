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
createdAt: Date;
updatedAt: Date;
item?: { name: string } | null;
supplier?: { name: string } | null;
createdBy?: { firstName: string | null; lastName: string | null } | null;
}

export interface ListPurchasesParams {
q?: string;
itemId?: string;
supplierId?: string;
status?: InventoryTransactionStatus;
page?: number;
limit?: number;
}

function clampInt(n: number, min: number, max: number) {
return Math.max(min, Math.min(max, n));
}

export class PurchaseService {
private prisma = prisma;

private async assertItemExists(itemId: string) {
const item = await this.prisma.inventoryItem.findUnique({ where: { id: itemId }, select: { id: true } });
if (!item) throw new Error("Invalid itemId");
}

private async assertSupplierExists(supplierId: string) {
const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId }, select: { id: true } });
if (!supplier) throw new Error("Invalid supplierId");
}

async createPurchase(input: {
itemId: string;
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
    if (input.supplierId) await this.assertSupplierExists(input.supplierId);
    console.log(input);
    return await this.prisma.inventoryTransaction.create({
    data: {
    itemId: input.itemId,
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
    include: {
    item: { select: { name: true } },
    supplier: { select: { name: true } },
    createdBy: { select: { firstName: true, lastName: true } },
    },
    });
    }

  async createBulkPurchases(input: {
    supplierId?: string | null;
    referenceNo?: string | null;
    notes?: string | null;
    transactionDate?: Date;
    amountPaid?: string | number;
    createdById: string;
    items: Array<{
      itemId: string;
      qtyIn: string | number;
      inCost: string | number;
    }>;
    status?: InventoryTransactionStatus;
  }): Promise<PurchaseData[]> {
    if (!input.items.length) {
      throw new Error("items must not be empty");
    }

    const supplierId = input.supplierId ?? null;
    if (supplierId) await this.assertSupplierExists(supplierId);

    const itemIds = [...new Set(input.items.map((i) => i.itemId))];
    const existingItems = await this.prisma.inventoryItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true },
    });
    const existingSet = new Set(existingItems.map((i) => i.id));
    const missing = itemIds.filter((id) => !existingSet.has(id));
    if (missing.length) {
      throw new Error(`Invalid itemId(s): ${missing.join(", ")}`);
    }

    const txDate = input.transactionDate ?? new Date();
    const status = input.status ?? InventoryTransactionStatus.completed;

    const created = await this.prisma.$transaction(
      input.items.map((it) =>
        this.prisma.inventoryTransaction.create({
          data: {
            itemId: it.itemId,
            supplierId,
            transactionType: InventoryTransactionType.purchase,
            qtyIn: it.qtyIn as any,
            inCost: it.inCost as any,
            ...(input.amountPaid !== undefined ? { amountPaid: input.amountPaid as any } : {}),
            status,
            referenceNo: input.referenceNo ?? null,
            notes: input.notes ?? null,
            transactionDate: txDate,
            createdById: input.createdById,
          },
          include: {
            item: { select: { name: true } },
            supplier: { select: { name: true } },
            createdBy: { select: { firstName: true, lastName: true } },
          },
        })
      )
    );

    return created;
  }

    async listPurchases(params: ListPurchasesParams = {}): Promise<{ purchases: PurchaseData[]; pagination: { page:
        number; limit: number; total: number; totalPages: number }; }> {
        const page = clampInt(params.page ?? 1, 1, 1_000_000);
        const limit = clampInt(params.limit ?? 20, 1, 100);
        const skip = (page - 1) * limit;

        const where: Prisma.InventoryTransactionWhereInput = {
        transactionType: InventoryTransactionType.purchase,
        ...(params.itemId ? { itemId: params.itemId } : {}),
        ...(params.supplierId ? { supplierId: params.supplierId } : {}),
        ...(params.status ? { status: params.status } : {}),
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
        include: {
        item: { select: { name: true } },
        supplier: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        },
        }),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / limit));
        return { purchases: rows, pagination: { page, limit, total, totalPages } };
        }

        async getPurchaseById(id: string): Promise<PurchaseData | null> {
            return await this.prisma.inventoryTransaction.findFirst({
            where: { id, transactionType: InventoryTransactionType.purchase },
            include: {
            item: { select: { name: true } },
            supplier: { select: { name: true } },
            createdBy: { select: { firstName: true, lastName: true } },
            },
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
                include: {
                item: { select: { name: true } },
                supplier: { select: { name: true } },
                createdBy: { select: { firstName: true, lastName: true } },
                },
                });
                }

                async deletePurchase(id: string): Promise<PurchaseData> {
                    const existing = await this.getPurchaseById(id);
                    if (!existing) throw new Error("Purchase not found");

                    return await this.prisma.inventoryTransaction.delete({
                    where: { id },
                    include: {
                    item: { select: { name: true } },
                    supplier: { select: { name: true } },
                    createdBy: { select: { firstName: true, lastName: true } },
                    },
                    });
                    }
                    }

                    export const purchaseService = new PurchaseService();
