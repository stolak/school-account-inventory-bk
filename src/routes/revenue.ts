import { Router } from "express";
import { revenueController } from "../controllers/revenueController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RevenueType:
 *       type: string
 *       enum:
 *         - Repayment
 *         - Settlement
 *         - DownPayment
 *       description: Type of revenue transaction
 *
 *     Revenue:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         liftpayId:
 *           type: string
 *         credit:
 *           type: number
 *           description: Credit amount
 *         debit:
 *           type: number
 *           description: Debit amount
 *         description:
 *           type: string
 *         parentTable:
 *           type: string
 *           nullable: true
 *         type:
 *           $ref: '#/components/schemas/RevenueType'
 *         referenceIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of reference IDs
 *         detail:
 *           type: string
 *           nullable: true
 *         buyerId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         buyer:
 *           type: object
 *           nullable: true
 *         merchantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         merchant:
 *           type: object
 *           nullable: true
 *         loanId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         loan:
 *           type: object
 *           nullable: true
 *           description: Associated loan details
 *         invoiceId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         invoice:
 *           type: object
 *           nullable: true
 *           description: Associated invoice details
 *         transactionDate:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateRevenueInput:
 *       type: object
 *       required:
 *         - description
 *         - type
 *         - referenceIds
 *         - transactionDate
 *       properties:
 *         credit:
 *           type: number
 *           default: 0
 *         debit:
 *           type: number
 *           default: 0
 *         description:
 *           type: string
 *           example: "Payment for invoice INV-001"
 *         parentTable:
 *           type: string
 *           example: "Invoice"
 *         type:
 *           $ref: '#/components/schemas/RevenueType'
 *         referenceIds:
 *           type: array
 *           items:
 *             type: string
 *           example: ["ref-id-1", "ref-id-2"]
 *         detail:
 *           type: string
 *           example: "Additional transaction details"
 *         buyerId:
 *           type: string
 *           format: uuid
 *         merchantId:
 *           type: string
 *           format: uuid
 *         loanId:
 *           type: string
 *           format: uuid
 *           description: Optional loan ID to link revenue to a loan
 *         invoiceId:
 *           type: string
 *           format: uuid
 *           description: Optional invoice ID to link revenue to an invoice
 *         transactionDate:
 *           type: string
 *           format: date-time
 *
 *     UpdateRevenueInput:
 *       type: object
 *       properties:
 *         credit:
 *           type: number
 *         debit:
 *           type: number
 *         description:
 *           type: string
 *         parentTable:
 *           type: string
 *         type:
 *           $ref: '#/components/schemas/RevenueType'
 *         referenceIds:
 *           type: array
 *           items:
 *             type: string
 *         detail:
 *           type: string
 *         buyerId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         merchantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         loanId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Loan ID to link revenue to a loan (null to unlink)
 *         invoiceId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Invoice ID to link revenue to an invoice (null to unlink)
 *         transactionDate:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/revenues:
 *   post:
 *     summary: Create a new revenue record
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRevenueInput'
 *     responses:
 *       201:
 *         description: Revenue record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Revenue'
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateJWT, revenueController.createRevenue);

/**
 * @swagger
 * /api/v1/revenues:
 *   get:
 *     summary: Get all revenue records with filters
 *     tags: [Revenue]
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
 *         name: buyerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by buyer ID
 *       - in: query
 *         name: loanId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by loan ID
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by invoice ID
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/RevenueType'
 *         description: Filter by revenue type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *         example: "2024-12-31T23:59:59Z"
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
 *         description: List of revenue records retrieved successfully
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
 *                     revenues:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Revenue'
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
router.get("/", authenticateJWT, revenueController.getAllRevenues);

/**
 * @swagger
 * /api/v1/revenues/{id}:
 *   get:
 *     summary: Get revenue by ID
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Revenue ID
 *     responses:
 *       200:
 *         description: Revenue record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Revenue'
 *       404:
 *         description: Revenue not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authenticateJWT, revenueController.getRevenueById);

/**
 * @swagger
 * /api/v1/revenues/liftpay/{liftpayId}:
 *   get:
 *     summary: Get revenue by LiftPay ID
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: liftpayId
 *         required: true
 *         schema:
 *           type: string
 *         description: LiftPay ID
 *     responses:
 *       200:
 *         description: Revenue record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Revenue'
 *       404:
 *         description: Revenue not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/liftpay/:liftpayId",
  authenticateJWT,
  revenueController.getRevenueByLiftpayId
);

/**
 * @swagger
 * /api/v1/revenues/{id}:
 *   put:
 *     summary: Update revenue record
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Revenue ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRevenueInput'
 *     responses:
 *       200:
 *         description: Revenue record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Revenue'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Revenue not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", authenticateJWT, revenueController.updateRevenue);

/**
 * @swagger
 * /api/v1/revenues/{id}:
 *   delete:
 *     summary: Delete revenue record
 *     tags: [Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Revenue ID
 *     responses:
 *       200:
 *         description: Revenue record deleted successfully
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
 *                   example: "Revenue record deleted successfully"
 *       400:
 *         description: Bad request
 *       404:
 *         description: Revenue not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticateJWT, revenueController.deleteRevenue);

/**
 * @swagger
 * /api/v1/revenues/analytics/merchant/{merchantId}:
 *   get:
 *     summary: Get revenue summary analytics by merchant
 *     tags: [Revenue Analytics]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Revenue summary retrieved successfully
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
 *                     period:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRecords:
 *                           type: integer
 *                         totalCredit:
 *                           type: number
 *                         totalDebit:
 *                           type: number
 *                         netRevenue:
 *                           type: number
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             $ref: '#/components/schemas/RevenueType'
 *                           count:
 *                             type: integer
 *                           totalCredit:
 *                             type: number
 *                           totalDebit:
 *                             type: number
 *                           netAmount:
 *                             type: number
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/analytics/merchant/:merchantId",
  authenticateJWT,
  revenueController.getRevenueSummaryByMerchant
);

/**
 * @swagger
 * /api/v1/revenues/analytics/buyer/{buyerId}:
 *   get:
 *     summary: Get revenue summary analytics by buyer
 *     tags: [Revenue Analytics]
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
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Revenue summary retrieved successfully
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
 *                     period:
 *                       type: object
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRecords:
 *                           type: integer
 *                         totalCredit:
 *                           type: number
 *                         totalDebit:
 *                           type: number
 *                         netRevenue:
 *                           type: number
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/analytics/buyer/:buyerId",
  authenticateJWT,
  revenueController.getRevenueSummaryByBuyer
);

/**
 * @swagger
 * /api/v1/revenues/analytics/type/{type}:
 *   get:
 *     summary: Get revenue analytics by type
 *     tags: [Revenue Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/RevenueType'
 *         description: Revenue type
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by merchant ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Revenue analytics by type retrieved successfully
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
 *                     type:
 *                       $ref: '#/components/schemas/RevenueType'
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         totalRecords:
 *                           type: integer
 *                         totalCredit:
 *                           type: number
 *                         totalDebit:
 *                           type: number
 *                         netAmount:
 *                           type: number
 *                     revenues:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Revenue'
 *                     pagination:
 *                       type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/analytics/type/:type",
  authenticateJWT,
  revenueController.getRevenueByType
);

/**
 * @swagger
 * /api/v1/revenues/analytics/trends:
 *   get:
 *     summary: Get revenue trends over time
 *     tags: [Revenue Analytics]
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
 *         name: buyerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by buyer ID
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/RevenueType'
 *         description: Filter by revenue type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Group results by time period
 *     responses:
 *       200:
 *         description: Revenue trends retrieved successfully
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
 *                     groupBy:
 *                       type: string
 *                       example: "day"
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                             example: "2024-01-01"
 *                           totalCredit:
 *                             type: number
 *                           totalDebit:
 *                             type: number
 *                           netAmount:
 *                             type: number
 *                           recordCount:
 *                             type: integer
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalPeriods:
 *                           type: integer
 *                         overallCredit:
 *                           type: number
 *                         overallDebit:
 *                           type: number
 *                         overallNet:
 *                           type: number
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/analytics/trends",
  authenticateJWT,
  revenueController.getRevenueTrends
);

/**
 * @swagger
 * /api/v1/revenues/analytics/overall:
 *   get:
 *     summary: Get overall revenue statistics and insights
 *     tags: [Revenue Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Overall statistics retrieved successfully
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
 *                     period:
 *                       type: object
 *                     overall:
 *                       type: object
 *                       properties:
 *                         totalRecords:
 *                           type: integer
 *                         totalCredit:
 *                           type: number
 *                         totalDebit:
 *                           type: number
 *                         netRevenue:
 *                           type: number
 *                         averageCredit:
 *                           type: number
 *                         averageDebit:
 *                           type: number
 *                     byType:
 *                       type: array
 *                       items:
 *                         type: object
 *                     topMerchants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           merchantId:
 *                             type: string
 *                             format: uuid
 *                           recordCount:
 *                             type: integer
 *                           totalCredit:
 *                             type: number
 *                           totalDebit:
 *                             type: number
 *                           netRevenue:
 *                             type: number
 *                     topBuyers:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/analytics/overall",
  authenticateJWT,
  revenueController.getOverallStatistics
);

/**
 * @swagger
 * /api/v1/revenues/analytics/counts/grouped-by-day:
 *   get:
 *     summary: Get revenue count grouped by day (only credit transactions)
 *     description: Returns daily count of revenue records where credit is not 0, including days with no transactions
 *     tags: [Revenue Analytics]
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
 *         description: Revenue count by day retrieved successfully
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
 *                       example: 35
 *                       description: Total number of credit transactions
 *                     totalCredit:
 *                       type: number
 *                       example: 3500000
 *                       description: Total credit amount
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
 *                             example: 10
 *                             description: Number of credit transactions on this day
 *                           totalCredit:
 *                             type: number
 *                             example: 1000000
 *                             description: Total credit amount for this day
 *                       example:
 *                         - date: "2024-01-01"
 *                           count: 10
 *                           totalCredit: 1000000
 *                         - date: "2024-01-02"
 *                           count: 0
 *                           totalCredit: 0
 *                         - date: "2024-01-03"
 *                           count: 25
 *                           totalCredit: 2500000
 *       400:
 *         description: Bad request - Invalid or missing dates
 *       500:
 *         description: Internal server error
 */
router.get(
  "/analytics/counts/grouped-by-day",
  authenticateJWT,
  revenueController.getRevenueCountGroupedByDay
);

export default router;

