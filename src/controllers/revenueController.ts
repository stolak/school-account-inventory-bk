import { Request, Response } from "express";
import { revenueService } from "../services/revenueService";
import { RevenueType } from "@prisma/client";

export class RevenueController {
  /**
   * Create a new revenue record
   */
  async createRevenue(req: Request, res: Response) {
    try {
      const {
        credit,
        debit,
        description,
        parentTable,
        type,
        referenceIds,
        detail,
        buyerId,
        merchantId,
        loanId,
        invoiceId,
        transactionDate,
      } = req.body;

      if (!description || !type || !transactionDate) {
        return res.status(400).json({
          success: false,
          message: "Description, type, and transactionDate are required",
        });
      }

      if (!Array.isArray(referenceIds)) {
        return res.status(400).json({
          success: false,
          message: "referenceIds must be an array",
        });
      }

      const result = await revenueService.createRevenue({
        credit,
        debit,
        description,
        parentTable,
        type,
        referenceIds,
        detail,
        buyerId,
        merchantId,
        loanId,
        invoiceId,
        transactionDate: new Date(transactionDate),
      });

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get revenue by ID
   */
  async getRevenueById(req: Request, res: Response) {
    try {
      const result = await revenueService.getRevenueById(req.params.id);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get revenue by liftpayId
   */
  async getRevenueByLiftpayId(req: Request, res: Response) {
    try {
      const result = await revenueService.getRevenueByLiftpayId(
        req.params.liftpayId
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get all revenues with filters
   */
  async getAllRevenues(req: Request, res: Response) {
    try {
      const result = await revenueService.getAllRevenues({
        merchantId: req.query.merchantId as string,
        buyerId: req.query.buyerId as string,
        loanId: req.query.loanId as string,
        invoiceId: req.query.invoiceId as string,
        type: req.query.type as RevenueType,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update revenue record
   */
  async updateRevenue(req: Request, res: Response) {
    try {
      const {
        credit,
        debit,
        description,
        parentTable,
        type,
        referenceIds,
        detail,
        buyerId,
        merchantId,
        loanId,
        invoiceId,
        transactionDate,
      } = req.body;

      const updateData: any = {};
      if (credit !== undefined) updateData.credit = credit;
      if (debit !== undefined) updateData.debit = debit;
      if (description) updateData.description = description;
      if (parentTable !== undefined) updateData.parentTable = parentTable;
      if (type) updateData.type = type;
      if (referenceIds) {
        if (!Array.isArray(referenceIds)) {
          return res.status(400).json({
            success: false,
            message: "referenceIds must be an array",
          });
        }
        updateData.referenceIds = referenceIds;
      }
      if (detail !== undefined) updateData.detail = detail;
      if (buyerId !== undefined) updateData.buyerId = buyerId;
      if (merchantId !== undefined) updateData.merchantId = merchantId;
      if (loanId !== undefined) updateData.loanId = loanId;
      if (invoiceId !== undefined) updateData.invoiceId = invoiceId;
      if (transactionDate) updateData.transactionDate = new Date(transactionDate);

      const result = await revenueService.updateRevenue(
        req.params.id,
        updateData
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Delete revenue record
   */
  async deleteRevenue(req: Request, res: Response) {
    try {
      const result = await revenueService.deleteRevenue(req.params.id);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get revenue summary by merchant
   */
  async getRevenueSummaryByMerchant(req: Request, res: Response) {
    try {
      const result = await revenueService.getRevenueSummaryByMerchant(
        req.params.merchantId,
        {
          startDate: req.query.startDate
            ? new Date(req.query.startDate as string)
            : undefined,
          endDate: req.query.endDate
            ? new Date(req.query.endDate as string)
            : undefined,
        }
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get revenue summary by buyer
   */
  async getRevenueSummaryByBuyer(req: Request, res: Response) {
    try {
      const result = await revenueService.getRevenueSummaryByBuyer(
        req.params.buyerId,
        {
          startDate: req.query.startDate
            ? new Date(req.query.startDate as string)
            : undefined,
          endDate: req.query.endDate
            ? new Date(req.query.endDate as string)
            : undefined,
        }
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get revenue by type with analytics
   */
  async getRevenueByType(req: Request, res: Response) {
    try {
      const result = await revenueService.getRevenueByType(
        req.params.type as RevenueType,
        {
          merchantId: req.query.merchantId as string,
          startDate: req.query.startDate
            ? new Date(req.query.startDate as string)
            : undefined,
          endDate: req.query.endDate
            ? new Date(req.query.endDate as string)
            : undefined,
          page: req.query.page ? parseInt(req.query.page as string) : undefined,
          limit: req.query.limit
            ? parseInt(req.query.limit as string)
            : undefined,
        }
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(req: Request, res: Response) {
    try {
      const result = await revenueService.getRevenueTrends({
        merchantId: req.query.merchantId as string,
        buyerId: req.query.buyerId as string,
        type: req.query.type as RevenueType,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        groupBy: (req.query.groupBy as "day" | "week" | "month") || "day",
      });

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get overall revenue statistics
   */
  async getOverallStatistics(req: Request, res: Response) {
    try {
      const result = await revenueService.getOverallStatistics({
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
      });

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get revenue count grouped by day (only credit transactions)
   */
  async getRevenueCountGroupedByDay(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      const result = await revenueService.getRevenueCountGroupedByDay(
        start,
        end
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting revenue count by day:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

export const revenueController = new RevenueController();

