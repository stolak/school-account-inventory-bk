import prisma from "../utils/prisma";
import { Prisma } from "@prisma/client";

export interface InventoryItemData {
  id: string;
  sku: string | null;
  name: string;
  categoryId: string | null;
  subCategoryId: string | null;
  brandId: string | null;
  uomId: string | null;
  barcode: string | null;
  costPrice: any;
  sellingPrice: any;
  lowStockThreshold: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  currentStock?: string;
}

export interface ListInventoryItemsParams {
  q?: string;
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  uomId?: string;
  createdById?: string;
  page?: number;
  limit?: number;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isPrismaKnownErrorWithCode(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as any).code === "string";
}

export class InventoryItemService {
  private prisma = prisma;

  private async assertLookupsExist(input: {
    categoryId?: string | null;
    subCategoryId?: string | null;
    brandId?: string | null;
    uomId?: string | null;
  }) {
    const checks: Array<Promise<any>> = [];

    if (input.categoryId) {
      checks.push(
        this.prisma.category.findUnique({ where: { id: input.categoryId } }).then((row) => {
          if (!row) throw new Error("Invalid categoryId");
        })
      );
    }
    if (input.subCategoryId) {
      checks.push(
        this.prisma.subCategory.findUnique({ where: { id: input.subCategoryId } }).then((row) => {
          if (!row) throw new Error("Invalid subCategoryId");
        })
      );
    }
    if (input.brandId) {
      checks.push(
        this.prisma.brand.findUnique({ where: { id: input.brandId } }).then((row) => {
          if (!row) throw new Error("Invalid brandId");
        })
      );
    }
    if (input.uomId) {
      checks.push(
        this.prisma.uom.findUnique({ where: { id: input.uomId } }).then((row) => {
          if (!row) throw new Error("Invalid uomId");
        })
      );
    }

    await Promise.all(checks);
  }

  private async assertBarcodeUnique(barcode: string, excludeId?: string) {
    const existing = await this.prisma.inventoryItem.findFirst({
      where: {
        barcode,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new Error("Barcode already exists");
    }
  }

  async createInventoryItem(input: {
    sku?: string | null;
    name: string;
    categoryId?: string | null;
    subCategoryId?: string | null;
    brandId?: string | null;
    uomId?: string | null;
    barcode?: string | null;
    costPrice: string | number;
    sellingPrice: string | number;
    lowStockThreshold?: number;
    createdById: string;
  }): Promise<InventoryItemData> {
    try {
      await this.assertLookupsExist({
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId,
        brandId: input.brandId,
        uomId: input.uomId,
      });

      if (input.barcode) {
        await this.assertBarcodeUnique(input.barcode);
      }

      return await this.prisma.inventoryItem.create({
        data: {
          sku: input.sku ?? null,
          name: input.name,
          categoryId: input.categoryId ?? null,
          subCategoryId: input.subCategoryId ?? null,
          brandId: input.brandId ?? null,
          uomId: input.uomId ?? null,
          barcode: input.barcode ?? null,
          costPrice: input.costPrice as any,
          sellingPrice: input.sellingPrice as any,
          lowStockThreshold: input.lowStockThreshold ?? 0,
          createdById: input.createdById,
        },
      });
    } catch (e) {
      console.error(e);
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("SKU or barcode already exists");
      }
      throw e;
    }
  }

  async listInventoryItems(params: ListInventoryItemsParams = {}): Promise<{
    inventoryItems: InventoryItemData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.subCategoryId) where.subCategoryId = params.subCategoryId;
    if (params.brandId) where.brandId = params.brandId;
    if (params.uomId) where.uomId = params.uomId;
    if (params.createdById) where.createdById = params.createdById;

    if (params.q) {
      where.OR = [
        { name: { contains: params.q } },
        { sku: { contains: params.q } },
        { barcode: { contains: params.q } },
      ];
    }

    const finalWhere = Object.keys(where).length ? where : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.inventoryItem.count({ where: finalWhere }),
      this.prisma.inventoryItem.findMany({
        where: finalWhere,
        orderBy: { name: "asc" },
        include: {category: {select: {name: true}}, subCategory: {select: {name: true}}, brand: {select: {name: true}}, uom: {select: {name: true}}, createdBy: {select: {firstName: true, lastName: true}}},
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const itemIds = rows.map((r) => r.id);
    const stockAgg = itemIds.length
      ? await this.prisma.inventoryTransaction.groupBy({
          by: ["itemId"],
          where: { itemId: { in: itemIds }, status: "completed" },
          _sum: { qtyIn: true, qtyOut: true },
        })
      : [];

    const stockByItemId = new Map<string, string>();
    for (const r of stockAgg) {
      const qtyIn = r._sum.qtyIn ?? new Prisma.Decimal(0);
      const qtyOut = r._sum.qtyOut ?? new Prisma.Decimal(0);
      stockByItemId.set(r.itemId, qtyIn.minus(qtyOut).toString());
    }

    // Keep behavior predictable if MySQL collation differs.
    const q = params.q?.toLowerCase();
    const filteredRows = q
      ? rows.filter((it) => {
          const name = it.name.toLowerCase();
          const sku = (it.sku ?? "").toLowerCase();
          const barcode = (it.barcode ?? "").toLowerCase();
          return name.includes(q) || sku.includes(q) || barcode.includes(q);
        })
      : rows;

    const inventoryItems = filteredRows.map((it) => ({
      ...it,
      currentStock: stockByItemId.get(it.id) ?? "0",
    }));

    return { inventoryItems, pagination: { page, limit, total, totalPages } };
  }

  async getInventoryItemById(id: string): Promise<InventoryItemData | null> {
    return await this.prisma.inventoryItem.findUnique({ where: { id } });
  }

  async updateInventoryItem(
    id: string,
    input: {
      sku?: string | null;
      name?: string;
      categoryId?: string | null;
      subCategoryId?: string | null;
      brandId?: string | null;
      uomId?: string | null;
      barcode?: string | null;
      costPrice?: string | number;
      sellingPrice?: string | number;
      lowStockThreshold?: number;
    }
  ): Promise<InventoryItemData> {
    try {
      await this.assertLookupsExist({
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId,
        brandId: input.brandId,
        uomId: input.uomId,
      });

      if (input.barcode) {
        await this.assertBarcodeUnique(input.barcode, id);
      }

      return await this.prisma.inventoryItem.update({
        where: { id },
        data: {
          ...(input.sku !== undefined ? { sku: input.sku } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          ...(input.subCategoryId !== undefined ? { subCategoryId: input.subCategoryId } : {}),
          ...(input.brandId !== undefined ? { brandId: input.brandId } : {}),
          ...(input.uomId !== undefined ? { uomId: input.uomId } : {}),
          ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
          ...(input.costPrice !== undefined ? { costPrice: input.costPrice as any } : {}),
          ...(input.sellingPrice !== undefined ? { sellingPrice: input.sellingPrice as any } : {}),
          ...(input.lowStockThreshold !== undefined ? { lowStockThreshold: input.lowStockThreshold } : {}),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("SKU or barcode already exists");
      }
      throw e;
    }
  }

  async deleteInventoryItem(id: string): Promise<InventoryItemData> {
    return await this.prisma.inventoryItem.delete({ where: { id } });
  }
}

export const inventoryItemService = new InventoryItemService();

