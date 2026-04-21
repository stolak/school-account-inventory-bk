import { Router } from "express";
import { loanSettingController } from "../controllers/loanSettingController";
import { authenticateJWT } from "../middlewares/auth";
const router = Router();

/**
 * @swagger
 * /api/v1/loan-settings:
 *   get:
 *     summary: Get current loan settings
 *     tags: [Loan Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loan settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     loanInterestRate:
 *                       type: number
 *                     maxLoanAmount:
 *                       type: number
 *                       nullable: true
 *                     minLoanAmount:
 *                       type: number
 *                       nullable: true
 *                     maxLoanTenure:
 *                       type: number
 *                       nullable: true
 *                     minLoanTenure:
 *                       type: number
 *                       nullable: true
 *                     incomeRatio:
 *                       type: number
 *                       nullable: true
 *                     minDownPayment:
 *                       type: number
 *                       nullable: true
 *                     insuranceRate:
 *                       type: number
 *                       nullable: true
 *                     adminFeeBase1To3:
 *                       type: number
 *                       nullable: true
 *                     adminFeeBase4To12:
 *                       type: number
 *                       nullable: true
 *                     adminFeePercentage:
 *                       type: number
 *                       nullable: true
 *                     adminFeeThreshold:
 *                       type: number
 *                       nullable: true
 *                     upfrontFeePercentage:
 *                       type: number
 *                       nullable: true
 *                     upfrontFeeCap:
 *                       type: number
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Loan settings not found
 *       500:
 *         description: Internal server error
 */
router.get("/", loanSettingController.getLoanSettings);

/**
 * @swagger
 * /api/v1/loan-settings:
 *   post:
 *     summary: Upsert loan settings (create if not exists, update if exists)
 *     tags: [Loan Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loanInterestRate
 *             properties:
 *               loanInterestRate:
 *                 type: number
 *                 description: Interest rate for loans
 *               maxLoanAmount:
 *                 type: number
 *                 description: Maximum loan amount allowed
 *               minLoanAmount:
 *                 type: number
 *                 description: Minimum loan amount allowed
 *               maxLoanTenure:
 *                 type: number
 *                 description: Maximum loan tenure in months
 *               minLoanTenure:
 *                 type: number
 *                 description: Minimum loan tenure in months
 *               incomeRatio:
 *                 type: number
 *                 description: Income ratio for loan eligibility
 *               minDownPayment:
 *                 type: number
 *                 description: Minimum down payment (percentage or amount based on your business rule)
 *               insuranceRate:
 *                 type: number
 *                 description: Insurance rate
 *               adminFeeBase1To3:
 *                 type: number
 *                 description: Admin fee base for 1-3 months
 *               adminFeeBase4To12:
 *                 type: number
 *                 description: Admin fee base for 4-12 months
 *               adminFeePercentage:
 *                 type: number
 *                 description: Admin fee percentage
 *               adminFeeThreshold:
 *                 type: number
 *                 description: Admin fee threshold
 *               upfrontFeePercentage:
 *                 type: number
 *                 description: Upfront fee percentage
 *               upfrontFeeCap:
 *                 type: number
 *                 description: Upfront fee cap
 *     responses:
 *       200:
 *         description: Loan settings upserted successfully
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateJWT, loanSettingController.upsertLoanSettings);

/**
 * @swagger
 * /api/v1/loan-settings:
 *   put:
 *     summary: Update specific loan setting fields
 *     tags: [Loan Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loanInterestRate:
 *                 type: number
 *                 description: Interest rate for loans
 *               maxLoanAmount:
 *                 type: number
 *                 description: Maximum loan amount allowed
 *               minLoanAmount:
 *                 type: number
 *                 description: Minimum loan amount allowed
 *               maxLoanTenure:
 *                 type: number
 *                 description: Maximum loan tenure in months
 *               minLoanTenure:
 *                 type: number
 *                 description: Minimum loan tenure in months
 *               incomeRatio:
 *                 type: number
 *                 description: Income ratio for loan eligibility
 *               minDownPayment:
 *                 type: number
 *               insuranceRate:
 *                 type: number
 *               adminFeeBase1To3:
 *                 type: number
 *               adminFeeBase4To12:
 *                 type: number
 *               adminFeePercentage:
 *                 type: number
 *               adminFeeThreshold:
 *                 type: number
 *               upfrontFeePercentage:
 *                 type: number
 *               upfrontFeeCap:
 *                 type: number
 *     responses:
 *       200:
 *         description: Loan settings updated successfully
 *       400:
 *         description: Bad request - no fields provided
 *       500:
 *         description: Internal server error
 */
router.put("/", authenticateJWT, loanSettingController.updateLoanSettings);

/**
 * @swagger
 * /api/v1/loan-settings/reset:
 *   post:
 *     summary: Reset loan settings to default values
 *     tags: [Loan Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loan settings reset to default values
 *       500:
 *         description: Internal server error
 */
router.post("/reset", authenticateJWT, loanSettingController.resetLoanSettings);

/**
 * @swagger
 * /api/v1/loan-settings:
 *   delete:
 *     summary: Delete loan settings
 *     tags: [Loan Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loan settings deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete("/", authenticateJWT, loanSettingController.deleteLoanSettings);

/**
 * @swagger
 * /api/v1/loan-settings/evaluate/request:
 *   post:
 *     summary: Evaluate loan request using individual parameters
 *     tags: [Loan Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monthlyIncome
 *               - months
 *               - monthlyInterestRate
 *               - requestedLoanAmount
 *             properties:
 *               monthlyIncome:
 *                 type: number
 *                 description: Customer's monthly income
 *                 example: 50000
 *               months:
 *                 type: number
 *                 description: Number of months for repayment
 *                 example: 12
 *               monthlyInterestRate:
 *                 type: number
 *                 description: Annual interest rate (e.g., 0.18 for 18%)
 *                 example: 0.18
 *               existingMonthlyRepayment:
 *                 type: number
 *                 description: Current monthly repayment
 *                 default: 0
 *                 example: 5000
 *               requestedLoanAmount:
 *                 type: number
 *                 description: The amount the customer wants to borrow
 *                 example: 100000
 *               repaymentRatio:
 *                 type: number
 *                 description: Max portion of income allowed for repayments
 *                 default: 35
 *                 example: 35
 *               maxLoanCap:
 *                 type: number
 *                 description: Maximum allowed loan amount
 *                 default: Infinity
 *                 example: 500000
 *
 *     responses:
 *       200:
 *         description: Loan evaluation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     eligible:
 *                       type: boolean
 *                       description: Whether the loan request is eligible
 *                     reasons:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of rejection reasons if not eligible
 *                     breakdown:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         requestedLoan:
 *                           type: number
 *                         monthlyRepayment:
 *                           type: number
 *
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post("/evaluate/request", loanSettingController.evaluateLoanRequest);

/**
 * @swagger
 * /api/v1/loan-settings/evaluate/object/request:
 *   post:
 *     summary: Evaluate loan request using object parameters
 *     tags: [Loan Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monthlyIncome
 *               - months
 *               - monthlyInterestRate
 *             properties:
 *               monthlyIncome:
 *                 type: number
 *                 description: Customer's monthly income
 *                 example: 50000
 *               months:
 *                 type: number
 *                 description: Number of months for repayment
 *                 example: 12
 *               monthlyInterestRate:
 *                 type: number
 *                 description: Annual interest rate (e.g., 0.18 for 18%)
 *                 example: 0.18
 *               existingMonthlyRepayment:
 *                 type: number
 *                 description: Current monthly repayment
 *                 default: 0
 *                 example: 5000
 *               requestedLoanAmount:
 *                 type: number
 *                 description: Requested loan amount (optional)
 *                 example: 100000
 *               repaymentRatio:
 *                 type: number
 *                 description: Max allowed percentage of income for loan servicing
 *                 default: 35
 *                 example: 35
 *               maxLoanCap:
 *                 type: number
 *                 description: Absolute maximum loan amount allowed
 *                 default: Infinity
 *                 example: 500000
 *     responses:
 *       200:
 *         description: Loan evaluation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     approved:
 *                       type: boolean
 *                       description: Whether the loan request is approved
 *                     reason:
 *                       type: string
 *                       description: Reason for approval or rejection
 *                     maxEligibleLoan:
 *                       type: number
 *                       description: Maximum loan amount the customer is eligible for
 *                     monthlyRepayment:
 *                       type: number
 *                       description: Monthly repayment amount
 *
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post(
  "/evaluate/object/request",
  loanSettingController.evaluateLoanRequestWithObject
);

/**
 * @swagger
 * /api/v1/loan-settings/evaluate/final-approval:
 *   post:
 *     summary: Evaluate loan request with final approval
 *     tags: [Loan Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monthlyIncome
 *               - months
 *               - monthlyInterestRate
 *             properties:
 *               monthlyIncome:
 *                 type: number
 *                 description: Customer's monthly income
 *                 example: 50000
 *               months:
 *                 type: number
 *                 description: Number of months for repayment
 *                 example: 12
 *               monthlyInterestRate:
 *                 type: number
 *                 description: Annual interest rate (e.g., 0.18 for 18%)
 *                 example: 7.5
 *               existingMonthlyRepayment:
 *                 type: number
 *                 description: Current loan repayment being serviced
 *                 default: 0
 *                 example: 5000
 *               requestedLoanAmount:
 *                 type: number
 *                 description: Optional requested loan amount
 *                 example: 100000
 *               repaymentRatio:
 *                 type: number
 *                 description: Max portion of income allowed for all repayments
 *                 default: 35
 *                 example: 35
 *               maxLoanCap:
 *                 type: number
 *                 description: Absolute maximum loan amount allowed
 *                 default: 500000
 *                 example: 500000
 *
 *     responses:
 *       200:
 *         description: Loan evaluation with final approval completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     approved:
 *                       type: boolean
 *                       description: Whether the loan request is approved
 *                     reason:
 *                       type: string
 *                       description: Reason for approval or rejection
 *                     finalApprovedLoan:
 *                       type: number
 *                       description: The final approved loan amount
 *                     maxEligibleLoan:
 *                       type: number
 *                       description: Maximum loan amount the customer is eligible for
 *                     monthlyRepayment:
 *                       type: number
 *                       description: Monthly repayment amount
 *
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post(
  "/evaluate/final-approval",
  loanSettingController.evaluateLoanRequestWithFinalApproval
);

/**
 * @swagger
 * /api/v1/loan-settings/evaluate/purchase-loan:
 *   post:
 *     summary: Evaluate purchase loan with final approval
 *     tags: [Loan Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseAmount
 *               - minDownPaymentPercent
 *               - maxLoanCap
 *               - monthlyIncome
 *               - months
 *               - monthlyInterestRate
 *             properties:
 *               purchaseAmount:
 *                 type: number
 *                 description: Total cost of item or service
 *                 example: 500000
 *               minDownPaymentPercent:
 *                 type: number
 *                 description: Minimum required down payment percentage (e.g., 20 = 20%)
 *                 example: 20.0
 *               maxLoanCap:
 *                 type: number
 *                 description: Maximum loan allowed
 *                 example: 500000
 *               downPaymentAmount:
 *                 type: number
 *                 description: Customer's proposed down payment (optional)
 *                 example: 100000
 *               monthlyIncome:
 *                 type: number
 *                 description: Customer's monthly income
 *                 example: 150000
 *               months:
 *                 type: number
 *                 description: Number of months for repayment
 *                 example: 12
 *               monthlyInterestRate:
 *                 type: number
 *                 description: Annual interest rate (e.g., 0.18 for 18%)
 *                 example: 7.5
 *               existingMonthlyRepayment:
 *                 type: number
 *                 description: Current monthly repayment (optional)
 *                 example: 0
 *               repaymentRatio:
 *                 type: number
 *                 description: Max portion of income allowed for repayments (default 35)
 *                 example: 35
 *     responses:
 *       200:
 *         description: Purchase loan evaluation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       description: Whether the purchase loan is valid
 *                     approved:
 *                       type: boolean
 *                       description: Whether the loan is approved
 *                     approvedLoanAmount:
 *                       type: number
 *                       description: Approved loan amount
 *                     requiredDownPayment:
 *                       type: number
 *                       description: Required down payment amount
 *                     customerDownPayment:
 *                       type: number
 *                       description: Customer's down payment amount
 *                     finalApprovedLoan:
 *                       type: number
 *                       description: Final approved loan amount
 *                     maxEligibleLoan:
 *                       type: number
 *                       description: Maximum eligible loan amount
 *                     monthlyRepayment:
 *                       type: number
 *                       description: Monthly repayment amount
 *                     totalRepayment:
 *                       type: number
 *                       description: Total repayment amount
 *                     totalInterest:
 *                       type: number
 *                       description: Total interest amount
 *                     adminCharge:
 *                       type: number
 *                       description: Administrative charge
 *                     insurance:
 *                       type: number
 *                       description: Insurance amount
 *                     message:
 *                       type: string
 *                       description: Evaluation message
 *                     reason:
 *                       type: string
 *                       description: Reason for approval/rejection
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post(
  "/evaluate/purchase-loan",
  loanSettingController.evaluatePurchaseLoanWithFinalApproval
);

/**
 * @swagger
 * /api/v1/loan-settings/evaluate/eligibility-and-score:
 *   post:
 *     summary: Evaluate eligibility and score for loan application
 *     tags: [Loan Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employmentStatus
 *               - employmentDuration
 *               - overdraft
 *               - creditHistory
 *               - averageBalance
 *               - monthlyIncome
 *               - months
 *             properties:
 *               employmentStatus:
 *                 type: number
 *                 description: Employment status score
 *                 example: 20
 *               employmentDuration:
 *                 type: number
 *                 description: Employment duration in months
 *                 example: 24
 *               overdraft:
 *                 type: number
 *                 description: Overdraft status (0 = no overdraft, 1 = occasional, 2+ = frequent)
 *                 example: 0
 *               creditHistory:
 *                 type: number
 *                 description: Credit history score
 *                 example: 20
 *               averageBalance:
 *                 type: number
 *                 description: Average account balance
 *                 example: 50000
 *               monthlyIncome:
 *                 type: number
 *                 description: Monthly income amount
 *                 example: 150000
 *               months:
 *                 type: number
 *                 description: Number of months for repayment
 *                 example: 12
 *               purchaseAmount:
 *                 type: number
 *                 description: Total cost of item or service (optional)
 *                 example: 500000
 *               downPaymentAmount:
 *                 type: number
 *                 description: Customer's proposed down payment (optional)
 *                 example: 100000
 *               existingMonthlyRepayment:
 *                 type: number
 *                 description: Current monthly repayment obligations (optional)
 *                 example: 20000
 *     responses:
 *       200:
 *         description: Eligibility and score evaluation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   oneOf:
 *                     - type: object
 *                       description: Simple eligibility and score result
 *                       properties:
 *                         eligibility:
 *                           type: number
 *                           description: Eligibility rating (0-1)
 *                           example: 1
 *                         score:
 *                           type: number
 *                           description: Eligibility score (0-100)
 *                           example: 100
 *                     - type: object
 *                       description: Full purchase loan evaluation result
 *                       properties:
 *                         valid:
 *                           type: boolean
 *                           description: Whether the purchase loan is valid
 *                         approved:
 *                           type: boolean
 *                           description: Whether the loan is approved
 *                         approvedLoanAmount:
 *                           type: number
 *                           description: Approved loan amount
 *                         requiredDownPayment:
 *                           type: number
 *                           description: Required down payment amount
 *                         customerDownPayment:
 *                           type: number
 *                           description: Customer's down payment amount
 *                         finalApprovedLoan:
 *                           type: number
 *                           description: Final approved loan amount
 *                         maxEligibleLoan:
 *                           type: number
 *                           description: Maximum eligible loan amount
 *                         monthlyRepayment:
 *                           type: number
 *                           description: Monthly repayment amount
 *                         totalRepayment:
 *                           type: number
 *                           description: Total repayment amount
 *                         totalInterest:
 *                           type: number
 *                           description: Total interest amount
 *                         adminCharge:
 *                           type: number
 *                           description: Administrative charge
 *                         insurance:
 *                           type: number
 *                           description: Insurance amount
 *                         message:
 *                           type: string
 *                           description: Evaluation message
 *                         reason:
 *                           type: string
 *                           description: Reason for approval/rejection
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post(
  "/evaluate/eligibility-and-score",
  loanSettingController.evaluateEligibilityAndScore
);

/**
 * @swagger
 * /api/v1/loan-settings/live-eligibility-purchase:
 *   post:
 *     summary: Live eligibility purchase evaluation for authenticated buyer
 *     tags: [Loan Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseAmount
 *               - downPaymentAmount
 *               - months
 *             properties:
 *               purchaseAmount:
 *                 type: number
 *                 description: Total cost of item or service
 *                 example: 500000
 *               downPaymentAmount:
 *                 type: number
 *                 description: Customer's down payment amount
 *                 example: 100000
 *               months:
 *                 type: number
 *                 description: Number of months for repayment
 *                 example: 12
 *     responses:
 *       200:
 *         description: Live eligibility evaluation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     eligibility:
 *                       type: number
 *                       description: Eligibility rating (0-1)
 *                     score:
 *                       type: number
 *                       description: Eligibility score
 *                     valid:
 *                       type: boolean
 *                       description: Whether the purchase loan is valid
 *                     approved:
 *                       type: boolean
 *                       description: Whether the loan is approved
 *                     approvedLoanAmount:
 *                       type: number
 *                       description: Approved loan amount
 *                     finalApprovedLoan:
 *                       type: number
 *                       description: Final approved loan amount
 *                     maxEligibleLoan:
 *                       type: number
 *                       description: Maximum eligible loan amount
 *                     monthlyRepayment:
 *                       type: number
 *                       description: Monthly repayment amount
 *                     requiredDownPayment:
 *                       type: number
 *                       description: Required down payment amount
 *                     customerDownPayment:
 *                       type: number
 *                       description: Customer's down payment amount
 *                     adminCharge:
 *                       type: number
 *                       description: Administrative charge
 *                     insurance:
 *                       type: number
 *                       description: Insurance amount
 *                     message:
 *                       type: string
 *                       description: Evaluation message
 *                     reason:
 *                       type: string
 *                       description: Reason for approval/rejection
 *       400:
 *         description: Bad request - missing required fields or unable to evaluate
 *       401:
 *         description: Unauthorized - Buyer not authenticated
 *       500:
 *         description: Internal server error
 */
router.post(
  "/live-eligibility-purchase",
  authenticateJWT,
  loanSettingController.liveEligibilityPurchase
);

export default router;
