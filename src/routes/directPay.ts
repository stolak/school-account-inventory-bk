import { Router } from "express";
import { directPayController } from "../controllers/directPayController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Create direct pay
router.post("/", authenticateJWT, directPayController.create);

// Get all direct pays with filters
router.get("/", authenticateJWT, directPayController.getAll);

// Get statistics (must come before /:id routes)
router.get(
  "/statistics/overview",
  authenticateJWT,
  directPayController.getStatistics
);

// Initiate Mono direct pay
router.post(
  "/mono/initiate",
  authenticateJWT,
  directPayController.initiateMonoDirectPay
);

// Verify Mono direct pay by reference
router.get(
  "/mono/verify/:reference",
  // authenticateJWT,
  directPayController.verifyMonoDirectPay
);

// Get direct pays by invoice ID
router.get(
  "/invoice/:invoiceId",
  authenticateJWT,
  directPayController.getByInvoiceId
);

// Get direct pays by buyer ID
router.get(
  "/buyer/:buyerId",
  authenticateJWT,
  directPayController.getByBuyerId
);

// Get direct pays by mandate ID
router.get(
  "/mandate/:mandateId",
  authenticateJWT,
  directPayController.getByMandateId
);

// Get direct pay by reference
router.get(
  "/reference/:reference",
  // authenticateJWT,
  directPayController.getByReference
);

// Get direct pay by ID (must come last)
router.get("/:id", authenticateJWT, directPayController.getById);

// Update direct pay
router.put("/:id", authenticateJWT, directPayController.update);
router.patch("/:id", authenticateJWT, directPayController.update);

// Delete direct pay
router.delete("/:id", authenticateJWT, directPayController.remove);

export default router;

