import { Request, Response } from "express";
import { paystackTransferService } from "../services/paystackTransferService";
import { PaystackTransferStatus } from "@prisma/client";

export const paystackTransferController = {
  /**
   * @openapi
   * /api/v1/paystack-transfers:
   *   post:
   *     summary: Create a new Paystack transfer
   *     tags: [Paystack Transfers]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - referenceId
   *               - amount
   *               - recipientCode
   *             properties:
   *               referenceId:
   *                 type: string
   *               merchantId:
   *                 type: string
   *               buyerId:
   *                 type: string
   *               amount:
   *                 type: number
   *               recipientCode:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [Pending, Processing, Success, Failed, Cancelled]
   *     responses:
   *       201:
   *         description: Transfer created successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error
   */
  create: async (req: Request, res: Response) => {
    try {
      const result = await paystackTransferService.createPaystackTransfer(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: "Paystack transfer created successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error creating paystack transfer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create paystack transfer",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack-transfers:
   *   get:
   *     summary: Get all Paystack transfers
   *     tags: [Paystack Transfers]
   *     parameters:
   *       - in: query
   *         name: merchantId
   *         schema:
   *           type: string
   *       - in: query
   *         name: buyerId
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [Pending, Processing, Success, Failed, Cancelled]
   *     responses:
   *       200:
   *         description: List of transfers
   *       500:
   *         description: Server error
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const { merchantId, buyerId, status } = req.query;

      const filters: any = {};
      if (merchantId) filters.merchantId = merchantId as string;
      if (buyerId) filters.buyerId = buyerId as string;
      if (status) filters.status = status as PaystackTransferStatus;

      const result = await paystackTransferService.getAllPaystackTransfers(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: "Paystack transfers retrieved successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting paystack transfers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve paystack transfers",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack-transfers/{id}:
   *   get:
   *     summary: Get Paystack transfer by ID
   *     tags: [Paystack Transfers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Transfer details
   *       404:
   *         description: Transfer not found
   *       500:
   *         description: Server error
   */
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await paystackTransferService.getPaystackTransferById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        message: "Paystack transfer retrieved successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting paystack transfer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve paystack transfer",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack-transfers/reference/{referenceId}:
   *   get:
   *     summary: Get Paystack transfer by reference ID
   *     tags: [Paystack Transfers]
   *     parameters:
   *       - in: path
   *         name: referenceId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Transfer details
   *       404:
   *         description: Transfer not found
   *       500:
   *         description: Server error
   */
  getByReference: async (req: Request, res: Response) => {
    try {
      const { referenceId } = req.params;

      const result = await paystackTransferService.getPaystackTransferByReference(referenceId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        message: "Paystack transfer retrieved successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting paystack transfer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve paystack transfer",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack-transfers/{id}:
   *   put:
   *     summary: Update Paystack transfer
   *     tags: [Paystack Transfers]
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
   *               status:
   *                 type: string
   *                 enum: [Pending, Processing, Success, Failed, Cancelled]
   *               amount:
   *                 type: number
   *               recipientCode:
   *                 type: string
   *     responses:
   *       200:
   *         description: Transfer updated successfully
   *       404:
   *         description: Transfer not found
   *       500:
   *         description: Server error
   */
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await paystackTransferService.updatePaystackTransfer(id, req.body);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        message: "Paystack transfer updated successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error updating paystack transfer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update paystack transfer",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/paystack-transfers/{id}:
   *   delete:
   *     summary: Delete Paystack transfer
   *     tags: [Paystack Transfers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Transfer deleted successfully
   *       404:
   *         description: Transfer not found
   *       500:
   *         description: Server error
   */
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await paystackTransferService.deletePaystackTransfer(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        message: result.message || "Paystack transfer deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting paystack transfer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete paystack transfer",
        error: error.message,
      });
    }
  },
};

