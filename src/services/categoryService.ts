import prisma from "../utils/prisma";
import { Status } from "@prisma/client";

export interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  status: Status;
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
  page?: number;
  limit?: number;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isPrismaKnownErrorWithCode(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as any).code === "string";
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
  } as const;

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

  async createCategory(input: {
    name: string;
    description?: string | null;
    status?: Status;
    consumableAccountId?: number | null;
  }): Promise<CategoryData> {
    try {
      await this.ensureConsumableAccountExists(input.consumableAccountId);

      const created = await this.prisma.category.create({
        data: {
          name: input.name,
          description: input.description ?? null,
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

    const where: any = {};

    // Default behavior: only Active unless explicitly overridden.
    if (params.status === undefined) {
      where.status = Status.Active;
    } else if (params.status !== "All") {
      where.status = params.status;
    }

    if (params.q) {
      where.name = { contains: params.q };
    }

    const finalWhere = Object.keys(where).length ? where : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.category.count({ where: finalWhere }),
      this.prisma.category.findMany({
        where: finalWhere,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: this.categoryInclude,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // MySQL `contains` can be case-insensitive depending on collation; keep behavior predictable.
    const categories = params.q
      ? rows.filter((c) => c.name.toLowerCase().includes(params.q!.toLowerCase()))
      : rows;

    return {
      categories,
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
      consumableAccountId?: number | null;
    }
  ): Promise<CategoryData> {
    try {
      await this.ensureConsumableAccountExists(input.consumableAccountId);

      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.consumableAccountId === undefined
            ? {}
            : input.consumableAccountId === null
              ? { consumableAccount: { disconnect: true } }
              : { consumableAccount: { connect: { id: input.consumableAccountId } } }),
          updatedAt: new Date(),
        },
        include: this.categoryInclude,
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Category name already exists");
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

