import { Request, Response } from "express";
import { categoryService } from "../services/categoryService";

function parseIntOrUndefined(v: unknown): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * @openapi
 * /api/v1/categories:
 *   post:
 *     summary: Create a category
 *     tags: [Categories]
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
 *                 example: "Stationery"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Books, pens, paper, and related items"
 *     responses:
 *       201:
 *         description: Category created
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
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate category name
 *       500:
 *         description: Server error
 *   get:
 *     summary: List categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional search query (matches category name)
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
 *         description: Categories list
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
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
export const categoryController = {
  createCategory: async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body ?? {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name is required",
        });
      }

      if (description !== undefined && description !== null && typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "description must be a string or null",
        });
      }

      const category = await categoryService.createCategory({
        name: name.trim(),
        description: description === undefined ? null : description,
      });

      return res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error: any) {
      const message = error?.message ?? "Failed to create category";
      const status = message.includes("already exists") ? 409 : 500;

      return res.status(status).json({
        success: false,
        message,
      });
    }
  },

  listCategories: async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const page = parseIntOrUndefined(req.query.page);
      const limit = parseIntOrUndefined(req.query.limit);

      const result = await categoryService.listCategories({ q, page, limit });

      return res.json({
        success: true,
        message: "Categories retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve categories",
        error: error?.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/categories/{id}:
   *   get:
   *     summary: Get a category by ID
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Category ID
   *     responses:
   *       200:
   *         description: Category details
   *       404:
   *         description: Category not found
   *       500:
   *         description: Server error
   *   put:
   *     summary: Update a category
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Category ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *                 nullable: true
   *     responses:
   *       200:
   *         description: Category updated
   *       400:
   *         description: Validation error
   *       404:
   *         description: Category not found
   *       409:
   *         description: Duplicate category name
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Delete a category
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Category ID
   *     responses:
   *       200:
   *         description: Category deleted
   *       404:
   *         description: Category not found
   *       500:
   *         description: Server error
   */
  getCategoryById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Category id parameter is required",
        });
      }

      const category = await categoryService.getCategoryById(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      return res.json({
        success: true,
        message: "Category retrieved successfully",
        data: category,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve category",
        error: error?.message,
      });
    }
  },

  updateCategory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body ?? {};

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Category id parameter is required",
        });
      }

      if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        return res.status(400).json({
          success: false,
          message: "name must be a non-empty string",
        });
      }

      if (description !== undefined && description !== null && typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "description must be a string or null",
        });
      }

      const existing = await categoryService.getCategoryById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      const updated = await categoryService.updateCategory(id, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
      });

      return res.json({
        success: true,
        message: "Category updated successfully",
        data: updated,
      });
    } catch (error: any) {
      const message = error?.message ?? "Failed to update category";
      const status = message.includes("already exists") ? 409 : 500;
      return res.status(status).json({ success: false, message });
    }
  },

  deleteCategory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Category id parameter is required",
        });
      }

      const existing = await categoryService.getCategoryById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      const deleted = await categoryService.deleteCategory(id);

      return res.json({
        success: true,
        message: "Category deleted successfully",
        data: deleted,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete category",
        error: error?.message,
      });
    }
  },
};

