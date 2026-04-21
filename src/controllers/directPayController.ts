import { Request, Response } from "express";
import {
  directPayService,
  CreateDirectPayInput,
  UpdateDirectPayInput,
  InitiateDirectPayInput,
} from "../services/directPayService";
import { DirectPayStatus } from "@prisma/client";

/**
 * @swagger
 * tags:
 *   name: DirectPay
 *   description: Direct Pay management
 */

/**
 * @swagger
 * /api/v1/direct-pays:
 *   post:
 *     summary: Create a new direct pay
 *     tags: [DirectPay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - monoAccountId
 *               - monoCustomerId
 *               - buyerId
 *               - reference
 *               - amount
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 example: "uuid-here"
 *               mandateId:
 *                 type: string
 *                 description: Optional mandate ID
 *               downPayment:
 *                 type: number
 *                 description: Optional down payment amount
 *               amount:
 *                 type: number
 *                 example: 50000
 *               status:
 *                 type: string
 *                 enum: [Pending, Processing, Completed, Failed, Cancelled]
 *                 default: Pending
 *               buyerId:
 *                 type: string
 *                 example: "uuid-here"
 *               reference:
 *                 type: string
 *                 example: "REF-123456"
 *               monoUrl:
 *                 type: string
 *                 description: Optional Mono payment URL
 *               monoAccountId:
 *                 type: string
 *                 example: "acc_123456"
 *               monoCustomerId:
 *                 type: string
 *                 example: "cust_123456"
 *     responses:
 *       201:
 *         description: Direct pay created successfully
 *       400:
 *         description: Validation error
 */
export const create = async (req: Request, res: Response) => {
  try {
    const input: CreateDirectPayInput = req.body;
    const directPay = await directPayService.createDirectPay(input);

    res.status(201).json({
      success: true,
      message: "Direct pay created successfully",
      data: directPay,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create direct pay",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/direct-pays:
 *   get:
 *     summary: Get all direct pays with filters and pagination
 *     tags: [DirectPay]
 *     parameters:
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *         description: Filter by invoice ID
 *       - in: query
 *         name: mandateId
 *         schema:
 *           type: string
 *         description: Filter by mandate ID
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: Filter by buyer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Processing, Completed, Failed, Cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of direct pays
 */
export const getAll = async (req: Request, res: Response) => {
  try {
    const filters = {
      invoiceId: req.query.invoiceId as string | undefined,
      mandateId: req.query.mandateId as string | undefined,
      buyerId: req.query.buyerId as string | undefined,
      status: req.query.status as DirectPayStatus | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await directPayService.getAllDirectPays(filters);

    res.status(200).json({
      success: true,
      message: "Direct pays retrieved successfully",
      data: result.directPays,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to retrieve direct pays",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/direct-pays/{id}:
 *   get:
 *     summary: Get direct pay by ID
 *     tags: [DirectPay]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Direct pay ID
 *     responses:
 *       200:
 *         description: Direct pay details
 *       404:
 *         description: Direct pay not found
 */
export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const directPay = await directPayService.getDirectPayById(id);

    res.status(200).json({
      success: true,
      message: "Direct pay retrieved successfully",
      data: directPay,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve direct pay",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/direct-pays/invoice/{invoiceId}:
 *   get:
 *     summary: Get all direct pays for a specific invoice
 *     tags: [DirectPay]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: List of direct pays
 *       404:
 *         description: Invoice not found
 */
export const getByInvoiceId = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const directPays = await directPayService.getDirectPaysByInvoiceId(
      invoiceId
    );

    res.status(200).json({
      success: true,
      message: "Direct pays retrieved successfully",
      data: directPays,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve direct pays",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/direct-pays/buyer/{buyerId}:
 *   get:
 *     summary: Get all direct pays for a specific buyer
 *     tags: [DirectPay]
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: List of direct pays
 *       404:
 *         description: Buyer not found
 */
export const getByBuyerId = async (req: Request, res: Response) => {
  try {
    const { buyerId } = req.params;
    const directPays = await directPayService.getDirectPaysByBuyerId(buyerId);

    res.status(200).json({
      success: true,
      message: "Direct pays retrieved successfully",
      data: directPays,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve direct pays",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/direct-pays/mandate/{mandateId}:
 *   get:
 *     summary: Get all direct pays for a specific mandate
 *     tags: [DirectPay]
 *     parameters:
 *       - in: path
 *         name: mandateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mandate ID
 *     responses:
 *       200:
 *         description: List of direct pays
 *       404:
 *         description: Mandate not found
 */
export const getByMandateId = async (req: Request, res: Response) => {
  try {
    const { mandateId } = req.params;
    const directPays = await directPayService.getDirectPaysByMandateId(
      mandateId
    );

    res.status(200).json({
      success: true,
      message: "Direct pays retrieved successfully",
      data: directPays,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve direct pays",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/direct-pays/reference/{reference}:
 *   get:
 *     summary: Get direct pay by reference
 *     tags: [DirectPay]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Reference ID
 *     responses:
 *       200:
 *         description: Direct pay details
 *       404:
 *         description: Direct pay not found
 */
export const getByReference = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const directPay = await directPayService.getDirectPayByReference(reference);

    res.status(200).json({
      success: true,
      message: "Direct pay retrieved successfully",
      data: directPay,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve direct pay",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/direct-pays/{id}:
 *   put:
 *     summary: Update direct pay
 *     tags: [DirectPay]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Direct pay ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceId:
 *                 type: string
 *               mandateId:
 *                 type: string
 *                 nullable: true
 *               downPayment:
 *                 type: number
 *                 nullable: true
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Pending, Processing, Completed, Failed, Cancelled]
 *               buyerId:
 *                 type: string
 *               reference:
 *                 type: string
 *               monoUrl:
 *                 type: string
 *                 nullable: true
 *               monoAccountId:
 *                 type: string
 *               monoCustomerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Direct pay updated successfully
 *       404:
 *         description: Direct pay not found
 */
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const input: UpdateDirectPayInput = req.body;
    const directPay = await directPayService.updateDirectPay(id, input);

    res.status(200).json({
      success: true,
      message: "Direct pay updated successfully",
      data: directPay,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update direct pay",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/direct-pays/{id}:
 *   delete:
 *     summary: Delete direct pay
 *     tags: [DirectPay]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Direct pay ID
 *     responses:
 *       200:
 *         description: Direct pay deleted successfully
 *       404:
 *         description: Direct pay not found
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await directPayService.deleteDirectPay(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete direct pay",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/direct-pays/statistics/overview:
 *   get:
 *     summary: Get direct pay statistics
 *     tags: [DirectPay]
 *     parameters:
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: Filter by buyer ID
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *         description: Filter by invoice ID
 *       - in: query
 *         name: mandateId
 *         schema:
 *           type: string
 *         description: Filter by mandate ID
 *     responses:
 *       200:
 *         description: Direct pay statistics
 */
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const filters = {
      buyerId: req.query.buyerId as string | undefined,
      invoiceId: req.query.invoiceId as string | undefined,
      mandateId: req.query.mandateId as string | undefined,
    };

    const statistics = await directPayService.getDirectPayStatistics(filters);

    res.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: statistics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to retrieve statistics",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/direct-pays/mono/initiate:
 *   post:
 *     summary: Initiate direct pay with Mono API
 *     description: |
 *       Initiates a one-time direct payment through Mono API.
 *       The payment type is automatically set to "onetime-debit" and method to "account".
 *       Redirect URL is automatically set to the frontend direct-pay dashboard.
 *     tags: [DirectPay]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - description
 *               - reference
 *               - customerId
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 20000
 *                 description: Payment amount
 *               account:
 *                 type: string
 *                 description: Optional Mono account ID
 *                 example: "678f7bc977eb9afb06fff11f"
 *               description:
 *                 type: string
 *                 example: "testing"
 *                 description: Payment description
 *               reference:
 *                 type: string
 *                 example: "testing10039819098"
 *                 description: Unique payment reference (max 24 alphanumeric characters)
 *               customerId:
 *                 type: string
 *                 example: "67aa0961271cb661d8cbae3b"
 *                 description: Mono customer ID
 *               meta:
 *                 type: object
 *                 description: Optional metadata object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Payment initiated successfully
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
 *                     status:
 *                       type: string
 *                       example: "successful"
 *                     message:
 *                       type: string
 *                       example: "Payment Initiated Successfully"
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         mono_url:
 *                           type: string
 *                         type:
 *                           type: string
 *                         method:
 *                           type: string
 *                         amount:
 *                           type: number
 *       400:
 *         description: Bad request - validation error or Mono API error
 */
export const initiateMonoDirectPay = async (req: Request, res: Response) => {
  try {
    const input: InitiateDirectPayInput = req.body;

    // Validate required fields
    if (!input.amount || input.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    if (!input.description) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }
    if (!input.reference) {
      return res.status(400).json({
        success: false,
        message: "Reference is required",
      });
    }
    if (!input.customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const result = await directPayService.initiateMonoDirectPay(input);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate direct pay",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/direct-pays/mono/verify/{reference}:
 *   get:
 *     summary: Verify direct pay with Mono API
 *     description: Verifies a direct payment status using the reference ID
 *     tags: [DirectPay]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference ID
 *         example: "testing10039819098"
 *     responses:
 *       200:
 *         description: Payment verified successfully
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
 *                     status:
 *                       type: string
 *                       example: "successful"
 *                     message:
 *                       type: string
 *                       example: "Payment retrieved successfully"
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         reference:
 *                           type: string
 *                         type:
 *                           type: string
 *       400:
 *         description: Bad request - validation error or Mono API error
 */
export const verifyMonoDirectPay = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Reference is required",
      });
    }

    const result = await directPayService.verifyMonoDirectPay(reference);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify direct pay",
      error: error.message,
    });
  }
};

export const directPayController = {
  create,
  getAll,
  getById,
  getByInvoiceId,
  getByBuyerId,
  getByMandateId,
  getByReference,
  update,
  remove,
  getStatistics,
  initiateMonoDirectPay,
  verifyMonoDirectPay,
};
