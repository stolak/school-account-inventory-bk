import { Request, Response } from "express";
import { paystackService } from "../services/paystackService";

/**
 * @openapi
 * /api/v1/paystack/banks:
 *   get:
 *     summary: Get list of banks from Paystack
 *     tags: [Paystack]
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency (e.g., NGN)
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country (e.g., Nigeria)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by type (e.g., nuban)
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: number
 *         description: Number of results per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of banks from Paystack
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           code:
 *                             type: string
 *                           longcode:
 *                             type: string
 *                           gateway:
 *                             type: string
 *                             nullable: true
 *                           pay_with_bank:
 *                             type: boolean
 *                           active:
 *                             type: boolean
 *                           is_deleted:
 *                             type: boolean
 *                           country:
 *                             type: string
 *                           currency:
 *                             type: string
 *                           type:
 *                             type: string
 *                           id:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                           updatedAt:
 *                             type: string
 *                     meta:
 *                       type: object
 *                       properties:
 *                         next:
 *                           type: string
 *                           nullable: true
 *                         previous:
 *                           type: string
 *                           nullable: true
 *                         perPage:
 *                           type: number
 *       500:
 *         description: Server error
 */
export const paystackController = {
  getBanks: async (req: Request, res: Response) => {
    try {
      const { currency, country, type, perPage, page } = req.query;

      const queryParams: {
        currency?: string;
        country?: string;
        type?: string;
        perPage?: number;
        page?: number;
      } = {};

      if (currency && typeof currency === "string") {
        queryParams.currency = currency;
      }
      if (country && typeof country === "string") {
        queryParams.country = country;
      }
      if (type && typeof type === "string") {
        queryParams.type = type;
      }
      if (perPage) {
        queryParams.perPage = parseInt(perPage as string, 10);
      }
      if (page) {
        queryParams.page = parseInt(page as string, 10);
      }

      const result = await paystackService.getBanks(
        Object.keys(queryParams).length > 0 ? queryParams : undefined
      );

      res.json({
        success: true,
        message: "Banks retrieved successfully from Paystack",
        data: result,
      });
    } catch (error: any) {
      console.error("Error getting banks from Paystack:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve banks from Paystack",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack/validate-account:
   *   get:
   *     summary: Validate/Resolve bank account number
   *     tags: [Paystack]
   *     parameters:
   *       - in: query
   *         name: account_number
   *         required: true
   *         schema:
   *           type: string
   *         description: Bank account number to validate
   *       - in: query
   *         name: bank_code
   *         required: true
   *         schema:
   *           type: string
   *         description: Bank code
   *     responses:
   *       200:
   *         description: Account number resolved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: boolean
   *                     message:
   *                       type: string
   *                     data:
   *                       type: object
   *                       properties:
   *                         account_number:
   *                           type: string
   *                         account_name:
   *                           type: string
   *       400:
   *         description: Missing required parameters
   *       500:
   *         description: Server error
   */
  validateAccountNumber: async (req: Request, res: Response) => {
    try {
      const { account_number, bank_code } = req.query;

      if (!account_number || typeof account_number !== "string") {
        return res.status(400).json({
          success: false,
          message: "Account number is required",
        });
      }

      if (!bank_code || typeof bank_code !== "string") {
        return res.status(400).json({
          success: false,
          message: "Bank code is required",
        });
      }

      const result = await paystackService.validateAccountNumber(
        account_number,
        bank_code
      );

      res.json({
        success: true,
        message: "Account number validated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error validating account number:", error);
      res.status(500).json({
        success: false,
        message: "Failed to validate account number",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack/transfer-recipient:
   *   post:
   *     summary: Create a transfer recipient
   *     tags: [Paystack]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *               - name
   *               - account_number
   *               - bank_code
   *               - currency
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [nuban, mobile_money, basa]
   *                 description: Recipient type
   *               name:
   *                 type: string
   *                 description: Recipient name
   *               account_number:
   *                 type: string
   *                 description: Account number
   *               bank_code:
   *                 type: string
   *                 description: Bank code
   *               currency:
   *                 type: string
   *                 description: Currency (e.g., NGN)
   *               description:
   *                 type: string
   *                 description: Optional description
   *               email:
   *                 type: string
   *                 description: Optional email
   *     responses:
   *       200:
   *         description: Transfer recipient created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: boolean
   *                     message:
   *                       type: string
   *                     data:
   *                       type: object
   *                       properties:
   *                         active:
   *                           type: boolean
   *                         createdAt:
   *                           type: string
   *                         currency:
   *                           type: string
   *                         domain:
   *                           type: string
   *                         id:
   *                           type: number
   *                         integration:
   *                           type: number
   *                         name:
   *                           type: string
   *                         recipient_code:
   *                           type: string
   *                         type:
   *                           type: string
   *                         updatedAt:
   *                           type: string
   *                         is_deleted:
   *                           type: boolean
   *                         details:
   *                           type: object
   *                           properties:
   *                             authorization_code:
   *                               type: string
   *                               nullable: true
   *                             account_number:
   *                               type: string
   *                             account_name:
   *                               type: string
   *                             bank_code:
   *                               type: string
   *                             bank_name:
   *                               type: string
   *       400:
   *         description: Missing required fields
   *       500:
   *         description: Server error
   */
  createTransferRecipient: async (req: Request, res: Response) => {
    try {
      const { type, name, account_number, bank_code, currency, description, email } = req.body;

      if (!type) {
        return res.status(400).json({
          success: false,
          message: "Type is required",
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      if (!account_number) {
        return res.status(400).json({
          success: false,
          message: "Account number is required",
        });
      }

      if (!bank_code) {
        return res.status(400).json({
          success: false,
          message: "Bank code is required",
        });
      }

      if (!currency) {
        return res.status(400).json({
          success: false,
          message: "Currency is required",
        });
      }

      const result = await paystackService.createTransferRecipient({
        type,
        name,
        account_number,
        bank_code,
        currency,
        ...(description && { description }),
        ...(email && { email }),
      });

      res.json({
        success: true,
        message: "Transfer recipient created successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error creating transfer recipient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create transfer recipient",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack/transfer:
   *   post:
   *     summary: Initiate a transfer
   *     tags: [Paystack]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - source
   *               - amount
   *               - recipient
   *               - reference
   *             properties:
   *               source:
   *                 type: string
   *                 description: Transfer source (e.g., "balance")
   *               amount:
   *                 type: number
   *                 description: Transfer amount in kobo (e.g., 100000 for 1000 NGN)
   *               recipient:
   *                 type: string
   *                 description: Recipient code (e.g., "RCP_xxx")
   *               reference:
   *                 type: string
   *                 description: Unique reference for the transfer
   *               reason:
   *                 type: string
   *                 description: Optional reason for the transfer
   *               currency:
   *                 type: string
   *                 description: Optional currency (e.g., "NGN")
   *     responses:
   *       200:
   *         description: Transfer initiated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: boolean
   *                     message:
   *                       type: string
   *                     data:
   *                       type: object
   *                       properties:
   *                         transfersessionid:
   *                           type: array
   *                         transfertrials:
   *                           type: array
   *                         domain:
   *                           type: string
   *                         amount:
   *                           type: number
   *                         currency:
   *                           type: string
   *                         reference:
   *                           type: string
   *                         source:
   *                           type: string
   *                         source_details:
   *                           type: object
   *                           nullable: true
   *                         reason:
   *                           type: string
   *                         status:
   *                           type: string
   *                         failures:
   *                           type: object
   *                           nullable: true
   *                         transfer_code:
   *                           type: string
   *                         titan_code:
   *                           type: string
   *                           nullable: true
   *                         transferred_at:
   *                           type: string
   *                           nullable: true
   *                         id:
   *                           type: number
   *                         integration:
   *                           type: number
   *                         request:
   *                           type: number
   *                         recipient:
   *                           type: number
   *                         createdAt:
   *                           type: string
   *                         updatedAt:
   *                           type: string
   *       400:
   *         description: Missing required fields
   *       500:
   *         description: Server error
   */
  initiateTransfer: async (req: Request, res: Response) => {
    try {
      const { source, amount, recipient, reference, reason, currency } = req.body;

      if (!source) {
        return res.status(400).json({
          success: false,
          message: "Source is required",
        });
      }

      if (!amount || typeof amount !== "number") {
        return res.status(400).json({
          success: false,
          message: "Amount is required and must be a number",
        });
      }

      if (!recipient) {
        return res.status(400).json({
          success: false,
          message: "Recipient is required",
        });
      }

      if (!reference) {
        return res.status(400).json({
          success: false,
          message: "Reference is required",
        });
      }

      const result = await paystackService.initiateTransfer({
        source,
        amount,
        recipient,
        reference,
        ...(reason && { reason }),
        ...(currency && { currency }),
      });

      res.json({
        success: true,
        message: "Transfer initiated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error initiating transfer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to initiate transfer",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack/transfer/verify/{reference}:
   *   get:
   *     summary: Verify a transfer by reference
   *     tags: [Paystack]
   *     parameters:
   *       - in: path
   *         name: reference
   *         required: true
   *         schema:
   *           type: string
   *         description: Transfer reference to verify
   *     responses:
   *       200:
   *         description: Transfer verified successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: boolean
   *                     message:
   *                       type: string
   *                     data:
   *                       type: object
   *                       properties:
   *                         amount:
   *                           type: number
   *                         createdAt:
   *                           type: string
   *                         currency:
   *                           type: string
   *                         domain:
   *                           type: string
   *                         failures:
   *                           type: object
   *                           nullable: true
   *                         id:
   *                           type: number
   *                         integration:
   *                           type: number
   *                         reason:
   *                           type: string
   *                         reference:
   *                           type: string
   *                         source:
   *                           type: string
   *                         source_details:
   *                           type: object
   *                           nullable: true
   *                         status:
   *                           type: string
   *                         titan_code:
   *                           type: string
   *                           nullable: true
   *                         transfer_code:
   *                           type: string
   *                         request:
   *                           type: number
   *                         transferred_at:
   *                           type: string
   *                           nullable: true
   *                         updatedAt:
   *                           type: string
   *                         recipient:
   *                           type: object
   *                           properties:
   *                             active:
   *                               type: boolean
   *                             createdAt:
   *                               type: string
   *                             currency:
   *                               type: string
   *                             description:
   *                               type: string
   *                             email:
   *                               type: string
   *                               nullable: true
   *                             id:
   *                               type: number
   *                             integration:
   *                               type: number
   *                             metadata:
   *                               type: object
   *                               nullable: true
   *                             name:
   *                               type: string
   *                             recipient_code:
   *                               type: string
   *                             type:
   *                               type: string
   *                             updatedAt:
   *                               type: string
   *                             is_deleted:
   *                               type: boolean
   *                             isDeleted:
   *                               type: boolean
   *                             details:
   *                               type: object
   *                               properties:
   *                                 authorization_code:
   *                                   type: string
   *                                   nullable: true
   *                                 account_number:
   *                                   type: string
   *                                 account_name:
   *                                   type: string
   *                                   nullable: true
   *                                 bank_code:
   *                                   type: string
   *                                 bank_name:
   *                                   type: string
   *                         session:
   *                           type: object
   *                           properties:
   *                             provider:
   *                               type: string
   *                               nullable: true
   *                             id:
   *                               type: string
   *                               nullable: true
   *                         fee_charged:
   *                           type: number
   *                         fees_breakdown:
   *                           type: object
   *                           nullable: true
   *                         gateway_response:
   *                           type: object
   *                           nullable: true
   *       400:
   *         description: Missing reference parameter
   *       500:
   *         description: Server error
   */
  verifyTransfer: async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;

      if (!reference) {
        return res.status(400).json({
          success: false,
          message: "Transfer reference is required",
        });
      }

      const result = await paystackService.verifyTransfer(reference);

      res.json({
        success: true,
        message: "Transfer verified successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error verifying transfer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify transfer",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack/transfer/bulk:
   *   post:
   *     summary: Initiate bulk transfers
   *     tags: [Paystack]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currency
   *               - source
   *               - transfers
   *             properties:
   *               currency:
   *                 type: string
   *                 description: Currency (e.g., "NGN")
   *               source:
   *                 type: string
   *                 description: Transfer source (e.g., "balance")
   *               transfers:
   *                 type: array
   *                 description: Array of transfer items
   *                 items:
   *                   type: object
   *                   required:
   *                     - amount
   *                     - reference
   *                     - reason
   *                     - recipient
   *                   properties:
   *                     amount:
   *                       type: number
   *                       description: Transfer amount in kobo (e.g., 100000 for 1000 NGN)
   *                     reference:
   *                       type: string
   *                       description: Unique reference for the transfer
   *                     reason:
   *                       type: string
   *                       description: Reason for the transfer
   *                     recipient:
   *                       type: string
   *                       description: Recipient code (e.g., "RCP_xxx")
   *     responses:
   *       200:
   *         description: Bulk transfers initiated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: boolean
   *                     message:
   *                       type: string
   *                     data:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           reference:
   *                             type: string
   *                           recipient:
   *                             type: string
   *                           amount:
   *                             type: number
   *                           transfer_code:
   *                             type: string
   *                           currency:
   *                             type: string
   *                           status:
   *                             type: string
   *       400:
   *         description: Missing required fields or invalid input
   *       500:
   *         description: Server error
   */
  initiateBulkTransfer: async (req: Request, res: Response) => {
    try {
      const { currency, source, transfers } = req.body;

      if (!currency) {
        return res.status(400).json({
          success: false,
          message: "Currency is required",
        });
      }

      if (!source) {
        return res.status(400).json({
          success: false,
          message: "Source is required",
        });
      }

      if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Transfers array is required and must contain at least one transfer",
        });
      }

      // Validate each transfer item
      for (const transfer of transfers) {
        if (!transfer.amount || typeof transfer.amount !== "number") {
          return res.status(400).json({
            success: false,
            message: "Each transfer must have a valid amount (number)",
          });
        }

        if (!transfer.reference || typeof transfer.reference !== "string") {
          return res.status(400).json({
            success: false,
            message: "Each transfer must have a reference (string)",
          });
        }

        if (!transfer.reason || typeof transfer.reason !== "string") {
          return res.status(400).json({
            success: false,
            message: "Each transfer must have a reason (string)",
          });
        }

        if (!transfer.recipient || typeof transfer.recipient !== "string") {
          return res.status(400).json({
            success: false,
            message: "Each transfer must have a recipient (string)",
          });
        }
      }

      const result = await paystackService.initiateBulkTransfer({
        currency,
        source,
        transfers,
      });

      res.json({
        success: true,
        message: "Bulk transfers initiated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error initiating bulk transfer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to initiate bulk transfer",
        error: error.message,
      });
    }
  },
};


