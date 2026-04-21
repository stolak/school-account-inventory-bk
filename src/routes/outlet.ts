import { Router } from "express";
import { outletController } from "../controllers/outletController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OutletStatus:
 *       type: string
 *       enum:
 *         - Active
 *         - Inactive
 *       description: Status of the outlet
 *
 *     Outlet:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the outlet
 *         name:
 *           type: string
 *           description: Name of the outlet
 *         address:
 *           type: string
 *           description: Physical address of the outlet
 *         managerId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the user managing this outlet
 *         manager:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             email:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *         merchantId:
 *           type: string
 *           format: uuid
 *           description: ID of the merchant that owns this outlet
 *         merchant:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             liftpayId:
 *               type: string
 *             businessName:
 *               type: string
 *             businessEmail:
 *               type: string
 *         status:
 *           $ref: '#/components/schemas/OutletStatus'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - name
 *         - address
 *         - merchantId
 *         - status
 *
 *     CreateOutletInput:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - merchantId
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the outlet
 *           example: "Downtown Branch"
 *         address:
 *           type: string
 *           description: Physical address of the outlet
 *           example: "123 Main Street, Lagos, Nigeria"
 *         managerId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the user who will manage this outlet
 *         merchantId:
 *           type: string
 *           format: uuid
 *           description: ID of the merchant that owns this outlet
 *         status:
 *           $ref: '#/components/schemas/OutletStatus'
 *           default: Active
 *
 *     UpdateOutletInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the outlet
 *         address:
 *           type: string
 *           description: Physical address of the outlet
 *         managerId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the user who will manage this outlet
 *         status:
 *           $ref: '#/components/schemas/OutletStatus'
 *
 *     OutletStatistics:
 *       type: object
 *       properties:
 *         outletId:
 *           type: string
 *           format: uuid
 *         totalInvoices:
 *           type: integer
 *           description: Total number of invoices for this outlet
 *         pendingInvoices:
 *           type: integer
 *           description: Number of pending invoices
 *         paidInvoices:
 *           type: integer
 *           description: Number of paid invoices
 *         totalRevenue:
 *           type: number
 *           description: Total revenue from paid invoices
 */

/**
 * @swagger
 * /api/v1/outlets:
 *   post:
 *     summary: Create a new outlet
 *     tags: [Outlets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOutletInput'
 *     responses:
 *       201:
 *         description: Outlet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Outlet'
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateJWT, outletController.createOutlet);

/**
 * @swagger
 * /api/v1/outlets:
 *   get:
 *     summary: Get all outlets with optional filters
 *     tags: [Outlets]
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
 *         name: managerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by manager ID
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/OutletStatus'
 *         description: Filter by outlet status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of outlets retrieved successfully
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
 *                     outlets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Outlet'
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
router.get("/", authenticateJWT, outletController.getAllOutlets);

/**
 * @swagger
 * /api/v1/outlets/{id}:
 *   get:
 *     summary: Get outlet by ID
 *     tags: [Outlets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Outlet ID
 *     responses:
 *       200:
 *         description: Outlet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Outlet'
 *       404:
 *         description: Outlet not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authenticateJWT, outletController.getOutletById);

/**
 * @swagger
 * /api/v1/outlets/merchant/{merchantId}:
 *   get:
 *     summary: Get all outlets for a specific merchant
 *     tags: [Outlets]
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
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/OutletStatus'
 *         description: Filter by outlet status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of outlets for the merchant retrieved successfully
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
 *                     outlets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Outlet'
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
router.get(
  "/merchant/:merchantId",
  authenticateJWT,
  outletController.getOutletsByMerchantId
);

/**
 * @swagger
 * /api/v1/outlets/{id}:
 *   put:
 *     summary: Update an outlet
 *     tags: [Outlets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Outlet ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOutletInput'
 *     responses:
 *       200:
 *         description: Outlet updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Outlet'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Outlet not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", authenticateJWT, outletController.updateOutlet);

/**
 * @swagger
 * /api/v1/outlets/{id}/toggle-status:
 *   patch:
 *     summary: Toggle outlet status (Active/Inactive)
 *     tags: [Outlets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Outlet ID
 *     responses:
 *       200:
 *         description: Outlet status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Outlet'
 *                 message:
 *                   type: string
 *                   example: "Outlet status changed to Inactive"
 *       400:
 *         description: Bad request
 *       404:
 *         description: Outlet not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/toggle-status", authenticateJWT, outletController.toggleOutletStatus);

/**
 * @swagger
 * /api/v1/outlets/{id}/statistics:
 *   get:
 *     summary: Get statistics for an outlet
 *     tags: [Outlets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Outlet ID
 *     responses:
 *       200:
 *         description: Outlet statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/OutletStatistics'
 *       404:
 *         description: Outlet not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id/statistics", authenticateJWT, outletController.getOutletStatistics);

/**
 * @swagger
 * /api/v1/outlets/{id}:
 *   delete:
 *     summary: Delete an outlet
 *     tags: [Outlets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Outlet ID
 *     responses:
 *       200:
 *         description: Outlet deleted successfully
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
 *                   example: "Outlet deleted successfully"
 *       400:
 *         description: Bad request - Cannot delete outlet with associated invoices
 *       404:
 *         description: Outlet not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticateJWT, outletController.deleteOutlet);

/**
 * @swagger
 * /api/v1/outlets/revenue/summary:
 *   get:
 *     summary: Get all outlets with revenue statistics (paid invoices sum and count)
 *     tags: [Outlets]
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
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/OutletStatus'
 *         description: Filter by outlet status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of outlets with revenue statistics retrieved successfully
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
 *                     outlets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *                           managerId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           manager:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               email:
 *                                 type: string
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                           merchantId:
 *                             type: string
 *                             format: uuid
 *                           merchant:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               liftpayId:
 *                                 type: string
 *                               businessName:
 *                                 type: string
 *                               businessEmail:
 *                                 type: string
 *                           status:
 *                             $ref: '#/components/schemas/OutletStatus'
 *                           paidInvoiceCount:
 *                             type: integer
 *                             description: Number of paid invoices for this outlet
 *                             example: 25
 *                           totalPaidAmount:
 *                             type: number
 *                             description: Total sum of paid invoice amounts
 *                             example: 1500000.50
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
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
router.get("/revenue/summary", authenticateJWT, outletController.getAllOutletsWithRevenue);

export default router;

