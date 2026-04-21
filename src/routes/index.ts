import { authenticateJWT } from "../middlewares/auth";
import authRoutes from "./auth";
import protectedRoutes from "./protected";
import monoRoutes from "./mono";
import buyerRoutes from "./buyer";
import merchantRoutes from "./merchant";
import uploadRoutes from "./upload";
import emailRoutes from "./email";
import locationRoutes from "./location";
import bankRoutes from "./bank";
import helperRoutes from "./helper";
import liftpayIdRoutes from "./liftpayId";
import businessCategoryRoutes from "./businessCategory";
import loanSettingRoutes from "./loanSetting";
import dashboardRoutes from "./dashboard";
import loanPenaltyRoutes from "./loanPenalty";
import loanRoutes from "./loan";
import loanDebitTrialRoutes from "./loanDebitTrial";
import loanTransactionRoutes from "./loanTransaction";
import eligibilityAndScoreRoutes from "./eligibilityAndScore";
import loanPenaltyScheduleRoutes from "./loanPenaltySchedule";
import invoiceRoutes from "./invoice";
import itemRoutes from "./item";
import merchantTransactionRoutes from "./merchantTransaction";
import tierRoutes from "./tier";
import outletRoutes from "./outlet";
import revenueRoutes from "./revenue";
import monoConnectRoutes from "./monoConnect";
import accountDetailsRoutes from "./accountDetails";
import invoiceMandateRoutes from "./invoiceMandate";
import directPayRoutes from "./directPay";
import disbursementRoutes from "./disbursement";
import paystackRoutes from "./paystack";
import paystackMerchantTransferRecipientRoutes from "./paystackMerchantTransferRecipient";
import paystackTransferRoutes from "./paystackTransfer";
import settlementSettingRoutes from "./settlementSetting";
import timeOutSettingRoutes from "./timeOutSetting";
import scoringRoutes from "./scoring";
import scoringInputSnapshotRoutes from "./scoringInputSnapshot";
import bankStatementAnalysisRoutes from "./bankStatementAnalysis";
import { Router } from "express";

const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", authenticateJWT, protectedRoutes);
router.use("/verify", monoRoutes);
router.use("/buyers", buyerRoutes);
router.use("/merchants", merchantRoutes);
router.use("/upload", uploadRoutes);
router.use("/email", emailRoutes);
router.use("/locations", locationRoutes);
router.use("/banks", bankRoutes);
router.use("/helper", helperRoutes);
router.use("/liftpay-id", liftpayIdRoutes);
router.use("/business-categories", businessCategoryRoutes);
router.use("/loan-settings", loanSettingRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/loan-penalties", loanPenaltyRoutes);
router.use("/loans", loanRoutes);
router.use("/loan-debit-trials", loanDebitTrialRoutes);
router.use("/loan-transactions", loanTransactionRoutes);
router.use("/eligibility-scores", eligibilityAndScoreRoutes);
router.use("/loan-penalty-schedules", loanPenaltyScheduleRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/items", itemRoutes);
router.use("/merchant-transactions", merchantTransactionRoutes);
router.use("/tiers", tierRoutes);
router.use("/outlets", outletRoutes);
router.use("/revenues", revenueRoutes);
router.use("/mono-connects", monoConnectRoutes);
router.use("/account-details", accountDetailsRoutes);
router.use("/invoice-mandates", invoiceMandateRoutes);
router.use("/direct-pays", directPayRoutes);
router.use("/disbursements", disbursementRoutes);
router.use("/paystack", paystackRoutes);
router.use("/paystack-merchant-transfer-recipients", paystackMerchantTransferRecipientRoutes);
router.use("/paystack-transfers", paystackTransferRoutes);
router.use("/settlement-settings", settlementSettingRoutes);
router.use("/timeout-settings", timeOutSettingRoutes);
router.use("/scoring", scoringRoutes);
router.use("/scoring-input-snapshots", scoringInputSnapshotRoutes);
router.use("/bank-statement-analysis", bankStatementAnalysisRoutes);

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

export default router;
