import { merchantSelect } from "./merchantService";
import prisma from "../utils/prisma";

export class UserService {
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        merchant: {
          select: merchantSelect,
        },
        buyer: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getAllUsers() {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    });

    return users;
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
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant) {
        throw new Error("Merchant not found");
      }

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
            outletId: true,
            outlet: {
              select: {
                id: true,
                name: true,
              },
            },
            isActive: true,
            isVerified: true,
            isEmailVerified: true,
            isPhoneVerified: true,
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
