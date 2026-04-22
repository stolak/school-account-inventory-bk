import { Request, Response } from "express";
import { uomService } from "../services/uomService";

function parseIntOrUndefined(v: unknown): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * @openapi
 * /api/v1/uoms:
 *   post:
 *     summary: Create a unit of measurement (UoM)
 *     tags: [Uoms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, symbol]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Kilogram"
 *               symbol:
 *                 type: string
 *                 example: "kg"
 *     responses:
 *       201:
 *         description: UoM created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate name or symbol
 *       500:
 *         description: Server error
 *   get:
 *     summary: List units of measurement (UoMs)
 *     tags: [Uoms]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional search query (matches name or symbol)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: UoMs list
 *       500:
 *         description: Server error
 */
export const uomController = {
  createUom: async (req: Request, res: Response) => {
    try {
      const { name, symbol } = req.body ?? {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Uom name is required",
        });
      }

      if (!symbol || typeof symbol !== "string" || !symbol.trim()) {
        return res.status(400).json({
          success: false,
          message: "Uom symbol is required",
        });
      }

      const uom = await uomService.createUom({
        name: name.trim(),
        symbol: symbol.trim(),
      });

      return res.status(201).json({
        success: true,
        message: "Uom created successfully",
        data: uom,
      });
    } catch (error: any) {
      const message = error?.message ?? "Failed to create uom";
      const status = message.includes("already exists") ? 409 : 500;
      return res.status(status).json({ success: false, message });
    }
  },

  listUoms: async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const page = parseIntOrUndefined(req.query.page);
      const limit = parseIntOrUndefined(req.query.limit);

      const result = await uomService.listUoms({ q, page, limit });

      return res.json({
        success: true,
        message: "Uoms retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve uoms",
        error: error?.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/uoms/{id}:
   *   get:
   *     summary: Get a unit of measurement (UoM) by ID
   *     tags: [Uoms]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: UoM ID
   *     responses:
   *       200:
   *         description: UoM details
   *       404:
   *         description: UoM not found
   *       500:
   *         description: Server error
   *   put:
   *     summary: Update a unit of measurement (UoM)
   *     tags: [Uoms]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: UoM ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               symbol:
   *                 type: string
   *     responses:
   *       200:
   *         description: UoM updated
   *       400:
   *         description: Validation error
   *       404:
   *         description: UoM not found
   *       409:
   *         description: Duplicate name or symbol
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Delete a unit of measurement (UoM)
   *     tags: [Uoms]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: UoM ID
   *     responses:
   *       200:
   *         description: UoM deleted
   *       404:
   *         description: UoM not found
   *       500:
   *         description: Server error
   */
  getUomById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Uom id parameter is required",
        });
      }

      const uom = await uomService.getUomById(id);

      if (!uom) {
        return res.status(404).json({
          success: false,
          message: "Uom not found",
        });
      }

      return res.json({
        success: true,
        message: "Uom retrieved successfully",
        data: uom,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve uom",
        error: error?.message,
      });
    }
  },

  updateUom: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, symbol } = req.body ?? {};

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Uom id parameter is required",
        });
      }

      if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        return res.status(400).json({
          success: false,
          message: "name must be a non-empty string",
        });
      }

      if (symbol !== undefined && (typeof symbol !== "string" || !symbol.trim())) {
        return res.status(400).json({
          success: false,
          message: "symbol must be a non-empty string",
        });
      }

      const existing = await uomService.getUomById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Uom not found",
        });
      }

      const updated = await uomService.updateUom(id, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(symbol !== undefined ? { symbol: symbol.trim() } : {}),
      });

      return res.json({
        success: true,
        message: "Uom updated successfully",
        data: updated,
      });
    } catch (error: any) {
      const message = error?.message ?? "Failed to update uom";
      const status = message.includes("already exists") ? 409 : 500;
      return res.status(status).json({ success: false, message });
    }
  },

  deleteUom: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Uom id parameter is required",
        });
      }

      const existing = await uomService.getUomById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Uom not found",
        });
      }

      const deleted = await uomService.deleteUom(id);

      return res.json({
        success: true,
        message: "Uom deleted successfully",
        data: deleted,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete uom",
        error: error?.message,
      });
    }
  },
};

