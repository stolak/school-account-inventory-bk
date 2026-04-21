import { Router } from "express";
import { invoiceMandateController } from "../controllers/invoiceMandateController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Create invoice mandate
router.post("/", authenticateJWT, invoiceMandateController.create);

// Get all invoice mandates with filters
router.get("/", authenticateJWT, invoiceMandateController.getAll);

// Get statistics (must come before /:id routes)
router.get(
  "/statistics/overview",
  authenticateJWT,
  invoiceMandateController.getStatistics
);

// Get mandates by invoice ID
router.get(
  "/invoice/:invoiceId",
  authenticateJWT,
  invoiceMandateController.getByInvoiceId
);

// Get mandates by buyer ID
router.get(
  "/buyer/:buyerId",
  authenticateJWT,
  invoiceMandateController.getByBuyerId
);

// Get mandates by loan ID
router.get(
  "/loan/:loanId",
  authenticateJWT,
  invoiceMandateController.getByLoanId
);

// Get mandate by reference ID
router.get(
  "/reference/:referenceId",
  authenticateJWT,
  invoiceMandateController.getByReferenceId
);

// Get invoice mandate by ID (must come last)
router.get("/:id", authenticateJWT, invoiceMandateController.getById);

// Update invoice mandate
router.put("/:id", authenticateJWT, invoiceMandateController.update);
router.patch("/:id", authenticateJWT, invoiceMandateController.update);

// Delete invoice mandate
router.delete("/:id", authenticateJWT, invoiceMandateController.remove);

export default router;

