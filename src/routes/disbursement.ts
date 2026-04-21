import { Router } from "express";
import { disbursementController } from "../controllers/disbursementController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateSourceAccountInput:
 *       type: object
 *       required:
 *         - app
 *         - account_number
 *         - bank_code
 *         - email
 *       properties:
 *         app:
 *           type: string
 *           description: Application ID
 *           example: "63249e670b34d0c3a9139b98"
 *         account_number:
 *           type: string
 *           description: Bank account number
 *           example: "0123456789"
 *         bank_code:
 *           type: string
 *           description: Bank code
 *           example: "044"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *           example: "olamide@neem.com"
 *
 *     SourceAccountResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [successful, failed]
 *           example: "successful"
 *         message:
 *           type: string
 *           example: "Source account created successfully"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-08-20T14:11:00.489Z"
 *         data:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               example: "68a4ac5200dcc73621596860"
 *             mandate_activation_url:
 *               type: string
 *               example: "https://authorise.mono.co/RD4605217996"
 *
 *     DisbursementDistribution:
 *       type: object
 *       required:
 *         - reference
 *         - recipient_email
 *         - account
 *         - amount
 *         - narration
 *       properties:
 *         reference:
 *           type: string
 *           description: Unique reference for this distribution
 *           example: "dist_ref_abcde"
 *         recipient_email:
 *           type: string
 *           format: email
 *           description: Email of the recipient
 *           example: "olamide@neem.com"
 *         account:
 *           type: object
 *           required:
 *             - account_number
 *             - bank_code
 *           properties:
 *             account_number:
 *               type: string
 *               example: "0012345678"
 *             bank_code:
 *               type: string
 *               example: "044"
 *         amount:
 *           type: number
 *           description: Amount to disburse to this recipient
 *           example: 250000
 *         narration:
 *           type: string
 *           description: Payment description
 *           example: "salary payment"
 *
 *     CreateDisbursementInput:
 *       type: object
 *       required:
 *         - reference
 *         - source
 *         - account
 *         - type
 *         - total_amount
 *         - description
 *         - distribution
 *       properties:
 *         reference:
 *           type: string
 *           description: Unique reference for the disbursement
 *           example: "disburse_ref_12345"
 *         source:
 *           type: string
 *           enum: [mandate]
 *           description: Source type
 *           example: "mandate"
 *         account:
 *           type: string
 *           description: Source account ID
 *           example: "688a0b672f88771f77d05cf5"
 *         type:
 *           type: string
 *           description: Disbursement type
 *           example: "instant"
 *         total_amount:
 *           type: number
 *           description: Total amount to disburse
 *           example: 500000
 *         description:
 *           type: string
 *           description: Description of the disbursement
 *           example: "instant disbursement payment"
 *         distribution:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DisbursementDistribution'
 *
 *     DisbursementResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [successful, failed]
 *           example: "successful"
 *         message:
 *           type: string
 *           example: "Disbursement request received"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-08-01T09:42:59.668Z"
 *         data:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               example: "688c8c23b947fac1455fa48f"
 *             reference:
 *               type: string
 *               example: "disburse_ref_12345"
 *             status:
 *               type: string
 *               example: "pending"
 */

/**
 * @swagger
 * /api/v1/disbursements/source-accounts:
 *   post:
 *     summary: Create a source account for disbursements
 *     description: |
 *       Creates a source account that can be used for disbursements.
 *       The source account must be activated using the mandate_activation_url before it can be used.
 *     tags: [Disbursement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSourceAccountInput'
 *     responses:
 *       200:
 *         description: Source account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SourceAccountResponse'
 *       400:
 *         description: Bad request - validation error or Mono API error
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
 *                 data:
 *                   type: object
 *                   nullable: true
 *       500:
 *         description: Internal server error
 */
router.post(
  "/source-accounts",
  authenticateJWT,
  disbursementController.createSourceAccount
);

/**
 * @swagger
 * /api/v1/disbursements:
 *   post:
 *     summary: Create a disbursement
 *     description: |
 *       Creates a disbursement to multiple recipients from a source account.
 *       The disbursement can be of type "instant" or other types as supported by Mono.
 *       The total_amount should equal the sum of all distribution amounts.
 *     tags: [Disbursement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDisbursementInput'
 *     responses:
 *       200:
 *         description: Disbursement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DisbursementResponse'
 *       400:
 *         description: Bad request - validation error or Mono API error
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
 *                 data:
 *                   type: object
 *                   nullable: true
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateJWT, disbursementController.createDisbursement);

export default router;

