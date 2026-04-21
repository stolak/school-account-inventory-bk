import express, { Router } from "express";
import { businessCategoryController } from "../controllers/businessCategoryController";

const router: Router = express.Router();

// Get all business categories
router.get("/", businessCategoryController.getAllCategories);

// Get all business categories and subcategories data
router.get("/data", businessCategoryController.getAllData);

// Get business category metadata with statistics
router.get("/metadata", businessCategoryController.getMetadata);

// Get subcategories for a specific business category
router.get(
  "/:category/subcategories",
  businessCategoryController.getSubcategoriesByCategory
);

// Search business categories by name
router.get("/search/categories", businessCategoryController.searchCategories);

// Search subcategories by name
router.get(
  "/search/subcategories",
  businessCategoryController.searchSubcategories
);

// Get a specific subcategory by category and subcategory name
router.get(
  "/:category/subcategories/:subcategory",
  businessCategoryController.getSubcategory
);

export = router;
