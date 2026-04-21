import { Router } from "express";
import { liftpayIdController } from "../controllers/liftpayIdController";

const router = Router();

// Health check endpoint
router.get("/health", liftpayIdController.health);

// Generate LiftPay ID
router.post("/generate", liftpayIdController.generateLiftPayId);

// Validate LiftPay ID
router.post("/validate", liftpayIdController.validateLiftPayId);

// Get sequences for a specific prefix
router.get("/sequences/:prefix", liftpayIdController.getSequencesForPrefix);

// Get statistics
router.get("/statistics", liftpayIdController.getStatistics);

export default router;
