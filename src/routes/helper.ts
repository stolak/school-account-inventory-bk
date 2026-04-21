import { Router } from "express";
import { helperController } from "../controllers/helperController";

const router = Router();

// Health check endpoint
router.get("/health", helperController.health);

// OTP generation endpoints (no authentication required)
router.post("/phone-otp", helperController.generatePhoneOTP);
router.post("/email-otp", helperController.generateEmailOTP);

export default router;
