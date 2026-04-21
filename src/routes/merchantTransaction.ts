import { Router } from "express";
import { merchantTransactionController } from "../controllers/merchantTransactionController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionStatus:
 *       type: string
 *       enum:
 *         - Pending
 *         - Completed
 *         - Failed
 *     MerchantTransactionType:
 *       type: string
 *       enum:
 *         - Credit
 *         - Debit
 *         - Refund
 *         - Payment
 *         - Withdrawal
 *         - AutoSettlement
 *         - ManualSettlement
 *         - MerchantCharge
 *         - PayoutCharge
 *         - Other
 *     MerchantTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         liftpayId:
 *           type: string
 *         merchantId:
 *           type: string
 *           format: uuid
 *         invoiceRef:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         credit:
 *           type: number
 *           format: decimal
 *         debit:
 *           type: number
 *           format: decimal
 *         transactionType:
 *           $ref: '#/components/schemas/MerchantTransactionType'
 *         transactionDate:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/TransactionStatus'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateMerchantTransactionInput:
 *       type: object
 *       required:
 *         - merchantId
 *         - transactionType
 *         - transactionDate
 *         - description
 *       properties:
 *         merchantId:
 *           type: string
 *           format: uuid
 *         invoiceRef:
 *           type: string
 *           format: uuid
 *         credit:
 *           type: number
 *           format: decimal
 *           default: 0
 *         debit:
 *           type: number
 *           format: decimal
 *           default: 0
 *         transactionType:
 *           $ref: '#/components/schemas/MerchantTransactionType'
 *         transactionDate:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/TransactionStatus'
 *     UpdateMerchantTransactionInput:
 *       type: object
 *       properties:
 *         credit:
 *           type: number
 *           format: decimal
 *         debit:
 *           type: number
 *           format: decimal
 *         transactionType:
 *           $ref: '#/components/schemas/MerchantTransactionType'
 *         transactionDate:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/TransactionStatus'
 */

/**
 * @swagger
 * /api/v1/merchant-transactions:
 *   post:
 *     summary: Create a new merchant transaction
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMerchantTransactionInput'
 *     responses:
 *       201:
 *         description: Merchant transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MerchantTransaction'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  authenticateJWT,
  merchantTransactionController.createMerchantTransaction.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions:
 *   get:
 *     summary: Get all merchant transactions with optional filters
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by merchant ID
 *       - in: query
 *         name: transactionType
 *         schema:
 *           oneOf:
 *             - $ref: '#/components/schemas/MerchantTransactionType'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/MerchantTransactionType'
 *         style: form
 *         explode: true
 *         description: Filter by transaction type (single value or multiple values)
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TransactionStatus'
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for transaction date range filter (ISO 8601 format)
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for transaction date range filter (ISO 8601 format)
 *         example: "2024-12-31T23:59:59Z"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of merchant transactions
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MerchantTransaction'
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authenticateJWT,
  merchantTransactionController.getAllMerchantTransactions.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/{id}:
 *   get:
 *     summary: Get merchant transaction by ID
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant transaction ID
 *     responses:
 *       200:
 *         description: Merchant transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MerchantTransaction'
 *       404:
 *         description: Merchant transaction not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:id",
  authenticateJWT,
  merchantTransactionController.getMerchantTransactionById.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/liftpay/{liftpayId}:
 *   get:
 *     summary: Get merchant transaction by liftpayId
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: liftpayId
 *         required: true
 *         schema:
 *           type: string
 *         description: Merchant transaction liftpayId
 *     responses:
 *       200:
 *         description: Merchant transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MerchantTransaction'
 *       404:
 *         description: Merchant transaction not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/liftpay/:liftpayId",
  authenticateJWT,
  merchantTransactionController.getMerchantTransactionByLiftpayId.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/merchant/{merchantId}:
 *   get:
 *     summary: Get all transactions for a specific merchant
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *       - in: query
 *         name: transactionType
 *         schema:
 *           oneOf:
 *             - $ref: '#/components/schemas/MerchantTransactionType'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/MerchantTransactionType'
 *         style: form
 *         explode: true
 *         description: Filter by transaction type (single value or multiple values)
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TransactionStatus'
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for transaction date range filter (ISO 8601 format)
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for transaction date range filter (ISO 8601 format)
 *         example: "2024-12-31T23:59:59Z"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of merchant transactions
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MerchantTransaction'
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/merchant/:merchantId",
  authenticateJWT,
  merchantTransactionController.getMerchantTransactionsByMerchantId.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/balance/{merchantId}:
 *   get:
 *     summary: Get merchant balance (total credit - debit)
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     responses:
 *       200:
 *         description: Merchant balance details
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
 *                     merchantId:
 *                       type: string
 *                       format: uuid
 *                     balance:
 *                       type: number
 *                     totalCredit:
 *                       type: number
 *                     totalDebit:
 *                       type: number
 *                     transactionCount:
 *                       type: integer
 *                     balanceByType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           transactionType:
 *                             $ref: '#/components/schemas/MerchantTransactionType'
 *                           balance:
 *                             type: number
 *                           totalCredit:
 *                             type: number
 *                           totalDebit:
 *                             type: number
 *                           transactionCount:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/balance/:merchantId",
  authenticateJWT,
  merchantTransactionController.getMerchantBalance.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/{id}:
 *   put:
 *     summary: Update merchant transaction
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMerchantTransactionInput'
 *     responses:
 *       200:
 *         description: Merchant transaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MerchantTransaction'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  authenticateJWT,
  merchantTransactionController.updateMerchantTransaction.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/{id}/complete:
 *   patch:
 *     summary: Mark merchant transaction as completed
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant transaction ID
 *     responses:
 *       200:
 *         description: Transaction completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MerchantTransaction'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id/complete",
  authenticateJWT,
  merchantTransactionController.completeMerchantTransaction.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/{id}:
 *   delete:
 *     summary: Delete merchant transaction
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant transaction ID
 *     responses:
 *       200:
 *         description: Merchant transaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  authenticateJWT,
  merchantTransactionController.deleteMerchantTransaction.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/manual-settlement:
 *   post:
 *     summary: Process manual settlement for merchant
 *     description: Creates multiple transactions for manual settlement including bank charges, merchant charges, and withdrawal amount. All transactions are grouped using a unique reference.
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - merchantId
 *               - amount
 *             properties:
 *               merchantId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the merchant
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 description: Total settlement amount requested
 *                 example: 50000
 *     responses:
 *       200:
 *         description: Manual settlement processed successfully
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
 *                     message:
 *                       type: string
 *                       example: "Successful manual settlement"
 *       400:
 *         description: Bad request - Invalid input, insufficient balance, or merchant not found
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
 *                   example: "Merchant balance is not enough"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/manual-settlement",
  authenticateJWT,
  merchantTransactionController.manualSettlement.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/revenue/unsettled:
 *   get:
 *     summary: Get unsettled revenue
 *     description: Get the total unsettled revenue (sum of all credits where isSettled=false and transactionType=Credit). Can be filtered by merchantId.
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional merchant ID to filter unsettled revenue for a specific merchant
 *         required: false
 *     responses:
 *       200:
 *         description: Unsettled revenue retrieved successfully
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
 *                     merchantId:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                       description: Merchant ID if filtered, null for all merchants
 *                     totalUnsettledRevenue:
 *                       type: number
 *                       format: decimal
 *                       description: Total unsettled revenue amount
 *                       example: 150000.50
 *                     transactionCount:
 *                       type: integer
 *                       description: Number of unsettled transactions
 *                       example: 25
 *                     transactions:
 *                       type: array
 *                       description: Array of unsettled transactions (only when merchantId is provided)
 *                       items:
 *                         $ref: '#/components/schemas/MerchantTransaction'
 *                     revenueByMerchant:
 *                       type: array
 *                       description: Revenue breakdown by merchant (only when merchantId is not provided)
 *                       items:
 *                         type: object
 *                         properties:
 *                           merchantId:
 *                             type: string
 *                             format: uuid
 *                           merchantName:
 *                             type: string
 *                           unsettledRevenue:
 *                             type: number
 *                             format: decimal
 *                           transactionCount:
 *                             type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/revenue/unsettled",
  authenticateJWT,
  merchantTransactionController.getUnsettledRevenue.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/merchant/{merchantId}/revenue/unsettled:
 *   get:
 *     summary: Get unsettled revenue for a specific merchant
 *     description: Get the total unsettled revenue for a specific merchant (sum of all credits where isSettled=false and transactionType=Credit).
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     responses:
 *       200:
 *         description: Merchant unsettled revenue retrieved successfully
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
 *                     merchantId:
 *                       type: string
 *                       format: uuid
 *                     totalUnsettledRevenue:
 *                       type: number
 *                       format: decimal
 *                       description: Total unsettled revenue amount
 *                       example: 75000.25
 *                     transactionCount:
 *                       type: integer
 *                       description: Number of unsettled transactions
 *                       example: 12
 *                     transactions:
 *                       type: array
 *                       description: Array of unsettled transactions
 *                       items:
 *                         $ref: '#/components/schemas/MerchantTransaction'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Merchant not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/merchant/:merchantId/revenue/unsettled",
  authenticateJWT,
  merchantTransactionController.getMerchantUnsettledRevenue.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/merchants/balances:
 *   get:
 *     summary: Get all merchants with their balances
 *     description: Retrieve all merchants along with their calculated balances (total credit - debit), transaction counts, and balance breakdown by transaction type.
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of merchants with balances retrieved successfully
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
 *                     merchants:
 *                       type: array
 *                       description: Array of merchants with their balance information
 *                       items:
 *                         type: object
 *                         properties:
 *                           merchantId:
 *                             type: string
 *                             format: uuid
 *                             description: Unique merchant identifier
 *                           liftpayId:
 *                             type: string
 *                             description: Merchant Liftpay ID
 *                           businessName:
 *                             type: string
 *                             description: Business name of the merchant
 *                           businessEmail:
 *                             type: string
 *                             description: Business email of the merchant
 *                           balance:
 *                             type: number
 *                             format: decimal
 *                             description: Total balance (credit - debit)
 *                             example: 50000.75
 *                           totalCredit:
 *                             type: number
 *                             format: decimal
 *                             description: Total credit amount
 *                             example: 150000.50
 *                           totalDebit:
 *                             type: number
 *                             format: decimal
 *                             description: Total debit amount
 *                             example: 100000.25
 *                           transactionCount:
 *                             type: integer
 *                             description: Number of completed transactions
 *                             example: 45
 *                           balanceByType:
 *                             type: array
 *                             description: Balance breakdown by transaction type
 *                             items:
 *                               type: object
 *                               properties:
 *                                 transactionType:
 *                                   $ref: '#/components/schemas/MerchantTransactionType'
 *                                 balance:
 *                                   type: number
 *                                   format: decimal
 *                                   description: Balance for this transaction type
 *                                 totalCredit:
 *                                   type: number
 *                                   format: decimal
 *                                   description: Total credit for this transaction type
 *                                 totalDebit:
 *                                   type: number
 *                                   format: decimal
 *                                   description: Total debit for this transaction type
 *                                 transactionCount:
 *                                   type: integer
 *                                   description: Number of transactions of this type
 *                     totalMerchants:
 *                       type: integer
 *                       description: Total number of merchants (including those with no transactions)
 *                       example: 150
 *                     totalMerchantsWithTransactions:
 *                       type: integer
 *                       description: Number of merchants that have at least one completed transaction
 *                       example: 120
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/merchants/balances",
  authenticateJWT,
  merchantTransactionController.getAllMerchantsWithBalances.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/credit/unsettled:
 *   get:
 *     summary: Get unsettled credit grouped by merchant
 *     description: Retrieve the sum of credit amounts grouped by merchantId where transactionType is Credit and isSettled is false.
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unsettled credit by merchant retrieved successfully
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
 *                     creditByMerchant:
 *                       type: array
 *                       description: Array of merchants with their total unsettled credit
 *                       items:
 *                         type: object
 *                         properties:
 *                           merchantId:
 *                             type: string
 *                             format: uuid
 *                             description: Unique merchant identifier
 *                           liftpayId:
 *                             type: string
 *                             description: Merchant Liftpay ID
 *                           businessName:
 *                             type: string
 *                             description: Business name of the merchant
 *                           businessEmail:
 *                             type: string
 *                             description: Business email of the merchant
 *                           totalCredit:
 *                             type: number
 *                             format: decimal
 *                             description: Sum of credit for this merchant
 *                             example: 50000.75
 *                           transactionCount:
 *                             type: integer
 *                             description: Number of unsettled credit transactions
 *                             example: 15
 *                     totalMerchants:
 *                       type: integer
 *                       description: Number of merchants with unsettled credits
 *                       example: 25
 *                     totalCredit:
 *                       type: number
 *                       format: decimal
 *                       description: Total credit across all merchants
 *                       example: 1250000.50
 *                     totalTransactions:
 *                       type: integer
 *                       description: Total number of unsettled credit transactions
 *                       example: 150
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/credit/unsettled",
  authenticateJWT,
  merchantTransactionController.getUnsettledCreditByMerchant.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/credit/unsettled/{merchantId}:
 *   get:
 *     summary: Get unsettled credit for a specific merchant
 *     description: Retrieve the sum of credit amounts for a specific merchant where transactionType is Credit and isSettled is false.
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     responses:
 *       200:
 *         description: Unsettled credit for merchant retrieved successfully
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
 *                     merchantId:
 *                       type: string
 *                       format: uuid
 *                       description: Unique merchant identifier
 *                     liftpayId:
 *                       type: string
 *                       nullable: true
 *                       description: Merchant Liftpay ID
 *                     businessName:
 *                       type: string
 *                       nullable: true
 *                       description: Business name of the merchant
 *                     businessEmail:
 *                       type: string
 *                       nullable: true
 *                       description: Business email of the merchant
 *                     totalCredit:
 *                       type: number
 *                       format: decimal
 *                       description: Sum of credit for this merchant
 *                       example: 50000.75
 *                     transactionCount:
 *                       type: integer
 *                       description: Number of unsettled credit transactions
 *                       example: 15
 *                     transactions:
 *                       type: array
 *                       description: Array of all unsettled credit transactions
 *                       items:
 *                         $ref: '#/components/schemas/MerchantTransaction'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/credit/unsettled/:merchantId",
  authenticateJWT,
  merchantTransactionController.getUnsettledCreditByMerchantId.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/credit/settle/{merchantId}:
 *   patch:
 *     summary: Settle credit transactions for a merchant
 *     description: Update isSettled to true for all transactions where merchantId matches and transactionType is Credit. This marks all unsettled credit transactions as settled.
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     responses:
 *       200:
 *         description: Credit transactions settled successfully
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
 *                     merchantId:
 *                       type: string
 *                       format: uuid
 *                       description: Unique merchant identifier
 *                     liftpayId:
 *                       type: string
 *                       description: Merchant Liftpay ID
 *                     businessName:
 *                       type: string
 *                       description: Business name of the merchant
 *                     transactionsUpdated:
 *                       type: integer
 *                       description: Number of transactions that were updated
 *                       example: 15
 *                     totalSettledCredit:
 *                       type: number
 *                       format: decimal
 *                       description: Total credit amount that was settled
 *                       example: 50000.75
 *                     message:
 *                       type: string
 *                       description: Success message
 *                       example: "Successfully settled 15 credit transaction(s) for merchant"
 *       400:
 *         description: Bad request - Merchant not found or invalid input
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
 *                   example: "Merchant not found"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/credit/settle/:merchantId",
  authenticateJWT,
  merchantTransactionController.settleCreditTransactionsByMerchantId.bind(
    merchantTransactionController
  )
);

/**
 * @swagger
 * /api/v1/merchant-transactions/automatic-settlement:
 *   post:
 *     summary: Process automatic settlement for all merchants
 *     description: |
 *       Automatically processes settlement for all merchants with balances. This endpoint:
 *       1. Gets all merchants with their balances
 *       2. Calculates discounts based on unsettled credits using tier service
 *       3. Creates discount transactions for eligible merchants
 *       4. Marks all credit transactions as settled
 *       5. Creates internal settlements for each merchant
 *       6. Initiates bulk transfer to Paystack for all settlements
 *     tags: [Merchant Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Automatic settlement processed successfully
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
 *                     message:
 *                       type: string
 *                       example: "Automatic settlement completed successfully"
 *                     settlementsProcessed:
 *                       type: integer
 *                       description: Number of merchants that were settled
 *                       example: 25
 *                     bulkTransferResult:
 *                       type: object
 *                       description: Result from Paystack bulk transfer API
 *                       properties:
 *                         status:
 *                           type: boolean
 *                         message:
 *                           type: string
 *                         data:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               reference:
 *                                 type: string
 *                               recipient:
 *                                 type: string
 *                               amount:
 *                                 type: number
 *                               transfer_code:
 *                                 type: string
 *                               currency:
 *                                 type: string
 *                               status:
 *                                 type: string
 *       400:
 *         description: Bad request - Settlement processing failed
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
 *                   example: "Failed to get merchants with balances"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/automatic-settlement",
  // authenticateJWT,
  merchantTransactionController.automaticSettlement.bind(
    merchantTransactionController
  )
);

export default router;
