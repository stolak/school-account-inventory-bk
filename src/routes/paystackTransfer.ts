import { Router } from "express";
import { paystackTransferController } from "../controllers/paystackTransferController";

const router = Router();

// Create a new Paystack transfer
router.post("/", paystackTransferController.create);

// Get all Paystack transfers
router.get("/", paystackTransferController.getAll);

// Get Paystack transfer by reference ID
router.get("/reference/:referenceId", paystackTransferController.getByReference);

// Get Paystack transfer by ID
router.get("/:id", paystackTransferController.getById);

// Update Paystack transfer
router.put("/:id", paystackTransferController.update);

// Delete Paystack transfer
router.delete("/:id", paystackTransferController.delete);

export default router;

