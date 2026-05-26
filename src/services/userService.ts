import prisma from "../utils/prisma";
import { Prisma, Role, UserType } from "@prisma/client";

export interface ListUsersParams {
  /** userType (Prisma UserType) */
  userType?: UserType;
  /** role (Prisma Role) */
  role?: Role;
  /** User.status string field (e.g. active) */
  status?: string;
  /** Search email / firstName / lastName (substring, case-sensitive per DB collation) */
  q?: string;
  /** When true, include soft-deleted users (isDeleted=true). Default excludes them. */
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

export interface ListedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  userType: UserType;
  role: Role;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivilegeSummary {
  id: string;
  name: string;
  description: string | null;
}

export interface AppRoleSummary {
  id: string;
  name: string;
  status: string;
}

export interface UserAccessData {
  id: string;
  email: string;
  privileges: PrivilegeSummary[];
  appRoles: AppRoleSummary[];
}

const privilegeSelect = {
  id: true,
  name: true,
  description: true,
} satisfies Prisma.PrivilegeSelect;

const appRoleSelect = {
  id: true,
  name: true,
  status: true,
} satisfies Prisma.AppRoleSelect;

const userAccessSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,

  privileges: { select: privilegeSelect },
  userRoles: {
    select: {
      role: { select: appRoleSelect },
    },
  },
} satisfies Prisma.UserSelect;

const getUserByIdSelect = {
  ...userAccessSelect,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const userListSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  userType: true,
  role: true,
  status: true,
  isActive: true,
  isVerified: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export class UserService {
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: getUserByIdSelect,
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Paginated user list with optional filters on userType, role, and status (User.status string).
   * By default excludes rows where isDeleted is true.
   */
  async listUsers(params: ListUsersParams = {}): Promise<{
    users: ListedUser[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (!params.includeDeleted) {
      where.isDeleted = false;
    }

    if (params.userType !== undefined) {
      where.userType = params.userType;
    }
    if (params.role !== undefined) {
      where.role = params.role;
    }
    if (params.status !== undefined && params.status.trim() !== "") {
      where.status = params.status.trim();
    }

    if (params.q?.trim()) {
      const q = params.q.trim();
      where.OR = [
        { email: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: userListSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      users: rows as ListedUser[],
      pagination: { page, limit, total, totalPages },
    };
  }

  async updateUser(userId: string, data: { email?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, updatedAt: true },
    });

    return user;
  }

  async deleteUser(userId: string) {
    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: "User deleted successfully" };
  }

  private mapUserAccess(
    user: Prisma.UserGetPayload<{ select: typeof userAccessSelect }>
  ): UserAccessData {
    return {
      id: user.id,
      email: user.email,
      privileges: user.privileges,
      appRoles: user.userRoles.map((ur) => ur.role),
    };
  }

  private async getUserAccessById(userId: string): Promise<UserAccessData | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userAccessSelect,
    });
    if (!user) {
      return null;
    }
    return this.mapUserAccess(user);
  }

  async addPrivilegesToUser(userId: string, privilegeIds: string[]): Promise<UserAccessData> {
    const uniqueIds = [...new Set(privilegeIds)];

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { privileges: { select: { id: true } } },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const privileges = await prisma.privilege.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (privileges.length !== uniqueIds.length) {
      throw new Error("One or more privilege IDs were not found");
    }

    const existingIds = new Set(user.privileges.map((p) => p.id));
    const toConnect = uniqueIds.filter((id) => !existingIds.has(id));

    if (toConnect.length === 0) {
      return (await this.getUserAccessById(userId))!;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        privileges: {
          connect: toConnect.map((id) => ({ id })),
        },
      },
      select: userAccessSelect,
    });

    return this.mapUserAccess(updated);
  }

  async removePrivilegeFromUser(userId: string, privilegeId: string): Promise<UserAccessData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { privileges: { where: { id: privilegeId }, select: { id: true } } },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.privileges.length === 0) {
      throw new Error("Privilege is not assigned to this user");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        privileges: {
          disconnect: { id: privilegeId },
        },
      },
      select: userAccessSelect,
    });

    return this.mapUserAccess(updated);
  }

  /**
   * Assigns an application role to a user. UserRole uses userId as primary key,
   * so each user may have at most one AppRole; assigning again replaces the existing link.
   */
  async addAppRoleToUser(userId: string, roleId: string): Promise<UserAccessData> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new Error("User not found");
    }

    const role = await prisma.appRole.findUnique({ where: { id: roleId }, select: { id: true } });
    if (!role) {
      throw new Error("Role not found");
    }

    await prisma.userRole.upsert({
      where: { userId },
      create: { userId, roleId },
      update: { roleId },
    });

    return (await this.getUserAccessById(userId))!;
  }

  async removeAppRoleFromUser(userId: string, roleId: string): Promise<UserAccessData> {
    const userRole = await prisma.userRole.findUnique({ where: { userId } });

    if (!userRole) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) {
        throw new Error("User not found");
      }
      throw new Error("Role is not assigned to this user");
    }

    if (userRole.roleId !== roleId) {
      throw new Error("Role is not assigned to this user");
    }

    await prisma.userRole.delete({ where: { userId } });

    return (await this.getUserAccessById(userId))!;
  }
}

export const userService = new UserService();
