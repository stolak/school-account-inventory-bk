import { Request, Response } from "express";
import { payrollService } from "../services/payrollService";
import { parseIntOrUndefined, routeParam } from "../utils/request";

function parseYearMonthQuery(
  yearRaw: unknown,
  monthRaw: unknown
): { year: number; month: number } | null {
  const year =
    typeof yearRaw === "string"
      ? Number.parseInt(yearRaw, 10)
      : typeof yearRaw === "number"
        ? yearRaw
        : NaN;
  const month =
    typeof monthRaw === "string"
      ? Number.parseInt(monthRaw, 10)
      : typeof monthRaw === "number"
        ? monthRaw
        : NaN;
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { year, month };
}

function httpStatusForPayrollReportError(message: string): number {
  if (message === "Invalid staffId") return 404;
  if (message.includes("must be")) return 400;
  return 500;
}

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
/**
 * @openapi
 * /api/v1/payroll/report:
 *   get:
 *     summary: Payroll report for a period
 *     description: >
 *       Returns periodComponent (unique salary components used in the period, earnings first then deductions by rank)
 *       and staffPayroll (payroll processes for the period with nested payroll components).
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1900
 *           maximum: 2100
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional filter for staffPayroll only
 *     responses:
 *       200:
 *         description: Payroll report
 *       400:
 *         description: Validation error
 *       404:
 *         description: Invalid staffId
 *       500:
 *         description: Server error
 */
export const payrollController = {
  report: async (req: Request, res: Response) => {
    try {
      const parsed = parseYearMonthQuery(req.query.year, req.query.month);
      if (!parsed) {
        return res.status(400).json({
          success: false,
          message: "year and month are required and must be integers",
        });
      }

      const staffIdRaw =
        typeof req.query.staffId === "string" ? routeParam(req.query.staffId).trim() : undefined;
      const staffId = staffIdRaw || undefined;

      const data = await payrollService.getPayrollReport({
        year: parsed.year,
        month: parsed.month,
        ...(staffId ? { staffId } : {}),
      });

      return res.json({
        success: true,
        message: "Payroll report retrieved successfully",
        data,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to retrieve payroll report";
      return res.status(httpStatusForPayrollReportError(message)).json({ success: false, message });
    }
  },

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
