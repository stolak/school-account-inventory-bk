import prisma from "../utils/prisma";
import { PaystackTransferStatus } from "@prisma/client";

// ==================== INTERFACES ====================

export interface CreatePaystackTransferInput {
  referenceId: string;
  merchantId?: string;
  buyerId?: string;
  amount: number;
  recipientCode: string;
  status?: PaystackTransferStatus;
}

export interface UpdatePaystackTransferInput {
  status?: PaystackTransferStatus;
  amount?: number;
  recipientCode?: string;
}

const paystackTransferSelect = {
  id: true,
  referenceId: true,
  merchantId: true,
  buyerId: true,
  amount: true,
  recipientCode: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  merchant: {
    select: {
      id: true,
      liftpayId: true,
      businessName: true,
      businessEmail: true,
    },
  },
  buyer: {
    select: {
      id: true,
      liftpayId: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} as const;

// ==================== PAYSTACK TRANSFER SERVICE ====================

export class PaystackTransferService {
  /**
   * Create a new Paystack transfer
   */
  async createPaystackTransfer(input: CreatePaystackTransferInput) {
    try {
      // Check if reference ID already exists
      const existingTransfer = await prisma.paystackTransfer.findUnique({
        where: { referenceId: input.referenceId },
      });

      if (existingTransfer) {
        throw new Error("Reference ID already exists");
      }

      // Validate merchant if provided
      if (input.merchantId) {
        const merchant = await prisma.merchant.findUnique({
          where: { id: input.merchantId },
        });

        if (!merchant) {
          throw new Error("Merchant not found");
        }
      }

      // Validate buyer if provided
      if (input.buyerId) {
        const buyer = await prisma.buyer.findUnique({
          where: { id: input.buyerId },
        });

        if (!buyer) {
          throw new Error("Buyer not found");
        }
      }

      const transfer = await prisma.paystackTransfer.create({
        data: {
          referenceId: input.referenceId,
          merchantId: input.merchantId,
          buyerId: input.buyerId,
          amount: input.amount,
          recipientCode: input.recipientCode,
          status: input.status || PaystackTransferStatus.Pending,
        },
        select: paystackTransferSelect,
      });

      return { success: true, data: transfer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all Paystack transfers
   */
  async getAllPaystackTransfers(filters?: {
    merchantId?: string;
    buyerId?: string;
    status?: PaystackTransferStatus;
  }) {
    try {
      const where: any = {};

      if (filters?.merchantId) {
        where.merchantId = filters.merchantId;
      }

      if (filters?.buyerId) {
        where.buyerId = filters.buyerId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      const transfers = await prisma.paystackTransfer.findMany({
        where,
        select: paystackTransferSelect,
        orderBy: {
          createdAt: "desc",
        },
      });

      return { success: true, data: transfers };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Paystack transfer by ID
   */
  async getPaystackTransferById(id: string) {
    try {
      const transfer = await prisma.paystackTransfer.findUnique({
        where: { id },
        select: paystackTransferSelect,
      });

      if (!transfer) {
        return { success: false, error: "Transfer not found" };
      }

      return { success: true, data: transfer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Paystack transfer by reference ID
   */
  async getPaystackTransferByReference(referenceId: string) {
    try {
      const transfer = await prisma.paystackTransfer.findUnique({
        where: { referenceId },
        select: paystackTransferSelect,
      });

      if (!transfer) {
        return { success: false, error: "Transfer not found" };
      }

      return { success: true, data: transfer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update Paystack transfer
   */
  async updatePaystackTransfer(id: string, input: UpdatePaystackTransferInput) {
    try {
      const existingTransfer = await prisma.paystackTransfer.findUnique({
        where: { id },
      });

      if (!existingTransfer) {
        return { success: false, error: "Transfer not found" };
      }

      const transfer = await prisma.paystackTransfer.update({
        where: { id },
        data: input,
        select: paystackTransferSelect,
      });

      return { success: true, data: transfer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete Paystack transfer
   */
  async deletePaystackTransfer(id: string) {
    try {
      const transfer = await prisma.paystackTransfer.findUnique({
        where: { id },
      });

      if (!transfer) {
        return { success: false, error: "Transfer not found" };
      }

      await prisma.paystackTransfer.delete({
        where: { id },
      });

      return { success: true, message: "Transfer deleted successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const paystackTransferService = new PaystackTransferService();

