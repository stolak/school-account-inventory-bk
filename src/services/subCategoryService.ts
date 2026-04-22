import prisma from "../utils/prisma";
import { CategoryData } from "./categoryService";

export interface SubCategoryData {
  id: string;
  category?: CategoryData | null;
  name: string;
  description: string | null;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListSubCategoriesParams {
  q?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isPrismaKnownErrorWithCode(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as any).code === "string";
}

export class SubCategoryService {
  private prisma = prisma;

  private async assertCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) throw new Error("Invalid categoryId");
  }

  async createSubCategory(input: {
    name: string;
    description?: string | null;
    categoryId: string;
  }): Promise<SubCategoryData> {
    try {
      await this.assertCategoryExists(input.categoryId);

      return await this.prisma.subCategory.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          categoryId: input.categoryId,
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("SubCategory name already exists for this category");
      }
      throw e;
    }
  }

  async listSubCategories(params: ListSubCategoriesParams = {}): Promise<{
    subCategories: SubCategoryData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }
    if (params.q) {
      where.name = { contains: params.q };
    }
    const finalWhere = Object.keys(where).length ? where : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.subCategory.count({ where: finalWhere }),
      this.prisma.subCategory.findMany({
        where: finalWhere,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: {
          category: true,
        },
      }),
    ]);


    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Keep behavior predictable if MySQL collation differs.
    const subCategories = params.q
      ? rows.filter((sc) => sc.name.toLowerCase().includes(params.q!.toLowerCase()))
      : rows;

    return {
      subCategories,
      pagination: { page, limit, total, totalPages },
    };
  }

  async getSubCategoryById(id: string): Promise<SubCategoryData | null> {
    return await this.prisma.subCategory.findUnique({ where: { id } });
  }

  async updateSubCategory(
    id: string,
    input: { name?: string; description?: string | null; categoryId?: string }
  ): Promise<SubCategoryData> {
    try {
      if (input.categoryId !== undefined) {
        await this.assertCategoryExists(input.categoryId);
      }

      return await this.prisma.subCategory.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("SubCategory name already exists for this category");
      }
      throw e;
    }
  }

  async deleteSubCategory(id: string): Promise<SubCategoryData> {
    return await this.prisma.subCategory.delete({ where: { id } });
  }
}

export const subCategoryService = new SubCategoryService();

