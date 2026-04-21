import { Request, Response } from "express";
import {
  eligibilityAndScoreService,
  CreateEligibilityAndScoreInput,
  UpdateEligibilityAndScoreInput,
} from "../services/eligibilityAndScoreService";

/**
 * @swagger
 * /api/v1/eligibility-scores:
 *   post:
 *     summary: Create eligibility and score record for a buyer
 *     tags: [EligibilityAndScore]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEligibilityAndScoreInput'
 *     responses:
 *       201:
 *         description: Eligibility and score created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Buyer not found
 */
/**
 * @swagger
 * /api/v1/eligibility-scores:
 *   get:
 *     summary: List all eligibility and score records
 *     tags: [EligibilityAndScore]
 *     parameters:
 *       - in: query
 *         name: approved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status (true or false)
 *     responses:
 *       200:
 *         description: List of eligibility and score records
 */
/**
 * @swagger
 * /api/v1/eligibility-scores/{id}:
 *   get:
 *     summary: Get eligibility and score by ID
 *     tags: [EligibilityAndScore]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Eligibility and score found
 *       404:
 *         description: Record not found
 */
/**
 * @swagger
 * /api/v1/eligibility-scores/buyer/{buyerId}:
 *   get:
 *     summary: Get all eligibility and score records by buyer ID
 *     tags: [EligibilityAndScore]
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: approved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status (true or false)
 *     responses:
 *       200:
 *         description: Eligibility and score records found
 *       404:
 *         description: Record not found
 */
/**
 * @swagger
 * /api/v1/eligibility-scores/{id}:
 *   patch:
 *     summary: Update eligibility and score by ID
 *     tags: [EligibilityAndScore]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEligibilityAndScoreInput'
 *     responses:
 *       200:
 *         description: Eligibility and score updated
 *       404:
 *         description: Record not found
 */
/**
 * @swagger
 * /api/v1/eligibility-scores/{id}:
 *   delete:
 *     summary: Delete eligibility and score by ID
 *     tags: [EligibilityAndScore]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Eligibility and score deleted
 *       404:
 *         description: Record not found
 */
/**
 * @swagger
 * /api/v1/eligibility-scores/upsert:
 *   post:
 *     summary: Create or update eligibility and score for a buyer
 *     tags: [EligibilityAndScore]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEligibilityAndScoreInput'
 *     responses:
 *       200:
 *         description: Eligibility and score saved
 *       400:
 *         description: Validation error
 *       404:
 *         description: Buyer not found
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateEligibilityAndScoreInput:
 *       type: object
 *       required:
 *         - buyerId
 *         - eligibility
 *         - score
 *         - employmentDurationScore
 *         - creditHistoryScore
 *         - averageBalanceScore
 *         - employmentStatusScore
 *         - overdraftScore
 *         - message
 *         - finalApprovedLoan
 *         - maxEligibleLoan
 *         - monthlyRepayment
 *         - approvedPurchaseAmount
 *         - requiredDownPayment
 *       properties:
 *         buyerId:
 *           type: string
 *         approved:
 *           type: boolean
 *           default: false
 *         eligibility:
 *           type: number
 *         score:
 *           type: number
 *         employmentDurationScore:
 *           type: number
 *         creditHistoryScore:
 *           type: number
 *         averageBalanceScore:
 *           type: number
 *         employmentStatusScore:
 *           type: number
 *         overdraftScore:
 *           type: number
 *         message:
 *           type: string
 *         finalApprovedLoan:
 *           type: number
 *         maxEligibleLoan:
 *           type: number
 *         monthlyRepayment:
 *           type: number
 *         approvedPurchaseAmount:
 *           type: number
 *         requiredDownPayment:
 *           type: number
 *     UpdateEligibilityAndScoreInput:
 *       type: object
 *       properties:
 *         approved:
 *           type: boolean
 *         eligibility:
 *           type: number
 *         score:
 *           type: number
 *         employmentDurationScore:
 *           type: number
 *         creditHistoryScore:
 *           type: number
 *         averageBalanceScore:
 *           type: number
 *         employmentStatusScore:
 *           type: number
 *         overdraftScore:
 *           type: number
 *         message:
 *           type: string
 *         finalApprovedLoan:
 *           type: number
 *         maxEligibleLoan:
 *           type: number
 *         monthlyRepayment:
 *           type: number
 *         approvedPurchaseAmount:
 *           type: number
 *         requiredDownPayment:
 *           type: number
 */
/**
 * @swagger
 * /api/v1/eligibility-scores/{id}/approval:
 *   patch:
 *     summary: Update approval status (approve or reject)
 *     tags: [EligibilityAndScore]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: True to approve, false to reject
 *     responses:
 *       200:
 *         description: Approval status updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Record not found
 */

export class EligibilityAndScoreController {
  /**
   * Create eligibility and score record
   */
  async create(req: Request, res: Response) {
    try {
      const input: CreateEligibilityAndScoreInput = req.body;

      // Validation
      if (!input.buyerId) {
        return res.status(400).json({
          success: false,
          message: "Buyer ID is required",
        });
      }

      const result = await eligibilityAndScoreService.createEligibilityAndScore(
        input
      );

      return res.status(201).json(result);
    } catch (error: any) {
      console.error("Error creating eligibility and score:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create eligibility and score",
      });
    }
  }

  /**
   * Get all eligibility and score records
   */
  async list(req: Request, res: Response) {
    try {
      const { approved } = req.query;
      const approvedFilter =
        approved === "true" ? true : approved === "false" ? false : undefined;

      const result =
        await eligibilityAndScoreService.getAllEligibilityAndScores(
          approvedFilter
        );
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching eligibility and score records:", error);
      return res.status(500).json({
        success: false,
        message:
          error.message || "Failed to fetch eligibility and score records",
      });
    }
  }

  /**
   * Get eligibility and score by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result =
        await eligibilityAndScoreService.getEligibilityAndScoreById(id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching eligibility and score:", error);
      return res.status(404).json({
        success: false,
        message: error.message || "Eligibility and score not found",
      });
    }
  }

  /**
   * Get all eligibility and score records by buyer ID
   */
  async getByBuyerId(req: Request, res: Response) {
    try {
      const { buyerId } = req.params;
      const { approved } = req.query;
      const approvedFilter =
        approved === "true" ? true : approved === "false" ? false : undefined;

      const result =
        await eligibilityAndScoreService.getEligibilityAndScoreByBuyerId(
          buyerId,
          approvedFilter
        );
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching eligibility and score records:", error);
      return res.status(404).json({
        success: false,
        message: error.message || "Eligibility and score not found",
      });
    }
  }

  /**
   * Get latest eligibility and score by buyer ID
   */
  async getLatestByBuyerId(req: Request, res: Response) {
    try {
      const { buyerId } = req.params;
      const { approved } = req.query;
      const approvedFilter =
        approved === "true" ? true : approved === "false" ? false : undefined;

      const result =
        await eligibilityAndScoreService.getLatestEligibilityAndScoreByBuyerId(
          buyerId,
          approvedFilter
        );
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching latest eligibility and score:", error);
      return res.status(404).json({
        success: false,
        message: error.message || "Eligibility and score not found",
      });
    }
  }

  /**
   * Update eligibility and score
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const input: UpdateEligibilityAndScoreInput = req.body;

      const result = await eligibilityAndScoreService.updateEligibilityAndScore(
        id,
        input
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error updating eligibility and score:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update eligibility and score",
      });
    }
  }

  /**
   * Delete eligibility and score
   */
  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await eligibilityAndScoreService.deleteEligibilityAndScore(
        id
      );
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error deleting eligibility and score:", error);
      return res.status(404).json({
        success: false,
        message: error.message || "Failed to delete eligibility and score",
      });
    }
  }

  /**
   * Create new eligibility and score record (always creates new)
   */
  async createNew(req: Request, res: Response) {
    try {
      const input: CreateEligibilityAndScoreInput = req.body;

      // Validation
      if (!input.buyerId) {
        return res.status(400).json({
          success: false,
          message: "Buyer ID is required",
        });
      }

      const result =
        await eligibilityAndScoreService.createNewEligibilityAndScore(input);

      return res.status(201).json(result);
    } catch (error: any) {
      console.error("Error creating eligibility and score:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to save eligibility and score",
      });
    }
  }

  /**
   * Update approval status (approve or reject)
   */
  async updateApprovalStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { approved } = req.body;

      // Validation
      if (typeof approved !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Approved field must be a boolean value",
        });
      }

      const result = await eligibilityAndScoreService.updateApprovalStatus(
        id,
        approved
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error updating approval status:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update approval status",
      });
    }
  }
}

export const eligibilityAndScoreController =
  new EligibilityAndScoreController();
