import { Request, Response } from "express";
import {
  loanService,
  CreateLoanInput,
  UpdateLoanInput,
} from "../services/loanService";
import { LoanStatus, LoanType } from "@prisma/client";

export class LoanController {
  /**
   * Create a new loan
   */
  async createLoan(req: Request, res: Response) {
    try {
      const data: CreateLoanInput = req.body;

      // Validate required fields
      if (!data.buyerId) {
        return res.status(400).json({
          success: false,
          message: "buyerId is required",
        });
      }

      if (data.loanAmount === undefined) {
        return res.status(400).json({
          success: false,
          message: "loanAmount is required",
        });
      }

      if (data.loanTenure === undefined) {
        return res.status(400).json({
          success: false,
          message: "loanTenure is required",
        });
      }

      if (data.loanInterestRate === undefined) {
        return res.status(400).json({
          success: false,
          message: "loanInterestRate is required",
        });
      }

      if (!data.loanStartDate) {
        return res.status(400).json({
          success: false,
          message: "loanStartDate is required",
        });
      }

      if (!data.loanStatus) {
        return res.status(400).json({
          success: false,
          message: "loanStatus is required",
        });
      }

      if (!data.loanType) {
        return res.status(400).json({
          success: false,
          message: "loanType is required",
        });
      }

      if (!data.loanPurpose) {
        return res.status(400).json({
          success: false,
          message: "loanPurpose is required",
        });
      }

      const result = await loanService.createLoan(data);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(201).json({
        success: true,
        message: "Loan created successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error creating loan:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get loan by ID
   */
  async getLoanById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Loan ID is required",
        });
      }

      const result = await loanService.getLoanById(id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting loan:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get loan by liftpayId
   */
  async getLoanByLiftpayId(req: Request, res: Response) {
    try {
      const { liftpayId } = req.params;

      if (!liftpayId) {
        return res.status(400).json({
          success: false,
          message: "Liftpay ID is required",
        });
      }

      const result = await loanService.getLoanByLiftpayId(liftpayId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting loan by liftpayId:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get loan by invoice ID
   */
  async getLoanByInvoiceId(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;

      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: "Invoice ID is required",
        });
      }

      const result = await loanService.getLoanByInvoiceId(invoiceId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting loan by invoice ID:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get all loans with filters
   */
  async getAllLoans(req: Request, res: Response) {
    try {
      const { buyerId, loanStatus, loanType, page, limit } = req.query;

      const filters: any = {};

      if (buyerId) filters.buyerId = buyerId as string;
      if (loanStatus) filters.loanStatus = loanStatus as LoanStatus;
      if (loanType) filters.loanType = loanType as LoanType;
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await loanService.getAllLoans(filters);

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
      console.error("Error getting loans:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Update loan
   */
  async updateLoan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateLoanInput = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Loan ID is required",
        });
      }

      // Check if at least one field is provided
      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one field must be provided for update",
        });
      }

      const result = await loanService.updateLoan(id, data);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        message: "Loan updated successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error updating loan:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Delete loan
   */
  async deleteLoan(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Loan ID is required",
        });
      }

      const result = await loanService.deleteLoan(id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error deleting loan:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get loan summary
   */
  async getLoanSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Loan ID is required",
        });
      }

      const result = await loanService.getLoanSummary(id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting loan summary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get buyer's loan history
   */
  async getBuyerLoanHistory(req: Request, res: Response) {
    try {
      const { buyerId } = req.params;

      if (!buyerId) {
        return res.status(400).json({
          success: false,
          message: "Buyer ID is required",
        });
      }

      const result = await loanService.getBuyerLoanHistory(buyerId);

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
      console.error("Error getting buyer loan history:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get loan balance grouped by transaction type
   */
  async getLoanBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Loan ID is required",
        });
      }

      const result = await loanService.getLoanBalanceByTransactionType(id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting loan balance:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Enforce penalties for pending penalty schedules
   */
  async penaltyEnforcement(req: Request, res: Response) {
    try {
      const { date } = req.body;
      const enforcementDate = date ? new Date(date) : new Date();

      // Validate date
      if (isNaN(enforcementDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      const result = await loanService.penaltyEnforcement(enforcementDate);

      if (!result || !result.success || !result.data) {
        return res.status(400).json({
          success: false,
          message: result?.error || "Penalty enforcement failed",
        });
      }

      res.status(200).json({
        success: true,
        message: `Penalty enforcement completed. ${result.data.count} penalty schedule(s) executed.`,
        data: {
          count: result.data.count,
          date: enforcementDate.toISOString(),
          penaltySchedules: result.data.penaltySchedules,
        },
      });
    } catch (error: any) {
      console.error("Error enforcing penalties:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Enforce interest for pending interest schedules
   */
  async interestEnforcement(req: Request, res: Response) {
    try {
      const { date } = req.body;
      const enforcementDate = date ? new Date(date) : new Date();

      // Validate date
      if (isNaN(enforcementDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      const result = await loanService.interestEnforcement(enforcementDate);

      if (!result || !result.success || !result.data) {
        return res.status(400).json({
          success: false,
          message: result?.error || "Interest enforcement failed",
        });
      }

      res.status(200).json({
        success: true,
        message: `Interest enforcement completed. ${
          result.data.count || 0
        } interest schedule(s) executed.`,
        data: {
          count: result.data.count || 0,
          date: enforcementDate.toISOString(),
          interestSchedules: result.data.interestSchedules || [],
        },
      });
    } catch (error: any) {
      console.error("Error enforcing interest:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Process loan repayment
   */
  async loanRepayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { amount, date } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Loan ID is required",
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid repayment amount is required",
        });
      }

      const repaymentDate = date ? new Date(date) : new Date();

      // Validate date
      if (isNaN(repaymentDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      const result = await loanService.loanRepayment(id, amount, repaymentDate);

      if (!result || !result.success) {
        return res.status(400).json({
          success: false,
          message: result?.error || "Loan repayment failed",
        });
      }

      res.status(200).json({
        success: true,
        message: "Loan repayment processed successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error processing loan repayment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Process loan repayment with automatic Mono mandate debit
   */
  async processLoanRepayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { date } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Loan ID is required",
        });
      }

      const repaymentDate = date ? new Date(date) : new Date();

      // Validate date
      if (isNaN(repaymentDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      const result = await loanService.processLoanRepayment(id, repaymentDate);

      if (!result || !result.success) {
        return res.status(400).json({
          success: false,
          message: result?.error || "Loan repayment processing failed",
        });
      }

      res.status(200).json({
        success: true,
        message:
          "Loan repayment processed successfully with Mono mandate debit",
        data: {
          loanId: id,
          amountDebited: result.data,
          date: repaymentDate.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error processing loan repayment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Initiate loan repayment with Mono direct pay
   */
  async initiateLoanRepayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Loan ID is required",
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Valid repayment amount is required and must be greater than 0",
        });
      }

      const result = await loanService.initiateLoanRepayment(id, amount);

      if (!result || !result.success) {
        return res.status(400).json({
          success: false,
          message: result?.error || "Failed to initiate loan repayment",
        });
      }

      res.status(200).json({
        success: true,
        message: "Loan repayment initiated successfully",
        data: {
          loanId: id,
          amount: amount,
          monoUrl: result.monoUrl,
        },
      });
    } catch (error: any) {
      console.error("Error initiating loan repayment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Validate and complete loan repayment
   */
  async validateLoanRepayment(req: Request, res: Response) {
    try {
      const { referenceId } = req.params;

      if (!referenceId) {
        return res.status(400).json({
          success: false,
          message: "Reference ID is required",
        });
      }

      const result = await loanService.validateLoanRepayment(referenceId);

      if (!result || !result.success) {
        return res.status(400).json({
          success: false,
          message: result?.error || "Failed to validate loan repayment",
        });
      }

      res.status(200).json({
        success: true,
        message: "Loan repayment validated and processed successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error validating loan repayment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get loan counts grouped by status
   */
  async getLoanCountsByStatus(req: Request, res: Response) {
    try {
      const result = await loanService.getLoanCountsByStatus();

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
      console.error("Error getting loan counts by status:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get loans created within a date range
   */
  async getLoansCreatedByDateRange(req: Request, res: Response) {
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

      const result = await loanService.getLoansCreatedByDateRange(start, end);

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
      console.error("Error getting loans by date range:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get loans count grouped by day
   */
  async getLoansCountGroupedByDay(req: Request, res: Response) {
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

      const result = await loanService.getLoansCountGroupedByDay(start, end);

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
      console.error("Error getting loans count by day:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

export const loanController = new LoanController();
