import { Request, Response } from "express";
import { loanService } from "../services/loanService";

/**
 * @swagger
 * tags:
 *   name: LoanPenaltySchedule
 *   description: Loan penalty schedule management
 */

/**
 * @swagger
 * /api/v1/loan-penalty-schedules:
 *   post:
 *     summary: Create a new loan penalty schedule
 *     tags: [LoanPenaltySchedule]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loadScheduleId
 *               - start
 *               - end
 *               - percentage
 *             properties:
 *               loadScheduleId:
 *                 type: string
 *                 description: ID of the loan schedule
 *               start:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of the penalty period
 *               end:
 *                 type: string
 *                 format: date-time
 *                 description: End date of the penalty period
 *               percentage:
 *                 type: number
 *                 description: Penalty percentage
 *               isExecuted:
 *                 type: boolean
 *                 default: false
 *               executedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Penalty schedule created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/v1/loan-penalty-schedules/{id}:
 *   get:
 *     summary: Get penalty schedule by ID
 *     tags: [LoanPenaltySchedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Penalty schedule details
 *       404:
 *         description: Penalty schedule not found
 */

/**
 * @swagger
 * /api/v1/loan-penalty-schedules/schedule/{scheduleId}:
 *   get:
 *     summary: Get all penalty schedules for a loan schedule
 *     tags: [LoanPenaltySchedule]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of penalty schedules
 */

/**
 * @swagger
 * /api/v1/loan-penalty-schedules/pending:
 *   get:
 *     summary: Get pending penalty schedules by date
 *     tags: [LoanPenaltySchedule]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date to check (defaults to current date)
 *     responses:
 *       200:
 *         description: List of pending penalty schedules
 */

/**
 * @swagger
 * /api/v1/loan-penalty-schedules/{id}:
 *   patch:
 *     summary: Update penalty schedule
 *     tags: [LoanPenaltySchedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start:
 *                 type: string
 *                 format: date-time
 *               end:
 *                 type: string
 *                 format: date-time
 *               percentage:
 *                 type: number
 *               isExecuted:
 *                 type: boolean
 *               executedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Penalty schedule updated
 *       404:
 *         description: Penalty schedule not found
 */

/**
 * @swagger
 * /api/v1/loan-penalty-schedules/{id}/execute:
 *   patch:
 *     summary: Execute a penalty schedule (mark as executed)
 *     tags: [LoanPenaltySchedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Penalty schedule executed successfully
 *       404:
 *         description: Penalty schedule not found
 */

/**
 * @swagger
 * /api/v1/loan-penalty-schedules/{id}:
 *   delete:
 *     summary: Delete penalty schedule
 *     tags: [LoanPenaltySchedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Penalty schedule deleted successfully
 *       404:
 *         description: Penalty schedule not found
 */

export class LoanPenaltyScheduleController {
  /**
   * Create a new penalty schedule
   */
  async create(req: Request, res: Response) {
    try {
      const result = await loanService.createLoanPenaltySchedule(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Loan penalty schedule created successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error creating penalty schedule:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create penalty schedule",
      });
    }
  }

  /**
   * Get penalty schedule by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await loanService.getLoanPenaltyScheduleById(id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error fetching penalty schedule:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch penalty schedule",
      });
    }
  }

  /**
   * Get all penalty schedules for a loan schedule
   */
  async getByScheduleId(req: Request, res: Response) {
    try {
      const { scheduleId } = req.params;
      const result = await loanService.getLoanPenaltySchedulesByScheduleId(
        scheduleId
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error fetching penalty schedules:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch penalty schedules",
      });
    }
  }

  /**
   * Get pending penalty schedules by date
   */
  async getPendingByDate(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const checkDate = date ? new Date(date as string) : new Date();

      if (date && isNaN(checkDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      const result = await loanService.getPendingPenaltySchedulesByDate(
        checkDate
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.count,
        message: `Found ${result.count} pending penalty schedule(s)`,
      });
    } catch (error: any) {
      console.error("Error fetching pending penalty schedules:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch pending penalty schedules",
      });
    }
  }

  /**
   * Update penalty schedule
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await loanService.updateLoanPenaltySchedule(id, req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Penalty schedule updated successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error updating penalty schedule:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update penalty schedule",
      });
    }
  }

  /**
   * Execute penalty schedule
   */
  async execute(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await loanService.executeLoanPenaltySchedule(id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message || "Penalty schedule executed successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error executing penalty schedule:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to execute penalty schedule",
      });
    }
  }

  /**
   * Delete penalty schedule
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await loanService.deleteLoanPenaltySchedule(id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message || "Penalty schedule deleted successfully",
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error deleting penalty schedule:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to delete penalty schedule",
      });
    }
  }
}

export const loanPenaltyScheduleController =
  new LoanPenaltyScheduleController();
