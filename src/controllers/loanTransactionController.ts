import { Request, Response } from "express";
import { loanService } from "../services/loanService";
import { TransactionType, TransactionStatus } from "@prisma/client";

export const loanTransactionController = {
  /**
   * Create a new loan transaction
   */
  async createLoanTransaction(req: Request, res: Response) {
    try {
      const {
        loanId,
        transactionType,
        transactionStatus,
        creditAmount,
        debitAmount,
        transactionDate,
        description,
      } = req.body;

      // Validate required fields
      if (
        !loanId ||
        !transactionType ||
        creditAmount === undefined ||
        debitAmount === undefined ||
        !transactionDate ||
        !description
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Validate transaction type
      if (!Object.values(TransactionType).includes(transactionType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction type",
        });
      }

      const result = await loanService.createLoanTransaction({
        loanId,
        transactionType,
        transactionStatus,
        creditAmount: Number(creditAmount),
        debitAmount: Number(debitAmount),
        transactionDate: new Date(transactionDate),
        description,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get loan transaction by ID
   */
  async getLoanTransactionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await loanService.getLoanTransactionById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get loan transaction by liftpayId
   */
  async getLoanTransactionByLiftpayId(req: Request, res: Response) {
    try {
      const { liftpayId } = req.params;

      const result = await loanService.getLoanTransactionByLiftpayId(liftpayId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get all transactions for a specific loan
   */
  async getLoanTransactionsByLoanId(req: Request, res: Response) {
    try {
      const { loanId } = req.params;
      const { transactionType, transactionStatus } = req.query;

      const filters: any = {};
      if (transactionType)
        filters.transactionType = transactionType as TransactionType;
      if (transactionStatus)
        filters.transactionStatus = transactionStatus as TransactionStatus;

      const result = await loanService.getLoanTransactionsByLoanId(
        loanId,
        filters
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get all loan transactions with filters
   */
  async getAllLoanTransactions(req: Request, res: Response) {
    try {
      const { transactionType, transactionStatus, page, limit } = req.query;

      const filters: any = {};
      if (transactionType)
        filters.transactionType = transactionType as TransactionType;
      if (transactionStatus)
        filters.transactionStatus = transactionStatus as TransactionStatus;
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await loanService.getAllLoanTransactions(filters);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Update loan transaction
   */
  async updateLoanTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate transaction type if provided
      if (
        updateData.transactionType &&
        !Object.values(TransactionType).includes(updateData.transactionType)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction type",
        });
      }

      // Validate transaction status if provided
      if (
        updateData.transactionStatus &&
        !Object.values(TransactionStatus).includes(updateData.transactionStatus)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction status",
        });
      }

      // Convert numeric fields
      if (updateData.creditAmount)
        updateData.creditAmount = Number(updateData.creditAmount);
      if (updateData.debitAmount)
        updateData.debitAmount = Number(updateData.debitAmount);
      if (updateData.transactionDate)
        updateData.transactionDate = new Date(updateData.transactionDate);

      const result = await loanService.updateLoanTransaction(id, updateData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Complete a loan transaction
   */
  async completeLoanTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await loanService.completeLoanTransaction(id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Delete loan transaction
   */
  async deleteLoanTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await loanService.deleteLoanTransaction(id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get loan balance grouped by transaction type
   */
  async getLoanBalanceByTransactionType(req: Request, res: Response) {
    try {
      const { loanId } = req.params;

      const result = await loanService.getLoanBalanceByTransactionType(loanId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
