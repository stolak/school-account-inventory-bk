import { Router } from "express";
import { monoConnectController } from "../controllers/monoConnectController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MonoConnectStatus:
 *       type: string
 *       enum:
 *         - Active
 *         - Inactive
 *       description: Status of the MonoConnect record
 *
 *     MonoConnect:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         buyerId:
 *           type: string
 *           format: uuid
 *         buyer:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             liftpayId:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *             phoneNumber:
 *               type: string
 *         accountId:
 *           type: string
 *           description: Mono account ID
 *         status:
 *           $ref: '#/components/schemas/MonoConnectStatus'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateMonoConnectInput:
 *       type: object
 *       required:
 *         - buyerId
 *         - accountId
 *       properties:
 *         buyerId:
 *           type: string
 *           format: uuid
 *           description: Buyer ID to link to
 *         accountId:
 *           type: string
 *           description: Mono account ID
 *         status:
 *           $ref: '#/components/schemas/MonoConnectStatus'
 *           default: Active
 *
 *     UpdateMonoConnectInput:
 *       type: object
 *       properties:
 *         accountId:
 *           type: string
 *           description: Mono account ID
 *         status:
 *           $ref: '#/components/schemas/MonoConnectStatus'
 */

/**
 * @swagger
 * /api/v1/mono-connects:
 *   post:
 *     summary: Create a new MonoConnect record
 *     tags: [MonoConnect]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMonoConnectInput'
 *     responses:
 *       201:
 *         description: MonoConnect record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MonoConnect'
 *       400:
 *         description: Bad request - validation error or duplicate
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateJWT, monoConnectController.create);

/**
 * @swagger
 * /api/v1/mono-connects:
 *   get:
 *     summary: Get all MonoConnect records with filters
 *     tags: [MonoConnect]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by buyer ID
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/MonoConnectStatus'
 *         description: Filter by status
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
 *         description: List of MonoConnect records retrieved successfully
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
 *                     monoConnects:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MonoConnect'
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
router.get("/", authenticateJWT, monoConnectController.list);

/**
 * @swagger
 * /api/v1/mono-connects/{id}:
 *   get:
 *     summary: Get MonoConnect by ID
 *     tags: [MonoConnect]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: MonoConnect ID
 *     responses:
 *       200:
 *         description: MonoConnect record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MonoConnect'
 *       404:
 *         description: MonoConnect not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authenticateJWT, monoConnectController.getById);

/**
 * @swagger
 * /api/v1/mono-connects/buyer/{buyerId}:
 *   get:
 *     summary: Get MonoConnect records by buyer ID
 *     tags: [MonoConnect]
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
 *     responses:
 *       200:
 *         description: MonoConnect records retrieved successfully
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
 *                     $ref: '#/components/schemas/MonoConnect'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/buyer/:buyerId", authenticateJWT, monoConnectController.getByBuyerId);

/**
 * @swagger
 * /api/v1/mono-connects/buyer/{buyerId}/active:
 *   get:
 *     summary: Get active MonoConnect by buyer ID
 *     tags: [MonoConnect]
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
 *     responses:
 *       200:
 *         description: Active MonoConnect record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MonoConnect'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  "/buyer/:buyerId/active",
  authenticateJWT,
  monoConnectController.getActiveByBuyerId
);

/**
 * @swagger
 * /api/v1/mono-connects/account/{accountId}:
 *   get:
 *     summary: Get MonoConnect by account ID
 *     tags: [MonoConnect]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mono account ID
 *     responses:
 *       200:
 *         description: MonoConnect record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MonoConnect'
 *       404:
 *         description: MonoConnect not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/account/:accountId",
  authenticateJWT,
  monoConnectController.getByAccountId
);

/**
 * @swagger
 * /api/v1/mono-connects/{id}:
 *   patch:
 *     summary: Update MonoConnect record
 *     tags: [MonoConnect]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: MonoConnect ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMonoConnectInput'
 *     responses:
 *       200:
 *         description: MonoConnect record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MonoConnect'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: MonoConnect not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id", authenticateJWT, monoConnectController.update);

/**
 * @swagger
 * /api/v1/mono-connects/{id}/status:
 *   patch:
 *     summary: Update MonoConnect status
 *     tags: [MonoConnect]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: MonoConnect ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 $ref: '#/components/schemas/MonoConnectStatus'
 *     responses:
 *       200:
 *         description: MonoConnect status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MonoConnect'
 *                 message:
 *                   type: string
 *                   example: "MonoConnect status updated to Active"
 *       400:
 *         description: Bad request - invalid status
 *       404:
 *         description: MonoConnect not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/status", authenticateJWT, monoConnectController.updateStatus);

/**
 * @swagger
 * /api/v1/mono-connects/{id}:
 *   delete:
 *     summary: Delete MonoConnect record
 *     tags: [MonoConnect]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: MonoConnect ID
 *     responses:
 *       200:
 *         description: MonoConnect record deleted successfully
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
 *                   example: "MonoConnect record deleted successfully"
 *       400:
 *         description: Bad request
 *       404:
 *         description: MonoConnect not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticateJWT, monoConnectController.delete);

export default router;

