import { Router } from "express";
import { loanPenaltyController } from "../controllers/loanPenaltyController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /api/v1/loan-penalties:
 *   post:
 *     summary: Create a new loan penalty rule
 *     tags: [Loan Penalty]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dayAfter
 *               - percentage
 *             properties:
 *               dayAfter:
 *                 type: number
 *                 description: Number of days after due date before penalty applies
 *                 example: 7
 *               percentage:
 *                 type: number
 *                 description: Penalty percentage to apply
 *                 example: 5.0
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *                 description: Status of the penalty rule
 *                 example: Active
 *     responses:
 *       201:
 *         description: Loan penalty created successfully
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
 *                   example: Loan penalty created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     dayAfter:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateJWT, loanPenaltyController.createLoanPenalty);

/**
 * @swagger
 * /api/v1/loan-penalties:
 *   get:
 *     summary: Get all loan penalty rules
 *     tags: [Loan Penalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *         description: Filter penalties by status
 *     responses:
 *       200:
 *         description: Loan penalties retrieved successfully
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       dayAfter:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticateJWT, loanPenaltyController.getAllLoanPenalties);

/**
 * @swagger
 * /api/v1/loan-penalties/{id}:
 *   get:
 *     summary: Get loan penalty by ID
 *     tags: [Loan Penalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan penalty ID
 *     responses:
 *       200:
 *         description: Loan penalty retrieved successfully
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
 *                     dayAfter:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Loan penalty not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authenticateJWT, loanPenaltyController.getLoanPenaltyById);

/**
 * @swagger
 * /api/v1/loan-penalties/{id}:
 *   put:
 *     summary: Update loan penalty by ID
 *     tags: [Loan Penalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan penalty ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dayAfter:
 *                 type: number
 *                 description: Number of days after due date before penalty applies
 *                 example: 7
 *               percentage:
 *                 type: number
 *                 description: Penalty percentage to apply
 *                 example: 5.0
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *                 description: Status of the penalty rule
 *                 example: Active
 *     responses:
 *       200:
 *         description: Loan penalty updated successfully
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
 *                   example: Loan penalty updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     dayAfter:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - missing required fields
 *       404:
 *         description: Loan penalty not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", authenticateJWT, loanPenaltyController.updateLoanPenalty);

/**
 * @swagger
 * /api/v1/loan-penalties/{id}:
 *   delete:
 *     summary: Delete loan penalty by ID
 *     tags: [Loan Penalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan penalty ID
 *     responses:
 *       200:
 *         description: Loan penalty deleted successfully
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
 *                   example: Loan penalty deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     dayAfter:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                     status:
 *                       type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Loan penalty not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticateJWT, loanPenaltyController.deleteLoanPenalty);

export default router;
