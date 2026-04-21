import { Router } from "express";
import { emailController } from "../controllers/emailController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Test email configuration (public endpoint for testing)
router.post("/test", emailController.testConnection);

// Send email endpoints (protected - require authentication)
router.post("/send", authenticateJWT, emailController.sendEmail);
router.post("/welcome", authenticateJWT, emailController.sendWelcomeEmail);
router.post(
  "/password-reset",
  authenticateJWT,
  emailController.sendPasswordResetEmail
);
router.post(
  "/verification",
  authenticateJWT,
  emailController.sendVerificationEmail
);
router.post(
  "/merchant-status",
  authenticateJWT,
  emailController.sendMerchantStatusEmail
);
router.post(
  "/payment",
  authenticateJWT,
  emailController.sendPaymentNotification
);
router.post(
  "/account-update",
  authenticateJWT,
  emailController.sendAccountUpdateEmail
);
router.post(
  "/notification",
  authenticateJWT,
  emailController.sendNotificationEmail
);

// Template management (protected - require authentication)
router.get(
  "/templates",
  authenticateJWT,
  emailController.getAvailableTemplates
);

export default router;
