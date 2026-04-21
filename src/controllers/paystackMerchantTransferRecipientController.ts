import { Request, Response } from "express";
import { paystackMerchantTransferRecipientService } from "../services/paystackMerchantTransferRecipientService";

export const paystackMerchantTransferRecipientController = {
  /**
   * @openapi
   * /api/v1/paystack-merchant-transfer-recipients:
   *   post:
   *     summary: Create a new Paystack merchant transfer recipient
   *     tags: [Paystack Merchant Transfer Recipients]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - merchantId
   *               - recipientCode
   *               - bankCode
   *               - bankName
   *               - accountNumber
   *               - accountName
   *             properties:
   *               merchantId:
   *                 type: string
   *               recipientId:
   *                 type: string
   *               recipientCode:
   *                 type: string
   *               bankCode:
   *                 type: string
   *               bankName:
   *                 type: string
   *               accountNumber:
   *                 type: string
   *               accountName:
   *                 type: string
   *     responses:
   *       200:
   *         description: Recipient created successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
  create: async (req: Request, res: Response) => {
    try {
      const result = await paystackMerchantTransferRecipientService.createPaystackMerchantTransferRecipient(
        req.body
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: "Paystack merchant transfer recipient created successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error creating paystack merchant transfer recipient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create paystack merchant transfer recipient",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack-merchant-transfer-recipients:
   *   get:
   *     summary: Get all Paystack merchant transfer recipients
   *     tags: [Paystack Merchant Transfer Recipients]
   *     parameters:
   *       - in: query
   *         name: merchantId
   *         schema:
   *           type: string
   *         description: Filter by merchant ID
   *     responses:
   *       200:
   *         description: List of recipients
   *       500:
   *         description: Server error
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const { merchantId } = req.query;

      const result = await paystackMerchantTransferRecipientService.getAllPaystackMerchantTransferRecipients(
        merchantId as string | undefined
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: "Paystack merchant transfer recipients retrieved successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting paystack merchant transfer recipients:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve paystack merchant transfer recipients",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack-merchant-transfer-recipients/merchant/{merchantId}:
   *   get:
   *     summary: Get Paystack merchant transfer recipients by merchant ID
   *     tags: [Paystack Merchant Transfer Recipients]
   *     parameters:
   *       - in: path
   *         name: merchantId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of recipients for the merchant
   *       404:
   *         description: Merchant not found
   *       500:
   *         description: Server error
   */
  getByMerchantId: async (req: Request, res: Response) => {
    try {
      const { merchantId } = req.params;

      const result =
        await paystackMerchantTransferRecipientService.getPaystackMerchantTransferRecipientsByMerchantId(
          merchantId
        );

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        message: "Paystack merchant transfer recipients retrieved successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting paystack merchant transfer recipients:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve paystack merchant transfer recipients",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack-merchant-transfer-recipients/{id}:
   *   get:
   *     summary: Get Paystack merchant transfer recipient by ID
   *     tags: [Paystack Merchant Transfer Recipients]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Recipient details
   *       404:
   *         description: Recipient not found
   *       500:
   *         description: Server error
   */
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await paystackMerchantTransferRecipientService.getPaystackMerchantTransferRecipientById(
        id
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        message: "Paystack merchant transfer recipient retrieved successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting paystack merchant transfer recipient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve paystack merchant transfer recipient",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack-merchant-transfer-recipients/code/{recipientCode}:
   *   get:
   *     summary: Get Paystack merchant transfer recipient by recipient code
   *     tags: [Paystack Merchant Transfer Recipients]
   *     parameters:
   *       - in: path
   *         name: recipientCode
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Recipient details
   *       404:
   *         description: Recipient not found
   *       500:
   *         description: Server error
   */
  getByCode: async (req: Request, res: Response) => {
    try {
      const { recipientCode } = req.params;

      const result =
        await paystackMerchantTransferRecipientService.getPaystackMerchantTransferRecipientByCode(
          recipientCode
        );

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        message: "Paystack merchant transfer recipient retrieved successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting paystack merchant transfer recipient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve paystack merchant transfer recipient",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack-merchant-transfer-recipients/{id}:
   *   put:
   *     summary: Update Paystack merchant transfer recipient
   *     tags: [Paystack Merchant Transfer Recipients]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               recipientId:
   *                 type: string
   *               recipientCode:
   *                 type: string
   *               bankCode:
   *                 type: string
   *               bankName:
   *                 type: string
   *               accountNumber:
   *                 type: string
   *               accountName:
   *                 type: string
   *     responses:
   *       200:
   *         description: Recipient updated successfully
   *       404:
   *         description: Recipient not found
   *       500:
   *         description: Server error
   */
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await paystackMerchantTransferRecipientService.updatePaystackMerchantTransferRecipient(
        id,
        req.body
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        message: "Paystack merchant transfer recipient updated successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error updating paystack merchant transfer recipient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update paystack merchant transfer recipient",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack-merchant-transfer-recipients/{id}:
   *   delete:
   *     summary: Delete Paystack merchant transfer recipient
   *     tags: [Paystack Merchant Transfer Recipients]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Recipient deleted successfully
   *       404:
   *         description: Recipient not found
   *       500:
   *         description: Server error
   */
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await paystackMerchantTransferRecipientService.deletePaystackMerchantTransferRecipient(
        id
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        message: result.message || "Paystack merchant transfer recipient deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting paystack merchant transfer recipient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete paystack merchant transfer recipient",
        error: error.message,
      });
    }
  },
};

