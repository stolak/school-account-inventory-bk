import prisma from "../utils/prisma";

export interface BrandData {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListBrandsParams {
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

export class BrandService {
  private prisma = prisma;

  async createBrand(input: { name: string }): Promise<BrandData> {
    try {
      return await this.prisma.brand.create({
        data: { name: input.name },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Brand name already exists");
      }
      throw e;
    }
  }

  async listBrands(params: ListBrandsParams = {}): Promise<{
    brands: BrandData[];
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
      this.prisma.brand.count({ where }),
      this.prisma.brand.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Keep behavior predictable if MySQL collation differs.
    const brands = params.q ? rows.filter((b) => b.name.toLowerCase().includes(params.q!.toLowerCase())) : rows;

    return {
      brands,
      pagination: { page, limit, total, totalPages },
    };
  }

  async getBrandById(id: string): Promise<BrandData | null> {
    return await this.prisma.brand.findUnique({ where: { id } });
  }

  async updateBrand(id: string, input: { name?: string }): Promise<BrandData> {
    try {
      return await this.prisma.brand.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Brand name already exists");
      }
      throw e;
    }
  }

  async deleteBrand(id: string): Promise<BrandData> {
    return await this.prisma.brand.delete({ where: { id } });
  }
}

export const brandService = new BrandService();

