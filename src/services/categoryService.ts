import prisma from "../utils/prisma";

export interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListCategoriesParams {
  q?: string;
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

  async createCategory(input: { name: string; description?: string | null }): Promise<CategoryData> {
    try {
      const created = await this.prisma.category.create({
        data: {
          name: input.name,
          description: input.description ?? null,
        },
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

    const where = params.q
      ? {
          name: {
            contains: params.q,
          },
        }
      : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
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
    return await this.prisma.category.findUnique({ where: { id } });
  }

  async updateCategory(
    id: string,
    input: { name?: string; description?: string | null }
  ): Promise<CategoryData> {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Category name already exists");
      }
      throw e;
    }
  }

  async deleteCategory(id: string): Promise<CategoryData> {
    return await this.prisma.category.delete({ where: { id } });
  }
}

export const categoryService = new CategoryService();

