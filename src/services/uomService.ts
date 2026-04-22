import prisma from "../utils/prisma";

export interface UomData {
  id: string;
  name: string;
  symbol: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListUomsParams {
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

export class UomService {
  private prisma = prisma;

  async createUom(input: { name: string; symbol: string }): Promise<UomData> {
    try {
      return await this.prisma.uom.create({
        data: { name: input.name, symbol: input.symbol },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Uom name or symbol already exists");
      }
      throw e;
    }
  }

  async listUoms(params: ListUomsParams = {}): Promise<{
    uoms: UomData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where = params.q
      ? {
          OR: [
            { name: { contains: params.q } },
            { symbol: { contains: params.q } },
          ],
        }
      : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.uom.count({ where }),
      this.prisma.uom.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Keep behavior predictable if MySQL collation differs.
    const q = params.q?.toLowerCase();
    const uoms = q
      ? rows.filter((u) => u.name.toLowerCase().includes(q) || u.symbol.toLowerCase().includes(q))
      : rows;

    return {
      uoms,
      pagination: { page, limit, total, totalPages },
    };
  }

  async getUomById(id: string): Promise<UomData | null> {
    return await this.prisma.uom.findUnique({ where: { id } });
  }

  async updateUom(id: string, input: { name?: string; symbol?: string }): Promise<UomData> {
    try {
      return await this.prisma.uom.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.symbol !== undefined ? { symbol: input.symbol } : {}),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Uom name or symbol already exists");
      }
      throw e;
    }
  }

  async deleteUom(id: string): Promise<UomData> {
    return await this.prisma.uom.delete({ where: { id } });
  }
}

export const uomService = new UomService();

