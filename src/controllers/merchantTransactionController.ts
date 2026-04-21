import { Request, Response } from "express";
import { merchantTransactionService } from "../services/merchantTransactionService";
import { TransactionStatus, MerchantTransactionType } from "@prisma/client";

export class MerchantTransactionController {
  /**
   * Create a new merchant transaction
   */
  async createMerchantTransaction(req: Request, res: Response) {
    try {
      const result = await merchantTransactionService.createMerchantTransaction(
        {
          merchantId: req.body.merchantId,
          invoiceRef: req.body.invoiceRef,
          credit: req.body.credit || 0,
          debit: req.body.debit || 0,
          transactionType: req.body.transactionType,
          transactionDate: new Date(req.body.transactionDate),
          description: req.body.description,
          status: req.body.status,
        }
      );

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
   * Get merchant transaction by ID
   */
  async getMerchantTransactionById(req: Request, res: Response) {
    try {
      const result =
        await merchantTransactionService.getMerchantTransactionById(
          req.params.id
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
   * Get merchant transaction by liftpayId
   */
  async getMerchantTransactionByLiftpayId(req: Request, res: Response) {
    try {
      const result =
        await merchantTransactionService.getMerchantTransactionByLiftpayId(
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
   * Get all transactions for a merchant
   */
  async getMerchantTransactionsByMerchantId(req: Request, res: Response) {
    try {
      // Handle transactionType as single value or array
      let transactionType:
        | MerchantTransactionType
        | MerchantTransactionType[]
        | undefined;
      if (req.query.transactionType) {
        const types = req.query.transactionType;
        transactionType = Array.isArray(types)
          ? (types as MerchantTransactionType[])
          : (types as MerchantTransactionType);
      }

      const result =
        await merchantTransactionService.getMerchantTransactionsByMerchantId(
          req.params.merchantId,
          {
            transactionType,
            status: req.query.status as TransactionStatus,
            startDate: req.query.startDate
              ? new Date(req.query.startDate as string)
              : undefined,
            endDate: req.query.endDate
              ? new Date(req.query.endDate as string)
              : undefined,
            page: req.query.page
              ? parseInt(req.query.page as string)
              : undefined,
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
   * Get all merchant transactions with filters
   */
  async getAllMerchantTransactions(req: Request, res: Response) {
    try {
      // Handle transactionType as single value or array
      let transactionType:
        | MerchantTransactionType
        | MerchantTransactionType[]
        | undefined;
      if (req.query.transactionType) {
        const types = req.query.transactionType;
        transactionType = Array.isArray(types)
          ? (types as MerchantTransactionType[])
          : (types as MerchantTransactionType);
      }

      const result =
        await merchantTransactionService.getAllMerchantTransactions({
          merchantId: req.query.merchantId as string,
          transactionType,
          status: req.query.status as TransactionStatus,
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
   * Update merchant transaction
   */
  async updateMerchantTransaction(req: Request, res: Response) {
    try {
      const result = await merchantTransactionService.updateMerchantTransaction(
        req.params.id,
        {
          credit: req.body.credit,
          debit: req.body.debit,
          transactionType: req.body.transactionType,
          transactionDate: req.body.transactionDate
            ? new Date(req.body.transactionDate)
            : undefined,
          description: req.body.description,
          status: req.body.status,
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
   * Complete merchant transaction
   */
  async completeMerchantTransaction(req: Request, res: Response) {
    try {
      const result =
        await merchantTransactionService.completeMerchantTransaction(
          req.params.id
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
   * Delete merchant transaction
   */
  async deleteMerchantTransaction(req: Request, res: Response) {
    try {
      const result = await merchantTransactionService.deleteMerchantTransaction(
        req.params.id
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
   * Get merchant balance
   */
  async getMerchantBalance(req: Request, res: Response) {
    try {
      const result = await merchantTransactionService.getMerchantBalance(
        req.params.merchantId
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
   * Manual settlement for merchant
   */
  async manualSettlement(req: Request, res: Response) {
    try {
      const result = await merchantTransactionService.manualSettlement({
        merchantId: req.body.merchantId,
        amount: req.body.amount,
        accountNumberId: req.body.accountNumberId,
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
   * Get unsettled revenue
   */
  async getUnsettledRevenue(req: Request, res: Response) {
    try {
      const merchantId = req.query.merchantId as string | undefined;
      const result = await merchantTransactionService.getUnsettledRevenue(
        merchantId
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
   * Get unsettled revenue for specific merchant
   */
  async getMerchantUnsettledRevenue(req: Request, res: Response) {
    try {
      const result = await merchantTransactionService.getUnsettledRevenue(
        req.params.merchantId
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
   * Get all merchants with their balances
   */
  async getAllMerchantsWithBalances(req: Request, res: Response) {
    try {
      const result =
        await merchantTransactionService.getAllMerchantsWithBalances();

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
   * Get unsettled credit grouped by merchant
   */
  async getUnsettledCreditByMerchant(req: Request, res: Response) {
    try {
      const result =
        await merchantTransactionService.getUnsettledCreditByMerchant();

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
   * Get unsettled credit for a specific merchant
   */
  async getUnsettledCreditByMerchantId(req: Request, res: Response) {
    try {
      const result =
        await merchantTransactionService.getUnsettledCreditByMerchantId(
          req.params.merchantId
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
   * Settle credit transactions for a specific merchant
   */
  async settleCreditTransactionsByMerchantId(req: Request, res: Response) {
    try {
      const result =
        await merchantTransactionService.settleCreditTransactionsByMerchantId(
          req.params.merchantId
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
   * Automatic settlement for all merchants
   */
  async automaticSettlement(req: Request, res: Response) {
    try {
      const result = await merchantTransactionService.automaticSettlement();

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
}

export const merchantTransactionController =
  new MerchantTransactionController();
