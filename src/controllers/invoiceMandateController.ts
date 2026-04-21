import { Request, Response } from "express";
import {
  invoiceMandateService,
  CreateInvoiceMandateInput,
  UpdateInvoiceMandateInput,
} from "../services/invoiceMandateService";
import { MandateStatus } from "@prisma/client";

/**
 * @swagger
 * tags:
 *   name: InvoiceMandate
 *   description: Invoice Mandate management
 */

/**
 * @swagger
 * /api/v1/invoice-mandates:
 *   post:
 *     summary: Create a new invoice mandate
 *     tags: [InvoiceMandate]
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
 *               - referenceId
 *               - amount
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 example: "uuid-here"
 *               loanId:
 *                 type: string
 *                 description: Optional loan ID
 *               monoMandateId:
 *                 type: string
 *                 description: Optional Mono mandate ID
 *               monoAccountId:
 *                 type: string
 *                 example: "acc_123456"
 *               monoCustomerId:
 *                 type: string
 *                 example: "cust_123456"
 *               buyerId:
 *                 type: string
 *                 example: "uuid-here"
 *               referenceId:
 *                 type: string
 *                 example: "REF-123456"
 *               amount:
 *                 type: number
 *                 example: 50000
 *               status:
 *                 type: string
 *                 enum: [Pending, Active, Completed, Failed, Cancelled]
 *                 default: Pending
 *     responses:
 *       201:
 *         description: Invoice mandate created successfully
 *       400:
 *         description: Validation error
 */
export const create = async (req: Request, res: Response) => {
  try {
    const input: CreateInvoiceMandateInput = req.body;
    const mandate = await invoiceMandateService.createInvoiceMandate(input);

    res.status(201).json({
      success: true,
      message: "Invoice mandate created successfully",
      data: mandate,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create invoice mandate",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/invoice-mandates:
 *   get:
 *     summary: Get all invoice mandates with filters and pagination
 *     tags: [InvoiceMandate]
 *     parameters:
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *         description: Filter by invoice ID
 *       - in: query
 *         name: loanId
 *         schema:
 *           type: string
 *         description: Filter by loan ID
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: Filter by buyer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Active, Completed, Failed, Cancelled]
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
 *         description: List of invoice mandates
 */
export const getAll = async (req: Request, res: Response) => {
  try {
    const filters = {
      invoiceId: req.query.invoiceId as string | undefined,
      loanId: req.query.loanId as string | undefined,
      buyerId: req.query.buyerId as string | undefined,
      status: req.query.status as MandateStatus | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await invoiceMandateService.getAllInvoiceMandates(filters);

    res.status(200).json({
      success: true,
      message: "Invoice mandates retrieved successfully",
      data: result.mandates,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to retrieve invoice mandates",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/invoice-mandates/{id}:
 *   get:
 *     summary: Get invoice mandate by ID
 *     tags: [InvoiceMandate]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice mandate ID
 *     responses:
 *       200:
 *         description: Invoice mandate details
 *       404:
 *         description: Invoice mandate not found
 */
export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mandate = await invoiceMandateService.getInvoiceMandateById(id);

    res.status(200).json({
      success: true,
      message: "Invoice mandate retrieved successfully",
      data: mandate,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve invoice mandate",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/invoice-mandates/invoice/{invoiceId}:
 *   get:
 *     summary: Get all mandates for a specific invoice
 *     tags: [InvoiceMandate]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: List of invoice mandates
 *       404:
 *         description: Invoice not found
 */
export const getByInvoiceId = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const mandates = await invoiceMandateService.getMandatesByInvoiceId(
      invoiceId
    );

    res.status(200).json({
      success: true,
      message: "Invoice mandates retrieved successfully",
      data: mandates,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve invoice mandates",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/invoice-mandates/buyer/{buyerId}:
 *   get:
 *     summary: Get all mandates for a specific buyer
 *     tags: [InvoiceMandate]
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Buyer ID
 *     responses:
 *       200:
 *         description: List of invoice mandates
 *       404:
 *         description: Buyer not found
 */
export const getByBuyerId = async (req: Request, res: Response) => {
  try {
    const { buyerId } = req.params;
    const mandates = await invoiceMandateService.getMandatesByBuyerId(buyerId);

    res.status(200).json({
      success: true,
      message: "Invoice mandates retrieved successfully",
      data: mandates,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve invoice mandates",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/invoice-mandates/loan/{loanId}:
 *   get:
 *     summary: Get all mandates for a specific loan
 *     tags: [InvoiceMandate]
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: List of invoice mandates
 *       404:
 *         description: Loan not found
 */
export const getByLoanId = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const mandates = await invoiceMandateService.getMandatesByLoanId(loanId);

    res.status(200).json({
      success: true,
      message: "Invoice mandates retrieved successfully",
      data: mandates,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve invoice mandates",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/invoice-mandates/reference/{referenceId}:
 *   get:
 *     summary: Get invoice mandate by reference ID
 *     tags: [InvoiceMandate]
 *     parameters:
 *       - in: path
 *         name: referenceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Reference ID
 *     responses:
 *       200:
 *         description: Invoice mandate details
 *       404:
 *         description: Invoice mandate not found
 */
export const getByReferenceId = async (req: Request, res: Response) => {
  try {
    const { referenceId } = req.params;
    const mandate =
      await invoiceMandateService.getMandateByReferenceId(referenceId);

    res.status(200).json({
      success: true,
      message: "Invoice mandate retrieved successfully",
      data: mandate,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve invoice mandate",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/invoice-mandates/{id}:
 *   put:
 *     summary: Update invoice mandate
 *     tags: [InvoiceMandate]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice mandate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceId:
 *                 type: string
 *               loanId:
 *                 type: string
 *                 nullable: true
 *               monoMandateId:
 *                 type: string
 *                 nullable: true
 *               monoAccountId:
 *                 type: string
 *               monoCustomerId:
 *                 type: string
 *               buyerId:
 *                 type: string
 *               referenceId:
 *                 type: string
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Pending, Active, Completed, Failed, Cancelled]
 *     responses:
 *       200:
 *         description: Invoice mandate updated successfully
 *       404:
 *         description: Invoice mandate not found
 */
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const input: UpdateInvoiceMandateInput = req.body;
    const mandate = await invoiceMandateService.updateInvoiceMandate(id, input);

    res.status(200).json({
      success: true,
      message: "Invoice mandate updated successfully",
      data: mandate,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update invoice mandate",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/invoice-mandates/{id}:
 *   delete:
 *     summary: Delete invoice mandate
 *     tags: [InvoiceMandate]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice mandate ID
 *     responses:
 *       200:
 *         description: Invoice mandate deleted successfully
 *       404:
 *         description: Invoice mandate not found
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await invoiceMandateService.deleteInvoiceMandate(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete invoice mandate",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/invoice-mandates/statistics:
 *   get:
 *     summary: Get invoice mandate statistics
 *     tags: [InvoiceMandate]
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
 *         name: loanId
 *         schema:
 *           type: string
 *         description: Filter by loan ID
 *     responses:
 *       200:
 *         description: Invoice mandate statistics
 */
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const filters = {
      buyerId: req.query.buyerId as string | undefined,
      invoiceId: req.query.invoiceId as string | undefined,
      loanId: req.query.loanId as string | undefined,
    };

    const statistics = await invoiceMandateService.getMandateStatistics(
      filters
    );

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

export const invoiceMandateController = {
  create,
  getAll,
  getById,
  getByInvoiceId,
  getByBuyerId,
  getByLoanId,
  getByReferenceId,
  update,
  remove,
  getStatistics,
};

