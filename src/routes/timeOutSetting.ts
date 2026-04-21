import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { timeOutSettingController } from "../controllers/timeOutSettingController";

const router = Router();

/**
 * @swagger
 * /api/v1/timeout-settings:
 *   get:
 *     summary: Get timeout setting (single record)
 *     tags: [Timeout Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Timeout setting retrieved successfully
 *       404:
 *         description: Timeout setting not found
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticateJWT, timeOutSettingController.get);

/**
 * @swagger
 * /api/v1/timeout-settings:
 *   post:
 *     summary: Upsert timeout setting (create if not exists, update if exists)
 *     tags: [Timeout Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountlinkingTimeout:
 *                 type: integer
 *               directPayTimeout:
 *                 type: integer
 *               scoringTimeout:
 *                 type: integer
 *               merchantCreationTimeout:
 *                 type: integer
 *               planselectionTimeout:
 *                 type: integer
 *               upfrontPaymentTimeout:
 *                 type: integer
 *               maxLinkAttempts:
 *                 type: integer
 *               periodBetweenAttempts:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Timeout setting upserted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateJWT, timeOutSettingController.upsert);

export default router;

