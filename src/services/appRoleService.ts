import prisma from "../utils/prisma";
import { Prisma, Status } from "@prisma/client";

export type AppRoleStatus = "active" | "inactive";

export interface PrivilegeSummary {
  id: string;
  name: string;
  description: string | null;
}

export interface AppRoleData {
  id: string;
  name: string;
  status: string;
  privileges?: PrivilegeSummary[];
  roleMenus?: RoleMenuData[];
}

export interface ListAppRolesParams {
  q?: string;
  status?: AppRoleStatus | "all";
}

export interface RoleMenuMenuSummary {
  id: string;
  route: string;
  caption: string;
  status: Status;
}

export interface RoleMenuData {
  id: string;
  roleId: string;
  menuId: string;
  menu: RoleMenuMenuSummary;
}

const privilegeSelect = {
  id: true,
  name: true,
  description: true,
} satisfies Prisma.PrivilegeSelect;

const roleWithPrivilegesInclude = {
  privileges: { select: privilegeSelect },
} satisfies Prisma.AppRoleInclude;

const roleMenuInclude = {
  menu: {
    select: {
      id: true,
      route: true,
      caption: true,
      status: true,
    },
  },
} satisfies Prisma.RoleMenuInclude;

const appRoleDetailInclude = {
  privileges: { select: privilegeSelect },
  roleMenus: {
    include: roleMenuInclude,
  },
} satisfies Prisma.AppRoleInclude;

function isPrismaKnownErrorWithCode(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as any).code === "string";
}

export class AppRoleService {
  private prisma = prisma;

  async createAppRole(input: { name: string; status?: AppRoleStatus }): Promise<AppRoleData> {
    return await this.prisma.appRole.create({
      data: {
        name: input.name,
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
  }

  async listAppRoles(params: ListAppRolesParams = {}): Promise<AppRoleData[]> {
    const where: { status?: string; name?: { contains: string } } = {};

    if (params.status === undefined) {
      where.status = "active";
    } else if (params.status !== "all") {
      where.status = params.status;
    }

    if (params.q) {
      where.name = { contains: params.q };
    }

    const finalWhere = Object.keys(where).length ? where : undefined;

    const rows = await this.prisma.appRole.findMany({
      where: finalWhere,
      include: appRoleDetailInclude,
      orderBy: { name: "asc" },
    });

    const q = params.q?.toLowerCase();
    if (!q) {
      return rows;
    }

    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }

  async getAppRoleById(id: string): Promise<AppRoleData | null> {
    return await this.prisma.appRole.findUnique({
      where: { id },
      include: appRoleDetailInclude,
    });
  }

  async updateAppRole(
    id: string,
    input: { name?: string; status?: AppRoleStatus }
  ): Promise<AppRoleData> {
    return await this.prisma.appRole.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
  }

  async deleteAppRole(id: string): Promise<AppRoleData> {
    try {
      return await this.prisma.appRole.delete({ where: { id } });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2003") {
        throw new Error("Cannot delete role: it is assigned to users or menus");
      }
      throw e;
    }
  }

  async addPrivilegesToRole(roleId: string, privilegeIds: string[]): Promise<AppRoleData> {
    const uniqueIds = [...new Set(privilegeIds)];

    const role = await this.prisma.appRole.findUnique({
      where: { id: roleId },
      include: { privileges: { select: { id: true } } },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    const privileges = await this.prisma.privilege.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (privileges.length !== uniqueIds.length) {
      throw new Error("One or more privilege IDs were not found");
    }

    const existingIds = new Set(role.privileges.map((p) => p.id));
    const toConnect = uniqueIds.filter((id) => !existingIds.has(id));

    if (toConnect.length === 0) {
      return (await this.getAppRoleById(roleId))!;
    }

    return await this.prisma.appRole.update({
      where: { id: roleId },
      data: {
        privileges: {
          connect: toConnect.map((id) => ({ id })),
        },
      },
      include: roleWithPrivilegesInclude,
    });
  }

  async removePrivilegeFromRole(roleId: string, privilegeId: string): Promise<AppRoleData> {
    const role = await this.prisma.appRole.findUnique({
      where: { id: roleId },
      include: { privileges: { where: { id: privilegeId }, select: { id: true } } },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.privileges.length === 0) {
      throw new Error("Privilege is not assigned to this role");
    }

    return await this.prisma.appRole.update({
      where: { id: roleId },
      data: {
        privileges: {
          disconnect: { id: privilegeId },
        },
      },
      include: roleWithPrivilegesInclude,
    });
  }

  async addMenusToRole(roleId: string, menuIds: string[]): Promise<RoleMenuData[]> {
    const uniqueIds = [...new Set(menuIds)];

    const role = await this.prisma.appRole.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
    if (!role) {
      throw new Error("Role not found");
    }

    const menus = await this.prisma.menu.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (menus.length !== uniqueIds.length) {
      throw new Error("One or more menu IDs were not found");
    }

    const existing = await this.prisma.roleMenu.findMany({
      where: { roleId, menuId: { in: uniqueIds } },
      select: { menuId: true },
    });
    const existingMenuIds = new Set(existing.map((r) => r.menuId));
    const toCreate = uniqueIds.filter((menuId) => !existingMenuIds.has(menuId));

    if (toCreate.length > 0) {
      await this.prisma.roleMenu.createMany({
        data: toCreate.map((menuId) => ({ roleId, menuId })),
      });
    }

    return this.listRoleMenus(roleId);
  }

  async listRoleMenus(roleId: string): Promise<RoleMenuData[]> {
    const role = await this.prisma.appRole.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
    if (!role) {
      throw new Error("Role not found");
    }

    return await this.prisma.roleMenu.findMany({
      where: { roleId },
      include: roleMenuInclude,
      orderBy: { menu: { route: "asc" } },
    });
  }

  async deleteRoleMenu(roleId: string, menuId: string): Promise<RoleMenuData> {
    const record = await this.prisma.roleMenu.findFirst({
      where: { menuId, roleId },
      include: roleMenuInclude,
    });

    if (!record) {
      throw new Error("Role menu record not found");
    }

    await this.prisma.roleMenu.delete({ where: { id: record.id } });
    return record;
  }
}

export const appRoleService = new AppRoleService();
