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
  assetAccountId?: number | null;
  assetAccount?: {
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
    assetAccount: {
      select: {
        id: true,
        accountNo: true,
        accountDescription: true,
      },
    },
  } satisfies Prisma.CategoryInclude;

  private async ensureAccountChartExists(
    accountId: number | null | undefined,
    fieldName: "consumableAccountId" | "assetAccountId"
  ): Promise<void> {
    if (accountId === undefined || accountId === null) return;
    const account = await this.prisma.accountChart.findUnique({
      where: { id: accountId },
      select: { id: true },
    });
    if (!account) {
      throw new Error(`Invalid ${fieldName}: account chart not found`);
    }
  }

  async createCategory(input: {
    name: string;
    description?: string | null;
    status?: Status;
    categoryType?: InventoryCategoryType;
    consumableAccountId?: number | null;
    assetAccountId?: number | null;
  }): Promise<CategoryData> {
    const name = input.name.trim();
    if (!name) throw new Error("name is required");

    const categoryType = input.categoryType ?? InventoryCategoryType.Consumable;
    await this.ensureAccountChartExists(input.consumableAccountId, "consumableAccountId");
    await this.ensureAccountChartExists(input.assetAccountId, "assetAccountId");

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
          ...(input.assetAccountId === undefined || input.assetAccountId === null
            ? {}
            : { assetAccount: { connect: { id: input.assetAccountId } } }),
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
      assetAccountId?: number | null;
    }
  ): Promise<CategoryData> {
    const existing = await this.getCategoryById(id);
    if (!existing) throw new Error("Category not found");

    if (input.name !== undefined && !input.name.trim()) {
      throw new Error("name cannot be empty");
    }

    if (input.consumableAccountId !== undefined) {
      await this.ensureAccountChartExists(input.consumableAccountId, "consumableAccountId");
    }
    if (input.assetAccountId !== undefined) {
      await this.ensureAccountChartExists(input.assetAccountId, "assetAccountId");
    }

    const consumableAccountRelation: Prisma.CategoryUpdateInput = {};
    if (input.consumableAccountId !== undefined) {
      if (input.consumableAccountId === null) {
        consumableAccountRelation.consumableAccount = { disconnect: true };
      } else {
        consumableAccountRelation.consumableAccount = { connect: { id: input.consumableAccountId } };
      }
    }

    const assetAccountRelation: Prisma.CategoryUpdateInput = {};
    if (input.assetAccountId !== undefined) {
      if (input.assetAccountId === null) {
        assetAccountRelation.assetAccount = { disconnect: true };
      } else {
        assetAccountRelation.assetAccount = { connect: { id: input.assetAccountId } };
      }
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
          ...assetAccountRelation,
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
