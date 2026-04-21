import { Request, Response } from "express";
import {
  invoiceService,
  CreateItemInput,
  UpdateItemInput,
} from "../services/invoiceService";

/**
 * @swagger
 * tags:
 *   name: Item
 *   description: Invoice item management
 */

/**
 * @swagger
 * /api/v1/items:
 *   post:
 *     summary: Create a new item for an invoice
 *     tags: [Item]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - description
 *               - quantity
 *               - amount
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 description: ID of the invoice
 *               description:
 *                 type: string
 *                 example: "Product A"
 *               quantity:
 *                 type: integer
 *                 example: 2
 *               amount:
 *                 type: number
 *                 example: 50000
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Invoice not found
 */

/**
 * @swagger
 * /api/v1/items/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags: [Item]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item details
 *       404:
 *         description: Item not found
 */

/**
 * @swagger
 * /api/v1/items/invoice/{invoiceId}:
 *   get:
 *     summary: Get all items for an invoice
 *     tags: [Item]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of items
 */

/**
 * @swagger
 * /api/v1/items/{id}:
 *   patch:
 *     summary: Update item
 *     tags: [Item]
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
 *               description:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Item updated
 *       404:
 *         description: Item not found
 */

/**
 * @swagger
 * /api/v1/items/{id}:
 *   delete:
 *     summary: Delete item
 *     tags: [Item]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted
 *       404:
 *         description: Item not found
 */

export class ItemController {
  /**
   * Create a new item
   */
  async create(req: Request, res: Response) {
    try {
      const { invoiceId, description, quantity, amount } = req.body;

      // Validation
      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: "Invoice ID is required",
        });
      }

      if (!description) {
        return res.status(400).json({
          success: false,
          message: "Description is required",
        });
      }

      if (quantity === undefined || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid quantity is required",
        });
      }

      if (amount === undefined || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid amount is required",
        });
      }

      const input: CreateItemInput = { description, quantity, amount };
      const result = await invoiceService.createItem(invoiceId, input);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(201).json(result);
    } catch (error: any) {
      console.error("Error creating item:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create item",
      });
    }
  }

  /**
   * Get item by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await invoiceService.getItemById(id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching item:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch item",
      });
    }
  }

  /**
   * Get all items for an invoice
   */
  async getByInvoiceId(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      const result = await invoiceService.getItemsByInvoiceId(invoiceId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching items:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch items",
      });
    }
  }

  /**
   * Update item
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const input: UpdateItemInput = req.body;

      // Validation
      if (input.quantity !== undefined && input.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be greater than 0",
        });
      }

      if (input.amount !== undefined && input.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be greater than 0",
        });
      }

      const result = await invoiceService.updateItem(id, input);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error updating item:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update item",
      });
    }
  }

  /**
   * Delete item
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await invoiceService.deleteItem(id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error deleting item:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to delete item",
      });
    }
  }
}

export const itemController = new ItemController();
