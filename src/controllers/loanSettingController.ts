import { Request, Response } from 'express';
import {
  loanSettingService,
  LoanSettingInput,
  LoanEvaluationParams,
  LoanEvaluationWithFinalApprovalResult,
  PurchaseLoanEvaluation,
  EligibilityAndScoreParams,
} from '../services/loanSettingService';

export class LoanSettingController {
  /**
   * Get current loan settings
   */
  async getLoanSettings(req: Request, res: Response) {
    try {
      const loanSettings = await loanSettingService.getLoanSettings();

      if (!loanSettings) {
        return res.status(404).json({
          success: false,
          message: 'Loan settings not found',
        });
      }

      res.status(200).json({
        success: true,
        data: loanSettings,
      });
    } catch (error: any) {
      console.error('Error getting loan settings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Upsert loan settings (create if not exists, update if exists)
   */
  async upsertLoanSettings(req: Request, res: Response) {
    try {
      const data: LoanSettingInput = req.body;

      // Validate required fields
      if (data.loanInterestRate === undefined) {
        return res.status(400).json({
          success: false,
          message: 'loanInterestRate is required',
        });
      }

      const loanSettings = await loanSettingService.upsertLoanSettings(data);

      res.status(200).json({
        success: true,
        message: 'Loan settings upserted successfully',
        data: loanSettings,
      });
    } catch (error: any) {
      console.error('Error upserting loan settings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Update specific loan setting fields
   */
  async updateLoanSettings(req: Request, res: Response) {
    try {
      const data: LoanSettingInput = req.body;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields provided for update',
        });
      }

      const loanSettings = await loanSettingService.updateLoanSettings(data);

      res.status(200).json({
        success: true,
        message: 'Loan settings updated successfully',
        data: loanSettings,
      });
    } catch (error: any) {
      console.error('Error updating loan settings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Reset loan settings to default values
   */
  async resetLoanSettings(req: Request, res: Response) {
    try {
      const loanSettings = await loanSettingService.resetLoanSettings();

      res.status(200).json({
        success: true,
        message: 'Loan settings reset to default values',
        data: loanSettings,
      });
    } catch (error: any) {
      console.error('Error resetting loan settings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Delete loan settings
   */
  async deleteLoanSettings(req: Request, res: Response) {
    try {
      const result = await loanSettingService.deleteLoanSettings();

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error('Error deleting loan settings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Evaluate loan request using individual parameters
   */
  async evaluateLoanRequest(req: Request, res: Response) {
    try {
      const {
        monthlyIncome,
        months,
        monthlyInterestRate,
        existingMonthlyRepayment = 0,
        requestedLoanAmount,
        repaymentRatio = 35,
        maxLoanCap = Infinity,
      } = req.body;

      // Validate required fields
      if (!monthlyIncome || !months || !monthlyInterestRate || !requestedLoanAmount) {
        return res.status(400).json({
          success: false,
          message:
            'monthlyIncome, months, monthlyInterestRate, and requestedLoanAmount are required',
        });
      }

      const result = loanSettingService.evaluateLoanRequest(
        monthlyIncome,
        months,
        monthlyInterestRate,
        existingMonthlyRepayment,
        requestedLoanAmount,
        repaymentRatio,
        maxLoanCap,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error evaluating loan request:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Evaluate loan request using object parameters
   */
  async evaluateLoanRequestWithObject(req: Request, res: Response) {
    try {
      const params: LoanEvaluationParams = req.body;

      // Validate required fields
      if (!params.monthlyIncome || !params.months || !params.monthlyInterestRate) {
        return res.status(400).json({
          success: false,
          message: 'monthlyIncome, months, and monthlyInterestRate are required',
        });
      }

      const result = loanSettingService.evaluateLoanRequestWithObject(params);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error evaluating loan request with object:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Evaluate loan request with final approval
   */
  async evaluateLoanRequestWithFinalApproval(req: Request, res: Response) {
    try {
      const params: LoanEvaluationParams = req.body;

      // Validate required fields
      if (!params.monthlyIncome || !params.months || !params.monthlyInterestRate) {
        return res.status(400).json({
          success: false,
          message: 'monthlyIncome, months, and monthlyInterestRate are required',
        });
      }

      const result = loanSettingService.evaluateLoanRequestWithFinalApproval(params);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error evaluating loan request with final approval:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Evaluate purchase loan with final approval
   */
  async evaluatePurchaseLoanWithFinalApproval(req: Request, res: Response) {
    try {
      const data: PurchaseLoanEvaluation & LoanEvaluationParams = req.body;

      // Validate required fields
      const requiredFields = [
        // "purchaseAmount",
        'minDownPaymentPercent',
        'maxLoanCap',
        'monthlyIncome',
        'months',
        'monthlyInterestRate',
      ];

      for (const field of requiredFields) {
        if (data[field as keyof typeof data] === undefined) {
          return res.status(400).json({
            success: false,
            message: `${field} is required`,
          });
        }
      }

      const result = loanSettingService.evaluatePurchaseLoanWithFinalApproval(data);

      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'Unable to evaluate purchase loan',
        });
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error evaluating purchase loan with final approval:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Evaluate eligibility and score for loan application
   */
  async evaluateEligibilityAndScore(req: Request, res: Response) {
    try {
      const data: EligibilityAndScoreParams = req.body;

      // Validate required fields
      const requiredFields = [
        'employmentStatus',
        'employmentDuration',
        'overdraft',
        'creditHistory',
        'averageBalance',
        'monthlyIncome',
        'months',
      ];

      for (const field of requiredFields) {
        if (data[field as keyof typeof data] === undefined) {
          return res.status(400).json({
            success: false,
            message: `${field} is required`,
          });
        }
      }

      const result = loanSettingService.eligibilityAndScore(data);

      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'Unable to evaluate eligibility and score',
        });
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error evaluating eligibility and score:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  /**
   * Live eligibility purchase evaluation for authenticated buyer
   */
  async liveEligibilityPurchase(req: Request, res: Response) {
    try {
      const { purchaseAmount, downPaymentAmount, months } = req.body;
      const buyerId = req.user?.buyerId;

      // Validate required fields
      if (!purchaseAmount || !months) {
        return res.status(400).json({
          success: false,
          message: 'purchaseAmount and months are required',
        });
      }

      if (!buyerId) {
        return res.status(401).json({
          success: false,
          message: 'Buyer ID not found. Please log in as a buyer.',
        });
      }

      const result = await loanSettingService.liveEligibilityPurchase({
        purchaseAmount,
        downPaymentAmount,
        months,
        buyerId,
      });

      if (!result) {
        console.error('unable to find live eligibility');
        return res.status(400).json({
          success: false,
          message: 'Unable to evaluate live eligibility',
        });
      }

      // console.log('result', result);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error evaluating live eligibility purchase:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }
}

export const loanSettingController = new LoanSettingController();
