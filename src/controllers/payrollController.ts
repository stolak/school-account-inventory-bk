import { Request, Response } from "express";
import { payrollService } from "../services/payrollService";

/**
 * @openapi
 * /api/v1/payroll/compute:
 *   post:
 *     summary: Run payroll computation
 *     description: Computes payroll for the current period. Placeholder implementation — no processing yet.
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Computation completed successfully
 *       500:
 *         description: Server error
 */
export const payrollController = {
  compute: async (_req: Request, res: Response) => {
    try {
      const result = await payrollService.compute();

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error: unknown) {
      return res.status(500).json({
        success: false,
        message: "Failed to run payroll computation",
        error: error instanceof Error ? error.message : undefined,
      });
    }
  },
};
