import { Request, Response } from "express";
import { liftpayIdService } from "../services/liftpayIdService";

/**
 * @openapi
 * /api/v1/liftpay-id/generate:
 *   post:
 *     summary: Generate a new LiftPay ID
 *     tags: [LiftPay ID]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prefix
 *             properties:
 *               prefix:
 *                 type: string
 *                 description: Prefix for the ID (e.g., LPM, LPB, LPL, LPP)
 *                 example: "LPM"
 *                 minLength: 1
 *                 maxLength: 10
 *     responses:
 *       200:
 *         description: LiftPay ID generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     liftpayId:
 *                       type: string
 *                       description: Generated LiftPay ID
 *                       example: "LPM-2510-100001"
 *       400:
 *         description: Invalid prefix or generation failed
 *       500:
 *         description: Server error
 */
export const liftpayIdController = {
  generateLiftPayId: async (req: Request, res: Response) => {
    try {
      const { prefix } = req.body;

      if (!prefix) {
        return res.status(400).json({
          success: false,
          message: "Prefix is required",
        });
      }

      const result = await liftpayIdService.generateLiftPayId(prefix);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error || "Failed to generate LiftPay ID",
        });
      }

      res.json({
        success: true,
        message: "LiftPay ID generated successfully",
        data: {
          liftpayId: result.liftpayId,
        },
      });
    } catch (error: any) {
      console.error("Error in generateLiftPayId:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/liftpay-id/validate:
   *   post:
   *     summary: Validate a LiftPay ID format
   *     tags: [LiftPay ID]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - liftpayId
   *             properties:
   *               liftpayId:
   *                 type: string
   *                 description: LiftPay ID to validate
   *                 example: "LPM-2510-100001"
   *     responses:
   *       200:
   *         description: Validation result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     isValid:
   *                       type: boolean
   *                     parsed:
   *                       type: object
   *                       properties:
   *                         prefix:
   *                           type: string
   *                         yearMonth:
   *                           type: string
   *                         sequence:
   *                           type: number
   *       400:
   *         description: Invalid request
   *       500:
   *         description: Server error
   */
  validateLiftPayId: async (req: Request, res: Response) => {
    try {
      const { liftpayId } = req.body;

      if (!liftpayId) {
        return res.status(400).json({
          success: false,
          message: "LiftPay ID is required",
        });
      }

      const isValid = liftpayIdService.validateLiftPayId(liftpayId);
      const parsed = isValid
        ? liftpayIdService.parseLiftPayId(liftpayId)
        : null;

      res.json({
        success: true,
        message: isValid ? "LiftPay ID is valid" : "LiftPay ID is invalid",
        data: {
          isValid,
          parsed,
        },
      });
    } catch (error: any) {
      console.error("Error in validateLiftPayId:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/liftpay-id/sequences/{prefix}:
   *   get:
   *     summary: Get sequences for a specific prefix
   *     tags: [LiftPay ID]
   *     parameters:
   *       - in: path
   *         name: prefix
   *         required: true
   *         schema:
   *           type: string
   *         description: Prefix to query sequences for
   *         example: "LPM"
   *     responses:
   *       200:
   *         description: Sequences retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     prefix:
   *                       type: string
   *                     sequences:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           yearMonth:
   *                             type: string
   *                           seq:
   *                             type: number
   *       400:
   *         description: Invalid prefix
   *       500:
   *         description: Server error
   */
  getSequencesForPrefix: async (req: Request, res: Response) => {
    try {
      const { prefix } = req.params;

      if (!prefix) {
        return res.status(400).json({
          success: false,
          message: "Prefix is required",
        });
      }

      const sequences = await liftpayIdService.getSequencesForPrefix(prefix);

      res.json({
        success: true,
        message: "Sequences retrieved successfully",
        data: {
          prefix,
          sequences,
        },
      });
    } catch (error: any) {
      console.error("Error in getSequencesForPrefix:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/liftpay-id/statistics:
   *   get:
   *     summary: Get LiftPay ID generation statistics
   *     tags: [LiftPay ID]
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalPrefixes:
   *                       type: number
   *                     totalSequences:
   *                       type: number
   *                     prefixes:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           prefix:
   *                             type: string
   *                           count:
   *                             type: number
   *       500:
   *         description: Server error
   */
  getStatistics: async (req: Request, res: Response) => {
    try {
      const statistics = await liftpayIdService.getStatistics();

      res.json({
        success: true,
        message: "Statistics retrieved successfully",
        data: statistics,
      });
    } catch (error: any) {
      console.error("Error in getStatistics:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/liftpay-id/health:
   *   get:
   *     summary: Check LiftPay ID service health
   *     tags: [LiftPay ID]
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  health: async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        message: "LiftPay ID service is running",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error in LiftPay ID health check:", error);
      res.status(500).json({
        success: false,
        message: "Service unavailable",
        error: error.message,
      });
    }
  },
};
