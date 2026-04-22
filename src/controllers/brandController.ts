import { Request, Response } from "express";
import { brandService } from "../services/brandService";

function parseIntOrUndefined(v: unknown): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * @openapi
 * /api/v1/brands:
 *   post:
 *     summary: Create a brand
 *     tags: [Brands]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "HP"
 *     responses:
 *       201:
 *         description: Brand created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate brand name
 *       500:
 *         description: Server error
 *   get:
 *     summary: List brands
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional search query (matches brand name)
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
 *         description: Brands list
 *       500:
 *         description: Server error
 */
export const brandController = {
  createBrand: async (req: Request, res: Response) => {
    try {
      const { name } = req.body ?? {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Brand name is required",
        });
      }

      const brand = await brandService.createBrand({ name: name.trim() });

      return res.status(201).json({
        success: true,
        message: "Brand created successfully",
        data: brand,
      });
    } catch (error: any) {
      const message = error?.message ?? "Failed to create brand";
      const status = message.includes("already exists") ? 409 : 500;
      return res.status(status).json({ success: false, message });
    }
  },

  listBrands: async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const page = parseIntOrUndefined(req.query.page);
      const limit = parseIntOrUndefined(req.query.limit);

      const result = await brandService.listBrands({ q, page, limit });

      return res.json({
        success: true,
        message: "Brands retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve brands",
        error: error?.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/brands/{id}:
   *   get:
   *     summary: Get a brand by ID
   *     tags: [Brands]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Brand ID
   *     responses:
   *       200:
   *         description: Brand details
   *       404:
   *         description: Brand not found
   *       500:
   *         description: Server error
   *   put:
   *     summary: Update a brand
   *     tags: [Brands]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Brand ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *     responses:
   *       200:
   *         description: Brand updated
   *       400:
   *         description: Validation error
   *       404:
   *         description: Brand not found
   *       409:
   *         description: Duplicate brand name
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Delete a brand
   *     tags: [Brands]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Brand ID
   *     responses:
   *       200:
   *         description: Brand deleted
   *       404:
   *         description: Brand not found
   *       500:
   *         description: Server error
   */
  getBrandById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Brand id parameter is required",
        });
      }

      const brand = await brandService.getBrandById(id);

      if (!brand) {
        return res.status(404).json({
          success: false,
          message: "Brand not found",
        });
      }

      return res.json({
        success: true,
        message: "Brand retrieved successfully",
        data: brand,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve brand",
        error: error?.message,
      });
    }
  },

  updateBrand: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body ?? {};

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Brand id parameter is required",
        });
      }

      if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        return res.status(400).json({
          success: false,
          message: "name must be a non-empty string",
        });
      }

      const existing = await brandService.getBrandById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Brand not found",
        });
      }

      const updated = await brandService.updateBrand(id, {
        ...(name !== undefined ? { name: name.trim() } : {}),
      });

      return res.json({
        success: true,
        message: "Brand updated successfully",
        data: updated,
      });
    } catch (error: any) {
      const message = error?.message ?? "Failed to update brand";
      const status = message.includes("already exists") ? 409 : 500;
      return res.status(status).json({ success: false, message });
    }
  },

  deleteBrand: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Brand id parameter is required",
        });
      }

      const existing = await brandService.getBrandById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Brand not found",
        });
      }

      const deleted = await brandService.deleteBrand(id);

      return res.json({
        success: true,
        message: "Brand deleted successfully",
        data: deleted,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete brand",
        error: error?.message,
      });
    }
  },
};

