import { DirectPayStatus, DirectPayType } from "@prisma/client";
import axios from "axios";
import prisma from "../utils/prisma";

// ==================== INTERFACES ====================

export interface CreateDirectPayInput {
  invoiceId: string;
  mandateId?: string;
  type?: DirectPayType;
  amount: number;
  status?: DirectPayStatus;
  buyerId: string;
  reference: string;
  monoUrl?: string;
  monoAccountId: string;
  monoCustomerId: string;
}

export interface UpdateDirectPayInput {
  invoiceId?: string;
  mandateId?: string;
  type?: DirectPayType;
  amount?: number;
  status?: DirectPayStatus;
  buyerId?: string;
  reference?: string;
  monoUrl?: string;
  monoAccountId?: string;
  monoCustomerId?: string;
}

export interface InitiateDirectPayInput {
  amount: number;
  account?: string;
  description: string;
  reference: string;
  customerId: string;
  redirectUrl?: string;
  meta?: Record<string, any>;
}

// ==================== SELECT OBJECTS ====================

const directPaySelect = {
  id: true,
  invoiceId: true,
  mandateId: true,
  type: true,
  amount: true,
  status: true,
  buyerId: true,
  reference: true,
  monoUrl: true,
  monoAccountId: true,
  monoCustomerId: true,
  createdAt: true,
  updatedAt: true,
  invoice: {
    select: {
      id: true,
      liftpayId: true,
      customerName: true,
      customerEmail: true,
      amount: true,
      status: true,
    },
  },
  mandate: {
    select: {
      id: true,
      referenceId: true,
      amount: true,
      status: true,
    },
  },
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
} as const;

// ==================== DIRECT PAY SERVICE ====================

export class DirectPayService {
  /**
   * Create a new direct pay
   */
  async createDirectPay(input: CreateDirectPayInput) {
    const {
      invoiceId,
      buyerId,
      monoAccountId,
      monoCustomerId,
      type = DirectPayType.Other,
      reference,
      amount,
    } = input;

    // Validate required fields
    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }
    if (!buyerId) {
      throw new Error("Buyer ID is required");
    }
    if (!monoAccountId) {
      throw new Error("Mono account ID is required");
    }
    if (!monoCustomerId) {
      throw new Error("Mono customer ID is required");
    }
    if (!reference) {
      throw new Error("Reference is required");
    }
    if (!amount || amount <= 0) {
      throw new Error("Valid amount is required");
    }

    // Verify invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Verify buyer exists
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });
    if (!buyer) {
      throw new Error("Buyer not found");
    }

    // Verify mandate exists if provided
    if (input.mandateId) {
      const mandate = await prisma.invoiceMandate.findUnique({
        where: { id: input.mandateId },
      });
      if (!mandate) {
        throw new Error("Mandate not found");
      }
    }

    // Check for duplicate reference
    const existingDirectPay = await prisma.directPay.findFirst({
      where: { reference },
    });
    if (existingDirectPay) {
      throw new Error("Direct pay with this reference already exists");
    }

    // Create the direct pay
    const directPay = await prisma.directPay.create({
      data: {
        invoiceId,
        mandateId: input.mandateId || null,
        type: input.type || DirectPayType.Other,
        amount,
        status: input.status || DirectPayStatus.Pending,
        buyerId,
        reference,
        monoUrl: input.monoUrl || null,
        monoAccountId,
        monoCustomerId,
      },
      select: directPaySelect,
    });

    return directPay;
  }

  /**
   * Get direct pay by ID
   */
  async getDirectPayById(id: string) {
    const directPay = await prisma.directPay.findUnique({
      where: { id },
      select: directPaySelect,
    });

    if (!directPay) {
      throw new Error("Direct pay not found");
    }

    return directPay;
  }

  /**
   * Get all direct pays with optional filters
   */
  async getAllDirectPays(filters?: {
    invoiceId?: string;
    mandateId?: string;
    buyerId?: string;
    status?: DirectPayStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }
    if (filters?.mandateId) {
      where.mandateId = filters.mandateId;
    }
    if (filters?.buyerId) {
      where.buyerId = filters.buyerId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const [directPays, total] = await Promise.all([
      prisma.directPay.findMany({
        where,
        select: directPaySelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.directPay.count({ where }),
    ]);

    return {
      directPays,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get direct pays by invoice ID
   */
  async getDirectPaysByInvoiceId(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const directPays = await prisma.directPay.findMany({
      where: { invoiceId },
      select: directPaySelect,
      orderBy: { createdAt: "desc" },
    });

    return directPays;
  }

  /**
   * Get direct pays by buyer ID
   */
  async getDirectPaysByBuyerId(buyerId: string) {
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const directPays = await prisma.directPay.findMany({
      where: { buyerId },
      select: directPaySelect,
      orderBy: { createdAt: "desc" },
    });

    return directPays;
  }

  /**
   * Get direct pays by mandate ID
   */
  async getDirectPaysByMandateId(mandateId: string) {
    const mandate = await prisma.invoiceMandate.findUnique({
      where: { id: mandateId },
    });

    if (!mandate) {
      throw new Error("Mandate not found");
    }

    const directPays = await prisma.directPay.findMany({
      where: { mandateId, isActive: true },
      select: directPaySelect,
      orderBy: { createdAt: "desc" },
    });

    return directPays;
  }

  async regenerateDirectPay(mandateId: string) {
    //set all pending direct pays for the mandate to inactive
    await prisma.directPay.updateMany({
      where: { mandateId, isActive: true ,status: DirectPayStatus.Pending},
      data: { status: DirectPayStatus.Cancelled },
    });

    return { success: true, message: "Direct pay regenerated successfully" };
  }

  /**
   * Get direct pay by reference
   */
  async getDirectPayByReference(reference: string) {
    const directPay = await prisma.directPay.findFirst({
      where: { reference },
      select: directPaySelect,
    });

    if (!directPay) {
      throw new Error("Direct pay not found");
    }

    return directPay;
  }

  /**
   * Update direct pay
   */
  async updateDirectPay(id: string, input: UpdateDirectPayInput) {
    // Check if direct pay exists
    const existingDirectPay = await prisma.directPay.findUnique({
      where: { id },
    });

    if (!existingDirectPay) {
      throw new Error("Direct pay not found");
    }

    // Verify invoice exists if being updated
    if (input.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: input.invoiceId },
      });
      if (!invoice) {
        throw new Error("Invoice not found");
      }
    }

    // Verify buyer exists if being updated
    if (input.buyerId) {
      const buyer = await prisma.buyer.findUnique({
        where: { id: input.buyerId },
      });
      if (!buyer) {
        throw new Error("Buyer not found");
      }
    }

    // Verify mandate exists if being updated
    if (input.mandateId !== undefined) {
      if (input.mandateId) {
        const mandate = await prisma.invoiceMandate.findUnique({
          where: { id: input.mandateId },
        });
        if (!mandate) {
          throw new Error("Mandate not found");
        }
      }
    }

    // Check for duplicate reference if being updated
    if (input.reference && input.reference !== existingDirectPay.reference) {
      const existingByReference = await prisma.directPay.findFirst({
        where: { reference: input.reference },
      });
      if (existingByReference) {
        throw new Error("Direct pay with this reference already exists");
      }
    }

    // Validate amount if being updated
    if (input.amount !== undefined && input.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Update the direct pay
    const updatedDirectPay = await prisma.directPay.update({
      where: { id },
      data: {
        ...(input.invoiceId && { invoiceId: input.invoiceId }),
        ...(input.mandateId !== undefined && {
          mandateId: input.mandateId || null,
        }),

        ...(input.amount && { amount: input.amount }),
        ...(input.status && { status: input.status }),
        ...(input.buyerId && { buyerId: input.buyerId }),
        ...(input.reference && { reference: input.reference }),
        ...(input.monoUrl !== undefined && { monoUrl: input.monoUrl || null }),
        ...(input.monoAccountId && { monoAccountId: input.monoAccountId }),
        ...(input.monoCustomerId && { monoCustomerId: input.monoCustomerId }),
      },
      select: directPaySelect,
    });

    return updatedDirectPay;
  }

  /**
   * Delete direct pay
   */
  async deleteDirectPay(id: string) {
    const directPay = await prisma.directPay.findUnique({
      where: { id },
    });

    if (!directPay) {
      throw new Error("Direct pay not found");
    }

    await prisma.directPay.delete({
      where: { id },
    });

    return { message: "Direct pay deleted successfully" };
  }

  /**
   * Get direct pay statistics
   */
  async getDirectPayStatistics(filters?: {
    buyerId?: string;
    invoiceId?: string;
    mandateId?: string;
  }) {
    const where: any = {};

    if (filters?.buyerId) {
      where.buyerId = filters.buyerId;
    }
    if (filters?.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }
    if (filters?.mandateId) {
      where.mandateId = filters.mandateId;
    }

    const [
      total,
      pending,
      processing,
      completed,
      failed,
      cancelled,
      totalAmount,
    ] = await Promise.all([
      prisma.directPay.count({ where }),
      prisma.directPay.count({
        where: { ...where, status: DirectPayStatus.Pending },
      }),
      prisma.directPay.count({
        where: { ...where, status: DirectPayStatus.Processing },
      }),
      prisma.directPay.count({
        where: { ...where, status: DirectPayStatus.Completed },
      }),
      prisma.directPay.count({
        where: { ...where, status: DirectPayStatus.Failed },
      }),
      prisma.directPay.count({
        where: { ...where, status: DirectPayStatus.Cancelled },
      }),
      prisma.directPay.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      total,
      byStatus: {
        pending,
        processing,
        completed,
        failed,
        cancelled,
      },
      totalAmount: totalAmount._sum.amount || 0,
    };
  }

  // ==================== MONO DIRECT PAY OPERATIONS ====================

  /**
   * Initiate direct pay with Mono API
   */
  async initiateMonoDirectPay(input: InitiateDirectPayInput) {
    try {
      const url = "https://api.withmono.com/v2/payments/initiate";

      const payload: any = {
        amount: input.amount,
        type: "onetime-debit",
        method: "account",
        description: input.description,
        reference: input.reference,
        redirect_url:
          input.redirectUrl ||
          `${process.env.FRONTEND_URL}/buyer/dashboard/direct-pay`,
        customer: {
          id: input.customerId,
        },
      };

      // Add optional fields
      if (input.account) {
        payload.account = input.account;
      }
      if (input.meta) {
        payload.meta = input.meta;
      }

      const response = await axios.post(url, payload, {
        headers: {
          "mono-sec-key": process.env.MONO_SECRET_KEY!,
          accept: "application/json",
          "content-type": "application/json",
        },
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data ||
          error.message,
      };
    }
  }

  /**
   * Verify direct pay with Mono API by reference
   */
  async verifyMonoDirectPay(reference: string) {
    try {
      const url = `https://api.withmono.com/v2/payments/verify/${reference}`;

      const response = await axios.get(url, {
        headers: {
          "mono-sec-key": process.env.MONO_SECRET_KEY!,
          accept: "application/json",
          "content-type": "application/json",
        },
      });
      // update direct pay status to completed if successful

      if (response.data.data.status === "successful") {
        await prisma.directPay.update({
          where: { reference },
          data: { status: DirectPayStatus.Completed },
        });
      }
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data ||
          error.message,
      };
    }
  }
}

// Export singleton instance
export const directPayService = new DirectPayService();
