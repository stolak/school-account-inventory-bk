import prisma from "../utils/prisma";
import { Status } from "@prisma/client";

export interface MenuData {
  id: string;
  route: string;
  caption: string;
  status: Status;
}

export interface ListMenusParams {
  q?: string;
  status?: Status | "All";
}

function isPrismaKnownErrorWithCode(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as any).code === "string";
}

export class MenuService {
  private prisma = prisma;

  async createMenu(input: {
    route: string;
    caption: string;
    status?: Status;
  }): Promise<MenuData> {
    try {
      return await this.prisma.menu.create({
        data: {
          route: input.route,
          caption: input.caption,
          ...(input.status !== undefined ? { status: input.status } : {}),
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
    const where: {
      status?: Status;
      OR?: Array<{ route: { contains: string } } | { caption: { contains: string } }>;
    } = {};

    if (params.status === undefined) {
      where.status = Status.Active;
    } else if (params.status !== "All") {
      where.status = params.status;
    }

    if (params.q) {
      where.OR = [{ route: { contains: params.q } }, { caption: { contains: params.q } }];
    }

    const finalWhere = Object.keys(where).length ? where : undefined;

    const rows = await this.prisma.menu.findMany({
      where: finalWhere,
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
    input: { route?: string; caption?: string; status?: Status }
  ): Promise<MenuData> {
    try {
      return await this.prisma.menu.update({
        where: { id },
        data: {
          ...(input.route !== undefined ? { route: input.route } : {}),
          ...(input.caption !== undefined ? { caption: input.caption } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
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
