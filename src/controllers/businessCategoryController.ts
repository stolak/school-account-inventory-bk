import { Request, Response } from "express";
import { businessCategoryService } from "../services/businessCategoryService";

/**
 * @openapi
 * /api/v1/business-categories:
 *   get:
 *     summary: Get all business categories
 *     tags: [Business Categories]
 *     responses:
 *       200:
 *         description: List of all business categories
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
 *                         type: string
 *                     count:
 *                       type: number
 *       500:
 *         description: Server error
 */
export const businessCategoryController = {
  getAllCategories: async (req: Request, res: Response) => {
    try {
      const categories = businessCategoryService.getAllCategories();

      res.json({
        success: true,
        message: "Business categories retrieved successfully",
        data: {
          categories,
          count: categories.length,
        },
      });
    } catch (error: any) {
      console.error("Error getting business categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve business categories",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/business-categories/data:
   *   get:
   *     summary: Get all business categories and subcategories data
   *     tags: [Business Categories]
   *     responses:
   *       200:
   *         description: Complete business categories and subcategories data
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
   *                   additionalProperties:
   *                     type: array
   *                     items:
   *                       type: string
   *       500:
   *         description: Server error
   */
  getAllData: async (req: Request, res: Response) => {
    try {
      const data = businessCategoryService.getAllData();

      res.json({
        success: true,
        message: "Business category data retrieved successfully",
        data,
      });
    } catch (error: any) {
      console.error("Error getting business category data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve business category data",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/business-categories/metadata:
   *   get:
   *     summary: Get business category metadata with statistics
   *     tags: [Business Categories]
   *     responses:
   *       200:
   *         description: Business category metadata with statistics
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
   *                     totalCategories:
   *                       type: number
   *                     totalSubcategories:
   *                       type: number
   *                     categories:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           name:
   *                             type: string
   *                           subcategoryCount:
   *                             type: number
   *                           subcategories:
   *                             type: array
   *                             items:
   *                               type: string
   *       500:
   *         description: Server error
   */
  getMetadata: async (req: Request, res: Response) => {
    try {
      const metadata = businessCategoryService.getCategoryMetadata();

      res.json({
        success: true,
        message: "Business category metadata retrieved successfully",
        data: metadata,
      });
    } catch (error: any) {
      console.error("Error getting business category metadata:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve business category metadata",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/business-categories/{category}/subcategories:
   *   get:
   *     summary: Get subcategories for a specific business category
   *     tags: [Business Categories]
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *         description: Business category name
   *     responses:
   *       200:
   *         description: Subcategories for the specified business category
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
   *                     category:
   *                       type: string
   *                     subcategories:
   *                       type: array
   *                       items:
   *                         type: string
   *                     count:
   *                       type: number
   *       404:
   *         description: Business category not found
   *       500:
   *         description: Server error
   */
  getSubcategoriesByCategory: async (req: Request, res: Response) => {
    try {
      const { category } = req.params;

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Category parameter is required",
        });
      }

      const subcategories =
        businessCategoryService.getSubcategoriesByCategory(category);

      res.json({
        success: true,
        message: `Subcategories for ${category} retrieved successfully`,
        data: {
          category,
          subcategories,
          count: subcategories.length,
        },
      });
    } catch (error: any) {
      console.error(
        `Error getting subcategories for category ${req.params.category}:`,
        error
      );

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to retrieve subcategories",
          error: error.message,
        });
      }
    }
  },

  /**
   * @openapi
   * /api/v1/business-categories/search/categories:
   *   get:
   *     summary: Search business categories by name
   *     tags: [Business Categories]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query for business category name
   *     responses:
   *       200:
   *         description: Matching business categories
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
   *                     query:
   *                       type: string
   *                     categories:
   *                       type: array
   *                       items:
   *                         type: string
   *                     count:
   *                       type: number
   *       400:
   *         description: Missing search query
   *       500:
   *         description: Server error
   */
  searchCategories: async (req: Request, res: Response) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query parameter 'q' is required",
        });
      }

      const categories = businessCategoryService.searchCategories(q);

      res.json({
        success: true,
        message: `Business categories matching "${q}" retrieved successfully`,
        data: {
          query: q,
          categories,
          count: categories.length,
        },
      });
    } catch (error: any) {
      console.error("Error searching business categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search business categories",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/business-categories/search/subcategories:
   *   get:
   *     summary: Search subcategories by name
   *     tags: [Business Categories]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query for subcategory name
   *       - in: query
   *         name: category
   *         required: false
   *         schema:
   *           type: string
   *         description: Filter by specific business category (optional)
   *     responses:
   *       200:
   *         description: Matching subcategories
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
   *                     query:
   *                       type: string
   *                     category:
   *                       type: string
   *                     subcategories:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           subcategory:
   *                             type: string
   *                           category:
   *                             type: string
   *                     count:
   *                       type: number
   *       400:
   *         description: Missing search query
   *       500:
   *         description: Server error
   */
  searchSubcategories: async (req: Request, res: Response) => {
    try {
      const { q, category } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query parameter 'q' is required",
        });
      }

      const subcategories = businessCategoryService.searchSubcategories(
        q,
        category as string
      );

      res.json({
        success: true,
        message: `Subcategories matching "${q}" retrieved successfully`,
        data: {
          query: q,
          category: category || "All categories",
          subcategories,
          count: subcategories.length,
        },
      });
    } catch (error: any) {
      console.error("Error searching subcategories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search subcategories",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/business-categories/{category}/subcategories/{subcategory}:
   *   get:
   *     summary: Get a specific subcategory by category and subcategory name
   *     tags: [Business Categories]
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *         description: Business category name
   *       - in: path
   *         name: subcategory
   *         required: true
   *         schema:
   *           type: string
   *         description: Subcategory name
   *     responses:
   *       200:
   *         description: Specific subcategory details
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
   *                     subcategory:
   *                       type: string
   *                     category:
   *                       type: string
   *       404:
   *         description: Category or subcategory not found
   *       500:
   *         description: Server error
   */
  getSubcategory: async (req: Request, res: Response) => {
    try {
      const { category, subcategory } = req.params;

      if (!category || !subcategory) {
        return res.status(400).json({
          success: false,
          message: "Both category and subcategory parameters are required",
        });
      }

      const result = businessCategoryService.getSubcategory(
        category,
        subcategory
      );

      res.json({
        success: true,
        message: `Subcategory "${subcategory}" from category "${category}" retrieved successfully`,
        data: result,
      });
    } catch (error: any) {
      console.error(
        `Error getting subcategory ${req.params.subcategory} from ${req.params.category}:`,
        error
      );

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to retrieve subcategory",
          error: error.message,
        });
      }
    }
  },
};
