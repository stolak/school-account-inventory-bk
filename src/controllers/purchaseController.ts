import { Request, Response } from "express";
import { purchaseService } from "../services/purchaseService";
import { InventoryTransactionStatus } from "@prisma/client";

function parseIntOrUndefined(v: unknown): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function isStringOrNullOrUndefined(v: unknown): v is string | null | undefined {
  return v === undefined || v === null || typeof v === "string" || v === "";
}

function isNumberOrString(v: unknown): v is number | string {
  return typeof v === "number" || typeof v === "string";
}

/**
 * @openapi
 * /api/v1/purchases:
 *   post:
 *     summary: Create a purchase transaction
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     description: Creates an InventoryTransaction with transactionType=purchase (locked). Defaults status to completed.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, qtyIn]
 *             properties:
 *               itemId:
 *                 type: string
 *               supplierId:
 *                 type: string
 *                 nullable: true
 *                 description: Optional. Empty string "" is treated as null.
 *               qtyIn:
 *                 oneOf: [{ type: string }, { type: number }]
 *               inCost:
 *                 oneOf: [{ type: string }, { type: number }]
 *                 description: Optional. If provided must be > 0.
 *               amountPaid:
 *                 oneOf: [{ type: string }, { type: number }]
 *                 description: Optional. If provided must be > 0.
 *               referenceNo:
 *                 type: string
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 nullable: true
 *               transactionDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional. Defaults to today.
 *               status:
 *                 type: string
 *                 enum: [pending, cancelled, deleted, completed]
 *                 description: Optional override (defaults to completed)
 *     responses:
 *       201:
 *         description: Purchase created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Referenced item/supplier not found
 *       500:
 *         description: Server error
 *   get:
 *     summary: List purchase transactions
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional search in referenceNo/notes
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, cancelled, deleted, completed]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Purchases list
 *       500:
 *         description: Server error
 */
export const purchaseController = {
  /**
   * @openapi
   * /api/v1/purchases/bulk:
   *   post:
   *     summary: Create multiple purchase transactions (bulk)
   *     tags: [Purchases]
   *     security:
   *       - bearerAuth: []
   *     description: Creates multiple InventoryTransaction rows with transactionType=purchase (locked). Defaults status to completed.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [items]
   *             properties:
   *               supplierId:
   *                 type: string
   *                 nullable: true
   *                 description: Optional. Empty string "" is treated as null.
   *               referenceNo:
   *                 type: string
   *                 nullable: true
   *               notes:
   *                 type: string
   *                 nullable: true
   *               transactionDate:
   *                 type: string
   *                 format: date-time
   *                 description: Optional. Defaults to today.
   *               amountPaid:
   *                 oneOf: [{ type: string }, { type: number }]
   *                 description: Optional. If provided must be > 0. Applied to each created row.
   *               status:
   *                 type: string
   *                 enum: [pending, cancelled, deleted, completed]
   *                 description: Optional override (defaults to completed)
   *               items:
   *                 type: array
   *                 minItems: 1
   *                 items:
   *                   type: object
   *                   required: [itemId, qtyIn, inCost]
   *                   properties:
   *                     itemId:
   *                       type: string
   *                     qtyIn:
   *                       oneOf: [{ type: string }, { type: number }]
   *                     inCost:
   *                       oneOf: [{ type: string }, { type: number }]
   *     responses:
   *       201:
   *         description: Purchases created
   *       400:
   *         description: Validation error
   *       404:
   *         description: Referenced item/supplier not found
   *       500:
   *         description: Server error
   */
  createBulkPurchases: async (req: Request, res: Response) => {
    try {
      const { supplierId, referenceNo, notes, transactionDate, amountPaid, status, items } =
        req.body ?? {};

      if (!isStringOrNullOrUndefined(supplierId)) {
        return res
          .status(400)
          .json({ success: false, message: "supplierId must be a string or null" });
      }
      const normalizedSupplierId =
        supplierId === undefined || supplierId === null
          ? null
          : supplierId.trim().length > 0
            ? supplierId.trim()
            : null;

      if (!isStringOrNullOrUndefined(referenceNo)) {
        return res
          .status(400)
          .json({ success: false, message: "referenceNo must be a string or null" });
      }
      if (!isStringOrNullOrUndefined(notes)) {
        return res.status(400).json({ success: false, message: "notes must be a string or null" });
      }
      if (transactionDate !== undefined && typeof transactionDate !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "transactionDate must be an ISO date string" });
      }
      const parsedDate =
        transactionDate === undefined
          ? undefined
          : (() => {
              const d = new Date(transactionDate);
              return Number.isNaN(d.getTime()) ? null : d;
            })();
      if (parsedDate === null) {
        return res.status(400).json({ success: false, message: "transactionDate is invalid" });
      }

      if (amountPaid !== undefined && !isNumberOrString(amountPaid)) {
        return res
          .status(400)
          .json({ success: false, message: "amountPaid must be a string or number" });
      }
      if (amountPaid !== undefined) {
        const amountPaidNum = typeof amountPaid === "string" ? Number(amountPaid) : amountPaid;
        if (!Number.isFinite(amountPaidNum) || amountPaidNum < 0) {
          return res
            .status(400)
            .json({ success: false, message: "amountPaid must be greater than 0" });
        }
      }

      if (
        status !== undefined &&
        status !== InventoryTransactionStatus.pending &&
        status !== InventoryTransactionStatus.cancelled &&
        status !== InventoryTransactionStatus.deleted &&
        status !== InventoryTransactionStatus.completed
      ) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "items is required and must be a non-empty array" });
      }

      const normalizedItems: Array<{
        itemId: string;
        qtyIn: string | number;
        inCost: string | number;
      }> = [];
      for (const [idx, it] of items.entries()) {
        if (!it || typeof it !== "object") {
          return res
            .status(400)
            .json({ success: false, message: `items[${idx}] must be an object` });
        }
        const { itemId, qtyIn, inCost } = it;
        if (!itemId || typeof itemId !== "string" || !itemId.trim()) {
          return res
            .status(400)
            .json({ success: false, message: `items[${idx}].itemId is required` });
        }
        if (!isNumberOrString(qtyIn)) {
          return res
            .status(400)
            .json({
              success: false,
              message: `items[${idx}].qtyIn is required (string or number)`,
            });
        }
        const qtyInNum = typeof qtyIn === "string" ? Number(qtyIn) : qtyIn;
        if (!Number.isFinite(qtyInNum) || qtyInNum <= 0) {
          return res
            .status(400)
            .json({ success: false, message: `items[${idx}].qtyIn must be greater than 0` });
        }
        if (!isNumberOrString(inCost)) {
          return res
            .status(400)
            .json({
              success: false,
              message: `items[${idx}].inCost is required (string or number)`,
            });
        }
        const inCostNum = typeof inCost === "string" ? Number(inCost) : inCost;
        if (!Number.isFinite(inCostNum) || inCostNum < 0) {
          return res
            .status(400)
            .json({ success: false, message: `items[${idx}].inCost must be greater than 0` });
        }

        normalizedItems.push({ itemId: itemId.trim(), qtyIn, inCost });
      }

      const createdById = (req as any).user?.id;
      if (!createdById) return res.status(401).json({ success: false, message: "Unauthorized" });

      const created = await purchaseService.createBulkPurchases({
        supplierId: normalizedSupplierId,
        referenceNo: referenceNo === undefined ? null : referenceNo,
        notes: notes === undefined ? null : notes,
        transactionDate: parsedDate ?? undefined,
        ...(amountPaid !== undefined ? { amountPaid } : {}),
        status,
        createdById,
        items: normalizedItems,
      });

      return res
        .status(201)
        .json({ success: true, message: "Purchases created successfully", data: created });
    } catch (error: any) {
      const message = error?.message ?? "Failed to create purchases";
      const code = message.startsWith("Invalid ") ? 404 : 500;
      return res.status(code).json({ success: false, message });
    }
  },

  createPurchase: async (req: Request, res: Response) => {
    try {
      const {
        itemId,
        supplierId,
        qtyIn,
        inCost,
        amountPaid,
        referenceNo,
        notes,
        transactionDate,
        status,
      } = req.body ?? {};

      if (!itemId || typeof itemId !== "string" || !itemId.trim()) {
        return res.status(400).json({ success: false, message: "itemId is required" });
      }
      if (!isStringOrNullOrUndefined(supplierId)) {
        return res
          .status(400)
          .json({ success: false, message: "supplierId must be a string or null" });
      }
      const normalizedSupplierId =
        supplierId === undefined || supplierId === null
          ? null
          : supplierId.trim().length > 0
            ? supplierId.trim()
            : null;

      if (!isNumberOrString(qtyIn)) {
        return res
          .status(400)
          .json({ success: false, message: "qtyIn is required (string or number)" });
      }
      const qtyInNum = typeof qtyIn === "string" ? Number(qtyIn) : qtyIn;
      if (!Number.isFinite(qtyInNum) || qtyInNum <= 0) {
        return res.status(400).json({ success: false, message: "qtyIn must be greater than 0" });
      }

      if (inCost !== undefined && !isNumberOrString(inCost)) {
        return res
          .status(400)
          .json({ success: false, message: "inCost must be a string or number" });
      }
      if (inCost !== undefined) {
        const inCostNum = typeof inCost === "string" ? Number(inCost) : inCost;
        if (!Number.isFinite(inCostNum) || inCostNum < 0) {
          return res.status(400).json({ success: false, message: "inCost must be greater than 0" });
        }
      }

      if (amountPaid !== undefined && !isNumberOrString(amountPaid)) {
        return res
          .status(400)
          .json({ success: false, message: "amountPaid must be a string or number" });
      }
      if (amountPaid !== undefined) {
        const amountPaidNum = typeof amountPaid === "string" ? Number(amountPaid) : amountPaid;
        if (!Number.isFinite(amountPaidNum) || amountPaidNum < 0) {
          return res
            .status(400)
            .json({ success: false, message: "amountPaid must be greater than 0" });
        }
      }
      if (!isStringOrNullOrUndefined(referenceNo)) {
        return res
          .status(400)
          .json({ success: false, message: "referenceNo must be a string or null" });
      }
      if (!isStringOrNullOrUndefined(notes)) {
        return res.status(400).json({ success: false, message: "notes must be a string or null" });
      }
      if (transactionDate !== undefined && typeof transactionDate !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "transactionDate must be an ISO date string" });
      }
      const parsedDate =
        transactionDate === undefined
          ? undefined
          : (() => {
              const d = new Date(transactionDate);
              return Number.isNaN(d.getTime()) ? null : d;
            })();
      if (parsedDate === null) {
        return res.status(400).json({ success: false, message: "transactionDate is invalid" });
      }
      if (
        status !== undefined &&
        status !== InventoryTransactionStatus.pending &&
        status !== InventoryTransactionStatus.cancelled &&
        status !== InventoryTransactionStatus.deleted &&
        status !== InventoryTransactionStatus.completed
      ) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }

      const createdById = (req as any).user?.id;
      if (!createdById) return res.status(401).json({ success: false, message: "Unauthorized" });

      const created = await purchaseService.createPurchase({
        itemId: itemId.trim(),
        supplierId: normalizedSupplierId,
        qtyIn,
        ...(inCost === undefined || inCost.trim() === "" ? { inCost: undefined } : { inCost }),
        ...(amountPaid === undefined || amountPaid.trim() === ""
          ? { amountPaid: undefined }
          : { amountPaid }),
        referenceNo:
          referenceNo === undefined || referenceNo === null || referenceNo.trim() === ""
            ? null
            : referenceNo,
        notes: notes === undefined || notes === null || notes.trim() === "" ? null : notes,
        transactionDate: parsedDate ?? undefined,
        createdById,
        status,
      });

      return res
        .status(201)
        .json({ success: true, message: "Purchase created successfully", data: created });
    } catch (error: any) {
      const message = error?.message ?? "Failed to create purchase";
      const code = message.startsWith("Invalid ") ? 404 : 500;
      return res.status(code).json({ success: false, message });
    }
  },

  listPurchases: async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const itemId = typeof req.query.itemId === "string" ? req.query.itemId : undefined;
      const supplierId =
        typeof req.query.supplierId === "string" ? req.query.supplierId : undefined;
      const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
      const status =
        statusRaw === undefined
          ? undefined
          : statusRaw === "pending"
            ? InventoryTransactionStatus.pending
            : statusRaw === "cancelled"
              ? InventoryTransactionStatus.cancelled
              : statusRaw === "deleted"
                ? InventoryTransactionStatus.deleted
                : statusRaw === "completed"
                  ? InventoryTransactionStatus.completed
                  : undefined;

      if (statusRaw !== undefined && status === undefined) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }

      const page = parseIntOrUndefined(req.query.page);
      const limit = parseIntOrUndefined(req.query.limit);

      const result = await purchaseService.listPurchases({
        q,
        itemId,
        supplierId,
        status,
        page,
        limit,
      });
      return res.json({ success: true, message: "Purchases retrieved successfully", data: result });
    } catch (error: any) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to retrieve purchases", error: error?.message });
    }
  },

  /**
   * @openapi
   * /api/v1/purchases/{id}:
   *   get:
   *     summary: Get a purchase transaction by ID
   *     tags: [Purchases]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Purchase details
   *       404:
   *         description: Purchase not found
   *       500:
   *         description: Server error
   *   put:
   *     summary: Update a purchase transaction
   *     tags: [Purchases]
   *     security:
   *       - bearerAuth: []
   *     description: Updates allowed fields only. transactionType stays purchase.
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
   *               itemId:
   *                 type: string
   *               supplierId:
   *                 type: string
   *                 nullable: true
   *               qtyIn:
   *                 oneOf: [{ type: string }, { type: number }]
   *               inCost:
   *                 oneOf: [{ type: string }, { type: number }]
   *               amountPaid:
   *                 oneOf: [{ type: string }, { type: number }]
   *               referenceNo:
   *                 type: string
   *                 nullable: true
   *               notes:
   *                 type: string
   *                 nullable: true
   *               transactionDate:
   *                 type: string
   *                 format: date-time
   *               status:
   *                 type: string
   *                 enum: [pending, cancelled, deleted, completed]
   *     responses:
   *       200:
   *         description: Purchase updated
   *       400:
   *         description: Validation error
   *       404:
   *         description: Purchase/item/supplier not found
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Delete a purchase transaction
   *     tags: [Purchases]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Purchase deleted
   *       404:
   *         description: Purchase not found
   *       500:
   *         description: Server error
   */
  getPurchaseById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const purchase = await purchaseService.getPurchaseById(id);
      if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });

      return res.json({
        success: true,
        message: "Purchase retrieved successfully",
        data: purchase,
      });
    } catch (error: any) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to retrieve purchase", error: error?.message });
    }
  },

  updatePurchase: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        itemId,
        supplierId,
        qtyIn,
        inCost,
        amountPaid,
        referenceNo,
        notes,
        transactionDate,
        status,
      } = req.body ?? {};

      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      if (itemId !== undefined && (typeof itemId !== "string" || !itemId.trim())) {
        return res
          .status(400)
          .json({ success: false, message: "itemId must be a non-empty string" });
      }
      if (supplierId !== undefined && !isStringOrNullOrUndefined(supplierId)) {
        return res
          .status(400)
          .json({ success: false, message: "supplierId must be a string or null" });
      }
      if (qtyIn !== undefined && !isNumberOrString(qtyIn)) {
        return res
          .status(400)
          .json({ success: false, message: "qtyIn must be a string or number" });
      }
      if (inCost !== undefined && !isNumberOrString(inCost)) {
        return res
          .status(400)
          .json({ success: false, message: "inCost must be a string or number" });
      }
      if (amountPaid !== undefined && !isNumberOrString(amountPaid)) {
        return res
          .status(400)
          .json({ success: false, message: "amountPaid must be a string or number" });
      }
      if (referenceNo !== undefined && !isStringOrNullOrUndefined(referenceNo)) {
        return res
          .status(400)
          .json({ success: false, message: "referenceNo must be a string or null" });
      }
      if (notes !== undefined && !isStringOrNullOrUndefined(notes)) {
        return res.status(400).json({ success: false, message: "notes must be a string or null" });
      }
      if (transactionDate !== undefined && typeof transactionDate !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "transactionDate must be an ISO date string" });
      }
      if (
        status !== undefined &&
        status !== InventoryTransactionStatus.pending &&
        status !== InventoryTransactionStatus.cancelled &&
        status !== InventoryTransactionStatus.deleted &&
        status !== InventoryTransactionStatus.completed
      ) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }

      const updated = await purchaseService.updatePurchase(id, {
        ...(itemId !== undefined ? { itemId: itemId.trim() } : {}),
        ...(supplierId !== undefined ? { supplierId } : {}),
        ...(qtyIn !== undefined ? { qtyIn } : {}),
        ...(inCost !== undefined ? { inCost } : {}),
        ...(amountPaid !== undefined ? { amountPaid } : {}),
        ...(referenceNo !== undefined ? { referenceNo } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(transactionDate !== undefined ? { transactionDate: new Date(transactionDate) } : {}),
        ...(status !== undefined ? { status } : {}),
      });

      return res.json({ success: true, message: "Purchase updated successfully", data: updated });
    } catch (error: any) {
      const message = error?.message ?? "Failed to update purchase";
      const code = message === "Purchase not found" || message.startsWith("Invalid ") ? 404 : 500;
      return res.status(code).json({ success: false, message });
    }
  },

  deletePurchase: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const deleted = await purchaseService.deletePurchase(id);
      return res.json({ success: true, message: "Purchase deleted successfully", data: deleted });
    } catch (error: any) {
      const message = error?.message ?? "Failed to delete purchase";
      const code = message === "Purchase not found" ? 404 : 500;
      return res.status(code).json({ success: false, message });
    }
  },
};
