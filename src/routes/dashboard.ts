import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /api/v1/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                     totalActiveBuyers:
 *                       type: number
 *                       description: Total number of active buyers
 *                       example: 1250
 *                     totalActiveMerchants:
 *                       type: number
 *                       description: Total number of active merchants
 *                       example: 89
 *                     totalActiveUsers:
 *                       type: number
 *                       description: Total number of active users (buyers + merchants)
 *                       example: 1339
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when the statistics were generated
 *                       example: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Internal server error
 */
router.get("/stats", authenticateJWT, dashboardController.getDashboardStats);

export default router;
