import { MonoConnectStatus } from "@prisma/client";
import prisma from "../utils/prisma";

// ==================== INTERFACES ====================

export interface CreateMonoConnectInput {
  buyerId: string;
  accountId: string;
  status?: MonoConnectStatus;
}

export interface UpdateMonoConnectInput {
  accountId?: string;
  status?: MonoConnectStatus;
}

const monoConnectSelect = {
  id: true,
  buyerId: true,
  accountId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  buyer: {
    select: {
      id: true,
      liftpayId: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
    },
  },
};

export class MonoConnectService {
  // ==================== CRUD OPERATIONS ====================

  /**
   * Create a new MonoConnect record
   */
  async createMonoConnect(input: CreateMonoConnectInput) {
    try {
      // Verify buyer exists
      const buyer = await prisma.buyer.findUnique({
        where: { id: input.buyerId },
      });

      if (!buyer) {
        throw new Error("Buyer not found");
      }

      // Check if the same buyer-accountId combination already exists
      const existing = await prisma.monoConnect.findUnique({
        where: {
          buyerId_accountId: {
            buyerId: input.buyerId,
            accountId: input.accountId,
          },
        },
      });

      if (existing) {
        throw new Error("MonoConnect record already exists for this buyer and account");
      }

      const monoConnect = await prisma.monoConnect.create({
        data: {
          buyerId: input.buyerId,
          accountId: input.accountId,
          status: input.status || MonoConnectStatus.Active,
        },
        select: monoConnectSelect,
      });

      return { success: true, data: monoConnect };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get MonoConnect by ID
   */
  async getMonoConnectById(id: string) {
    try {
      const monoConnect = await prisma.monoConnect.findUnique({
        where: { id },
        select: monoConnectSelect,
      });

      if (!monoConnect) {
        throw new Error("MonoConnect record not found");
      }

      return { success: true, data: monoConnect };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get MonoConnect by buyerId
   */
  async getMonoConnectsByBuyerId(buyerId: string) {
    try {
      const monoConnects = await prisma.monoConnect.findMany({
        where: { buyerId },
        select: monoConnectSelect,
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: monoConnects };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get MonoConnect by accountId
   */
  async getMonoConnectByAccountId(accountId: string) {
    try {
      const monoConnect = await prisma.monoConnect.findFirst({
        where: { accountId },
        select: monoConnectSelect,
      });

      if (!monoConnect) {
        throw new Error("MonoConnect record not found");
      }

      return { success: true, data: monoConnect };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all MonoConnect records with filters
   */
  async getAllMonoConnects(filters?: {
    buyerId?: string;
    status?: MonoConnectStatus;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.buyerId) where.buyerId = filters.buyerId;
      if (filters?.status) where.status = filters.status;

      const [monoConnects, total] = await Promise.all([
        prisma.monoConnect.findMany({
          where,
          skip,
          take: limit,
          select: monoConnectSelect,
          orderBy: { createdAt: "desc" },
        }),
        prisma.monoConnect.count({ where }),
      ]);

      return {
        success: true,
        data: {
          monoConnects,
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

  /**
   * Update MonoConnect record
   */
  async updateMonoConnect(id: string, input: UpdateMonoConnectInput) {
    try {
      // Verify record exists
      const existing = await prisma.monoConnect.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("MonoConnect record not found");
      }

      const monoConnect = await prisma.monoConnect.update({
        where: { id },
        data: input,
        select: monoConnectSelect,
      });

      return { success: true, data: monoConnect };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update MonoConnect status
   */
  async updateMonoConnectStatus(id: string, status: MonoConnectStatus) {
    try {
      const monoConnect = await prisma.monoConnect.update({
        where: { id },
        data: { status },
        select: monoConnectSelect,
      });

      return {
        success: true,
        data: monoConnect,
        message: `MonoConnect status updated to ${status}`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete MonoConnect record
   */
  async deleteMonoConnect(id: string) {
    try {
      const monoConnect = await prisma.monoConnect.delete({
        where: { id },
      });

      return {
        success: true,
        data: monoConnect,
        message: "MonoConnect record deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active MonoConnect by buyerId
   */
  async getActiveMonoConnectByBuyerId(buyerId: string) {
    try {
      const monoConnect = await prisma.monoConnect.findFirst({
        where: {
          buyerId,
          status: MonoConnectStatus.Active,
        },
        select: monoConnectSelect,
      });

      return { success: true, data: monoConnect };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const monoConnectService = new MonoConnectService();

