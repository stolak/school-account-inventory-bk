import { OutletStatus } from "@prisma/client";
import prisma from "../utils/prisma";

// ==================== INTERFACES ====================

export interface CreateOutletInput {
  name: string;
  address: string;
  managerId?: string;
  merchantId: string;
  status?: OutletStatus;
}

export interface UpdateOutletInput {
  name?: string;
  address?: string;
  managerId?: string | null;
  status?: OutletStatus;
}

export class OutletService {
  /**
   * Create a new outlet
   */
  async createOutlet(input: CreateOutletInput) {
    try {
      // Verify merchant exists
      const merchant = await prisma.merchant.findUnique({
        where: { id: input.merchantId },
      });

      if (!merchant) {
        throw new Error("Merchant not found");
      }

      // If managerId is provided, verify user exists
      if (input.managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: input.managerId },
        });

        if (!manager) {
          throw new Error("Manager not found");
        }
      }

      const outlet = await prisma.outlet.create({
        data: {
          name: input.name,
          address: input.address,
          managerId: input.managerId,
          merchantId: input.merchantId,
          status: input.status || OutletStatus.Active,
        },
        include: {
          merchant: {
            select: {
              id: true,
              liftpayId: true,
              businessName: true,
              businessEmail: true,
            },
          },
          manager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return { success: true, data: outlet };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get outlet by ID
   */
  async getOutletById(outletId: string) {
    try {
      const outlet = await prisma.outlet.findUnique({
        where: { id: outletId },
        include: {
          merchant: {
            select: {
              id: true,
              liftpayId: true,
              businessName: true,
              businessEmail: true,
            },
          },
          manager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          invoices: {
            select: {
              id: true,
              liftpayId: true,
              amount: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!outlet) {
        throw new Error("Outlet not found");
      }

      return { success: true, data: outlet };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all outlets with optional filters
   */
  async getAllOutlets(filters?: {
    merchantId?: string;
    managerId?: string;
    status?: OutletStatus;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.merchantId) where.merchantId = filters.merchantId;
      if (filters?.managerId) where.managerId = filters.managerId;
      if (filters?.status) where.status = filters.status;

      const [outlets, total] = await Promise.all([
        prisma.outlet.findMany({
          where,
          skip,
          take: limit,
          include: {
            merchant: {
              select: {
                id: true,
                liftpayId: true,
                businessName: true,
                businessEmail: true,
              },
            },
            manager: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                invoices: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.outlet.count({ where }),
      ]);

      return {
        success: true,
        data: {
          outlets,
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
   * Get outlets by merchant ID
   */
  async getOutletsByMerchantId(
    merchantId: string,
    filters?: {
      status?: OutletStatus;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { merchantId };
      if (filters?.status) where.status = filters.status;

      const [outlets, total] = await Promise.all([
        prisma.outlet.findMany({
          where,
          skip,
          take: limit,
          include: {
            manager: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                invoices: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.outlet.count({ where }),
      ]);

      return {
        success: true,
        data: {
          outlets,
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
   * Update outlet
   */
  async updateOutlet(outletId: string, input: UpdateOutletInput) {
    try {
      // Verify outlet exists
      const existingOutlet = await prisma.outlet.findUnique({
        where: { id: outletId },
      });

      if (!existingOutlet) {
        throw new Error("Outlet not found");
      }

      // If managerId is provided and not null, verify user exists
      if (input.managerId && input.managerId !== null) {
        const manager = await prisma.user.findUnique({
          where: { id: input.managerId },
        });

        if (!manager) {
          throw new Error("Manager not found");
        }
      }

      const outlet = await prisma.outlet.update({
        where: { id: outletId },
        data: input,
        include: {
          merchant: {
            select: {
              id: true,
              liftpayId: true,
              businessName: true,
              businessEmail: true,
            },
          },
          manager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return { success: true, data: outlet };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle outlet status
   */
  async toggleOutletStatus(outletId: string) {
    try {
      const outlet = await prisma.outlet.findUnique({
        where: { id: outletId },
      });

      if (!outlet) {
        throw new Error("Outlet not found");
      }

      const newStatus =
        outlet.status === OutletStatus.Active
          ? OutletStatus.Inactive
          : OutletStatus.Active;

      const updatedOutlet = await prisma.outlet.update({
        where: { id: outletId },
        data: { status: newStatus },
        include: {
          merchant: {
            select: {
              id: true,
              liftpayId: true,
              businessName: true,
              businessEmail: true,
            },
          },
          manager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedOutlet,
        message: `Outlet status changed to ${newStatus}`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete outlet
   */
  async deleteOutlet(outletId: string) {
    try {
      // Check if outlet has invoices
      const invoiceCount = await prisma.invoice.count({
        where: { outletId },
      });

      if (invoiceCount > 0) {
        throw new Error(
          `Cannot delete outlet with ${invoiceCount} associated invoice(s)`
        );
      }

      const outlet = await prisma.outlet.delete({
        where: { id: outletId },
      });

      return {
        success: true,
        data: outlet,
        message: "Outlet deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get outlet statistics
   */
  async getOutletStatistics(outletId: string) {
    try {
      const outlet = await prisma.outlet.findUnique({
        where: { id: outletId },
      });

      if (!outlet) {
        throw new Error("Outlet not found");
      }

      const [totalInvoices, pendingInvoices, paidInvoices, totalRevenue] =
        await Promise.all([
          prisma.invoice.count({
            where: { outletId },
          }),
          prisma.invoice.count({
            where: { outletId, status: "Pending" },
          }),
          prisma.invoice.count({
            where: { outletId, status: "Paid" },
          }),
          prisma.invoice.aggregate({
            where: { outletId, status: "Paid" },
            _sum: {
              amount: true,
            },
          }),
        ]);

      return {
        success: true,
        data: {
          outletId,
          totalInvoices,
          pendingInvoices,
          paidInvoices,
          totalRevenue: Number(totalRevenue._sum?.amount || 0),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all outlets with revenue statistics (paid invoices)
   */
  async getAllOutletsWithRevenue(filters?: {
    merchantId?: string;
    status?: OutletStatus;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.merchantId) where.merchantId = filters.merchantId;
      if (filters?.status) where.status = filters.status;

      const [outlets, total] = await Promise.all([
        prisma.outlet.findMany({
          where,
          skip,
          take: limit,
          include: {
            merchant: {
              select: {
                id: true,
                liftpayId: true,
                businessName: true,
                businessEmail: true,
              },
            },
            manager: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            invoices: {
              where: {
                status: "Paid",
              },
              select: {
                amount: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.outlet.count({ where }),
      ]);

      // Calculate revenue statistics for each outlet
      const outletsWithRevenue = outlets.map((outlet) => {
        const paidInvoices = outlet.invoices;
        const paidInvoiceCount = paidInvoices.length;
        const totalPaidAmount = paidInvoices.reduce(
          (sum, invoice) => sum + Number(invoice.amount),
          0
        );

        // Remove invoices from the response and add calculated fields
        const { invoices, ...outletData } = outlet;

        return {
          ...outletData,
          paidInvoiceCount,
          totalPaidAmount,
        };
      });

      return {
        success: true,
        data: {
          outlets: outletsWithRevenue,
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
}

export const outletService = new OutletService();
