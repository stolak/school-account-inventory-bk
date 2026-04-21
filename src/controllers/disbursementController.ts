import { Request, Response } from "express";
import {
  disbursementService,
  CreateSourceAccountInput,
  CreateDisbursementInput,
} from "../services/disbursementService";

export class DisbursementController {
  /**
   * Create a source account for disbursements
   */
  async createSourceAccount(req: Request, res: Response) {
    try {
      const { app, account_number, bank_code, email } = req.body;

      if (!app) {
        return res.status(400).json({
          success: false,
          message: "app is required",
        });
      }

      if (!account_number) {
        return res.status(400).json({
          success: false,
          message: "account_number is required",
        });
      }

      if (!bank_code) {
        return res.status(400).json({
          success: false,
          message: "bank_code is required",
        });
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "email is required",
        });
      }

      const input: CreateSourceAccountInput = {
        app,
        account_number,
        bank_code,
        email,
      };

      const result = await disbursementService.createSourceAccountWithMono(
        input
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Create a disbursement
   */
  async createDisbursement(req: Request, res: Response) {
    try {
      const {
        reference,
        source,
        account,
        type,
        total_amount,
        description,
        distribution,
      } = req.body;

      if (!reference) {
        return res.status(400).json({
          success: false,
          message: "reference is required",
        });
      }

      if (!source) {
        return res.status(400).json({
          success: false,
          message: "source is required",
        });
      }

      if (!account) {
        return res.status(400).json({
          success: false,
          message: "account is required",
        });
      }

      if (!type) {
        return res.status(400).json({
          success: false,
          message: "type is required",
        });
      }

      if (!total_amount || total_amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "total_amount is required and must be greater than 0",
        });
      }

      if (!description) {
        return res.status(400).json({
          success: false,
          message: "description is required",
        });
      }

      if (!distribution || !Array.isArray(distribution) || distribution.length === 0) {
        return res.status(400).json({
          success: false,
          message: "distribution is required and must be a non-empty array",
        });
      }

      // Validate each distribution item
      for (const dist of distribution) {
        if (!dist.reference) {
          return res.status(400).json({
            success: false,
            message: "Each distribution item must have a reference",
          });
        }

        if (!dist.recipient_email) {
          return res.status(400).json({
            success: false,
            message: "Each distribution item must have a recipient_email",
          });
        }

        if (!dist.account || !dist.account.account_number || !dist.account.bank_code) {
          return res.status(400).json({
            success: false,
            message:
              "Each distribution item must have an account with account_number and bank_code",
          });
        }

        if (!dist.amount || dist.amount <= 0) {
          return res.status(400).json({
            success: false,
            message:
              "Each distribution item must have an amount greater than 0",
          });
        }

        if (!dist.narration) {
          return res.status(400).json({
            success: false,
            message: "Each distribution item must have a narration",
          });
        }
      }

      const input: CreateDisbursementInput = {
        reference,
        source,
        account,
        type,
        total_amount,
        description,
        distribution,
      };

      const result = await disbursementService.createDisbursementWithMono(
        input
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

export const disbursementController = new DisbursementController();

