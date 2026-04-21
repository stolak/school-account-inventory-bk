import { MandateStatus } from "@prisma/client";
import prisma from "../utils/prisma";

// ==================== INTERFACES ====================

export interface CreateInvoiceMandateInput {
  invoiceId: string;
  loanId?: string;
  monoMandateId?: string;
  monoAccountId: string;
  monoCustomerId: string;
  buyerId: string;
  referenceId: string;
  amount: number;
  updateMandateUrl?: string;
  tenure?: number;
  downPayment?: number;
  status?: MandateStatus;
}

export interface UpdateInvoiceMandateInput {
  invoiceId?: string;
  loanId?: string;
  monoMandateId?: string;
  monoAccountId?: string;
  monoCustomerId?: string;
  buyerId?: string;
  referenceId?: string;
  amount?: number;
  status?: MandateStatus;
  updateMandateUrl?: string;
  tenure?: number;
  downPayment?: number;
}

// ==================== SELECT OBJECTS ====================

const invoiceMandateSelect = {
  id: true,
  invoiceId: true,
  loanId: true,
  monoMandateId: true,
  monoAccountId: true,
  monoCustomerId: true,
  buyerId: true,
  referenceId: true,
  updateMandateUrl: true,
  tenure: true,
  downPayment: true,
  amount: true,
  status: true,
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
  loan: {
    select: {
      id: true,
      liftpayId: true,
      loanAmount: true,
      loanStatus: true,
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

// ==================== INVOICE MANDATE SERVICE ====================

export class InvoiceMandateService {
  /**
   * Create a new invoice mandate
   */
  async createInvoiceMandate(input: CreateInvoiceMandateInput) {
    const {
      invoiceId,
      buyerId,
      monoAccountId,
      monoCustomerId,
      referenceId,
      amount,
      updateMandateUrl,
      tenure,
      downPayment,
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
    if (!referenceId) {
      throw new Error("Reference ID is required");
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

    // Verify loan exists if provided
    if (input.loanId) {
      const loan = await prisma.loan.findUnique({
        where: { id: input.loanId },
      });
      if (!loan) {
        throw new Error("Loan not found");
      }
    }

    // Check for duplicate reference ID
    const existingMandate = await prisma.invoiceMandate.findFirst({
      where: { referenceId },
    });
    if (existingMandate) {
      throw new Error("Mandate with this reference ID already exists");
    }

    // Create the mandate
    const mandate = await prisma.invoiceMandate.create({
      data: {
        invoiceId,
        loanId: input.loanId || null,
        monoMandateId: input.monoMandateId || null,
        monoAccountId,
        monoCustomerId,
        buyerId,
        referenceId,
        amount,
        updateMandateUrl,
        tenure,
        downPayment,
        status: input.status || MandateStatus.Pending,
      },
      select: invoiceMandateSelect,
    });

    return mandate;
  }

  /**
   * Get invoice mandate by ID
   */
  async getInvoiceMandateById(id: string) {
    const mandate = await prisma.invoiceMandate.findUnique({
      where: { id },
      select: invoiceMandateSelect,
    });

    if (!mandate) {
      throw new Error("Invoice mandate not found");
    }

    return mandate;
  }

  /**
   * Get all invoice mandates with optional filters
   */
  async getAllInvoiceMandates(filters?: {
    invoiceId?: string;
    loanId?: string;
    buyerId?: string;
    status?: MandateStatus;
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
    if (filters?.loanId) {
      where.loanId = filters.loanId;
    }
    if (filters?.buyerId) {
      where.buyerId = filters.buyerId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const [mandates, total] = await Promise.all([
      prisma.invoiceMandate.findMany({
        where,
        select: invoiceMandateSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoiceMandate.count({ where }),
    ]);

    return {
      mandates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get invoice mandates by invoice ID
   */
  async getMandatesByInvoiceId(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const mandates = await prisma.invoiceMandate.findMany({
      where: { invoiceId },
      select: invoiceMandateSelect,
      orderBy: { createdAt: "desc" },
    });

    return mandates;
  }

  /**
   * Get invoice mandates by buyer ID
   */
  async getMandatesByBuyerId(buyerId: string) {
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const mandates = await prisma.invoiceMandate.findMany({
      where: { buyerId },
      select: invoiceMandateSelect,
      orderBy: { createdAt: "desc" },
    });

    return mandates;
  }

  /**
   * Get invoice mandates by loan ID
   */
  async getMandatesByLoanId(loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new Error("Loan not found");
    }

    const mandates = await prisma.invoiceMandate.findMany({
      where: { loanId },
      select: invoiceMandateSelect,
      orderBy: { createdAt: "desc" },
    });

    return mandates;
  }

  /**
   * Get invoice mandate by reference ID
   */
  async getMandateByReferenceId(referenceId: string) {
    const mandate = await prisma.invoiceMandate.findFirst({
      where: { referenceId },
      select: invoiceMandateSelect,
    });

    if (!mandate) {
      throw new Error("Invoice mandate not found");
    }

    return mandate;
  }

  /**
   * Update invoice mandate
   */
  async updateInvoiceMandate(id: string, input: UpdateInvoiceMandateInput) {
    // Check if mandate exists
    const existingMandate = await prisma.invoiceMandate.findUnique({
      where: { id },
    });

    if (!existingMandate) {
      throw new Error("Invoice mandate not found");
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

    // Verify loan exists if being updated
    if (input.loanId !== undefined) {
      if (input.loanId) {
        const loan = await prisma.loan.findUnique({
          where: { id: input.loanId },
        });
        if (!loan) {
          throw new Error("Loan not found");
        }
      }
    }

    // Check for duplicate reference ID if being updated
    if (
      input.referenceId &&
      input.referenceId !== existingMandate.referenceId
    ) {
      const existingByReference = await prisma.invoiceMandate.findFirst({
        where: { referenceId: input.referenceId },
      });
      if (existingByReference) {
        throw new Error("Mandate with this reference ID already exists");
      }
    }

    // Validate amount if being updated
    if (input.amount !== undefined && input.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Update the mandate
    const updatedMandate = await prisma.invoiceMandate.update({
      where: { id },
      data: {
        ...(input.invoiceId && { invoiceId: input.invoiceId }),
        ...(input.loanId !== undefined && { loanId: input.loanId || null }),
        ...(input.monoMandateId !== undefined && {
          monoMandateId: input.monoMandateId || null,
        }),
        ...(input.monoAccountId && { monoAccountId: input.monoAccountId }),
        ...(input.monoCustomerId && { monoCustomerId: input.monoCustomerId }),
        ...(input.buyerId && { buyerId: input.buyerId }),
        ...(input.referenceId && { referenceId: input.referenceId }),
        ...(input.amount && { amount: input.amount }),
        ...(input.status && { status: input.status }),
        ...(input.updateMandateUrl && { updateMandateUrl: input.updateMandateUrl }),
        ...(input.tenure && { tenure: input.tenure }),
        ...(input.downPayment && { downPayment: input.downPayment }),
        ...(input.status && { status: input.status }),
        ...(input.updateMandateUrl && { updateMandateUrl: input.updateMandateUrl }),
        ...(input.tenure && { tenure: input.tenure }),
        
      },
      select: invoiceMandateSelect,
    });

    return updatedMandate;
  }

  /**
   * Delete invoice mandate
   */
  async deleteInvoiceMandate(id: string) {
    const mandate = await prisma.invoiceMandate.findUnique({
      where: { id },
    });

    if (!mandate) {
      throw new Error("Invoice mandate not found");
    }

    await prisma.invoiceMandate.delete({
      where: { id },
    });

    return { message: "Invoice mandate deleted successfully" };
  }

  /**
   * Get mandate statistics
   */
  async getMandateStatistics(filters?: {
    buyerId?: string;
    invoiceId?: string;
    loanId?: string;
  }) {
    const where: any = {};

    if (filters?.buyerId) {
      where.buyerId = filters.buyerId;
    }
    if (filters?.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }
    if (filters?.loanId) {
      where.loanId = filters.loanId;
    }

    const [total, pending, active, completed, failed, cancelled, totalAmount] =
      await Promise.all([
        prisma.invoiceMandate.count({ where }),
        prisma.invoiceMandate.count({
          where: { ...where, status: MandateStatus.Pending },
        }),
        prisma.invoiceMandate.count({
          where: { ...where, status: MandateStatus.Active },
        }),
        prisma.invoiceMandate.count({
          where: { ...where, status: MandateStatus.Completed },
        }),
        prisma.invoiceMandate.count({
          where: { ...where, status: MandateStatus.Failed },
        }),
        prisma.invoiceMandate.count({
          where: { ...where, status: MandateStatus.Cancelled },
        }),
        prisma.invoiceMandate.aggregate({
          where,
          _sum: { amount: true },
        }),
      ]);

    return {
      total,
      byStatus: {
        pending,
        active,
        completed,
        failed,
        cancelled,
      },
      totalAmount: totalAmount._sum.amount || 0,
    };
  }
  async initiateMandate(mandateId: string) {
    const mandate = await prisma.invoiceMandate.findUnique({
      where: { id: mandateId },
    });
    if (!mandate) {
      throw new Error("Invoice mandate not found");
    }
  }
}

// Export singleton instance
export const invoiceMandateService = new InvoiceMandateService();
