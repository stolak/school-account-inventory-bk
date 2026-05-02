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
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
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

  async getUsersByMerchantId(
    merchantId: string,
    filters?: {
      userType?: string;
      role?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      // Verify merchant exists
      

      const where: any = { merchantId };
      if (filters?.userType) where.userType = filters.userType;
      if (filters?.role) where.role = filters.role;
      if (filters?.isActive !== undefined) where.isActive = filters.isActive;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            userType: true,
            role: true,
            
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        success: true,
        data: {
          users,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
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
}

export const userService = new UserService();
