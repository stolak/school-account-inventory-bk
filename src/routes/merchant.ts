import { Router } from "express";
import { merchantController } from "../controllers/merchantController";
import { authenticateJWT } from "../middlewares/auth";
const router = Router();

router.post("/", merchantController.create);
router.get("/", authenticateJWT, merchantController.list);
router.get("/:id", authenticateJWT, merchantController.getById);
router.get(
  "/:merchantId/users",
  authenticateJWT,
  merchantController.getUsersByMerchantId
);
router.patch("/:id", authenticateJWT, merchantController.update);
router.put("/:id", authenticateJWT, merchantController.update);
router.delete("/:id", authenticateJWT, merchantController.remove);
router.get(
  "/user/merchant",
  authenticateJWT,
  merchantController.getByUserMerchantId
);

/**
 * @swagger
 * /api/v1/merchants/{merchantId}/stats/paid-invoices:
 *   get:
 *     summary: Get paid invoices statistics by merchant
 *     description: |
 *       Returns comprehensive statistics about paid invoices for a merchant including:
 *       - Total sum of paid invoices within date range
 *       - Average invoice value
 *       - Conversion rate (percentage of paid invoices)
 *       - Pending invoice statistics
 *       - All-time paid invoice sum
 *     tags: [Merchant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Merchant ID
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for the range (ISO 8601 format)
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for the range (ISO 8601 format)
 *         example: "2024-12-31T23:59:59Z"
 *     responses:
 *       200:
 *         description: Merchant statistics retrieved successfully
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
 *                       description: Merchant ID
 *                     merchantName:
 *                       type: string
 *                       description: Business name of the merchant
 *                     totalSum:
 *                       type: number
 *                       description: Sum of paid invoice amounts within date range
 *                       example: 500000
 *                     invoiceCount:
 *                       type: number
 *                       description: Number of paid invoices within date range
 *                       example: 25
 *                     averageValue:
 *                       type: number
 *                       description: Average invoice amount within date range
 *                       example: 20000
 *                     conversionRate:
 *                       type: number
 *                       description: Percentage of paid invoices out of total invoices
 *                       example: 75.50
 *                     totalInvoiceCount:
 *                       type: number
 *                       description: Total number of invoices (all statuses) within date range
 *                       example: 33
 *                     pendingInvoiceSum:
 *                       type: number
 *                       description: Total value of pending invoices within date range
 *                       example: 100000
 *                     pendingInvoiceCount:
 *                       type: number
 *                       description: Number of pending invoices within date range
 *                       example: 8
 *                     allTimePaidInvoiceSum:
 *                       type: number
 *                       description: Total sum of all paid invoices (lifetime, regardless of date range)
 *                       example: 2000000
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       description: Start date of the range
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                       description: End date of the range
 *                     invoices:
 *                       type: array
 *                       description: Array of paid invoice details within date range
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           liftpayId:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
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
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:merchantId/stats/paid-invoices",
  authenticateJWT,
  merchantController.getPaidInvoicesSum
);

export default router;
