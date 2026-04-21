import { Router } from "express";
import { accountDetailsController } from "../controllers/accountDetailsController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AccountDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         accountId:
 *           type: string
 *           nullable: true
 *           description: Optional Mono account ID
 *         buyerId:
 *           type: string
 *           format: uuid
 *         buyer:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             liftpayId:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *             phoneNumber:
 *               type: string
 *         bankStatement:
 *           type: string
 *           nullable: true
 *           description: Bank statement data (text or JSON string)
 *         employmentType:
 *           type: string
 *           nullable: true
 *           description: Type of employment (e.g., Salaried, Self-employed)
 *         monthlyIncome:
 *           type: number
 *           nullable: true
 *           description: Monthly income amount
 *         overdraft:
 *           type: number
 *           nullable: true
 *           description: Overdraft amount
 *         existingLoanRepayment:
 *           type: number
 *           nullable: true
 *           description: Existing loan repayment amount
 *         creditHistory:
 *           type: string
 *           nullable: true
 *           description: Credit history data (text or JSON string)
 *         employmentDuration:
 *           type: integer
 *           nullable: true
 *           description: Employment duration in months
 *         averageBalance:
 *           type: number
 *           nullable: true
 *           description: Average account balance
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateAccountDetailsInput:
 *       type: object
 *       required:
 *         - buyerId
 *       properties:
 *         buyerId:
 *           type: string
 *           format: uuid
 *           description: Buyer ID to link to
 *         accountId:
 *           type: string
 *           description: Optional Mono account ID
 *         bankStatement:
 *           type: string
 *           description: Bank statement data
 *         employmentType:
 *           type: string
 *           description: Type of employment
 *         monthlyIncome:
 *           type: number
 *           description: Monthly income amount
 *         overdraft:
 *           type: number
 *           description: Overdraft amount
 *         existingLoanRepayment:
 *           type: number
 *           description: Existing loan repayment amount
 *         creditHistory:
 *           type: string
 *           description: Credit history data
 *         employmentDuration:
 *           type: integer
 *           description: Employment duration in months
 *         averageBalance:
 *           type: number
 *           description: Average account balance
 *
 *     UpdateAccountDetailsInput:
 *       type: object
 *       properties:
 *         accountId:
 *           type: string
 *           nullable: true
 *         bankStatement:
 *           type: string
 *           nullable: true
 *         employmentType:
 *           type: string
 *           nullable: true
 *         monthlyIncome:
 *           type: number
 *           nullable: true
 *         overdraft:
 *           type: number
 *           nullable: true
 *         existingLoanRepayment:
 *           type: number
 *           nullable: true
 *         creditHistory:
 *           type: string
 *           nullable: true
 *         employmentDuration:
 *           type: integer
 *           nullable: true
 *         averageBalance:
 *           type: number
 *           nullable: true
 */

/**
 * @swagger
 * /api/v1/account-details:
 *   post:
 *     summary: Create a new AccountDetails record
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAccountDetailsInput'
 *     responses:
 *       201:
 *         description: AccountDetails record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AccountDetails'
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateJWT, accountDetailsController.create);

/**
 * @swagger
 * /api/v1/account-details/upsert:
 *   post:
 *     summary: Create or update AccountDetails record
 *     description: If a record exists for the buyer with the same accountId, it will be updated. Otherwise, a new record is created.
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAccountDetailsInput'
 *     responses:
 *       200:
 *         description: AccountDetails record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AccountDetails'
 *                 isNew:
 *                   type: boolean
 *                   description: Whether a new record was created
 *       201:
 *         description: AccountDetails record created successfully
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post("/upsert", authenticateJWT, accountDetailsController.upsert);

/**
 * @swagger
 * /api/v1/account-details/exchange-mono-code:
 *   post:
 *     summary: Exchange Mono authorization code for account access
 *     description: Exchanges a Mono authorization code for account access token and creates/updates AccountDetails record
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - buyerId
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mono authorization code received from OAuth callback
 *                 example: "code_abc123xyz"
 *               buyerId:
 *                 type: string
 *                 format: uuid
 *                 description: Buyer ID to link the account to
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Mono code exchanged successfully and AccountDetails updated
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
 *                   description: Mono API response containing account_id and token
 *                   properties:
 *                     account_id:
 *                       type: string
 *                       description: Mono account ID
 *                     token:
 *                       type: string
 *                       description: Access token for Mono API
 *       400:
 *         description: Bad request - validation error or Mono API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 */
router.post(
  "/exchange-mono-code",
  authenticateJWT,
  accountDetailsController.exchangeMonoCode
);

/**
 * @swagger
 * /api/v1/account-details:
 *   get:
 *     summary: Get all AccountDetails records with filters
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by buyer ID
 *       - in: query
 *         name: employmentType
 *         schema:
 *           type: string
 *         description: Filter by employment type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of AccountDetails records retrieved successfully
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
 *                     accountDetails:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AccountDetails'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticateJWT, accountDetailsController.list);

/**
 * @swagger
 * /api/v1/account-details/mono/accounts:
 *   get:
 *     summary: Get all Mono accounts
 *     description: Fetches all accounts from Mono API
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mono accounts retrieved successfully
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
 *                   description: Mono API response containing all accounts
 *       400:
 *         description: Bad request - Mono API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 */
router.get(
  "/mono/accounts",
  authenticateJWT,
  accountDetailsController.getMonoAccounts
);

/**
 * @swagger
 * /api/v1/account-details/mono/accounts/buyer/{buyerId}:
 *   get:
 *     summary: Get Mono accounts linked to a buyer
 *     description: Fetches Mono account(s) for a buyer via AccountDetails mapping.
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: Mono accounts retrieved successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/mono/accounts/buyer/:buyerId",
  // authenticateJWT,
  accountDetailsController.getMonoAccountByBuyerId
);

/**
 * @swagger
 * /api/v1/account-details/mono/{accountId}:
 *   get:
 *     summary: Get Mono account details by account ID
 *     description: Fetches account details from Mono API using the account ID
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mono account ID
 *         example: "account_123456789"
 *     responses:
 *       200:
 *         description: Mono account details retrieved successfully
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
 *                   description: Mono API response containing account details
 *       400:
 *         description: Bad request - validation error or Mono API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 */
router.get(
  "/mono/:accountId",
  authenticateJWT,
  accountDetailsController.getMonoAccountById
);

/**
 * @swagger
 * /api/v1/account-details/mono/{accountId}/statements:
 *   get:
 *     summary: Get account statements from Mono API
 *     description: Fetches account statements from Mono API using the account ID
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mono account ID
 *         example: "account_123456789"
 *     responses:
 *       200:
 *         description: Account statements retrieved successfully
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
 *                   description: Mono API response containing account statements
 *       400:
 *         description: Bad request - validation error or Mono API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 */
router.get(
  "/mono/:accountId/statements",
  authenticateJWT,
  accountDetailsController.getStatement
);

/**
 * @swagger
 * /api/v1/account-details/{id}:
 *   get:
 *     summary: Get AccountDetails by ID
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: AccountDetails ID
 *     responses:
 *       200:
 *         description: AccountDetails record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AccountDetails'
 *       404:
 *         description: AccountDetails not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authenticateJWT, accountDetailsController.getById);

/**
 * @swagger
 * /api/v1/account-details/buyer/{buyerId}:
 *   get:
 *     summary: Get all AccountDetails records by buyer ID
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: AccountDetails records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AccountDetails'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/buyer/:buyerId",
  authenticateJWT,
  accountDetailsController.getByBuyerId
);

/**
 * @swagger
 * /api/v1/account-details/buyer/{buyerId}/latest:
 *   get:
 *     summary: Get latest AccountDetails by buyer ID
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: Latest AccountDetails record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AccountDetails'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/buyer/:buyerId/latest",
  authenticateJWT,
  accountDetailsController.getLatestByBuyerId
);

/**
 * @swagger
 * /api/v1/account-details/buyer/{buyerId}/set-status-false:
 *   patch:
 *     summary: Set account details status to false by buyer ID
 *     description: Updates all active account details (status=true) for a buyer to status=false
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: Account details status updated successfully
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
 *                     buyerId:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     updatedCount:
 *                       type: number
 *                       description: Number of account details updated
 *                       example: 2
 *                     message:
 *                       type: string
 *                       example: "Successfully set 2 account detail(s) status to false"
 *       400:
 *         description: Bad request - Buyer not found or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Buyer not found"
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/buyer/:buyerId/set-status-false",
  authenticateJWT,
  accountDetailsController.setStatusToFalseByBuyerId
);

/**
 * @swagger
 * /api/v1/account-details/buyer/{buyerId}/unlink:
 *   patch:
 *     summary: Unlink buyer from AccountDetails
 *     description: Sets all active account details (status=true) for a buyer to status=false
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: Buyer unlinked successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/buyer/:buyerId/unlink",
  authenticateJWT,
  accountDetailsController.unlinkBuyerFromAccountDetails
);

/**
 * @swagger
 * /api/v1/account-details/buyer/{buyerId}/accounts/count-last-6-months:
 *   get:
 *     summary: Get total number of accounts associated with a buyer in the last 6 months
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: Count retrieved successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/buyer/:buyerId/accounts/count-last-6-months",
  authenticateJWT,
  accountDetailsController.getTotalAccountsAssociatedWithBuyerLastSixMonths
);

/**
 * @swagger
 * /api/v1/account-details/account/{accountId}:
 *   get:
 *     summary: Get AccountDetails by account ID
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mono account ID
 *     responses:
 *       200:
 *         description: AccountDetails record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AccountDetails'
 *       404:
 *         description: AccountDetails not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/account/:accountId",
  authenticateJWT,
  accountDetailsController.getByAccountId
);

/**
 * @swagger
 * /api/v1/account-details/{id}:
 *   patch:
 *     summary: Update AccountDetails record
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: AccountDetails ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAccountDetailsInput'
 *     responses:
 *       200:
 *         description: AccountDetails record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AccountDetails'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: AccountDetails not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id", authenticateJWT, accountDetailsController.update);

/**
 * @swagger
 * /api/v1/account-details/{id}:
 *   delete:
 *     summary: Delete AccountDetails record
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: AccountDetails ID
 *     responses:
 *       200:
 *         description: AccountDetails record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "AccountDetails record deleted successfully"
 *       400:
 *         description: Bad request
 *       404:
 *         description: AccountDetails not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticateJWT, accountDetailsController.delete);

/**
 * @swagger
 * /api/v1/account-details/variable-mandate:
 *   post:
 *     summary: Create a variable mandate for recurring Mono debit
 *     description: Initiates a recurring debit payment with a variable mandate that allows debiting up to a maximum amount. Creates an e-mandate for variable amount debits.
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - maxAmount
 *               - startDate
 *               - reference
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: Customer ID for the mandate
 *                 example: "customer_123456789"
 *               maxAmount:
 *                 type: number
 *                 description: Maximum amount for each debit
 *                 example: 50000
 *                 minimum: 0
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for the mandate (YYYY-MM-DD)
 *                 example: "2024-01-01"
 *               reference:
 *                 type: string
 *                 description: Reference identifier for the payment/mandate
 *                 example: "REF123456789"
 *     responses:
 *       200:
 *         description: Variable mandate created successfully
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
 *                   description: Mono API response containing payment initiation and mandate details
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 */
router.post(
  "/variable-mandate",
  authenticateJWT,
  accountDetailsController.createVariableMandate
);

/**
 * @swagger
 * /api/v1/account-details/analyze-bank-statement:
 *   post:
 *     summary: Analyze bank statement using OpenAI
 *     description: Uses AI to analyze bank statement transaction data and extract financial metrics including employment type, income, overdrafts, and loan repayments
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 description: Array of transaction records from bank statement
 *                 items:
 *                   type: object
 *                 example:
 *                   - { date: "2024-01-01", amount: 50000, narration: "SALARY", type: "credit" }
 *                   - { date: "2024-01-15", amount: -5000, narration: "LOAN REPAYMENT", type: "debit" }
 *     responses:
 *       200:
 *         description: Bank statement analyzed successfully
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
 *                     EmploymentType:
 *                       type: string
 *                       enum: [Employed, Self-employed, Unemployed]
 *                       example: "Employed"
 *                     MonthlySalary:
 *                       type: number
 *                       nullable: true
 *                       example: 50000
 *                     AverageMonthlyIncome:
 *                       type: number
 *                       example: 50000
 *                     NumberOfMonthsInCurrentPlaceOfWork:
 *                       type: number
 *                       nullable: true
 *                       example: 12
 *                     NumberOfOverdraft:
 *                       type: number
 *                       example: 2
 *                     AverageAccountBalance:
 *                       type: number
 *                       example: 150000
 *                     TotalExistingLoanRepayment:
 *                       type: number
 *                       example: 5000
 *                     CurrentBalance:
 *                       type: number
 *                       example: 200000
 *       400:
 *         description: Bad request - validation error or analysis failure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/account-details/mono/customers:
 *   post:
 *     summary: Create a new Mono customer
 *     description: Creates a new customer in Mono API
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identity
 *               - email
 *               - type
 *               - first_name
 *               - last_name
 *               - phone
 *             properties:
 *               identity:
 *                 type: object
 *                 required:
 *                   - type
 *                   - number
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [bvn, nin, phone]
 *                     example: "bvn"
 *                   number:
 *                     type: string
 *                     example: "12345678901"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "bobohavilah@gmail.com"
 *               type:
 *                 type: string
 *                 enum: [individual, business]
 *                 example: "individual"
 *               first_name:
 *                 type: string
 *                 example: "Stephen"
 *               last_name:
 *                 type: string
 *                 example: "Akin"
 *               address:
 *                 type: string
 *                 example: "Abuja"
 *               phone:
 *                 type: string
 *                 example: "08032196222"
 *     responses:
 *       201:
 *         description: Customer created successfully
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
 *                   description: Mono API response containing customer details
 *       400:
 *         description: Bad request - validation error or Mono API error
 */
router.post(
  "/mono/customers",
  authenticateJWT,
  accountDetailsController.createMonoCustomer
);

/**
 * @swagger
 * /api/v1/account-details/mono/customers/list:
 *   get:
 *     summary: Get all Mono customers
 *     description: Fetches all customers from Mono API
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
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
 *                   description: Mono API response containing all customers
 *       400:
 *         description: Bad request - Mono API error
 */
router.get(
  "/mono/customers/list",
  authenticateJWT,
  accountDetailsController.getAllMonoCustomers
);

/**
 * @swagger
 * /api/v1/account-details/mono/customers/{customerId}:
 *   get:
 *     summary: Get Mono customer by ID
 *     description: Fetches customer details from Mono API using the customer ID
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mono customer ID
 *         example: "customer_123456789"
 *     responses:
 *       200:
 *         description: Customer details retrieved successfully
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
 *                   description: Mono API response containing customer details
 *       400:
 *         description: Bad request - validation error or Mono API error
 */
router.get(
  "/mono/customers/:customerId",
  authenticateJWT,
  accountDetailsController.getMonoCustomerById
);

/**
 * @swagger
 * /api/v1/account-details/mono/customers/{customerId}:
 *   patch:
 *     summary: Update Mono customer by ID
 *     description: Updates customer details in Mono API using PATCH method
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mono customer ID
 *         example: "customer_123456789"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newemail@gmail.com"
 *               first_name:
 *                 type: string
 *                 example: "John"
 *               last_name:
 *                 type: string
 *                 example: "Doe"
 *               address:
 *                 type: string
 *                 example: "Lagos"
 *               phone:
 *                 type: string
 *                 example: "08012345678"
 *     responses:
 *       200:
 *         description: Customer updated successfully
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
 *                   description: Mono API response containing updated customer details
 *       400:
 *         description: Bad request - validation error or Mono API error
 */
router.patch(
  "/mono/customers/:customerId",
  authenticateJWT,
  accountDetailsController.updateMonoCustomer
);

/**
 * @swagger
 * /api/v1/account-details/mono/customers/{customerId}:
 *   delete:
 *     summary: Delete Mono customer by ID
 *     description: Deletes a customer from Mono API
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mono customer ID
 *         example: "customer_123456789"
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Customer deleted successfully"
 *                 data:
 *                   type: object
 *                   description: Mono API response
 *       400:
 *         description: Bad request - validation error or Mono API error
 */
router.delete(
  "/mono/customers/:customerId",
  authenticateJWT,
  accountDetailsController.deleteMonoCustomer
);

/**
 * @swagger
 * /api/v1/account-details/validate-and-create/{accountId}:
 *   post:
 *     summary: Validate Mono account and create/update account details
 *     description: |
 *       Validates a Mono account by:
 *       1. Retrieving account details from Mono API
 *       2. Retrieving customer details from Mono API
 *       3. Fetching account statement
 *       4. Analyzing bank statement using OpenAI
 *       5. Updating AccountDetails record with analyzed data
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mono account ID
 *         example: "acc_123456789"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyerId
 *             properties:
 *               buyerId:
 *                 type: string
 *                 format: uuid
 *                 description: Buyer ID from database
 *                 example: "buyer-uuid-here"
 *     responses:
 *       200:
 *         description: Account validated and details updated successfully
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
 *                   description: Bank statement analysis result
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     data:
 *                       type: object
 *                       properties:
 *                         EmploymentType:
 *                           type: string
 *                           enum: [Employed, Self-employed, Unemployed]
 *                         MonthlySalary:
 *                           type: number
 *                           nullable: true
 *                         AverageMonthlyIncome:
 *                           type: number
 *                         NumberOfMonthsInCurrentPlaceOfWork:
 *                           type: number
 *                           nullable: true
 *                         NumberOfOverdraft:
 *                           type: number
 *                         AverageAccountBalance:
 *                           type: number
 *                         TotalExistingLoanRepayment:
 *                           type: number
 *                         CurrentBalance:
 *                           type: number
 *       400:
 *         description: Bad request - validation error, Mono API error, or analysis failure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 */
router.post(
  "/validate-and-create/:accountId",
  authenticateJWT,
  accountDetailsController.validateAndCreateAccount
);

/**
 * @swagger
 * /api/v1/account-details/mono/mandates/{mandateId}:
 *   get:
 *     summary: Get Mono mandate by ID
 *     description: Fetches mandate details from Mono API using the mandate ID
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mandateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mono mandate ID
 *         example: "mmc_682b9c5803c0b736078889a3"
 *     responses:
 *       200:
 *         description: Mandate details retrieved successfully
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
 *                     status:
 *                       type: string
 *                       example: "successful"
 *                     message:
 *                       type: string
 *                       example: "request completed successfully"
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "mmc_682b9c5803c0b736078889a3"
 *                         status:
 *                           type: string
 *                           example: "approved"
 *                         reference:
 *                           type: string
 *                           example: "refO2b9O9E03m"
 *                         amount:
 *                           type: number
 *                           example: 80030
 *                         balance:
 *                           type: number
 *                           example: 80030
 *                         mandate_type:
 *                           type: string
 *                           example: "emandate"
 *                         debit_type:
 *                           type: string
 *                           example: "variable"
 *                         account_name:
 *                           type: string
 *                           example: "SAMUEL OLAMIDE"
 *                         account_number:
 *                           type: string
 *                           example: "0123456789"
 *                         live_mode:
 *                           type: boolean
 *                           example: true
 *                         approved:
 *                           type: boolean
 *                           example: true
 *                         ready_to_debit:
 *                           type: boolean
 *                           example: false
 *                         nibss_code:
 *                           type: string
 *                           example: "RC227914/1580/0008721216"
 *                         institution:
 *                           type: object
 *                           properties:
 *                             bank_code:
 *                               type: string
 *                               example: "672"
 *                             nip_code:
 *                               type: string
 *                               example: "090267"
 *                             name:
 *                               type: string
 *                               example: "Kuda Bank"
 *                         customer:
 *                           type: string
 *                           example: "682b96680a74b6af4de736ee"
 *                         narration:
 *                           type: string
 *                           example: "Subscriptions"
 *                         redirect_url:
 *                           type: string
 *                           example: "https://mono.co"
 *                         start_date:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-05-21T00:00:00.000Z"
 *                         end_date:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-08-04T22:59:59.999Z"
 *                         date:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-05-19T21:02:16.342Z"
 *       400:
 *         description: Bad request - validation error or Mono API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 */
router.get(
  "/mono/mandates/:mandateId",
  authenticateJWT,
  accountDetailsController.getMonoMandateById
);

/**
 * @swagger
 * /api/v1/account-details/mono/mandates/{mandateId}/cancel:
 *   patch:
 *     summary: Cancel Mono mandate by ID
 *     description: Cancels and deletes a mandate from Mono API. Once cancelled, the mandate cannot be used again.
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mandateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mono mandate ID to cancel
 *         example: "mmc_682b9c5803c0b736078889a3"
 *     responses:
 *       200:
 *         description: Mandate cancelled successfully
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
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     response_code:
 *                       type: string
 *                       example: "200"
 *                     message:
 *                       type: string
 *                       example: "This mandate is now cancelled and deleted, and can't be used again"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-05-19T22:15:56.343Z"
 *                     documentation:
 *                       type: string
 *                       example: "https://mono.co/docs/error-codes/200"
 *                     data:
 *                       type: object
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: Bad request - validation error or Mono API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/mono/mandates/:mandateId/cancel",
  authenticateJWT,
  accountDetailsController.cancelMonoMandate
);

/**
 * @swagger
 * /api/v1/account-details/mono/mandates/{mandateId}/debit:
 *   post:
 *     summary: Debit Mono mandate by ID
 *     description: Initiates a debit transaction against an approved mandate. The mandate must be approved and ready to debit.
 *     tags: [AccountDetails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mandateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mono mandate ID
 *         example: "mmc_682b9c5803c0b736078889a3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reference
 *               - narration
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount to debit in kobo (smallest currency unit)
 *                 example: 50000
 *                 minimum: 1
 *               reference:
 *                 type: string
 *                 description: Unique reference identifier for the debit transaction
 *                 example: "REF123456789"
 *               narration:
 *                 type: string
 *                 description: Transaction narration/description
 *                 example: "Loan repayment"
 *     responses:
 *       200:
 *         description: Debit initiated successfully
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
 *                   description: Mono API response containing debit transaction details
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "successful"
 *                     message:
 *                       type: string
 *                       example: "request completed successfully"
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "payment_123456789"
 *                         status:
 *                           type: string
 *                           example: "pending"
 *                         amount:
 *                           type: number
 *                           example: 50000
 *                         reference:
 *                           type: string
 *                           example: "REF123456789"
 *                         narration:
 *                           type: string
 *                           example: "Loan repayment"
 *       400:
 *         description: Bad request - validation error or Mono API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 */
router.post(
  "/mono/mandates/:mandateId/debit",
  authenticateJWT,
  accountDetailsController.debitMonoMandate
);

router.post(
  "/analyze-bank-statement",

  accountDetailsController.analyzeBankStatement
);

export default router;
