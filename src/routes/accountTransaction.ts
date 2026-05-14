import { Router } from "express";
import { accountTransactionController } from "../controllers/accountTransactionController";

const router = Router();

router.get("/report-by-account", accountTransactionController.getAccountTransactionByAccountReport);
router.get("/transaction-log", accountTransactionController.getAccountTransactionLog);
router.post("/debit", accountTransactionController.debitAccount);
router.post("/credit", accountTransactionController.creditAccount);
router.delete("/rollback/:ref", accountTransactionController.rollBack);

export default router;
