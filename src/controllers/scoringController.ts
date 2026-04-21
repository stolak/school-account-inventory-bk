import { Request, Response } from 'express';
import { scoreService, ScoringInput, SelfAssessmentScoringInput } from '../services/scoringService';

/**
 * @swagger
 * /api/v1/scoring/calculate:
 *   post:
 *     summary: Calculate composite scoring result
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScoringInput'
 *     responses:
 *       200:
 *         description: Scoring calculated successfully
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
 *                   example: Scoring calculated successfully
 *                 data:
 *                   $ref: '#/components/schemas/ScoringCalculateResult'
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/scoring/self-assessment/calculate:
 *   post:
 *     summary: Calculate self-assessment scoring result
 *     tags: [Scoring]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SelfAssessmentScoringInput'
 *     responses:
 *       200:
 *         description: Self-assessment scoring calculated successfully
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
 *                   example: Self-assessment scoring calculated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     finalScore:
 *                       type: number
 *                       example: 68
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         incomeRecurrentScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         incomeStabilityScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         netCashFlowScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         liquidityBufferScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         overdraftScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         creditBehaviorScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                         riskFactorScore:
 *                           $ref: '#/components/schemas/WeightedScore'
 *                     eligibility:
 *                       $ref: '#/components/schemas/EligibilityDeterminationResult'
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     WeightedScore:
 *       type: object
 *       required:
 *         - weight
 *         - score
 *       properties:
 *         weight:
 *           type: number
 *           example: 10
 *         score:
 *           type: number
 *           example: 7
 *     EligibilityDeterminationResult:
 *       type: object
 *       required:
 *         - eligible
 *         - riskLevel
 *         - dtiRatio
 *       properties:
 *         eligible:
 *           type: boolean
 *           example: true
 *         riskLevel:
 *           type: string
 *           enum: [high, medium, low]
 *           example: medium
 *         dtiRatio:
 *           type: number
 *           example: 16.67
 *     IncomeRecurrentInput:
 *       type: object
 *       required:
 *         - incomeMonths
 *         - dominantSourceCount
 *         - isFiftMonth
 *         - isSixtMonth
 *       properties:
 *         incomeMonths:
 *           type: number
 *           example: 5
 *         dominantSourceCount:
 *           type: number
 *           example: 4
 *         isFiftMonth:
 *           type: boolean
 *           example: true
 *         isSixtMonth:
 *           type: boolean
 *           example: true
 *     IncomeStabilityInput:
 *       type: object
 *       required:
 *         - averageIncome
 *         - monthlyIncomes
 *       properties:
 *         averageIncome:
 *           type: number
 *           example: 250000
 *         monthlyIncomes:
 *           type: array
 *           items:
 *             type: number
 *           example: [220000, 240000, 250000, 255000, 260000, 275000]
 *     LiquidityBufferMonthSnapshot:
 *       type: object
 *       required:
 *         - preIncomeBalance
 *         - monthEndBalance
 *       properties:
 *         preIncomeBalance:
 *           type: number
 *           example: 30000
 *         monthEndBalance:
 *           type: number
 *           example: 45000
 *     LiquidityBufferInput:
 *       type: object
 *       required:
 *         - months
 *         - recurringIncomeExists
 *       properties:
 *         months:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LiquidityBufferMonthSnapshot'
 *         recurringIncomeExists:
 *           type: boolean
 *           example: true
 *         estimatedMonthlyIncome:
 *           type: number
 *           example: 250000
 *         averageMonthlyInflow:
 *           type: number
 *           example: 230000
 *     MonthlyScores:
 *       type: object
 *       required:
 *         - M1
 *         - M2
 *         - M3
 *         - M4
 *         - M5
 *         - M6
 *       properties:
 *         M1:
 *           type: number
 *           example: 0
 *         M2:
 *           type: number
 *           example: 1
 *         M3:
 *           type: number
 *           example: 0
 *         M4:
 *           type: number
 *           example: 2
 *         M5:
 *           type: number
 *           example: 0
 *         M6:
 *           type: number
 *           example: 0
 *     IncomeRecurrentScoreDetail:
 *       type: object
 *       properties:
 *         recurrentCoverage:
 *           type: number
 *           example: 0.83
 *         recencyStrength:
 *           type: number
 *           example: 1
 *         sourceConsistency:
 *           type: number
 *           example: 0.8
 *         score:
 *           type: number
 *           example: 18.5
 *     LiquidityBufferScoreDetail:
 *       type: object
 *       properties:
 *         monthCount:
 *           type: number
 *           example: 6
 *         score:
 *           type: number
 *           example: 8
 *     ScoringBreakdown:
 *       type: object
 *       properties:
 *         incomeRecurrentScore:
 *           type: number
 *         incomeStabilityScore:
 *           type: number
 *         netCashFlowScore:
 *           type: number
 *         liquidityBufferScore:
 *           type: number
 *         overdraftScore:
 *           type: number
 *         creditBehaviorScore:
 *           type: number
 *         riskFactorScore:
 *           type: number
 *     ScoringCalculateResult:
 *       type: object
 *       required:
 *         - finalScore
 *         - eligibility
 *         - eligible
 *         - breakdown
 *         - details
 *       properties:
 *         finalScore:
 *           type: number
 *           example: 74
 *         eligibility:
 *           type: number
 *           description: Tier from final score (0, 0.5, 0.75, or 1)
 *           enum: [0, 0.5, 0.75, 1]
 *           example: 1
 *         eligible:
 *           $ref: '#/components/schemas/EligibilityDeterminationResult'
 *           description: Debt-to-income and score-based eligibility (nested boolean `eligible`)
 *         breakdown:
 *           $ref: '#/components/schemas/ScoringBreakdown'
 *         details:
 *           type: object
 *           required:
 *             - incomeRecurrent
 *             - liquidityBuffer
 *           properties:
 *             incomeRecurrent:
 *               $ref: '#/components/schemas/IncomeRecurrentScoreDetail'
 *             liquidityBuffer:
 *               $ref: '#/components/schemas/LiquidityBufferScoreDetail'
 *     ScoringInput:
 *       type: object
 *       required:
 *         - incomeRecurrent
 *         - incomeStability
 *         - netCashFlowPositiveCount
 *         - liquidityBuffer
 *         - creditHistory
 *         - riskFactor
 *         - overdraftRecent
 *         - existingLoanRepayment
 *       properties:
 *         incomeRecurrent:
 *           $ref: '#/components/schemas/IncomeRecurrentInput'
 *         incomeStability:
 *           $ref: '#/components/schemas/IncomeStabilityInput'
 *         netCashFlowPositiveCount:
 *           type: number
 *           description: Number of months (in the observed window) with positive net cash flow
 *           example: 4
 *         liquidityBuffer:
 *           $ref: '#/components/schemas/LiquidityBufferInput'
 *         creditHistory:
 *           type: number
 *           description: Bucket 1 (best) through 3 (weak)
 *           example: 2
 *         riskFactor:
 *           $ref: '#/components/schemas/MonthlyScores'
 *         overdraftEvents:
 *           type: number
 *           description: Optional; defaults treated as 0 when omitted
 *           example: 1
 *         overdraftDeepestNegativeBalance:
 *           type: number
 *           example: 2000
 *         overdraftNegativeDays:
 *           type: number
 *           example: 3
 *         overdraftRecent:
 *           type: boolean
 *           description: Whether overdraft occurred in the last 2 months
 *           example: false
 *         existingLoanRepayment:
 *           type: number
 *           description: Existing monthly loan repayment (₦), used for eligibility
 *           example: 20000
 *     SelfAssessmentScoringInput:
 *       type: object
 *       required:
 *         - incomeRecurrent
 *         - overdraftCount
 *         - overdraftEvents
 *         - overdraftDeepestNegativeBalance
 *         - overdraftNegativeDays
 *         - overdraftRecent
 *         - creditHistory
 *         - totalFlags
 *         - estimatedMonthlyIncome
 *         - existingLoanRepayment
 *       properties:
 *         incomeRecurrent:
 *           $ref: '#/components/schemas/IncomeRecurrentInput'
 *         overdraftCount:
 *           type: number
 *           example: 1
 *         overdraftEvents:
 *           type: number
 *           example: 1
 *         overdraftDeepestNegativeBalance:
 *           type: number
 *           example: 2000
 *         overdraftNegativeDays:
 *           type: number
 *           example: 3
 *         overdraftRecent:
 *           type: boolean
 *           example: false
 *         creditHistory:
 *           type: number
 *           example: 2
 *         totalFlags:
 *           type: number
 *           description: Count of checked risk flags (0-6)
 *           example: 2
 *         estimatedMonthlyIncome:
 *           type: number
 *           example: 120000
 *         existingLoanRepayment:
 *           type: number
 *           example: 20000
 */
export class ScoringController {
  async calculate(req: Request, res: Response) {
    try {
      const input: ScoringInput = req.body;

      if (!input || typeof input !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
        });
      }

      if (!input.incomeRecurrent || !input.incomeStability || !input.liquidityBuffer) {
        return res.status(400).json({
          success: false,
          message: 'incomeRecurrent, incomeStability, and liquidityBuffer are required',
        });
      }

      if (typeof input.netCashFlowPositiveCount !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'netCashFlowPositiveCount is required and must be a number',
        });
      }

      if (typeof input.creditHistory !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'creditHistory is required and must be a number',
        });
      }

      if (typeof input.existingLoanRepayment !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'existingLoanRepayment is required and must be a number',
        });
      }

      if (typeof input.overdraftRecent !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'overdraftRecent is required and must be a boolean',
        });
      }

      if (!input.riskFactor || typeof input.riskFactor !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'riskFactor is required and must be an object (MonthlyScores)',
        });
      }

      const result = await scoreService.scoring(input);

      return res.status(200).json({
        success: true,
        message: 'Scoring calculated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error calculating scoring:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate scoring',
      });
    }
  }

  async selfAssessmentCalculate(req: Request, res: Response) {
    try {
      const input: SelfAssessmentScoringInput = req.body;

      if (!input || typeof input !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Request body is required',
        });
      }

      if (!input.incomeRecurrent) {
        return res.status(400).json({
          success: false,
          message: 'incomeRecurrent is required',
        });
      }

      if (typeof input.overdraftCount !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'overdraftCount is required and must be a number',
        });
      }

      if (typeof input.overdraftEvents !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'overdraftEvents is required and must be a number',
        });
      }

      if (typeof input.overdraftDeepestNegativeBalance !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'overdraftDeepestNegativeBalance is required and must be a number',
        });
      }

      if (typeof input.overdraftNegativeDays !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'overdraftNegativeDays is required and must be a number',
        });
      }

      if (typeof input.overdraftRecent !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'overdraftRecent is required and must be a boolean',
        });
      }

      if (typeof input.creditHistory !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'creditHistory is required and must be a number',
        });
      }

      if (typeof input.totalFlags !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'totalFlags is required and must be a number',
        });
      }

      if (typeof input.estimatedMonthlyIncome !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'estimatedMonthlyIncome is required and must be a number',
        });
      }

      if (typeof input.existingLoanRepayment !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'existingLoanRepayment is required and must be a number',
        });
      }

      const result = await scoreService.selfAssessmentScoring(input);

      return res.status(200).json({
        success: true,
        message: 'Self-assessment scoring calculated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error calculating self-assessment scoring:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate self-assessment scoring',
      });
    }
  }
}

export const scoringController = new ScoringController();
