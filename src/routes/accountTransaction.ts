import { Router } from "express";
import { accountTransactionController } from "../controllers/accountTransactionController";

const router = Router();

router.post("/debit", accountTransactionController.debitAccount);
router.post("/credit", accountTransactionController.creditAccount);
router.delete("/rollback/:ref", accountTransactionController.rollBack);

export default router;
