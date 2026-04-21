import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { settlementSettingController } from "../controllers/settlementSettingController";

const router = Router();

/**
 * @swagger
 * /api/v1/settlement-settings:
 *   get:
 *     summary: Get settlement setting (single record)
 *     tags: [Settlement Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settlement setting retrieved successfully
 *       404:
 *         description: Settlement setting not found
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticateJWT, settlementSettingController.get);

/**
 * @swagger
 * /api/v1/settlement-settings:
 *   post:
 *     summary: Upsert settlement setting (create if not exists, update if exists)
 *     tags: [Settlement Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               merchantFeeRate:
 *                 type: number
 *               autoSettlementCharge:
 *                 type: number
 *               manualSettlementCharge:
 *                 type: number
 *               Tx:
 *                 type: integer
 *               timeOfAutoSettlement:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Settlement setting upserted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateJWT, settlementSettingController.upsert);

export default router;

