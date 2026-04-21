import { Router } from "express";
import { loanTransactionController } from "../controllers/loanTransactionController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: LoanTransactions
 *   description: Loan transaction management endpoints
 */

/**
 * @swagger
 * /api/v1/loan-transactions:
 *   post:
 *     summary: Create a new loan transaction
 *     tags: [LoanTransactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loanId
 *               - transactionType
 *               - creditAmount
 *               - debitAmount
 *               - transactionDate
 *               - description
 *             properties:
 *               loanId:
 *                 type: string
 *                 description: ID of the loan
 *               transactionType:
 *                 type: string
 *                 enum: [principal, interest, penalty, other]
 *                 description: Type of transaction
 *               transactionStatus:
 *                 type: string
 *                 enum: [Pending, Completed]
 *                 description: Status of transaction (default is Pending)
 *               creditAmount:
 *                 type: number
 *                 description: Credit amount
 *               debitAmount:
 *                 type: number
 *                 description: Debit amount
 *               transactionDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of transaction
 *               description:
 *                 type: string
 *                 description: Transaction description
 *     responses:
 *       201:
 *         description: Loan transaction created successfully
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
  loanTransactionController.createLoanTransaction
);

/**
 * @swagger
 * /api/v1/loan-transactions:
 *   get:
 *     summary: Get all loan transactions with pagination and filters
 *     tags: [LoanTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [principal, interest, penalty, other]
 *         description: Filter by transaction type
 *       - in: query
 *         name: transactionStatus
 *         schema:
 *           type: string
 *           enum: [Pending, Completed]
 *         description: Filter by transaction status
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
 *         description: List of loan transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authenticateJWT,
  loanTransactionController.getAllLoanTransactions
);

/**
 * @swagger
 * /api/v1/loan-transactions/{id}:
 *   get:
 *     summary: Get loan transaction by ID
 *     tags: [LoanTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan transaction ID
 *     responses:
 *       200:
 *         description: Loan transaction retrieved successfully
 *       404:
 *         description: Loan transaction not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:id",
  authenticateJWT,
  loanTransactionController.getLoanTransactionById
);

/**
 * @swagger
 * /api/v1/loan-transactions/liftpay-id/{liftpayId}:
 *   get:
 *     summary: Get loan transaction by liftpayId
 *     tags: [LoanTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: liftpayId
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan transaction liftpayId
 *     responses:
 *       200:
 *         description: Loan transaction retrieved successfully
 *       404:
 *         description: Loan transaction not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/liftpay-id/:liftpayId",
  authenticateJWT,
  loanTransactionController.getLoanTransactionByLiftpayId
);

/**
 * @swagger
 * /api/v1/loan-transactions/loan/{loanId}:
 *   get:
 *     summary: Get all transactions for a specific loan
 *     tags: [LoanTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [principal, interest, penalty, other]
 *         description: Filter by transaction type
 *       - in: query
 *         name: transactionStatus
 *         schema:
 *           type: string
 *           enum: [Pending, Completed]
 *         description: Filter by transaction status
 *     responses:
 *       200:
 *         description: Loan transactions retrieved successfully
 *       404:
 *         description: Loan not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/loan/:loanId",
  authenticateJWT,
  loanTransactionController.getLoanTransactionsByLoanId
);

/**
 * @swagger
 * /api/v1/loan-transactions/{id}:
 *   put:
 *     summary: Update a loan transaction
 *     tags: [LoanTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionType:
 *                 type: string
 *                 enum: [principal, interest, penalty, other]
 *                 description: Type of transaction
 *               transactionStatus:
 *                 type: string
 *                 enum: [Pending, Completed]
 *                 description: Status of transaction
 *               creditAmount:
 *                 type: number
 *                 description: Credit amount
 *               debitAmount:
 *                 type: number
 *                 description: Debit amount
 *               transactionDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of transaction
 *     responses:
 *       200:
 *         description: Loan transaction updated successfully
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
  loanTransactionController.updateLoanTransaction
);

/**
 * @swagger
 * /api/v1/loan-transactions/{id}/complete:
 *   patch:
 *     summary: Mark a loan transaction as completed
 *     tags: [LoanTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan transaction ID
 *     responses:
 *       200:
 *         description: Loan transaction completed successfully
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
  loanTransactionController.completeLoanTransaction
);

/**
 * @swagger
 * /api/v1/loan-transactions/{id}:
 *   delete:
 *     summary: Delete a loan transaction
 *     tags: [LoanTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan transaction ID
 *     responses:
 *       200:
 *         description: Loan transaction deleted successfully
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
  loanTransactionController.deleteLoanTransaction
);

/**
 * @swagger
 * /api/v1/loan-transactions/balance/{loanId}:
 *   get:
 *     summary: Get loan balance grouped by transaction type
 *     description: Calculates the sum of (creditAmount - debitAmount) grouped by transaction type for a specific loan
 *     tags: [LoanTransactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan balance retrieved successfully
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
 *                     loanId:
 *                       type: string
 *                       description: Loan ID
 *                     balanceByType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           transactionType:
 *                             type: string
 *                             enum: [principal, interest, penalty, other]
 *                           balance:
 *                             type: number
 *                             description: Sum of (creditAmount - debitAmount)
 *                           totalCredit:
 *                             type: number
 *                             description: Total credit amount
 *                           totalDebit:
 *                             type: number
 *                             description: Total debit amount
 *                           transactionCount:
 *                             type: number
 *                             description: Number of transactions
 *                     overall:
 *                       type: object
 *                       properties:
 *                         balance:
 *                           type: number
 *                           description: Overall balance across all types
 *                         totalCredit:
 *                           type: number
 *                           description: Overall total credit
 *                         totalDebit:
 *                           type: number
 *                           description: Overall total debit
 *                         transactionCount:
 *                           type: number
 *                           description: Total number of transactions
 *       404:
 *         description: Loan not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/balance/:loanId",
  authenticateJWT,
  loanTransactionController.getLoanBalanceByTransactionType
);

export default router;
