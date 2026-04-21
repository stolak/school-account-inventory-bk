import { Router } from "express";
import { buyerController } from "../controllers/buyerController";

const router = Router();

router.post("/", buyerController.create);
router.get("/", buyerController.list);
router.get("/:id", buyerController.getById);
router.patch("/:id", buyerController.update);
router.delete("/:id", buyerController.remove);

/**
 * @swagger
 * /api/v1/buyers/counts/by-date-range:
 *   get:
 *     summary: Get buyers created within a date range
 *     tags: [Buyer]
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
 *         description: Buyers retrieved successfully
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
 *                       example: 125
 *                     verifiedCount:
 *                       type: number
 *                       example: 100
 *                     unverifiedCount:
 *                       type: number
 *                       example: 25
 *                     activeCount:
 *                       type: number
 *                       example: 95
 *                     buyers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           liftpayId:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *                           isVerified:
 *                             type: boolean
 *                           isActive:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Bad request - Invalid or missing dates
 *       500:
 *         description: Internal server error
 */
router.get(
  "/counts/by-date-range",
  buyerController.getBuyersCreatedByDateRange
);

/**
 * @swagger
 * /api/v1/buyers/counts/grouped-by-day:
 *   get:
 *     summary: Get buyers count grouped by day within a date range
 *     tags: [Buyer]
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
 *         description: Buyers count by day retrieved successfully
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
 *                       example: 12
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
 *                             example: 2
 *                       example:
 *                         - date: "2024-01-01"
 *                           count: 2
 *                         - date: "2024-01-02"
 *                           count: 0
 *                         - date: "2024-01-03"
 *                           count: 10
 *       400:
 *         description: Bad request - Invalid or missing dates
 *       500:
 *         description: Internal server error
 */
router.get(
  "/counts/grouped-by-day",
  buyerController.getBuyersCountGroupedByDay
);

export default router;
