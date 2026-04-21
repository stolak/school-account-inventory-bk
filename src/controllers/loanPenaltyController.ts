import { Request, Response } from "express";
import {
  loanService,
  CreateLoanPenaltyInput,
  UpdateLoanPenaltyInput,
} from "../services/loanService";
import { LoanPenaltyStatus } from "@prisma/client";

export class LoanPenaltyController {
  /**
   * Create a new loan penalty
   */
  async createLoanPenalty(req: Request, res: Response) {
    try {
      const data: CreateLoanPenaltyInput = req.body;

      // Validate required fields
      if (data.dayAfter === undefined) {
        return res.status(400).json({
          success: false,
          message: "dayAfter is required",
        });
      }

      if (data.percentage === undefined) {
        return res.status(400).json({
          success: false,
          message: "percentage is required",
        });
      }

      const result = await loanService.createLoanPenalty(data);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(201).json({
        success: true,
        message: "Loan penalty created successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error creating loan penalty:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get loan penalty by ID
   */
  async getLoanPenaltyById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Penalty ID is required",
        });
      }

      const result = await loanService.getLoanPenaltyById(id);

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
      console.error("Error getting loan penalty:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Get all loan penalties
   */
  async getAllLoanPenalties(req: Request, res: Response) {
    try {
      const { status } = req.query;

      let penaltyStatus: LoanPenaltyStatus | undefined;
      if (status) {
        penaltyStatus = status as LoanPenaltyStatus;
      }

      const result = await loanService.getAllLoanPenalties(penaltyStatus);

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
      console.error("Error getting loan penalties:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Update loan penalty
   */
  async updateLoanPenalty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateLoanPenaltyInput = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Penalty ID is required",
        });
      }

      // Check if at least one field is provided
      if (
        data.dayAfter === undefined &&
        data.percentage === undefined &&
        data.status === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "At least one field must be provided for update",
        });
      }

      const result = await loanService.updateLoanPenalty(id, data);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        message: "Loan penalty updated successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error updating loan penalty:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Delete loan penalty
   */
  async deleteLoanPenalty(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Penalty ID is required",
        });
      }

      const result = await loanService.deleteLoanPenalty(id);

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
      console.error("Error deleting loan penalty:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

export const loanPenaltyController = new LoanPenaltyController();
