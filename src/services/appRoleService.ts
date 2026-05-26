import prisma from "../utils/prisma";
import { Prisma } from "@prisma/client";

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
}

export interface ListAppRolesParams {
  q?: string;
  status?: AppRoleStatus | "all";
}

const privilegeSelect = {
  id: true,
  name: true,
  description: true,
} satisfies Prisma.PrivilegeSelect;

const roleWithPrivilegesInclude = {
  privileges: { select: privilegeSelect },
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
      include: roleWithPrivilegesInclude,
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
      include: roleWithPrivilegesInclude,
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
}

export const appRoleService = new AppRoleService();
