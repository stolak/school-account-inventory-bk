import { Router } from "express";
import { loanController } from "../controllers/loanController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /api/v1/loans:
 *   post:
 *     summary: Create a new loan
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyerId
 *               - loanAmount
 *               - loanTenure
 *               - loanInterestRate
 *               - loanStartDate
 *               - loanStatus
 *               - loanType
 *               - loanPurpose
 *             properties:
 *               buyerId:
 *                 type: string
 *                 description: ID of the buyer requesting the loan
 *                 example: "abc123-def456-ghi789"
 *               loanAmount:
 *                 type: number
 *                 description: Amount of loan requested
 *                 example: 100000
 *               purchaseAmount:
 *                 type: number
 *                 description: Total purchase amount (for purchase-based loans)
 *                 example: 150000
 *               downPaymentAmount:
 *                 type: number
 *                 description: Down payment amount
 *                 example: 50000
 *               merchantId:
 *                 type: string
 *                 description: ID of the merchant (for merchant-specific loans)
 *                 example: "merchant-uuid-123"
 *               referenceNumber:
 *                 type: string
 *                 description: External reference number
 *                 example: "REF-2024-001"
 *               adminCharge:
 *                 type: number
 *                 description: Administrative charge for the loan
 *                 example: 2500
 *               insurance:
 *                 type: number
 *                 description: Insurance amount
 *                 example: 1500
 *               monthlyRepayment:
 *                 type: number
 *                 description: Monthly repayment amount
 *                 example: 8500
 *               loanTenure:
 *                 type: number
 *                 description: Loan tenure in months
 *                 example: 12
 *               loanInterestRate:
 *                 type: number
 *                 description: Interest rate (e.g., 7.5 for 7.5%)
 *                 example: 7.5
 *               loanStartDate:
 *                 type: string
 *                 format: date-time
 *                 description: Loan start date
 *                 example: "2024-01-01T00:00:00Z"
 *               loanEndDate:
 *                 type: string
 *                 format: date-time
 *                 description: Loan end date (optional)
 *                 example: "2024-12-31T23:59:59Z"
 *               loanStatus:
 *                 type: string
 *                 enum: [Pending, Approved, Active, Cancel, Complete, Pause]
 *                 description: Status of the loan
 *                 example: Pending
 *               loanType:
 *                 type: string
 *                 enum: [Person, Corporate]
 *                 description: Type of loan
 *                 example: Person
 *               loanPurpose:
 *                 type: string
 *                 description: Purpose of the loan
 *                 example: "Business expansion"
 *               loanDocument:
 *                 type: string
 *                 description: URL or path to loan document
 *                 example: "https://example.com/documents/loan123.pdf"
 *               loanDocumentVerified:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected]
 *                 description: Document verification status
 *                 example: Pending
 *     responses:
 *       201:
 *         description: Loan created successfully
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateJWT, loanController.createLoan);

/**
 * @swagger
 * /api/v1/loans:
 *   get:
 *     summary: Get all loans with optional filters
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: Filter by buyer ID
 *       - in: query
 *         name: loanStatus
 *         schema:
 *           type: string
 *           enum: [Pending, Approved, Active, Cancel, Complete, Pause]
 *         description: Filter by loan status
 *       - in: query
 *         name: loanType
 *         schema:
 *           type: string
 *           enum: [Person, Corporate]
 *         description: Filter by loan type
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Loans retrieved successfully
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
 *                     loans:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticateJWT, loanController.getAllLoans);

/**
 * @swagger
 * /api/v1/loans/counts/by-status:
 *   get:
 *     summary: Get loan counts grouped by status
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loan counts retrieved successfully
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
 *                     countsByStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                             enum: [Pending, Approved, Active, Cancel, Complete, Pause]
 *                             example: Active
 *                           count:
 *                             type: number
 *                             example: 25
 *                     total:
 *                       type: number
 *                       example: 100
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/counts/by-status",
  authenticateJWT,
  loanController.getLoanCountsByStatus
);

/**
 * @swagger
 * /api/v1/loans/counts/by-date-range:
 *   get:
 *     summary: Get loans created within a date range
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date of the range (ISO 8601 format)
 *         example: "2025-01-01T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date of the range (ISO 8601 format)
 *         example: "2025-12-31T23:59:59Z"
 *     responses:
 *       200:
 *         description: Loans retrieved successfully
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
 *                     dateRange:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                     totalCount:
 *                       type: number
 *                       example: 45
 *                     totalLoanAmount:
 *                       type: number
 *                       example: 4500000
 *                     countsByStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: number
 *                     loans:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request - Invalid or missing dates
 *       500:
 *         description: Internal server error
 */
router.get(
  "/counts/by-date-range",
  authenticateJWT,
  loanController.getLoansCreatedByDateRange
);

/**
 * @swagger
 * /api/v1/loans/counts/grouped-by-day:
 *   get:
 *     summary: Get loans count grouped by day within a date range
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date of the range (ISO 8601 format)
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date of the range (ISO 8601 format)
 *         example: "2024-01-03T23:59:59Z"
 *     responses:
 *       200:
 *         description: Loans count by day retrieved successfully
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
 *                     dateRange:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                     totalCount:
 *                       type: number
 *                       example: 25
 *                     totalLoanAmount:
 *                       type: number
 *                       example: 2500000
 *                     countsByDay:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2024-01-01"
 *                           count:
 *                             type: number
 *                             example: 5
 *                           totalAmount:
 *                             type: number
 *                             example: 500000
 *                       example:
 *                         - date: "2024-01-01"
 *                           count: 5
 *                           totalAmount: 500000
 *                         - date: "2024-01-02"
 *                           count: 0
 *                           totalAmount: 0
 *                         - date: "2024-01-03"
 *                           count: 20
 *                           totalAmount: 2000000
 *       400:
 *         description: Bad request - Invalid or missing dates
 *       500:
 *         description: Internal server error
 */
router.get(
  "/counts/grouped-by-day",
  authenticateJWT,
  loanController.getLoansCountGroupedByDay
);

/**
 * @swagger
 * /api/v1/loans/{id}:
 *   get:
 *     summary: Get loan by ID
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan retrieved successfully
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
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/loans/{id}/repayment:
 *   post:
 *     summary: Process loan repayment
 *     description: Processes a loan repayment, automatically enforcing penalties and interest first, then allocating payment to penalty, interest, and principal in that order
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Repayment amount
 *                 example: 50000
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Repayment date (defaults to current date if not provided)
 *                 example: "2024-01-15T00:00:00Z"
 *     responses:
 *       200:
 *         description: Loan repayment processed successfully
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
 *                   example: "Loan repayment processed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     loanId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     date:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid loan ID, amount, date format, or amount exceeds balance
 *       500:
 *         description: Internal server error
 */
router.post("/:id/repayment", authenticateJWT, loanController.loanRepayment);

/**
 * @swagger
 * /api/v1/loans/{id}/process-repayment:
 *   post:
 *     summary: Process loan repayment with automatic Mono mandate debit
 *     description: |
 *       Processes a loan repayment by:
 *       1. Retrieving the loan and calculating the amount due
 *       2. Finding the associated invoice mandate
 *       3. Debiting the Mono mandate for the amount due
 *       4. Processing the loan repayment transaction
 *       This endpoint automatically handles the entire repayment flow including mandate debit.
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Repayment date (defaults to current date if not provided)
 *                 example: "2024-01-15T00:00:00Z"
 *     responses:
 *       200:
 *         description: Loan repayment processed successfully with Mono mandate debit
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
 *                   example: "Loan repayment processed successfully with Mono mandate debit"
 *                 data:
 *                   type: object
 *                   properties:
 *                     loanId:
 *                       type: string
 *                       description: Loan ID
 *                     amountDebited:
 *                       type: number
 *                       description: Amount debited from Mono mandate
 *                       example: 50000
 *                     date:
 *                       type: string
 *                       format: date-time
 *                       description: Repayment date
 *       400:
 *         description: Bad request - Invalid loan ID, loan not found, amount due is 0 or less, invoice mandate not found, or Mono debit failed
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
 *                   example: "Loan not found"
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:id/process-repayment",
  authenticateJWT,
  loanController.processLoanRepayment
);

/**
 * @swagger
 * /api/v1/loans/{id}/initiate-repayment:
 *   post:
 *     summary: Initiate loan repayment with Mono direct pay
 *     description: |
 *       Initiates a loan repayment by:
 *       1. Retrieving the loan and associated invoice mandate
 *       2. Initiating a Mono direct pay transaction
 *       3. Creating a direct pay record in the database
 *       4. Returning a Mono URL for the user to complete the payment
 *       This endpoint creates a payment link that the user must visit to authorize the payment.
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Repayment amount in naira
 *                 example: 50000
 *                 minimum: 0.01
 *     responses:
 *       200:
 *         description: Loan repayment initiated successfully
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
 *                   example: "Loan repayment initiated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     loanId:
 *                       type: string
 *                       description: Loan ID
 *                     amount:
 *                       type: number
 *                       description: Repayment amount
 *                       example: 50000
 *                     monoUrl:
 *                       type: string
 *                       description: Mono payment URL for user to complete payment
 *                       example: "https://mono.co/pay/abc123xyz"
 *       400:
 *         description: Bad request - Invalid loan ID, amount validation error, invoice ID not found, mandate not found, or Mono direct pay initiation failed
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
 *                   example: "Invoice ID not found"
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:id/initiate-repayment",
  authenticateJWT,
  loanController.initiateLoanRepayment
);

/**
 * @swagger
 * /api/v1/loans/validate-repayment/{referenceId}:
 *   post:
 *     summary: Validate and complete loan repayment
 *     description: |
 *       Validates and completes a loan repayment by:
 *       1. Retrieving the direct pay record by reference ID
 *       2. Finding the associated loan via invoice ID
 *       3. Verifying the Mono direct pay transaction status
 *       4. Updating the direct pay status to Completed
 *       5. Processing the loan repayment transaction
 *       This endpoint should be called after a user completes payment via the Mono URL from the initiate-repayment endpoint.
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: referenceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Reference ID from the direct pay transaction
 *         example: "REF123456789"
 *     responses:
 *       200:
 *         description: Loan repayment validated and processed successfully
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
 *                   example: "Loan repayment validated and processed successfully"
 *                 data:
 *                   type: object
 *                   description: Mono direct pay verification response data
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "successful"
 *                     message:
 *                       type: string
 *                       example: "Payment verified successfully"
 *                     data:
 *                       type: object
 *                       description: Payment verification details
 *       400:
 *         description: Bad request - Reference ID not found, direct pay not found, loan not found, or Mono verification failed
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
 *                   example: "Direct pay not found"
 *       500:
 *         description: Internal server error
 */
router.post(
  "/validate-repayment/:referenceId",
  authenticateJWT,
  loanController.validateLoanRepayment
);

router.get("/:id", authenticateJWT, loanController.getLoanById);

/**
 * @swagger
 * /api/v1/loans/liftpay-id/{liftpayId}:
 *   get:
 *     summary: Get loan by liftpayId
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: liftpayId
 *         required: true
 *         schema:
 *           type: string
 *         description: Liftpay ID
 *     responses:
 *       200:
 *         description: Loan retrieved successfully
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/liftpay-id/:liftpayId",
  authenticateJWT,
  loanController.getLoanByLiftpayId
);

/**
 * @swagger
 * /api/v1/loans/invoice/{invoiceId}:
 *   get:
 *     summary: Get loan by invoice ID
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Loan retrieved successfully
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
 *                     id:
 *                       type: string
 *                     liftpayId:
 *                       type: string
 *                     loanAmount:
 *                       type: number
 *                     principalBalance:
 *                       type: number
 *                     interestBalance:
 *                       type: number
 *                     penaltyBalance:
 *                       type: number
 *                     overallBalance:
 *                       type: number
 *                     nextPaymentDate:
 *                       type: string
 *                       format: date-time
 *                     nextPaymentAmount:
 *                       type: number
 *                     monthCompleted:
 *                       type: number
 *                     buyer:
 *                       type: object
 *                     merchant:
 *                       type: object
 *                     loanSchedules:
 *                       type: array
 *                     loanTransactions:
 *                       type: array
 *       404:
 *         description: Loan not found for this invoice
 *       500:
 *         description: Internal server error
 */
router.get(
  "/invoice/:invoiceId",
  authenticateJWT,
  loanController.getLoanByInvoiceId
);

/**
 * @swagger
 * /api/v1/loans/{id}:
 *   put:
 *     summary: Update loan by ID
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loanAmount:
 *                 type: number
 *                 example: 150000
 *               purchaseAmount:
 *                 type: number
 *                 description: Total purchase amount
 *                 example: 200000
 *               downPaymentAmount:
 *                 type: number
 *                 description: Down payment amount
 *                 example: 50000
 *               merchantId:
 *                 type: string
 *                 description: Merchant ID
 *                 example: "merchant-uuid-123"
 *               referenceNumber:
 *                 type: string
 *                 description: External reference number
 *                 example: "REF-2024-001"
 *               adminCharge:
 *                 type: number
 *                 description: Administrative charge
 *                 example: 3000
 *               insurance:
 *                 type: number
 *                 description: Insurance amount
 *                 example: 2000
 *               monthlyRepayment:
 *                 type: number
 *                 description: Monthly repayment amount
 *                 example: 12000
 *               loanTenure:
 *                 type: number
 *                 example: 18
 *               loanInterestRate:
 *                 type: number
 *                 example: 8.5
 *               loanStartDate:
 *                 type: string
 *                 format: date-time
 *               loanEndDate:
 *                 type: string
 *                 format: date-time
 *               loanStatus:
 *                 type: string
 *                 enum: [Pending, Approved, Active, Cancel, Complete, Pause]
 *               loanType:
 *                 type: string
 *                 enum: [Person, Corporate]
 *               loanPurpose:
 *                 type: string
 *               loanDocument:
 *                 type: string
 *               loanDocumentVerified:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected]
 *     responses:
 *       200:
 *         description: Loan updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", authenticateJWT, loanController.updateLoan);

/**
 * @swagger
 * /api/v1/loans/{id}:
 *   delete:
 *     summary: Delete loan by ID
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan deleted successfully
 *       400:
 *         description: Bad request - Cannot delete loan with transactions
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticateJWT, loanController.deleteLoan);

/**
 * @swagger
 * /api/v1/loans/{id}/summary:
 *   get:
 *     summary: Get comprehensive loan summary with calculations
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan summary retrieved successfully
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
 *                     loan:
 *                       type: object
 *                       description: Full loan details
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalPaid:
 *                           type: number
 *                           description: Total amount paid
 *                         totalPending:
 *                           type: number
 *                           description: Total pending amount
 *                         scheduledPayments:
 *                           type: number
 *                           description: Total number of scheduled payments
 *                         completedPayments:
 *                           type: number
 *                           description: Number of completed payments
 *                         remainingPayments:
 *                           type: number
 *                           description: Number of remaining payments
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id/summary", authenticateJWT, loanController.getLoanSummary);

/**
 * @swagger
 * /api/v1/loans/buyer/{buyerId}/history:
 *   get:
 *     summary: Get buyer's loan history
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: Buyer loan history retrieved successfully
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
 *                     type: object
 *                     description: Loan with transactions and schedules
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/buyer/:buyerId/history",
  authenticateJWT,
  loanController.getBuyerLoanHistory
);

/**
 * @swagger
 * /api/v1/loans/{id}/balance:
 *   get:
 *     summary: Get loan balance grouped by transaction type
 *     description: Calculates the sum of (creditAmount - debitAmount) grouped by transaction type for a specific loan
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *       500:
 *         description: Internal server error
 */
router.get("/:id/balance", authenticateJWT, loanController.getLoanBalance);

/**
 * @swagger
 * /api/v1/loans/penalty-enforcement:
 *   post:
 *     summary: Enforce penalties for pending penalty schedules
 *     description: Updates all penalty schedules where the given date falls between start and end dates and isExecuted is false
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Date for penalty enforcement (defaults to current date if not provided)
 *                 example: "2024-01-15T00:00:00Z"
 *     responses:
 *       200:
 *         description: Penalty enforcement completed successfully
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
 *                   example: "Penalty enforcement completed. 5 penalty schedule(s) executed."
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                       description: Number of penalty schedules executed
 *                       example: 5
 *                     date:
 *                       type: string
 *                       format: date-time
 *                       description: Date used for enforcement
 *                     penaltySchedules:
 *                       type: array
 *                       description: List of updated penalty schedules with loan and buyer details
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           loadScheduleId:
 *                             type: string
 *                           start:
 *                             type: string
 *                             format: date-time
 *                           end:
 *                             type: string
 *                             format: date-time
 *                           percentage:
 *                             type: number
 *                           isExecuted:
 *                             type: boolean
 *                           executedAt:
 *                             type: string
 *                             format: date-time
 *                           loadSchedule:
 *                             type: object
 *                             properties:
 *                               loan:
 *                                 type: object
 *                                 properties:
 *                                   buyer:
 *                                     type: object
 *                                     properties:
 *                                       id:
 *                                         type: string
 *                                       liftpayId:
 *                                         type: string
 *                                       firstName:
 *                                         type: string
 *                                       lastName:
 *                                         type: string
 *                                       email:
 *                                         type: string
 *       400:
 *         description: Bad request - Invalid date format or enforcement failed
 *       500:
 *         description: Internal server error
 */
router.post(
  "/penalty-enforcement",
  authenticateJWT,
  loanController.penaltyEnforcement
);

/**
 * @swagger
 * /api/v1/loans/interest-enforcement:
 *   post:
 *     summary: Enforce interest for pending interest schedules
 *     description: Updates all interest schedules where the given date falls between start and end dates and isExecuted is false
 *     tags: [Loan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Date for interest enforcement (defaults to current date if not provided)
 *                 example: "2024-01-15T00:00:00Z"
 *     responses:
 *       200:
 *         description: Interest enforcement completed successfully
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
 *                   example: "Interest enforcement completed. 5 interest schedule(s) executed."
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                       description: Number of interest schedules executed
 *                       example: 5
 *                     date:
 *                       type: string
 *                       format: date-time
 *                       description: Date used for enforcement
 *                     interestSchedules:
 *                       type: array
 *                       description: List of updated interest schedules with loan and buyer details
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request - Invalid date format or enforcement failed
 *       500:
 *         description: Internal server error
 */
router.post(
  "/interest-enforcement",
  authenticateJWT,
  loanController.interestEnforcement
);

export default router;
