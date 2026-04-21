import { Router } from "express";
import { paystackController } from "../controllers/paystackController";

const router = Router();

// Get list of banks from Paystack
router.get("/banks", paystackController.getBanks);

// Validate/Resolve account number
router.get("/validate-account", paystackController.validateAccountNumber);

// Create transfer recipient
router.post("/transfer-recipient", paystackController.createTransferRecipient);

// Initiate transfer
router.post("/transfer", paystackController.initiateTransfer);

// Verify transfer by reference
router.get("/transfer/verify/:reference", paystackController.verifyTransfer);

// Initiate bulk transfers
router.post("/transfer/bulk", paystackController.initiateBulkTransfer);

export default router;


