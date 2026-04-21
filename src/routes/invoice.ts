import { Router } from "express";
import { invoiceController } from "../controllers/invoiceController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Create new invoice with items
router.post("/", authenticateJWT, invoiceController.create);

// Get all invoices with filters and pagination
router.get("/", invoiceController.list);

// Get invoice by LiftPay ID (must be before /:id route)
router.get("/liftpay/:liftpayId", invoiceController.getByLiftpayId);

// Get merchant invoices
router.get("/merchant/:merchantId", invoiceController.getByMerchantId);

// Get merchant invoice statistics
router.get("/merchant/:merchantId/stats", invoiceController.getMerchantStats);

// Get buyer invoices
router.get("/buyer/:buyerId", invoiceController.getByBuyerId);

// Get invoices by customer email (authenticated user)
router.get(
  "/my-invoices",
  authenticateJWT,
  invoiceController.getByCustomerEmail
);

// Get invoice by ID
router.get("/:id", invoiceController.getById);

// Calculate invoice total
router.get("/:id/total", invoiceController.calculateTotal);

// Approve invoice and create loan (authenticated buyer)
router.post(
  "/:id/approve-and-create-loan",
  authenticateJWT,
  invoiceController.approveAndCreateLoan
);

// Validate post-transaction (mandate + direct debit) for invoice
router.get(
  "/:id/post-transaction-validation",
  // authenticateJWT,
  invoiceController.validatePostTransaction
);

// Validate mandate by referenceId or invoiceId
router.get(
  "/validate/mandate",
  // authenticateJWT,
  invoiceController.validateMandate
);

// Initiate upfront payment for invoice
router.post(
  "/:id/initiate-upfront-payment",
  authenticateJWT,
  invoiceController.initiateUpfrontPayment
);

// Validate mandate, verify down payment, and create loan invoice
router.post(
  "/validate/mandate/downpayment/and/create/loan",
  authenticateJWT,
  invoiceController.validateMandateDownPaymentAndCreateLoan
);

// Update invoice status
router.patch("/:id/status", invoiceController.updateStatus);

// Update invoice
router.patch("/:id", invoiceController.update);

// Delete invoice
router.delete("/:id", invoiceController.delete);

export default router;
