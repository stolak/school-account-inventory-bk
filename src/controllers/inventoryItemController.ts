import { Request, Response } from "express";
import { inventoryItemService } from "../services/inventoryItemService";
import { Status } from "@prisma/client";

function parseIntOrUndefined(v: unknown): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function isStringOrNullOrUndefined(v: unknown): v is string | null | undefined {
  return v === undefined || v === null || typeof v === "string";
}

function isNumberOrString(v: unknown): v is number | string {
  return typeof v === "number" || typeof v === "string";
}

/**
 * @openapi
 * /api/v1/inventory-items:
 *   post:
 *     summary: Create an inventory item
 *     tags: [InventoryItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, costPrice, sellingPrice]
 *             properties:
 *               sku:
 *                 type: string
 *                 nullable: true
 *               name:
 *                 type: string
 *                 example: "A4 Exercise Book"
 *               categoryId:
 *                 type: string
 *                 nullable: true
 *               subCategoryId:
 *                 type: string
 *                 nullable: true
 *               brandId:
 *                 type: string
 *                 nullable: true
 *               uomId:
 *                 type: string
 *                 nullable: true
 *               barcode:
 *                 type: string
 *                 nullable: true
 *               costPrice:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 example: "120.00"
 *               sellingPrice:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 example: "150.00"
 *               lowStockThreshold:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: Inventory item created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate SKU or barcode
 *       500:
 *         description: Server error
 *   get:
 *     summary: List inventory items
 *     tags: [InventoryItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional search query (matches name, sku, or barcode)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: subCategoryId
 *         schema:
 *           type: string
 *         description: Filter by sub-category ID
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *         description: Filter by brand ID
 *       - in: query
 *         name: uomId
 *         schema:
 *           type: string
 *         description: Filter by uom ID
 *       - in: query
 *         name: createdById
 *         schema:
 *           type: string
 *         description: Filter by creator user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, All]
 *         description: Defaults to Active only. Use All to include Active and Inactive.
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
 *         description: Inventory items list
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
 *                     inventoryItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           sku:
 *                             type: string
 *                             nullable: true
 *                           name:
 *                             type: string
 *                           barcode:
 *                             type: string
 *                             nullable: true
 *                           costPrice:
 *                             type: string
 *                           sellingPrice:
 *                             type: string
 *                           lowStockThreshold:
 *                             type: integer
 *                           currentStock:
 *                             type: string
 *                             description: Available quantity (sum(qtyIn-qtyOut))
 *                           categoryId:
 *                             type: string
 *                             nullable: true
 *                           subCategoryId:
 *                             type: string
 *                             nullable: true
 *                           brandId:
 *                             type: string
 *                             nullable: true
 *                           uomId:
 *                             type: string
 *                             nullable: true
 *                           category:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               name:
 *                                 type: string
 *                           subCategory:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               name:
 *                                 type: string
 *                           brand:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               name:
 *                                 type: string
 *                           uom:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               name:
 *                                 type: string
 *                           createdBy:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               firstName:
 *                                 type: string
 *                                 nullable: true
 *                               lastName:
 *                                 type: string
 *                                 nullable: true
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       500:
 *         description: Server error
 */
export const inventoryItemController = {
  createInventoryItem: async (req: Request, res: Response) => {
    try {
      const {
        sku,
        name,
        categoryId,
        subCategoryId,
        brandId,
        uomId,
        barcode,
        costPrice,
        sellingPrice,
        lowStockThreshold,
      } = req.body ?? {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ success: false, message: "name is required" });
      }

      if (!isNumberOrString(costPrice)) {
        return res.status(400).json({ success: false, message: "costPrice is required (string or number)" });
      }
      if (!isNumberOrString(sellingPrice)) {
        return res.status(400).json({ success: false, message: "sellingPrice is required (string or number)" });
      }

      if (!isStringOrNullOrUndefined(sku)) {
        return res.status(400).json({ success: false, message: "sku must be a string or null" });
      }
      console.log("barcode", barcode);
      if (!isStringOrNullOrUndefined(barcode)) {
        return res.status(400).json({ success: false, message: "barcode must be a string or null" });
      }
      const normalizedBarcode = barcode === null || barcode === undefined||barcode.trim() === "" ? null : barcode.trim();
      
    
      if (!isStringOrNullOrUndefined(categoryId)) {
        return res.status(400).json({ success: false, message: "categoryId must be a string or null" });
      }
      if (!isStringOrNullOrUndefined(subCategoryId)) {
        return res.status(400).json({ success: false, message: "subCategoryId must be a string or null" });
      }
      if (!isStringOrNullOrUndefined(brandId)) {
        return res.status(400).json({ success: false, message: "brandId must be a string or null" });
      }
      if (!isStringOrNullOrUndefined(uomId)) {
        return res.status(400).json({ success: false, message: "uomId must be a string or null" });
      }

      if (lowStockThreshold !== undefined && (typeof lowStockThreshold !== "number" || lowStockThreshold < 0)) {
        return res.status(400).json({ success: false, message: "lowStockThreshold must be a number >= 0" });
      }

      const createdById = (req as any).user?.id;
      if (!createdById) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const created = await inventoryItemService.createInventoryItem({
        sku: sku === undefined || sku === null || sku.trim() === "" ? null : sku.trim(),
        name: name.trim(),
        categoryId: categoryId === undefined ? null : categoryId,
        subCategoryId: subCategoryId === undefined ? null : subCategoryId,
        brandId: brandId === undefined ? null : brandId,
        uomId: uomId === undefined ? null : uomId,
        barcode: normalizedBarcode,
        costPrice,
        sellingPrice,
        lowStockThreshold,
        createdById,
      });

      return res.status(201).json({
        success: true,
        message: "Inventory item created successfully",
        data: created,
      });
    } catch (error: any) {
      const message = error?.message ?? "Failed to create inventory item";
      const status = message.includes("already exists") ? 409 : 500;
      return res.status(status).json({ success: false, message });
    }
  },

  listInventoryItems: async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
      const subCategoryId = typeof req.query.subCategoryId === "string" ? req.query.subCategoryId : undefined;
      const brandId = typeof req.query.brandId === "string" ? req.query.brandId : undefined;
      const uomId = typeof req.query.uomId === "string" ? req.query.uomId : undefined;
      const createdById = typeof req.query.createdById === "string" ? req.query.createdById : undefined;
      const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
      const status =
        statusRaw === undefined
          ? undefined
          : statusRaw === "All"
            ? "All"
            : statusRaw === "Active"
              ? Status.Active
              : statusRaw === "Inactive"
                ? Status.Inactive
                : undefined;

      if (statusRaw !== undefined && status === undefined) {
        return res.status(400).json({
          success: false,
          message: "status must be Active, Inactive, or All",
        });
      }
      const page = parseIntOrUndefined(req.query.page);
      const limit = parseIntOrUndefined(req.query.limit);

      const result = await inventoryItemService.listInventoryItems({
        q,
        categoryId,
        subCategoryId,
        brandId,
        uomId,
        createdById,
        status,
        page,
        limit,
      });

      return res.json({
        success: true,
        message: "Inventory items retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve inventory items",
        error: error?.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/inventory-items/{id}:
   *   get:
   *     summary: Get an inventory item by ID
   *     tags: [InventoryItems]
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
   *         description: Inventory item details
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
   *                     id:
   *                       type: string
   *                     sku:
   *                       type: string
   *                       nullable: true
   *                     name:
   *                       type: string
   *                     barcode:
   *                       type: string
   *                       nullable: true
   *                     costPrice:
   *                       type: string
   *                     sellingPrice:
   *                       type: string
   *                     lowStockThreshold:
   *                       type: integer
   *                     createdById:
   *                       type: string
   *                       nullable: true
   *                     categoryId:
   *                       type: string
   *                       nullable: true
   *                     subCategoryId:
   *                       type: string
   *                       nullable: true
   *                     brandId:
   *                       type: string
   *                       nullable: true
   *                     uomId:
   *                       type: string
   *                       nullable: true
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: Inventory item not found
   *       500:
   *         description: Server error
   *   put:
   *     summary: Update an inventory item
   *     tags: [InventoryItems]
   *     security:
   *       - bearerAuth: []
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
   *               sku:
   *                 type: string
   *                 nullable: true
   *               name:
   *                 type: string
   *               categoryId:
   *                 type: string
   *                 nullable: true
   *               subCategoryId:
   *                 type: string
   *                 nullable: true
   *               brandId:
   *                 type: string
   *                 nullable: true
   *               uomId:
   *                 type: string
   *                 nullable: true
   *               barcode:
   *                 type: string
   *                 nullable: true
   *               costPrice:
   *                 oneOf:
   *                   - type: string
   *                   - type: number
   *               sellingPrice:
   *                 oneOf:
   *                   - type: string
   *                   - type: number
   *               lowStockThreshold:
   *                 type: integer
   *               status:
   *                 type: string
   *                 enum: [Active, Inactive]
   *     responses:
   *       200:
   *         description: Inventory item updated
   *       400:
   *         description: Validation error
   *       404:
   *         description: Inventory item not found
   *       409:
   *         description: Duplicate SKU or barcode
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Delete an inventory item
   *     tags: [InventoryItems]
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
   *         description: Inventory item deleted
   *       404:
   *         description: Inventory item not found
   *       500:
   *         description: Server error
   */
  getInventoryItemById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const item = await inventoryItemService.getInventoryItemById(id);
      if (!item) return res.status(404).json({ success: false, message: "Inventory item not found" });

      return res.json({ success: true, message: "Inventory item retrieved successfully", data: item });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: "Failed to retrieve inventory item", error: error?.message });
    }
  },

  updateInventoryItem: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        sku,
        name,
        categoryId,
        subCategoryId,
        brandId,
        uomId,
        barcode,
        costPrice,
        sellingPrice,
        lowStockThreshold,
        status,
      } = req.body ?? {};

      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        return res.status(400).json({ success: false, message: "name must be a non-empty string" });
      }
      
      const normalizedBarcode = barcode === undefined ? undefined : barcode === null ? null : barcode.trim();
     
      if (categoryId !== undefined && !isStringOrNullOrUndefined(categoryId)) {
        return res.status(400).json({ success: false, message: "categoryId must be a string or null" });
      }
      if (subCategoryId !== undefined && !isStringOrNullOrUndefined(subCategoryId)) {
        return res.status(400).json({ success: false, message: "subCategoryId must be a string or null" });
      }
      if (brandId !== undefined && !isStringOrNullOrUndefined(brandId)) {
        return res.status(400).json({ success: false, message: "brandId must be a string or null" });
      }
      if (uomId !== undefined && !isStringOrNullOrUndefined(uomId)) {
        return res.status(400).json({ success: false, message: "uomId must be a string or null" });
      }
      if (costPrice !== undefined && !isNumberOrString(costPrice)) {
        return res.status(400).json({ success: false, message: "costPrice must be a string or number" });
      }
      if (sellingPrice !== undefined && !isNumberOrString(sellingPrice)) {
        return res.status(400).json({ success: false, message: "sellingPrice must be a string or number" });
      }
      if (lowStockThreshold !== undefined && (typeof lowStockThreshold !== "number" || lowStockThreshold < 0)) {
        return res.status(400).json({ success: false, message: "lowStockThreshold must be a number >= 0" });
      }

      if (status !== undefined && status !== Status.Active && status !== Status.Inactive) {
        return res.status(400).json({ success: false, message: "status must be Active or Inactive" });
      }

      const existing = await inventoryItemService.getInventoryItemById(id);
      if (!existing) return res.status(404).json({ success: false, message: "Inventory item not found" });

      const updated = await inventoryItemService.updateInventoryItem(id, {
        ...(sku !== undefined ? { sku: sku === undefined || sku === null || sku.trim() === "" ? null : sku.trim() } : {}),
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(subCategoryId !== undefined ? { subCategoryId } : {}),
        ...(brandId !== undefined ? { brandId } : {}),
        ...(uomId !== undefined ? { uomId } : {}),
        ...(normalizedBarcode !== undefined ? { barcode: normalizedBarcode === null || normalizedBarcode === undefined || normalizedBarcode.trim() === "" ? null : normalizedBarcode.trim() } : {}),
        ...(costPrice !== undefined ? { costPrice } : {}),
        ...(sellingPrice !== undefined ? { sellingPrice } : {}),
        ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
        ...(status !== undefined ? { status } : {}),
      });

      return res.json({ success: true, message: "Inventory item updated successfully", data: updated });
    } catch (error: any) {
      const message = error?.message ?? "Failed to update inventory item";
      const status = message.includes("already exists") ? 409 : 500;
      return res.status(status).json({ success: false, message });
    }
  },

  deleteInventoryItem: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const existing = await inventoryItemService.getInventoryItemById(id);
      if (!existing) return res.status(404).json({ success: false, message: "Inventory item not found" });

      const deleted = await inventoryItemService.deleteInventoryItem(id);
      return res.json({ success: true, message: "Inventory item deleted successfully", data: deleted });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: "Failed to delete inventory item", error: error?.message });
    }
  },
};

