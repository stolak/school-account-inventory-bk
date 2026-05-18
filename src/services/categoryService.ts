import prisma from "../utils/prisma";
import { InventoryCategoryType, Prisma, Status } from "@prisma/client";

export interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  status: Status;
  categoryType: InventoryCategoryType;
  createdAt: Date;
  updatedAt: Date;
  consumableAccountId?: number | null;
  consumableAccount?: {
    id: number;
    accountNo: string | null;
    accountDescription: string;
  } | null;
}

export interface ListCategoriesParams {
  q?: string;
  status?: Status | "All";
  categoryType?: InventoryCategoryType;
  page?: number;
  limit?: number;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isPrismaKnownErrorWithCode(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as { code: unknown }).code === "string";
}

export class CategoryService {
  private prisma = prisma;

  private categoryInclude = {
    consumableAccount: {
      select: {
        id: true,
        accountNo: true,
        accountDescription: true,
      },
    },
  } satisfies Prisma.CategoryInclude;

  private async ensureConsumableAccountExists(consumableAccountId?: number | null): Promise<void> {
    if (consumableAccountId === undefined || consumableAccountId === null) return;
    const account = await this.prisma.accountChart.findUnique({
      where: { id: consumableAccountId },
      select: { id: true },
    });
    if (!account) {
      throw new Error("Invalid consumableAccountId: account chart not found");
    }
  }

  private assertConsumableAccountAllowed(
    categoryType: InventoryCategoryType,
    consumableAccountId?: number | null
  ): void {
    if (
      categoryType === InventoryCategoryType.NonConsumable &&
      consumableAccountId !== undefined &&
      consumableAccountId !== null
    ) {
      throw new Error("consumableAccountId cannot be set when categoryType is NonConsumable");
    }
  }

  async createCategory(input: {
    name: string;
    description?: string | null;
    status?: Status;
    categoryType?: InventoryCategoryType;
    consumableAccountId?: number | null;
  }): Promise<CategoryData> {
    const name = input.name.trim();
    if (!name) throw new Error("name is required");

    const categoryType = input.categoryType ?? InventoryCategoryType.Consumable;
    this.assertConsumableAccountAllowed(categoryType, input.consumableAccountId);
    await this.ensureConsumableAccountExists(input.consumableAccountId);

    try {
      const created = await this.prisma.category.create({
        data: {
          name,
          description: input.description ?? null,
          categoryType,
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.consumableAccountId === undefined || input.consumableAccountId === null
            ? {}
            : { consumableAccount: { connect: { id: input.consumableAccountId } } }),
        },
        include: this.categoryInclude,
      });

      return created;
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Category name already exists");
      }
      throw e;
    }
  }

  async listCategories(params: ListCategoriesParams = {}): Promise<{
    categories: CategoryData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {};

    if (params.status === undefined) {
      where.status = Status.Active;
    } else if (params.status !== "All") {
      where.status = params.status;
    }

    if (params.categoryType !== undefined) {
      where.categoryType = params.categoryType;
    }

    if (params.q?.trim()) {
      const q = params.q.trim();
      where.OR = [{ name: { contains: q } }, { description: { contains: q } }];
    }

    const [total, rows] = await Promise.all([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: this.categoryInclude,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      categories: rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async getCategoryById(id: string): Promise<CategoryData | null> {
    return await this.prisma.category.findUnique({ where: { id }, include: this.categoryInclude });
  }

  async updateCategory(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      status?: Status;
      categoryType?: InventoryCategoryType;
      consumableAccountId?: number | null;
    }
  ): Promise<CategoryData> {
    const existing = await this.getCategoryById(id);
    if (!existing) throw new Error("Category not found");

    if (input.name !== undefined && !input.name.trim()) {
      throw new Error("name cannot be empty");
    }

    const categoryType = input.categoryType ?? existing.categoryType;
    const resolvedConsumableAccountId =
      input.consumableAccountId !== undefined ? input.consumableAccountId : existing.consumableAccountId ?? null;

    this.assertConsumableAccountAllowed(categoryType, resolvedConsumableAccountId);
    await this.ensureConsumableAccountExists(resolvedConsumableAccountId);

    const switchingToNonConsumable =
      input.categoryType === InventoryCategoryType.NonConsumable &&
      existing.categoryType !== InventoryCategoryType.NonConsumable;
    const consumableAccountRelation: Prisma.CategoryUpdateInput = {};
    if (input.consumableAccountId !== undefined) {
      if (input.consumableAccountId === null || categoryType === InventoryCategoryType.NonConsumable) {
        consumableAccountRelation.consumableAccount = { disconnect: true };
      } else {
        consumableAccountRelation.consumableAccount = { connect: { id: input.consumableAccountId } };
      }
    } else if (switchingToNonConsumable && existing.consumableAccountId != null) {
      consumableAccountRelation.consumableAccount = { disconnect: true };
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.categoryType !== undefined ? { categoryType: input.categoryType } : {}),
          ...consumableAccountRelation,
          updatedAt: new Date(),
        },
        include: this.categoryInclude,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Category name already exists");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Category not found");
      }
      throw e;
    }
  }

  async deleteCategory(id: string): Promise<CategoryData> {
    const [subCategoryCount, inventoryItemCount] = await Promise.all([
      this.prisma.subCategory.count({ where: { categoryId: id } }),
      this.prisma.inventoryItem.count({ where: { categoryId: id } }),
    ]);

    if (subCategoryCount > 0 || inventoryItemCount > 0) {
      throw new Error("Cannot delete category because it is referenced by subcategories or inventory items");
    }

    return await this.prisma.category.delete({ where: { id }, include: this.categoryInclude });
  }
}

export const categoryService = new CategoryService();
