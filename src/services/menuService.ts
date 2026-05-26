import prisma from "../utils/prisma";

export interface MenuData {
  id: string;
  route: string;
  caption: string;
}

export interface ListMenusParams {
  q?: string;
}

function isPrismaKnownErrorWithCode(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as any).code === "string";
}

export class MenuService {
  private prisma = prisma;

  async createMenu(input: { route: string; caption: string }): Promise<MenuData> {
    try {
      return await this.prisma.menu.create({
        data: {
          route: input.route,
          caption: input.caption,
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Menu route already exists");
      }
      throw e;
    }
  }

  async listMenus(params: ListMenusParams = {}): Promise<MenuData[]> {
    const where = params.q
      ? {
          OR: [{ route: { contains: params.q } }, { caption: { contains: params.q } }],
        }
      : undefined;

    const rows = await this.prisma.menu.findMany({
      where,
      orderBy: { route: "asc" },
    });

    const q = params.q?.toLowerCase();
    if (!q) {
      return rows;
    }

    return rows.filter(
      (m) => m.route.toLowerCase().includes(q) || m.caption.toLowerCase().includes(q)
    );
  }

  async getMenuById(id: string): Promise<MenuData | null> {
    return await this.prisma.menu.findUnique({ where: { id } });
  }

  async updateMenu(
    id: string,
    input: { route?: string; caption?: string }
  ): Promise<MenuData> {
    try {
      return await this.prisma.menu.update({
        where: { id },
        data: {
          ...(input.route !== undefined ? { route: input.route } : {}),
          ...(input.caption !== undefined ? { caption: input.caption } : {}),
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Menu route already exists");
      }
      throw e;
    }
  }

  async deleteMenu(id: string): Promise<MenuData> {
    return await this.prisma.menu.delete({ where: { id } });
  }
}

export const menuService = new MenuService();
