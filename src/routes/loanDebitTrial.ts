import { Router } from "express";
import { loanDebitTrialController } from "../controllers/loanDebitTrialController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /api/v1/loan-debit-trials:
 *   post:
 *     summary: Create a new loan debit trial rule
 *     tags: [Loan Debit Trial]
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
 *             properties:
 *               dayAfter:
 *                 type: number
 *                 description: Number of days after due date before debit trial applies
 *                 example: 3
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *                 description: Status of the debit trial rule
 *                 example: Active
 *     responses:
 *       201:
 *         description: Loan debit trial created successfully
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
 *                   example: Loan debit trial created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     dayAfter:
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
router.post(
  "/",
  authenticateJWT,
  loanDebitTrialController.createLoanDebitTrial
);

/**
 * @swagger
 * /api/v1/loan-debit-trials:
 *   get:
 *     summary: Get all loan debit trial rules
 *     tags: [Loan Debit Trial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *         description: Filter debit trials by status
 *     responses:
 *       200:
 *         description: Loan debit trials retrieved successfully
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
router.get(
  "/",
  authenticateJWT,
  loanDebitTrialController.getAllLoanDebitTrials
);

/**
 * @swagger
 * /api/v1/loan-debit-trials/{id}:
 *   get:
 *     summary: Get loan debit trial by ID
 *     tags: [Loan Debit Trial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan debit trial ID
 *     responses:
 *       200:
 *         description: Loan debit trial retrieved successfully
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
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Loan debit trial not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:id",
  authenticateJWT,
  loanDebitTrialController.getLoanDebitTrialById
);

/**
 * @swagger
 * /api/v1/loan-debit-trials/{id}:
 *   put:
 *     summary: Update loan debit trial by ID
 *     tags: [Loan Debit Trial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan debit trial ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dayAfter:
 *                 type: number
 *                 description: Number of days after due date before debit trial applies
 *                 example: 5
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *                 description: Status of the debit trial rule
 *                 example: Active
 *     responses:
 *       200:
 *         description: Loan debit trial updated successfully
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
 *                   example: Loan debit trial updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     dayAfter:
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
 *         description: Loan debit trial not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  authenticateJWT,
  loanDebitTrialController.updateLoanDebitTrial
);

/**
 * @swagger
 * /api/v1/loan-debit-trials/{id}:
 *   delete:
 *     summary: Delete loan debit trial by ID
 *     tags: [Loan Debit Trial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan debit trial ID
 *     responses:
 *       200:
 *         description: Loan debit trial deleted successfully
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
 *                   example: Loan debit trial deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     dayAfter:
 *                       type: number
 *                     status:
 *                       type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Loan debit trial not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  authenticateJWT,
  loanDebitTrialController.deleteLoanDebitTrial
);

export default router;
