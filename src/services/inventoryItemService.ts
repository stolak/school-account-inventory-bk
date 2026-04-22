import prisma from "../utils/prisma";

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
    createdById?: string | null;
  }): Promise<InventoryItemData> {
    try {
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
          createdById: input.createdById ?? null,
        },
      });
    } catch (e) {
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
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Keep behavior predictable if MySQL collation differs.
    const q = params.q?.toLowerCase();
    const inventoryItems = q
      ? rows.filter((it) => {
          const name = it.name.toLowerCase();
          const sku = (it.sku ?? "").toLowerCase();
          const barcode = (it.barcode ?? "").toLowerCase();
          return name.includes(q) || sku.includes(q) || barcode.includes(q);
        })
      : rows;

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

