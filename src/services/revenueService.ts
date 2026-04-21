import { RevenueType } from "@prisma/client";
import { liftpayIdService } from "./liftpayIdService";
import prisma from "../utils/prisma";

// ==================== INTERFACES ====================

export interface CreateRevenueInput {
  credit?: number;
  debit?: number;
  description: string;
  parentTable?: string;
  type: RevenueType;
  referenceIds: string[];
  detail?: string;
  buyerId?: string;
  merchantId?: string;
  loanId?: string;
  invoiceId?: string;
  transactionDate: Date;
}

export interface UpdateRevenueInput {
  credit?: number;
  debit?: number;
  description?: string;
  parentTable?: string;
  type?: RevenueType;
  referenceIds?: string[];
  detail?: string;
  buyerId?: string | null;
  merchantId?: string | null;
  loanId?: string | null;
  invoiceId?: string | null;
  transactionDate?: Date;
}

export class RevenueService {
  // ==================== CRUD OPERATIONS ====================

  /**
   * Create a new revenue record
   */
  async createRevenue(input: CreateRevenueInput) {
    try {
      // Verify merchant exists
      if (input.merchantId) {
        const merchant = await prisma.merchant.findUnique({
          where: { id: input.merchantId },
        });

        if (!merchant) {
          throw new Error("Merchant not found");
        }
      }

      // If buyerId is provided, verify buyer exists
      if (input.buyerId) {
        const buyer = await prisma.buyer.findUnique({
          where: { id: input.buyerId },
        });

        if (!buyer) {
          throw new Error("Buyer not found");
        }
      }

      // If loanId is provided, verify loan exists
      if (input.loanId) {
        const loan = await prisma.loan.findUnique({
          where: { id: input.loanId },
        });

        if (!loan) {
          throw new Error("Loan not found");
        }
      }

      // If invoiceId is provided, verify invoice exists
      if (input.invoiceId) {
        const invoice = await prisma.invoice.findUnique({
          where: { id: input.invoiceId },
        });

        if (!invoice) {
          throw new Error("Invoice not found");
        }
      }
      // Generate liftpayId for Revenue
      const liftpayIdResult = await liftpayIdService.generateLiftPayId("LPR");
      if (!liftpayIdResult.success || !liftpayIdResult.liftpayId) {
        throw new Error(
          liftpayIdResult.error || "Failed to generate LiftPay ID for Revenue"
        );
      }

      const revenue = await prisma.revenue.create({
        data: {
          liftpayId: liftpayIdResult.liftpayId,
          credit: input.credit || 0,
          debit: input.debit || 0,
          description: input.description,
          parentTable: input.parentTable,
          type: input.type,
          referenceIds: JSON.stringify(input.referenceIds),
          detail: input.detail,
          buyerId: input.buyerId,
          merchantId: input.merchantId || undefined,
          loanId: input.loanId,
          invoiceId: input.invoiceId,
          transactionDate: input.transactionDate,
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
          buyer: {
            select: {
              id: true,
              liftpayId: true,
              firstName: true,
              lastName: true,
              email: true,
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
          invoice: {
            select: {
              id: true,
              liftpayId: true,
              amount: true,
              status: true,
            },
          },
        },
      });

      return {
        success: true,
        data: {
          ...revenue,
          referenceIds: JSON.parse(revenue.referenceIds),
        },
      };
    } catch (error: any) {
      console.log(error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get revenue by ID
   */
  async getRevenueById(revenueId: string) {
    try {
      const revenue = await prisma.revenue.findUnique({
        where: { id: revenueId },
        include: {
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
          loan: {
            select: {
              id: true,
              liftpayId: true,
              loanAmount: true,
              loanStatus: true,
            },
          },
          invoice: {
            select: {
              id: true,
              liftpayId: true,
              amount: true,
              status: true,
            },
          },
        },
      });

      if (!revenue) {
        throw new Error("Revenue record not found");
      }

      return {
        success: true,
        data: {
          ...revenue,
          referenceIds: JSON.parse(revenue.referenceIds),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get revenue by liftpayId
   */
  async getRevenueByLiftpayId(liftpayId: string) {
    try {
      const revenue = await prisma.revenue.findUnique({
        where: { liftpayId },
        include: {
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
          loan: {
            select: {
              id: true,
              liftpayId: true,
              loanAmount: true,
              loanStatus: true,
            },
          },
          invoice: {
            select: {
              id: true,
              liftpayId: true,
              amount: true,
              status: true,
            },
          },
        },
      });

      if (!revenue) {
        throw new Error("Revenue record not found");
      }

      return {
        success: true,
        data: {
          ...revenue,
          referenceIds: JSON.parse(revenue.referenceIds),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all revenues with filters
   */
  async getAllRevenues(filters?: {
    merchantId?: string;
    buyerId?: string;
    loanId?: string;
    invoiceId?: string;
    type?: RevenueType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.merchantId) where.merchantId = filters.merchantId;
      if (filters?.buyerId) where.buyerId = filters.buyerId;
      if (filters?.loanId) where.loanId = filters.loanId;
      if (filters?.invoiceId) where.invoiceId = filters.invoiceId;
      if (filters?.type) where.type = filters.type;

      // Date range filtering
      if (filters?.startDate || filters?.endDate) {
        where.transactionDate = {};
        if (filters?.startDate) {
          where.transactionDate.gte = filters.startDate;
        }
        if (filters?.endDate) {
          where.transactionDate.lte = filters.endDate;
        }
      }

      const [revenues, total] = await Promise.all([
        prisma.revenue.findMany({
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
            buyer: {
              select: {
                id: true,
                liftpayId: true,
                firstName: true,
                lastName: true,
                email: true,
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
            invoice: {
              select: {
                id: true,
                liftpayId: true,
                amount: true,
                status: true,
              },
            },
          },
          orderBy: { transactionDate: "desc" },
        }),
        prisma.revenue.count({ where }),
      ]);

      const revenuesWithParsedIds = revenues.map((revenue) => ({
        ...revenue,
        referenceIds: JSON.parse(revenue.referenceIds),
      }));

      return {
        success: true,
        data: {
          revenues: revenuesWithParsedIds,
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
   * Update revenue record
   */
  async updateRevenue(revenueId: string, input: UpdateRevenueInput) {
    try {
      // Verify revenue exists
      const existingRevenue = await prisma.revenue.findUnique({
        where: { id: revenueId },
      });

      if (!existingRevenue) {
        throw new Error("Revenue record not found");
      }

      // If buyerId is provided and not null, verify buyer exists
      if (input.buyerId && input.buyerId !== null) {
        const buyer = await prisma.buyer.findUnique({
          where: { id: input.buyerId },
        });

        if (!buyer) {
          throw new Error("Buyer not found");
        }
      }

      // If loanId is provided and not null, verify loan exists
      if (input.loanId && input.loanId !== null) {
        const loan = await prisma.loan.findUnique({
          where: { id: input.loanId },
        });

        if (!loan) {
          throw new Error("Loan not found");
        }
      }

      // If invoiceId is provided and not null, verify invoice exists
      if (input.invoiceId && input.invoiceId !== null) {
        const invoice = await prisma.invoice.findUnique({
          where: { id: input.invoiceId },
        });

        if (!invoice) {
          throw new Error("Invoice not found");
        }
      }

      const updateData: any = { ...input };
      if (input.referenceIds) {
        updateData.referenceIds = JSON.stringify(input.referenceIds);
      }

      const revenue = await prisma.revenue.update({
        where: { id: revenueId },
        data: updateData,
        include: {
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
          loan: {
            select: {
              id: true,
              liftpayId: true,
              loanAmount: true,
              loanStatus: true,
            },
          },
          invoice: {
            select: {
              id: true,
              liftpayId: true,
              amount: true,
              status: true,
            },
          },
        },
      });

      return {
        success: true,
        data: {
          ...revenue,
          referenceIds: JSON.parse(revenue.referenceIds),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete revenue record
   */
  async deleteRevenue(revenueId: string) {
    try {
      const revenue = await prisma.revenue.delete({
        where: { id: revenueId },
      });

      return {
        success: true,
        data: revenue,
        message: "Revenue record deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== ANALYTICAL ENDPOINTS ====================

  /**
   * Get revenue summary by merchant
   */
  async getRevenueSummaryByMerchant(
    merchantId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    try {
      const where: any = { merchantId };

      if (filters?.startDate || filters?.endDate) {
        where.transactionDate = {};
        if (filters?.startDate) {
          where.transactionDate.gte = filters.startDate;
        }
        if (filters?.endDate) {
          where.transactionDate.lte = filters.endDate;
        }
      }

      const [
        totalRevenues,
        revenueByType,
        totalCredit,
        totalDebit,
        netRevenue,
      ] = await Promise.all([
        prisma.revenue.count({ where }),
        prisma.revenue.groupBy({
          by: ["type"],
          where,
          _sum: {
            credit: true,
            debit: true,
          },
          _count: true,
        }),
        prisma.revenue.aggregate({
          where,
          _sum: {
            credit: true,
          },
        }),
        prisma.revenue.aggregate({
          where,
          _sum: {
            debit: true,
          },
        }),
        prisma.revenue.aggregate({
          where,
          _sum: {
            credit: true,
            debit: true,
          },
        }),
      ]);

      const revenueBreakdown = revenueByType.map((item) => ({
        type: item.type,
        count: item._count,
        totalCredit: Number(item._sum.credit || 0),
        totalDebit: Number(item._sum.debit || 0),
        netAmount: Number(item._sum.credit || 0) - Number(item._sum.debit || 0),
      }));

      return {
        success: true,
        data: {
          merchantId,
          period: {
            startDate: filters?.startDate,
            endDate: filters?.endDate,
          },
          summary: {
            totalRecords: totalRevenues,
            totalCredit: Number(totalCredit._sum.credit || 0),
            totalDebit: Number(totalDebit._sum.debit || 0),
            netRevenue:
              Number(netRevenue._sum.credit || 0) -
              Number(netRevenue._sum.debit || 0),
          },
          breakdown: revenueBreakdown,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get revenue summary by buyer
   */
  async getRevenueSummaryByBuyer(
    buyerId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    try {
      const where: any = { buyerId };

      if (filters?.startDate || filters?.endDate) {
        where.transactionDate = {};
        if (filters?.startDate) {
          where.transactionDate.gte = filters.startDate;
        }
        if (filters?.endDate) {
          where.transactionDate.lte = filters.endDate;
        }
      }

      const [totalRevenues, revenueByType, aggregates] = await Promise.all([
        prisma.revenue.count({ where }),
        prisma.revenue.groupBy({
          by: ["type"],
          where,
          _sum: {
            credit: true,
            debit: true,
          },
          _count: true,
        }),
        prisma.revenue.aggregate({
          where,
          _sum: {
            credit: true,
            debit: true,
          },
        }),
      ]);

      const revenueBreakdown = revenueByType.map((item) => ({
        type: item.type,
        count: item._count,
        totalCredit: Number(item._sum.credit || 0),
        totalDebit: Number(item._sum.debit || 0),
        netAmount: Number(item._sum.credit || 0) - Number(item._sum.debit || 0),
      }));

      return {
        success: true,
        data: {
          buyerId,
          period: {
            startDate: filters?.startDate,
            endDate: filters?.endDate,
          },
          summary: {
            totalRecords: totalRevenues,
            totalCredit: Number(aggregates._sum.credit || 0),
            totalDebit: Number(aggregates._sum.debit || 0),
            netRevenue:
              Number(aggregates._sum.credit || 0) -
              Number(aggregates._sum.debit || 0),
          },
          breakdown: revenueBreakdown,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get revenue by type with analytics
   */
  async getRevenueByType(
    type: RevenueType,
    filters?: {
      merchantId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { type };
      if (filters?.merchantId) where.merchantId = filters.merchantId;

      if (filters?.startDate || filters?.endDate) {
        where.transactionDate = {};
        if (filters?.startDate) {
          where.transactionDate.gte = filters.startDate;
        }
        if (filters?.endDate) {
          where.transactionDate.lte = filters.endDate;
        }
      }

      const [revenues, total, aggregates] = await Promise.all([
        prisma.revenue.findMany({
          where,
          skip,
          take: limit,
          include: {
            merchant: {
              select: {
                id: true,
                liftpayId: true,
                businessName: true,
              },
            },
            buyer: {
              select: {
                id: true,
                liftpayId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { transactionDate: "desc" },
        }),
        prisma.revenue.count({ where }),
        prisma.revenue.aggregate({
          where,
          _sum: {
            credit: true,
            debit: true,
          },
        }),
      ]);

      const revenuesWithParsedIds = revenues.map((revenue) => ({
        ...revenue,
        referenceIds: JSON.parse(revenue.referenceIds),
      }));

      return {
        success: true,
        data: {
          type,
          analytics: {
            totalRecords: total,
            totalCredit: Number(aggregates._sum.credit || 0),
            totalDebit: Number(aggregates._sum.debit || 0),
            netAmount:
              Number(aggregates._sum.credit || 0) -
              Number(aggregates._sum.debit || 0),
          },
          revenues: revenuesWithParsedIds,
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
   * Get revenue trends (grouped by date)
   */
  async getRevenueTrends(filters?: {
    merchantId?: string;
    buyerId?: string;
    type?: RevenueType;
    startDate?: Date;
    endDate?: Date;
    groupBy?: "day" | "week" | "month";
  }) {
    try {
      const where: any = {};
      if (filters?.merchantId) where.merchantId = filters.merchantId;
      if (filters?.buyerId) where.buyerId = filters.buyerId;
      if (filters?.type) where.type = filters.type;

      if (filters?.startDate || filters?.endDate) {
        where.transactionDate = {};
        if (filters?.startDate) {
          where.transactionDate.gte = filters.startDate;
        }
        if (filters?.endDate) {
          where.transactionDate.lte = filters.endDate;
        }
      }

      const revenues = await prisma.revenue.findMany({
        where,
        select: {
          transactionDate: true,
          credit: true,
          debit: true,
          type: true,
        },
        orderBy: { transactionDate: "asc" },
      });

      // Group revenues by date
      const trendsMap = new Map<string, any>();

      revenues.forEach((revenue) => {
        const date = new Date(revenue.transactionDate);
        let key: string;

        switch (filters?.groupBy) {
          case "month":
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
              2,
              "0"
            )}`;
            break;
          case "week":
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split("T")[0];
            break;
          case "day":
          default:
            key = date.toISOString().split("T")[0];
            break;
        }

        if (!trendsMap.has(key)) {
          trendsMap.set(key, {
            period: key,
            totalCredit: 0,
            totalDebit: 0,
            netAmount: 0,
            recordCount: 0,
          });
        }

        const trend = trendsMap.get(key);
        trend.totalCredit += Number(revenue.credit);
        trend.totalDebit += Number(revenue.debit);
        trend.netAmount += Number(revenue.credit) - Number(revenue.debit);
        trend.recordCount += 1;
      });

      const trends = Array.from(trendsMap.values()).sort((a, b) =>
        a.period.localeCompare(b.period)
      );

      return {
        success: true,
        data: {
          groupBy: filters?.groupBy || "day",
          trends,
          summary: {
            totalPeriods: trends.length,
            overallCredit: trends.reduce((sum, t) => sum + t.totalCredit, 0),
            overallDebit: trends.reduce((sum, t) => sum + t.totalDebit, 0),
            overallNet: trends.reduce((sum, t) => sum + t.netAmount, 0),
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get overall revenue statistics
   */
  async getOverallStatistics(filters?: { startDate?: Date; endDate?: Date }) {
    try {
      const where: any = {};

      if (filters?.startDate || filters?.endDate) {
        where.transactionDate = {};
        if (filters?.startDate) {
          where.transactionDate.gte = filters.startDate;
        }
        if (filters?.endDate) {
          where.transactionDate.lte = filters.endDate;
        }
      }

      // Query for repayment revenues
      const repaymentWhere = {
        ...where,
        type: RevenueType.Repayment,
      };

      // Query for settlement revenues
      const settlementWhere = {
        ...where,
        type: RevenueType.Settlement,
      };

      const [
        totalRevenues,
        revenueByType,
        aggregates,
        topMerchants,
        topBuyers,
        repaymentAggregate,
        settlementAggregate,
      ] = await Promise.all([
        prisma.revenue.count({ where }),
        prisma.revenue.groupBy({
          by: ["type"],
          where,
          _sum: {
            credit: true,
            debit: true,
          },
          _count: true,
        }),
        prisma.revenue.aggregate({
          where,
          _sum: {
            credit: true,
            debit: true,
          },
          _avg: {
            credit: true,
            debit: true,
          },
        }),
        prisma.revenue.groupBy({
          by: ["merchantId"],
          where,
          _sum: {
            credit: true,
            debit: true,
          },
          _count: true,
          orderBy: {
            _sum: {
              credit: "desc",
            },
          },
          take: 5,
        }),
        prisma.revenue.groupBy({
          by: ["buyerId"],
          where: {
            ...where,
            buyerId: { not: null },
          },
          _sum: {
            credit: true,
            debit: true,
          },
          _count: true,
          orderBy: {
            _sum: {
              credit: "desc",
            },
          },
          take: 5,
        }),
        prisma.revenue.aggregate({
          where: repaymentWhere,
          _sum: {
            credit: true,
            debit: true,
          },
        }),
        prisma.revenue.aggregate({
          where: settlementWhere,
          _sum: {
            credit: true,
            debit: true,
          },
        }),
      ]);

      const typeBreakdown = revenueByType.map((item) => ({
        type: item.type,
        count: item._count,
        totalCredit: Number(item._sum.credit || 0),
        totalDebit: Number(item._sum.debit || 0),
        netAmount: Number(item._sum.credit || 0) - Number(item._sum.debit || 0),
      }));

      return {
        success: true,
        data: {
          period: {
            startDate: filters?.startDate,
            endDate: filters?.endDate,
          },
          overall: {
            totalRecords: totalRevenues,
            totalCredit: Number(aggregates._sum.credit || 0),
            totalDebit: Number(aggregates._sum.debit || 0),
            netRevenue:
              Number(aggregates._sum.credit || 0) -
              Number(aggregates._sum.debit || 0),
            averageCredit: Number(aggregates._avg.credit || 0),
            averageDebit: Number(aggregates._avg.debit || 0),
            totalRepayment:
              Number(repaymentAggregate._sum.credit || 0) -
              Number(repaymentAggregate._sum.debit || 0),
            totalSettlement:
              Number(settlementAggregate._sum.credit || 0) -
              Number(settlementAggregate._sum.debit || 0),
          },
          byType: typeBreakdown,
          topMerchants: topMerchants.map((m) => ({
            merchantId: m.merchantId,
            recordCount: m._count,
            totalCredit: Number(m._sum.credit || 0),
            totalDebit: Number(m._sum.debit || 0),
            netRevenue: Number(m._sum.credit || 0) - Number(m._sum.debit || 0),
          })),
          topBuyers: topBuyers.map((b) => ({
            buyerId: b.buyerId,
            recordCount: b._count,
            totalCredit: Number(b._sum.credit || 0),
            totalDebit: Number(b._sum.debit || 0),
            netRevenue: Number(b._sum.credit || 0) - Number(b._sum.debit || 0),
          })),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get revenue count grouped by day within a date range
   * Only counts records where credit is not 0
   */
  async getRevenueCountGroupedByDay(startDate: Date, endDate: Date) {
    try {
      // Validate dates
      if (!startDate || !endDate) {
        throw new Error("Start date and end date are required");
      }

      if (startDate > endDate) {
        throw new Error("Start date must be before or equal to end date");
      }

      // Get all revenues in the date range where credit is not 0
      const revenues = await prisma.revenue.findMany({
        where: {
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
          credit: {
            not: 0,
          },
        },
        select: {
          transactionDate: true,
          credit: true,
        },
      });

      // Create a map to store counts and amounts by date
      const dataByDate = new Map<
        string,
        { count: number; totalCredit: number }
      >();

      // Generate all dates in the range
      const currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);
      const endDateNormalized = new Date(endDate);
      endDateNormalized.setHours(23, 59, 59, 999);

      // Initialize all dates with 0 count and 0 amount
      while (currentDate <= endDateNormalized) {
        const dateKey = currentDate.toISOString().split("T")[0];
        dataByDate.set(dateKey, { count: 0, totalCredit: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count revenues and sum credit amounts for each date
      revenues.forEach((revenue) => {
        const dateKey = revenue.transactionDate.toISOString().split("T")[0];
        const currentData = dataByDate.get(dateKey) || {
          count: 0,
          totalCredit: 0,
        };
        dataByDate.set(dateKey, {
          count: currentData.count + 1,
          totalCredit: currentData.totalCredit + Number(revenue.credit),
        });
      });

      // Convert map to array
      const countsByDay = Array.from(dataByDate.entries()).map(
        ([date, data]) => ({
          date,
          count: data.count,
          totalCredit: data.totalCredit,
        })
      );

      // Calculate totals
      const totalCount = revenues.length;
      const totalCredit = revenues.reduce(
        (sum, revenue) => sum + Number(revenue.credit),
        0
      );

      return {
        success: true,
        data: {
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          totalCount,
          totalCredit,
          countsByDay,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const revenueService = new RevenueService();
