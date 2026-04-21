import { Router } from "express";
import { tierController } from "../controllers/tierController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TierStatus:
 *       type: string
 *       enum:
 *         - Active
 *         - Inactive
 *     Tier:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         from:
 *           type: number
 *           format: decimal
 *         to:
 *           type: number
 *           format: decimal
 *         status:
 *           $ref: '#/components/schemas/TierStatus'
 *         discounted:
 *           type: number
 *           format: decimal
 *           description: Discount percentage
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateTierInput:
 *       type: object
 *       required:
 *         - name
 *         - from
 *         - to
 *         - discounted
 *       properties:
 *         name:
 *           type: string
 *           example: "Gold Tier"
 *         from:
 *           type: number
 *           format: decimal
 *           example: 50001
 *         to:
 *           type: number
 *           format: decimal
 *           example: 100000
 *         status:
 *           $ref: '#/components/schemas/TierStatus'
 *         discounted:
 *           type: number
 *           format: decimal
 *           example: 5
 *           description: Discount percentage
 *     UpdateTierInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         from:
 *           type: number
 *           format: decimal
 *         to:
 *           type: number
 *           format: decimal
 *         status:
 *           $ref: '#/components/schemas/TierStatus'
 *         discounted:
 *           type: number
 *           format: decimal
 */

/**
 * @swagger
 * /api/v1/tiers:
 *   post:
 *     summary: Create a new tier
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTierInput'
 *     responses:
 *       201:
 *         description: Tier created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tier'
 *       400:
 *         description: Bad request (validation error or overlapping range)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  authenticateJWT,
  tierController.createTier.bind(tierController)
);

/**
 * @swagger
 * /api/v1/tiers:
 *   get:
 *     summary: Get all tiers with optional filters
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TierStatus'
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of tiers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tier'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authenticateJWT,
  tierController.getAllTiers.bind(tierController)
);

/**
 * @swagger
 * /api/v1/tiers/{id}:
 *   get:
 *     summary: Get tier by ID
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tier ID
 *     responses:
 *       200:
 *         description: Tier details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tier'
 *       404:
 *         description: Tier not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:id",
  authenticateJWT,
  tierController.getTierById.bind(tierController)
);

/**
 * @swagger
 * /api/v1/tiers/amount/{amount}:
 *   get:
 *     summary: Get tier by amount (find which tier an amount falls into)
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Amount to check
 *         example: 75000
 *     responses:
 *       200:
 *         description: Tier found for the amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tier'
 *       404:
 *         description: No tier found for the amount
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/amount/:amount",
  authenticateJWT,
  tierController.getTierByAmount.bind(tierController)
);

/**
 * @swagger
 * /api/v1/tiers/calculate-discount/{amount}:
 *   get:
 *     summary: Calculate discount for a given amount
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Amount to calculate discount for
 *         example: 75000
 *     responses:
 *       200:
 *         description: Discount calculation result
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
 *                     tier:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         discountPercentage:
 *                           type: number
 *                     originalAmount:
 *                       type: number
 *                     discountAmount:
 *                       type: number
 *                     finalAmount:
 *                       type: number
 *       404:
 *         description: No tier found for the amount
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/calculate-discount/:amount",
  authenticateJWT,
  tierController.calculateDiscount.bind(tierController)
);

/**
 * @swagger
 * /api/v1/tiers/{id}:
 *   put:
 *     summary: Update tier
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTierInput'
 *     responses:
 *       200:
 *         description: Tier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tier'
 *       400:
 *         description: Bad request (validation error or overlapping range)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  authenticateJWT,
  tierController.updateTier.bind(tierController)
);

/**
 * @swagger
 * /api/v1/tiers/{id}/toggle-status:
 *   patch:
 *     summary: Toggle tier status (Active ↔ Inactive)
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tier ID
 *     responses:
 *       200:
 *         description: Tier status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tier'
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
  "/:id/toggle-status",
  authenticateJWT,
  tierController.toggleTierStatus.bind(tierController)
);

/**
 * @swagger
 * /api/v1/tiers/{id}:
 *   delete:
 *     summary: Delete tier
 *     tags: [Tiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tier ID
 *     responses:
 *       200:
 *         description: Tier deleted successfully
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
  tierController.deleteTier.bind(tierController)
);

export default router;

