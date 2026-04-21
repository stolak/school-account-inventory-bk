import { Request, Response } from 'express';
import { analyzeBankStatementRework } from '../services/bankStatementAnalysisService';
import { convertGtbankStatementFullToNormalizedTransactions } from '../services/helperService';

/**
 * @swagger
 * /api/v1/bank-statement-analysis/rework:
 *   post:
 *     summary: Analyze bank statement into ScoringInput (structured output)
 *     description: Converts bank statement transactions into a `ScoringInput` object for scoring/eligibility processing.
 *     tags: [BankStatementAnalysis]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 description: Array of transaction records (raw bank statement rows)
 *                 items:
 *                   type: object
 *               systemPrompt:
 *                 description: Optional override for the system prompt used for extraction (string or array of lines)
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bank statement analyzed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ScoringInput'
 *       400:
 *         description: Bad request / analysis failed
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/bank-statement-analysis/normalize-gtbank:
 *   post:
 *     summary: Normalize GTBank statement JSON into transaction rows
 *     description: |
 *       Converts `gtbank_statement_full.json`-style payload (root object with `transactions`)
 *       or a raw `transactions` array into normalized rows used by other processing steps.
 *     tags: [BankStatementAnalysis]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 description: Either the full GTBank JSON object or the `transactions` array
 *                 oneOf:
 *                   - type: object
 *                   - type: array
 *                     items:
 *                       type: object
 *     responses:
 *       200:
 *         description: Normalized successfully
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
 *                     $ref: '#/components/schemas/NormalizedBankStatementTransaction'
 *       400:
 *         description: Bad request
 *
 * components:
 *   schemas:
 *     NormalizedBankStatementTransaction:
 *       type: object
 *       required:
 *         - id
 *         - narration
 *         - amount
 *         - type
 *         - category
 *         - date
 *         - balance
 *       properties:
 *         id:
 *           type: string
 *           example: 6290e6d17024d722b0a4b3a2
 *         narration:
 *           type: string
 *         amount:
 *           type: number
 *         type:
 *           type: string
 *           enum: [credit, debit]
 *         category:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         balance:
 *           type: number
 */
export class BankStatementAnalysisController {
  async analyzeRework(req: Request, res: Response) {
    try {
      const { data, systemPrompt } = req.body ?? {};

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'data is required and must be a non-empty array',
        });
      }

      const resolvedSystemPrompt =
        Array.isArray(systemPrompt) ? systemPrompt.join('\n') : systemPrompt;

      if (
        resolvedSystemPrompt !== undefined &&
        typeof resolvedSystemPrompt !== 'string'
      ) {
        return res.status(400).json({
          success: false,
          error: 'systemPrompt must be a string or an array of strings when provided',
        });
      }

      const result = await analyzeBankStatementRework(data, resolvedSystemPrompt);
      if (result.success) {
        return res.status(200).json(result);
      }
      console.error('Error analyzing bank statement (rework):', result.error);
      return res.status(400).json(result);
    } catch (error: any) {
      console.error('Error analyzing bank statement (rework):', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze bank statement',
      });
    }
  }

  async normalizeGtbank(req: Request, res: Response) {
    try {
      const { data } = req.body ?? {};
      if (data === undefined || data === null) {
        return res.status(400).json({
          success: false,
          error: 'data is required',
        });
      }

      const normalized = convertGtbankStatementFullToNormalizedTransactions(data);
      return res.status(200).json({ success: true, data: normalized });
    } catch (error: any) {
      console.error('Error normalizing GTBank statement:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to normalize bank statement',
      });
    }
  }
}

export const bankStatementAnalysisController = new BankStatementAnalysisController();
