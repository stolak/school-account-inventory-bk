import { Router } from "express";
import { accountTransactionController } from "../controllers/accountTransactionController";

const router = Router();

router.get("/balance-as-at", accountTransactionController.getAccountBalanceAsAtDate);
router.get("/report-by-account", accountTransactionController.getAccountTransactionByAccountReport);
router.get(
  "/report-by-head-subhead",
  accountTransactionController.getAccountTransactionByHeadSubheadReport
);
router.get("/transaction-log", accountTransactionController.getAccountTransactionLog);
router.post("/debit", accountTransactionController.debitAccount);
router.post("/credit", accountTransactionController.creditAccount);
router.delete("/rollback/:ref", accountTransactionController.rollBack);

export default router;
