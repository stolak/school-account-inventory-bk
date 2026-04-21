import { Request, Response } from "express";
import {
  loanService,
  CreateLoanDebitTrialInput,
  UpdateLoanDebitTrialInput,
} from "../services/loanService";
import { LoanPenaltyStatus } from "@prisma/client";

export class LoanDebitTrialController {
  /**
   * Create a new loan debit trial
   */
  async createLoanDebitTrial(req: Request, res: Response) {
    try {
      const data: CreateLoanDebitTrialInput = req.body;

      // Validate required fields
      if (data.dayAfter === undefined) {
        return res.status(400).json({
          success: false,
          message: "dayAfter is required",
        });
      }

      const result = await loanService.createLoanDebitTrial(data);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(201).json({
        success: true,
        message: "Loan debit trial created successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error creating loan debit trial:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get loan debit trial by ID
   */
  async getLoanDebitTrialById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Debit trial ID is required",
        });
      }

      const result = await loanService.getLoanDebitTrialById(id);

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
      console.error("Error getting loan debit trial:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get all loan debit trials
   */
  async getAllLoanDebitTrials(req: Request, res: Response) {
    try {
      const { status } = req.query;

      let debitTrialStatus: LoanPenaltyStatus | undefined;
      if (status) {
        debitTrialStatus = status as LoanPenaltyStatus;
      }

      const result = await loanService.getAllLoanDebitTrials(debitTrialStatus);

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
      console.error("Error getting loan debit trials:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Update loan debit trial
   */
  async updateLoanDebitTrial(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateLoanDebitTrialInput = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Debit trial ID is required",
        });
      }

      // Check if at least one field is provided
      if (data.dayAfter === undefined && data.status === undefined) {
        return res.status(400).json({
          success: false,
          message: "At least one field must be provided for update",
        });
      }

      const result = await loanService.updateLoanDebitTrial(id, data);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        message: "Loan debit trial updated successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error updating loan debit trial:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Delete loan debit trial
   */
  async deleteLoanDebitTrial(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Debit trial ID is required",
        });
      }

      const result = await loanService.deleteLoanDebitTrial(id);

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
      console.error("Error deleting loan debit trial:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

export const loanDebitTrialController = new LoanDebitTrialController();
