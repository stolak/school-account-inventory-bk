import { Router } from "express";
import { paystackMerchantTransferRecipientController } from "../controllers/paystackMerchantTransferRecipientController";

const router = Router();

// Create a new Paystack merchant transfer recipient
router.post("/", paystackMerchantTransferRecipientController.create);

// Get all Paystack merchant transfer recipients
router.get("/", paystackMerchantTransferRecipientController.getAll);

// Get Paystack merchant transfer recipients by merchant ID
router.get("/merchant/:merchantId", paystackMerchantTransferRecipientController.getByMerchantId);

// Get Paystack merchant transfer recipient by recipient code
router.get("/code/:recipientCode", paystackMerchantTransferRecipientController.getByCode);

// Get Paystack merchant transfer recipient by ID
router.get("/:id", paystackMerchantTransferRecipientController.getById);

// Update Paystack merchant transfer recipient
router.put("/:id", paystackMerchantTransferRecipientController.update);

// Delete Paystack merchant transfer recipient
router.delete("/:id", paystackMerchantTransferRecipientController.delete);

export default router;

