import { Router } from "express";
import { itemController } from "../controllers/itemController";

const router = Router();

// Create new item
router.post("/", itemController.create);

// Get all items for an invoice
router.get("/invoice/:invoiceId", itemController.getByInvoiceId);

// Get item by ID
router.get("/:id", itemController.getById);

// Update item
router.patch("/:id", itemController.update);

// Delete item
router.delete("/:id", itemController.delete);

export default router;
