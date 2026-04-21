import { InvoiceStatus } from "@prisma/client";
import prisma from "../utils/prisma";

// ==================== INTERFACES ====================

export interface GetPaidInvoicesSumInput {
  merchantId: string;
  startDate: Date;
  endDate: Date;
}

// ==================== SERVICE ====================

export class MerchantStatsService {
  /**
   * Get the sum of paid invoices by merchant within a date range
   * @param input - Object containing merchantId, startDate, and endDate
   * @returns Sum of all paid invoice amounts for the merchant within the date range
   */
  async getPaidInvoicesSumByMerchant(input: GetPaidInvoicesSumInput) {
    try {
      const { merchantId, startDate, endDate } = input;

      // Validate inputs
      if (!merchantId) {
        return {
          success: false,
          error: "merchantId is required",
        };
      }

      if (!startDate || !endDate) {
        return {
          success: false,
          error: "startDate and endDate are required",
        };
      }

      // Validate date range
      if (startDate > endDate) {
        return {
          success: false,
          error: "startDate must be before or equal to endDate",
        };
      }

      // Verify merchant exists
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { id: true, businessName: true },
      });

      if (!merchant) {
        return {
          success: false,
          error: "Merchant not found",
        };
      }

      // Query paid invoices within date range
      const paidInvoicesResult = await prisma.invoice.aggregate({
        where: {
          merchantId: merchantId,
          status: InvoiceStatus.Paid,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      // Query total invoices (all statuses) within date range
      const totalInvoicesResult = await prisma.invoice.aggregate({
        where: {
          merchantId: merchantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          id: true,
        },
      });

      // Query pending invoices within date range
      const pendingInvoicesResult = await prisma.invoice.aggregate({
        where: {
          merchantId: merchantId,
          status: InvoiceStatus.Pending,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      // Query all paid invoices regardless of date range (lifetime total)
      const allPaidInvoicesResult = await prisma.invoice.aggregate({
        where: {
          merchantId: merchantId,
          status: InvoiceStatus.Paid,
        },
        _sum: {
          amount: true,
        },
      });

      // Get additional details for better response
      const invoices = await prisma.invoice.findMany({
        where: {
          merchantId: merchantId,
          status: InvoiceStatus.Paid,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          liftpayId: true,
          amount: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const totalSum = paidInvoicesResult._sum.amount || 0;
      const paidInvoiceCount = paidInvoicesResult._count.id || 0;
      const totalInvoiceCount = totalInvoicesResult._count.id || 0;
      const pendingInvoiceSum = pendingInvoicesResult._sum.amount || 0;
      const pendingInvoiceCount = pendingInvoicesResult._count.id || 0;
      const allTimePaidInvoiceSum = allPaidInvoicesResult._sum.amount || 0;

      // Calculate average value
      const averageValue =
        paidInvoiceCount > 0 ? Number(totalSum) / paidInvoiceCount : 0;

      // Calculate conversion rate (percentage of paid invoices out of total invoices)
      const conversionRate =
        totalInvoiceCount > 0
          ? (paidInvoiceCount / totalInvoiceCount) * 100
          : 0;

      return {
        success: true,
        data: {
          merchantId: merchantId,
          merchantName: merchant.businessName,
          totalSum: Number(totalSum),
          invoiceCount: paidInvoiceCount,
          averageValue: averageValue,
          conversionRate: Number(conversionRate.toFixed(2)),
          totalInvoiceCount: totalInvoiceCount,
          pendingInvoiceSum: Number(pendingInvoiceSum),
          pendingInvoiceCount: pendingInvoiceCount,
          allTimePaidInvoiceSum: Number(allTimePaidInvoiceSum),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          invoices: invoices.map((invoice) => ({
            id: invoice.id,
            liftpayId: invoice.liftpayId,
            amount: Number(invoice.amount),
            createdAt: invoice.createdAt.toISOString(),
          })),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to get paid invoices sum",
      };
    }
  }
}

export const merchantStatsService = new MerchantStatsService();
