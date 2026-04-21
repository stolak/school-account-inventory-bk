import { EligibilityAndScoreService } from "./eligibilityAndScoreService";
import { accountDetailsService } from "./accountDetailsService";
import prisma from "../utils/prisma";

const eligibilityAndScoreService = new EligibilityAndScoreService();

export interface LoanSettingInput {
  loanInterestRate?: number;
  maxLoanAmount?: number;
  minLoanAmount?: number;
  maxLoanTenure?: number;
  minLoanTenure?: number;
  incomeRatio?: number;
  minDownPayment?: number;
  insuranceRate?: number;
  adminFeeBase1To3?: number;
  adminFeeBase4To12?: number;
  adminFeePercentage?: number;
  adminFeeThreshold?: number;
  upfrontFeePercentage?: number;
  upfrontFeeCap?: number;
}

export interface LoanEvaluationParamsFull {
  monthlyIncome: number;
  months: number;
  monthlyInterestRate: number;
  existingMonthlyRepayment?: number;
  requestedLoanAmount?: number;
  repaymentRatio?: number;
  purchaseAmount?: number; // Total cost of item or service
  minDownPaymentPercent: number; // Minimum required down payment percentage (e.g., 0.2 = 20%)
  maxLoanCap: number; // Maximum loan allowed
  downPaymentAmount?: number; // Optional: Customer's proposed down payment
}
export interface LoanSettingData {
  id: string;
  loanInterestRate: number;
  maxLoanAmount: number | null;
  minLoanAmount: number | null;
  maxLoanTenure: number | null;
  minLoanTenure: number | null;
  incomeRatio: number | null;
  minDownPayment: number | null;
  insuranceRate: number | null;
  adminFeeBase1To3: number | null;
  adminFeeBase4To12: number | null;
  adminFeePercentage: number | null;
  adminFeeThreshold: number | null;
  upfrontFeePercentage: number | null;
  upfrontFeeCap: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanEvaluationResult {
  eligible: boolean;
  reasons: string[];
  breakdown: {
    requestedLoan: number;
    monthlyRepayment: number;
  } | null;
}

export interface LoanEvaluationParams {
  monthlyIncome: number;
  months: number;
  monthlyInterestRate: number;
  existingMonthlyRepayment?: number;
  requestedLoanAmount?: number;
  repaymentRatio?: number;
  maxLoanCap?: number;
}

export interface LoanEvaluationWithObjectResult {
  approved: boolean;
  reason: string;
  maxEligibleLoan: number;
  monthlyRepayment: number;
}

export interface LoanEvaluationWithFinalApprovalResult {
  approved: boolean;
  reason: string;
  finalApprovedLoan: number;
  maxEligibleLoan: number;
  monthlyRepayment: number;
}

export interface PurchaseLoanEvaluation {
  purchaseAmount: number; // Total cost of item or service
  minDownPaymentPercent: number; // Minimum required down payment percentage (e.g., 0.2 = 20%)
  maxLoanCap: number; // Maximum loan allowed
  downPaymentAmount?: number; // Optional: Customer's proposed down payment
}

export interface PurchaseLoanResult {
  valid: boolean;
  approvedLoanAmount: number;
  approvedPurchaseAmount?: number;
  requiredDownPayment: number;
  customerDownPayment: number;
  message: string;
}

export interface EligibilityAndScoreParams {
  employmentStatus: number;
  employmentDuration: number;
  overdraft: number;
  creditHistory: number;
  averageBalance: number;
  monthlyIncome: number;
  months: number;
  purchaseAmount?: number;
  downPaymentAmount?: number;
  existingMonthlyRepayment?: number;
  isLive?: boolean;
}

export class LoanSettingService {
  /**
   * Helper function to convert Prisma Decimal fields to numbers
   */
  private convertDecimalToNumber(loanSetting: any): LoanSettingData {
    return {
      ...loanSetting,
      loanInterestRate: Number(loanSetting.loanInterestRate),
      maxLoanAmount: loanSetting.maxLoanAmount
        ? Number(loanSetting.maxLoanAmount)
        : null,
      minLoanAmount: loanSetting.minLoanAmount
        ? Number(loanSetting.minLoanAmount)
        : null,
      incomeRatio: loanSetting.incomeRatio
        ? Number(loanSetting.incomeRatio)
        : null,
      minDownPayment: loanSetting.minDownPayment
        ? Number(loanSetting.minDownPayment)
        : null,
      insuranceRate: loanSetting.insuranceRate
        ? Number(loanSetting.insuranceRate)
        : null,
      adminFeeBase1To3: loanSetting.adminFeeBase1To3
        ? Number(loanSetting.adminFeeBase1To3)
        : null,
      adminFeeBase4To12: loanSetting.adminFeeBase4To12
        ? Number(loanSetting.adminFeeBase4To12)
        : null,
      adminFeePercentage: loanSetting.adminFeePercentage
        ? Number(loanSetting.adminFeePercentage)
        : null,
      adminFeeThreshold: loanSetting.adminFeeThreshold
        ? Number(loanSetting.adminFeeThreshold)
        : null,
      upfrontFeePercentage: loanSetting.upfrontFeePercentage
        ? Number(loanSetting.upfrontFeePercentage)
        : null,
      upfrontFeeCap: loanSetting.upfrontFeeCap
        ? Number(loanSetting.upfrontFeeCap)
        : null,
    };
  }
  /**
   * Get the current loan settings (only one record allowed)
   */
  async getLoanSettings(): Promise<LoanSettingData | null> {
    try {
      const loanSetting = await prisma.loanSetting.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          loanInterestRate: 7.5,
          maxLoanAmount:500000,
          minLoanAmount: 10000,
          maxLoanTenure: 12,
          minLoanTenure: 1,
          incomeRatio: 35,
          minDownPayment: 20,
          insuranceRate: 1,
          adminFeeBase1To3: 2500,
          adminFeeBase4To12: 5000,
      
          adminFeePercentage: null,
          adminFeeThreshold: 250000,
          upfrontFeePercentage: 1,
          upfrontFeeCap: 1000,
        },
        update: {},
      });

      return this.convertDecimalToNumber(loanSetting);
    } catch (error) {
      console.error("Error fetching loan settings:", error);
      throw new Error("Failed to fetch loan settings");
    }
  }

  /**
   * Upsert loan settings (create if not exists, update if exists)
   * Only one record is allowed for this table
   */
  async upsertLoanSettings(data: LoanSettingInput): Promise<LoanSettingData> {
    try {
      // Validate required fields
      if (data.loanInterestRate === undefined) {
        throw new Error("loanInterestRate is required");
      }

      // Prepare the data for upsert
      const upsertData: any = {
        loanInterestRate: data.loanInterestRate,
      };

      // Only include optional fields if they are provided
      if (data.maxLoanAmount !== undefined) {
        upsertData.maxLoanAmount = data.maxLoanAmount;
      }
      if (data.minLoanAmount !== undefined) {
        upsertData.minLoanAmount = data.minLoanAmount;
      }
      if (data.maxLoanTenure !== undefined) {
        upsertData.maxLoanTenure = data.maxLoanTenure;
      }
      if (data.minLoanTenure !== undefined) {
        upsertData.minLoanTenure = data.minLoanTenure;
      }
      if (data.incomeRatio !== undefined) {
        upsertData.incomeRatio = data.incomeRatio;
      }
      if (data.minDownPayment !== undefined) {
        upsertData.minDownPayment = data.minDownPayment;
      }
      if (data.insuranceRate !== undefined) {
        upsertData.insuranceRate = data.insuranceRate;
      }
      if (data.adminFeeBase1To3 !== undefined) {
        upsertData.adminFeeBase1To3 = data.adminFeeBase1To3;
      }
      if (data.adminFeeBase4To12 !== undefined) {
        upsertData.adminFeeBase4To12 = data.adminFeeBase4To12;
      }
      if (data.adminFeePercentage !== undefined) {
        upsertData.adminFeePercentage = data.adminFeePercentage;
      }
      if (data.adminFeeThreshold !== undefined) {
        upsertData.adminFeeThreshold = data.adminFeeThreshold;
      }
      if (data.upfrontFeePercentage !== undefined) {
        upsertData.upfrontFeePercentage = data.upfrontFeePercentage;
      }
      if (data.upfrontFeeCap !== undefined) {
        upsertData.upfrontFeeCap = data.upfrontFeeCap;
      }

      const loanSetting = await prisma.loanSetting.upsert({
        where: { id: "default" },
        update: upsertData,
        create: {
          id: "default",
          ...upsertData,
        },
      });

      return this.convertDecimalToNumber(loanSetting);
    } catch (error) {
      console.error("Error upserting loan settings:", error);
      throw new Error("Failed to upsert loan settings");
    }
  }

  /**
   * Update specific loan setting fields
   */
  async updateLoanSettings(data: LoanSettingInput): Promise<LoanSettingData> {
    try {
      // Check if loan settings exist
      const existing = await prisma.loanSetting.findUnique({
        where: { id: "default" },
      });

      if (!existing) {
        throw new Error("Loan settings not found. Please create them first.");
      }

      // Prepare update data with only provided fields
      const updateData: any = {};

      if (data.loanInterestRate !== undefined) {
        updateData.loanInterestRate = data.loanInterestRate;
      }
      if (data.maxLoanAmount !== undefined) {
        updateData.maxLoanAmount = data.maxLoanAmount;
      }
      if (data.minLoanAmount !== undefined) {
        updateData.minLoanAmount = data.minLoanAmount;
      }
      if (data.maxLoanTenure !== undefined) {
        updateData.maxLoanTenure = data.maxLoanTenure;
      }
      if (data.minLoanTenure !== undefined) {
        updateData.minLoanTenure = data.minLoanTenure;
      }
      if (data.incomeRatio !== undefined) {
        updateData.incomeRatio = data.incomeRatio;
      }
      if (data.minDownPayment !== undefined) {
        updateData.minDownPayment = data.minDownPayment;
      }
      if (data.insuranceRate !== undefined) {
        updateData.insuranceRate = data.insuranceRate;
      }
      if (data.adminFeeBase1To3 !== undefined) {
        updateData.adminFeeBase1To3 = data.adminFeeBase1To3;
      }
      if (data.adminFeeBase4To12 !== undefined) {
        updateData.adminFeeBase4To12 = data.adminFeeBase4To12;
      }
      if (data.adminFeePercentage !== undefined) {
        updateData.adminFeePercentage = data.adminFeePercentage;
      }
      if (data.adminFeeThreshold !== undefined) {
        updateData.adminFeeThreshold = data.adminFeeThreshold;
      }
      if (data.upfrontFeePercentage !== undefined) {
        updateData.upfrontFeePercentage = data.upfrontFeePercentage;
      }
      if (data.upfrontFeeCap !== undefined) {
        updateData.upfrontFeeCap = data.upfrontFeeCap;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error("No valid fields provided for update");
      }

      const loanSetting = await prisma.loanSetting.update({
        where: { id: "default" },
        data: updateData,
      });

      return this.convertDecimalToNumber(loanSetting);
    } catch (error) {
      console.error("Error updating loan settings:", error);
      throw new Error("Failed to update loan settings");
    }
  }

  /**
   * Reset loan settings to default values
   */
  async resetLoanSettings(): Promise<LoanSettingData> {
    try {
      const defaultData = {
        id: "default",
        loanInterestRate: 0,
        maxLoanAmount: null,
        minLoanAmount: null,
        maxLoanTenure: 12,
        minLoanTenure: 1,
        incomeRatio: null,
        minDownPayment: null,
        insuranceRate: null,
        adminFeeBase1To3: null,
        adminFeeBase4To12: null,
        adminFeePercentage: null,
        adminFeeThreshold: null,
        upfrontFeePercentage: null,
        upfrontFeeCap: null,
      };

      const loanSetting = await prisma.loanSetting.upsert({
        where: { id: "default" },
        update: defaultData,
        create: defaultData,
      });

      return this.convertDecimalToNumber(loanSetting);
    } catch (error) {
      console.error("Error resetting loan settings:", error);
      throw new Error("Failed to reset loan settings");
    }
  }

  /**
   * Delete loan settings
   */
  async deleteLoanSettings(): Promise<{ message: string }> {
    try {
      await prisma.loanSetting.delete({
        where: { id: "default" },
      });

      return { message: "Loan settings deleted successfully" };
    } catch (error) {
      console.error("Error deleting loan settings:", error);
      throw new Error("Failed to delete loan settings");
    }
  }

  PV(rate: number, nper: number, pmt: number): number {
    if (rate === 0) {
      // No interest case
      return pmt * nper;
    }

    const pv = (pmt * (1 - Math.pow(1 + rate, -nper))) / rate;
    return parseFloat(pv.toFixed(2));
  }
  /**
   * Evaluate customer's loan request and eligibility.
   *
   * @param {number} monthlyIncome - Customer's monthly income
   * @param {number} months - Number of months for repayment
   * @param {number} monthlyInterestRate - Annual interest rate (e.g. 0.18 for 18%)
   * @param {number} existingMonthlyRepayment - Current monthly repayment
   * @param {number} requestedLoanAmount - The amount the customer wants to borrow
   * @param {number} repaymentRatio - Max portion of income allowed for repayments (default 35)
   * @param {number} maxLoanCap - Maximum allowed loan amount (default Infinity)
   *
   * @returns {LoanEvaluationResult}
   */
  evaluateLoanRequest(
    monthlyIncome: number,
    months: number,
    monthlyInterestRate: number,
    existingMonthlyRepayment: number = 0.0,
    requestedLoanAmount: number,
    repaymentRatio: number = 35,
    maxLoanCap: number = Infinity
  ): LoanEvaluationResult {
    const monthlyRate = monthlyInterestRate / 12;
    const totalAllowedRepayment = monthlyIncome * repaymentRatio * 0.01;

    // Helper to compute monthly repayment
    const computeMonthlyRepayment = (principal: number): number => {
      if (monthlyRate === 0) return principal / months;
      const factor = Math.pow(1 + monthlyRate, months);
      return (principal * monthlyRate * factor) / (factor - 1);
    };

    // Step 1: Compute maximum loan by allowed repayment ratio
    const remainingRepaymentCapacity =
      totalAllowedRepayment - existingMonthlyRepayment;

    const factor = Math.pow(1 + monthlyRate, months);
    let maxLoanByRatio =
      monthlyRate === 0
        ? remainingRepaymentCapacity * months
        : remainingRepaymentCapacity * ((factor - 1) / (monthlyRate * factor));

    // Respect the global loan cap
    const maxLoan = Math.min(maxLoanByRatio, maxLoanCap);

    // Step 2: Compute repayment for the requested loan
    const requestedMonthlyRepayment =
      computeMonthlyRepayment(requestedLoanAmount);

    // Step 3: Run validations
    const reasons: string[] = [];

    if (requestedLoanAmount > maxLoanCap) {
      reasons.push(
        `Requested loan (${requestedLoanAmount.toFixed(
          2
        )}) exceeds maximum allowed loan cap (${maxLoanCap.toFixed(2)}).`
      );
    }

    if (
      Math.floor(existingMonthlyRepayment + requestedMonthlyRepayment) >
      Math.ceil(totalAllowedRepayment)
    ) {
      reasons.push(
        `Total monthly repayment (${(
          existingMonthlyRepayment + requestedMonthlyRepayment
        ).toFixed(2)}) exceeds ${
          repaymentRatio * 100
        }% of monthly income (${totalAllowedRepayment.toFixed(2)}).`
      );
    }

    if (requestedLoanAmount > maxLoan) {
      reasons.push(
        `Requested loan (${requestedLoanAmount.toFixed(
          2
        )}) exceeds allowable amount (${maxLoan.toFixed(2)}).`
      );
    }

    const eligible = reasons.length === 0;

    // Step 4: Compute breakdown if eligible
    let breakdown = null;
    if (eligible) {
      const totalRepayment = requestedMonthlyRepayment * months;
      const totalInterest = totalRepayment - requestedLoanAmount;

      breakdown = {
        requestedLoan: requestedLoanAmount,
        monthlyRepayment: requestedMonthlyRepayment,
      };
    }

    return { eligible, reasons, breakdown };
  }

  /**
   * Evaluate a customer's loan request and determine eligibility using object parameters
   *
   * @param {LoanEvaluationParams} params - Loan evaluation parameters
   * @returns {LoanEvaluationWithObjectResult}
   */
  evaluateLoanRequestWithObject({
    monthlyIncome,
    months,
    monthlyInterestRate,
    existingMonthlyRepayment = 0,
    requestedLoanAmount,
    repaymentRatio = 35,
    maxLoanCap = Infinity,
  }: LoanEvaluationParams): LoanEvaluationWithObjectResult {
    // const monthlyRate = monthlyInterestRate / 12;
    const monthlyRate = monthlyInterestRate;
    const totalAllowedRepayment = monthlyIncome * repaymentRatio * 0.01;

    // Remaining amount available for new loan repayment
    let maxMonthlyPayment = totalAllowedRepayment - existingMonthlyRepayment;

    // Respect absolute monthly repayment cap

    // Already over repayment limit
    if (maxMonthlyPayment <= 0) {
      return {
        approved: false,
        reason: "Repayment limit already exceeded by existing loans.",
        maxEligibleLoan: 0,
        monthlyRepayment: 0,
      };
    }

    // Calculate max eligible loan amount
    const factor = Math.pow(1 + monthlyRate, months);
    let maxEligibleLoan =
      monthlyRate === 0
        ? maxMonthlyPayment * months
        : maxMonthlyPayment * ((factor - 1) / (monthlyRate * factor));

    if (maxEligibleLoan > maxLoanCap) {
      maxEligibleLoan = maxLoanCap;
    }

    // If customer did not request a specific amount, return eligibility details
    if (!requestedLoanAmount) {
      return {
        approved: true,
        reason: "Maximum eligible loan amount calculated.",
        maxEligibleLoan,
        monthlyRepayment: maxMonthlyPayment,
      };
    }

    // --- Evaluate requested loan ---
    if (requestedLoanAmount > maxLoanCap) {
      return {
        approved: false,
        reason: `Requested amount exceeds the maximum allowed loan cap of ₦${maxLoanCap.toLocaleString()}.`,
        maxEligibleLoan,
        monthlyRepayment: 0,
      };
    }

    // Calculate repayment for requested loan
    const factorReq = Math.pow(1 + monthlyRate, months);
    const requestedMonthlyRepayment =
      monthlyRate === 0
        ? requestedLoanAmount / months
        : (requestedLoanAmount * monthlyRate * factorReq) / (factorReq - 1);

    const totalRepayment = requestedMonthlyRepayment * months;
    const totalInterest = totalRepayment - requestedLoanAmount;
    const totalMonthlyObligation =
      requestedMonthlyRepayment + existingMonthlyRepayment;

    // --- Apply validation checks ---

    if (totalMonthlyObligation > totalAllowedRepayment) {
      return {
        approved: false,
        reason: `Total repayment (₦${totalMonthlyObligation.toFixed(
          2
        )}) exceeds ${repaymentRatio.toFixed(2)}% of income.`,
        maxEligibleLoan,
        monthlyRepayment: requestedMonthlyRepayment,
      };
    }

    if (requestedLoanAmount > maxEligibleLoan) {
      return {
        approved: false,
        reason: `Requested amount ₦${requestedLoanAmount.toLocaleString()} exceeds maximum eligible loan ₦${maxEligibleLoan.toLocaleString()}.`,
        maxEligibleLoan,
        monthlyRepayment: requestedMonthlyRepayment,
      };
    }

    // --- All good ---
    return {
      approved: true,
      reason:
        "Approved. Your employment stability, banking behavior, credit history, and DTI ratio meet our lending criteria. You are eligible to proceed.",
      maxEligibleLoan,
      monthlyRepayment: requestedMonthlyRepayment,
    };
  }

  /**
   * Evaluate a customer's loan request and determine eligibility with final approval.
   *
   * @param {LoanEvaluationParams} params - Loan evaluation parameters
   * @returns {LoanEvaluationWithFinalApprovalResult}
   */
  /**
   * Evaluate a customer's loan request and determine eligibility with final approval.
   *
   * @param {LoanEvaluationParams} params - Loan evaluation parameters
   * @returns {LoanEvaluationWithFinalApprovalResult}
   */
  evaluateLoanRequestWithFinalApproval({
    monthlyIncome,
    months,
    monthlyInterestRate,
    existingMonthlyRepayment = 0,
    requestedLoanAmount,
    repaymentRatio = 35,
    maxLoanCap = Infinity,
  }: LoanEvaluationParams): LoanEvaluationWithFinalApprovalResult {
    const monthlyRate = monthlyInterestRate / 100;
    const totalAllowedRepayment = monthlyIncome * (repaymentRatio / 100);

    // Remaining amount available for new loan repayment
    let maxMonthlyPayment = totalAllowedRepayment - existingMonthlyRepayment;

    // Base factor for amortization
    const factor = Math.pow(1 + monthlyRate, months);

    // Helper to calculate eligible loan given a monthly payment
    const computeLoan = (payment: number) =>
      monthlyRate === 0
        ? payment * months
        : payment * ((factor - 1) / (monthlyRate * factor));

    // Helper to calculate monthly repayment given a loan amount
    const computeRepayment = (loan: number) =>
      monthlyRate === 0
        ? loan / months
        : (loan * monthlyRate * factor) / (factor - 1);

    // Even if over the limit, compute what they *could* borrow if obligations were cleared
    const totalAllowedLoan = computeLoan(totalAllowedRepayment);

    // Compute current eligibility based on remaining repayment capacity
    let maxEligibleLoan =
      maxMonthlyPayment > 0 ? computeLoan(maxMonthlyPayment) : 0;

    // Respect the absolute loan cap
    if (maxEligibleLoan > maxLoanCap) maxEligibleLoan = maxLoanCap;

    // Compute the expected repayment for that eligible amount
    const eligibleMonthlyRepayment = computeRepayment(maxEligibleLoan);

    // ✅ Advisory case: Already over repayment limit
    if (maxMonthlyPayment <= 0) {
      const neededIncome =
        existingMonthlyRepayment / (repaymentRatio / 100) - monthlyIncome;

      return {
        approved: false,
        reason: `Your current loan repayments exceed ${repaymentRatio}% of your income. 
If you had no existing obligations, you could qualify for up to ₦${totalAllowedLoan.toFixed(
          2
        )}. 
Alternatively, increase your income by ₦${neededIncome.toFixed(
          2
        )} or reduce current repayments to qualify.`,
        finalApprovedLoan: 0,
        maxEligibleLoan: totalAllowedLoan,
        monthlyRepayment: computeRepayment(totalAllowedLoan),
      };
    }

    // If no requested loan, return maximum eligibility
    if (!requestedLoanAmount) {
      return {
        approved: true,
        reason: "Maximum eligible loan amount calculated.",
        finalApprovedLoan: maxEligibleLoan,
        maxEligibleLoan,
        monthlyRepayment: eligibleMonthlyRepayment,
      };
    }

    // Calculate repayment for requested loan
    const requestedMonthlyRepayment = computeRepayment(requestedLoanAmount);
    const totalMonthlyObligation =
      requestedMonthlyRepayment + existingMonthlyRepayment;

    // Validation checks
    if (requestedLoanAmount > maxLoanCap) {
      return {
        approved: false,
        reason: `Requested amount exceeds the maximum loan cap of ₦${maxLoanCap.toLocaleString()}.`,
        finalApprovedLoan: maxEligibleLoan,
        maxEligibleLoan,
        monthlyRepayment: eligibleMonthlyRepayment,
      };
    }

    if (Math.floor(totalMonthlyObligation) > Math.ceil(totalAllowedRepayment)) {
      return {
        approved: false,
        reason: `Total repayment (₦${totalMonthlyObligation.toFixed(
          2
        )}) exceeds ${repaymentRatio.toFixed(2)}% of monthly income.`,
        finalApprovedLoan: maxEligibleLoan,
        maxEligibleLoan,
        monthlyRepayment: eligibleMonthlyRepayment,
      };
    }

    if (Math.floor(requestedLoanAmount) > Math.ceil(maxEligibleLoan)) {
      return {
        approved: false,
        reason: `Requested amount ₦${requestedLoanAmount.toLocaleString()} exceeds eligible loan ₦${maxEligibleLoan.toLocaleString()}.`,
        finalApprovedLoan: maxEligibleLoan,
        maxEligibleLoan,
        monthlyRepayment: eligibleMonthlyRepayment,
      };
    }

    // ✅ All conditions satisfied
    return {
      approved: true,
      reason:
        "Approved. Your employment stability, banking behavior, credit history, and DTI ratio meet our lending criteria. You are eligible to proceed.",
      finalApprovedLoan: requestedLoanAmount,
      maxEligibleLoan,
      monthlyRepayment: requestedMonthlyRepayment,
    };
  }

  /**
   * Evaluates a customer's down payment and loan eligibility for purchase financing.
   *
   * @param {PurchaseLoanEvaluation} params - Purchase loan evaluation parameters
   * @returns {PurchaseLoanResult}
   */
  evaluatePurchaseLoan({
    purchaseAmount,
    minDownPaymentPercent,
    maxLoanCap,
    downPaymentAmount,
  }: PurchaseLoanEvaluation): PurchaseLoanResult {
    // Calculate the minimum required down payment
    const requiredDownPayment = Number(Math.max(
      purchaseAmount * minDownPaymentPercent * 0.01,
      purchaseAmount - maxLoanCap
    ).toFixed(2));

    // If customer didn't specify, suggest the required one
    if (downPaymentAmount === undefined) {
      const loanAmount = purchaseAmount - requiredDownPayment;
      const approvedLoanAmount = Math.min(loanAmount, maxLoanCap);

      return {
        valid: approvedLoanAmount <= maxLoanCap,
        approvedLoanAmount,
        requiredDownPayment,
        customerDownPayment: requiredDownPayment,
        message:
          approvedLoanAmount > maxLoanCap
            ? `To stay within the loan cap of ₦${maxLoanCap.toLocaleString()}, increase your down payment to at least ₦${(
                purchaseAmount - maxLoanCap
              ).toLocaleString()}.`
            : `Minimum down payment required is ₦${requiredDownPayment.toLocaleString()}. You qualify for a loan of ₦${approvedLoanAmount.toLocaleString()}.`,
      };
    }

    // Validate that the customer's down payment meets the minimum
    if (downPaymentAmount < requiredDownPayment) {
      return {
        valid: false,
        approvedLoanAmount: 0,
        requiredDownPayment,
        customerDownPayment: downPaymentAmount,
        message: `Your down payment of ₦${downPaymentAmount.toLocaleString()} is below the minimum required ₦${requiredDownPayment.toLocaleString()}.`,
      };
    }

    // Compute remaining balance
    const loanAmount = purchaseAmount - downPaymentAmount;

    // Validate against the loan cap
    if (loanAmount > maxLoanCap) {
      return {
        valid: false,
        approvedLoanAmount: 0,
        requiredDownPayment,
        customerDownPayment: downPaymentAmount,
        message: `Your desired loan of ₦${loanAmount.toLocaleString()} exceeds the cap of ₦${maxLoanCap.toLocaleString()}. Increase your down payment to at least ₦${(
          purchaseAmount - maxLoanCap
        ).toLocaleString()}.`,
      };
    }

    // All conditions satisfied
    return {
      valid: true,
      approvedLoanAmount: loanAmount,
      requiredDownPayment,
      customerDownPayment: downPaymentAmount,
      message: `Loan approved for ₦${loanAmount.toLocaleString()} with a down payment of ₦${downPaymentAmount.toLocaleString()}.`,
    };
  }

  /**
   * Evaluates a customer's down payment and loan eligibility for purchase financing.
   *
   * @param {PurchaseLoanEvaluation} params - Purchase loan evaluation parameters
   * @returns {PurchaseLoanResult}
   */
  evaluatePurchaseLoanWithFinalApproval({
    purchaseAmount,
    minDownPaymentPercent,
    maxLoanCap,
    downPaymentAmount,
    monthlyIncome,
    repaymentRatio = 35,
    months,
    monthlyInterestRate,
    existingMonthlyRepayment,
  }: LoanEvaluationParamsFull):
    | (PurchaseLoanResult &
        LoanEvaluationWithFinalApprovalResult & {
          adminCharge: number;
          insurance: number;
        })
    | undefined {
    if (!purchaseAmount) {
      const assumedLoanRequest = this.evaluateLoanRequestWithFinalApproval({
        monthlyIncome,
        months,
        monthlyInterestRate,
        existingMonthlyRepayment,
        repaymentRatio,
        maxLoanCap,
      });
      if (assumedLoanRequest.approved) {
        return {
          ...assumedLoanRequest,
          approvedPurchaseAmount:
            (assumedLoanRequest.finalApprovedLoan * 100) /
            (100 - minDownPaymentPercent),
          adminCharge: 20000,
          insurance: 2000001,
          valid: true,
          approvedLoanAmount: assumedLoanRequest.finalApprovedLoan,
          requiredDownPayment: Math.ceil(
            (assumedLoanRequest.finalApprovedLoan * 100) /
              (100 - minDownPaymentPercent) -
              assumedLoanRequest.finalApprovedLoan
          ),
          customerDownPayment: Math.ceil(
            (assumedLoanRequest.finalApprovedLoan * 100) /
              (100 - minDownPaymentPercent) -
              assumedLoanRequest.finalApprovedLoan
          ),
          message: "Loan approved",
        };
      }
    }
    const evaluatePurchaseLoan = this.evaluatePurchaseLoan({
      purchaseAmount: purchaseAmount || 0,
      minDownPaymentPercent,
      maxLoanCap,
      downPaymentAmount,
    });
    if (!evaluatePurchaseLoan.valid) {
      return {
        ...evaluatePurchaseLoan,
        adminCharge: 0,
        insurance: 0,
        approved: false,
        reason: evaluatePurchaseLoan.message,
        finalApprovedLoan: 0,
        maxEligibleLoan: 0,
        monthlyRepayment: 0,
      };
    }

    const evaluateLoanRequestWithFinalApproval =
      this.evaluateLoanRequestWithFinalApproval({
        monthlyIncome,
        months,
        monthlyInterestRate,
        existingMonthlyRepayment,
        requestedLoanAmount:
          evaluatePurchaseLoan.approvedLoanAmount === 0
            ? undefined
            : evaluatePurchaseLoan.approvedLoanAmount,
        repaymentRatio,
        maxLoanCap,
      });

    if (evaluateLoanRequestWithFinalApproval.approved) {
      return {
        ...evaluatePurchaseLoan,
        ...evaluateLoanRequestWithFinalApproval,
        approvedPurchaseAmount: purchaseAmount,
        adminCharge: 20000,
        insurance: 2000002,
      };
    }

    if (!evaluateLoanRequestWithFinalApproval.approved) {
      const evaluatePurchaseLoan2 = this.evaluatePurchaseLoan({
        purchaseAmount: purchaseAmount || 0,
        minDownPaymentPercent,
        maxLoanCap,
        downPaymentAmount:
          (purchaseAmount || 0) -
          evaluateLoanRequestWithFinalApproval.maxEligibleLoan,
      });
      if (downPaymentAmount) {
        return {
          ...evaluatePurchaseLoan2,
          ...evaluateLoanRequestWithFinalApproval,
          requiredDownPayment: Math.ceil(
            (purchaseAmount || 0) -
              evaluateLoanRequestWithFinalApproval.maxEligibleLoan
          ),
          approved: false,
          valid: false,
          reason:
            "loan not approved your max eligible loan is ₦" +
            evaluateLoanRequestWithFinalApproval.maxEligibleLoan.toLocaleString() +
            "To purchase this item, you need to increase your down payment to at least ₦" +
            Math.ceil(
              (purchaseAmount || 0) -
                evaluateLoanRequestWithFinalApproval.maxEligibleLoan
            ).toLocaleString(),
          finalApprovedLoan: 0,
          maxEligibleLoan: evaluateLoanRequestWithFinalApproval.maxEligibleLoan,
          monthlyRepayment: 0,

          adminCharge: 0,
          insurance: 0,
          message: "Loan not approved.",
        };
      }
    }
    return {
      ...evaluatePurchaseLoan,
      ...evaluateLoanRequestWithFinalApproval,
      approvedLoanAmount:
        evaluateLoanRequestWithFinalApproval.finalApprovedLoan,
      valid: true,
      approved: true,
      approvedPurchaseAmount: purchaseAmount,
      requiredDownPayment:
        (purchaseAmount || 0) -
        evaluateLoanRequestWithFinalApproval.maxEligibleLoan,
      customerDownPayment:
        (purchaseAmount || 0) -
        evaluateLoanRequestWithFinalApproval.maxEligibleLoan,
      message:
        "Loan approved with down payment of ₦" +
        (
          (purchaseAmount || 0) -
          evaluateLoanRequestWithFinalApproval.maxEligibleLoan
        ).toLocaleString(),
      adminCharge: 20000,
      insurance: 2000003,
    };
  }
  calculateEligibility({
    employmentStatus,
    employmentDuration,
    overdraft,
    creditHistory,
    averageBalance,
    monthlyIncome,
    isLive,
  }: {
    employmentStatus: number;
    employmentDuration: number;
    overdraft: number;
    creditHistory: number;
    averageBalance: number;
    monthlyIncome: number;
    isLive?: boolean;
  }): {
    eligibility: number;
    score: number;
    employmentDurationScore: number;
    creditHistoryScore: number;
    averageBalanceScore: number;
    employmentStatusScore: number;
    overdraftScore: number;
  } {
    const employmentStatusScore = employmentStatus;
    const employmentDurationScore =
      employmentDuration >= 24 ? 20 : employmentDuration >= 12 ? 15 : 10;
    const overdraftScore =
      overdraft === 0
        ? 15
        : overdraft > 0 && overdraft <= 1
        ? 10
        : overdraft > 1 && overdraft <= 2
        ? 5
        : 0;
    const creditHistoryScore = creditHistory;
    const percentageOfaverageBalance = (averageBalance / monthlyIncome) * 100;

    const averageBalanceScore =
      percentageOfaverageBalance >= 5
        ? 15
        : percentageOfaverageBalance >= 2
        ? 10
        : 0;

    // Validate input values
    if (
      employmentStatusScore === 0 ||
      overdraftScore === 0 ||
      averageBalanceScore === 0
    ) {
      if (isLive) {
        console.log("isLive");
      }
      return {
        eligibility: 0,
        score: 0,
        employmentDurationScore,
        creditHistoryScore,
        averageBalanceScore,
        employmentStatusScore,
        overdraftScore,
      };
    }

    // Calculate the total score
    const sum =
      employmentDurationScore +
      creditHistoryScore +
      averageBalanceScore +
      employmentStatusScore +
      overdraftScore;

    if (sum < 60 && sum > 55)
      return {
        eligibility: 0.75,
        score: sum,
        employmentDurationScore,
        creditHistoryScore,
        averageBalanceScore,
        employmentStatusScore,
        overdraftScore,
      };
    if (sum < 55 && sum > 50)
      return {
        eligibility: 0.5,
        score: sum,
        employmentDurationScore,
        creditHistoryScore,
        averageBalanceScore,
        employmentStatusScore,
        overdraftScore,
      };

    // Default full eligibility
    return {
      eligibility: 1,
      score: sum,
      employmentDurationScore,
      creditHistoryScore,
      averageBalanceScore,
      employmentStatusScore,
      overdraftScore,
    };
  }

  calculateAdminFee(purchaseAmount: number, months: number): number {
    const BASE_FEE_1_TO_3 = 2500;
    const BASE_FEE_4_TO_12 = 5000;
    const PERCENT_FEE_RATE = 0.005; // 0.5%
    const THRESHOLD_AMOUNT = 250000;

    let adminFee = 0;

    // Determine fixed base fee
    if (months >= 1 && months <= 3) {
      adminFee = BASE_FEE_1_TO_3;
    } else if (months >= 4 && months <= 12) {
      adminFee = BASE_FEE_4_TO_12;
    }

    // Add percentage fee if purchase amount exceeds threshold
    if (purchaseAmount > THRESHOLD_AMOUNT) {
      adminFee += purchaseAmount * PERCENT_FEE_RATE;
    }

    return adminFee;
  }
  eligibilityAndScore({
    employmentStatus,
    employmentDuration,
    overdraft,
    creditHistory,
    averageBalance,
    monthlyIncome,
    months,
    purchaseAmount,
    downPaymentAmount,
    existingMonthlyRepayment,
    isLive,
  }: EligibilityAndScoreParams):
    | { eligibility: number; score: number }
    | (PurchaseLoanResult &
        LoanEvaluationWithFinalApprovalResult & {
          adminCharge: number;
          insurance: number;
          eligibility: { eligibility: number; score: number };
        })
    | undefined {
    let eligibility;
    if (isLive) {
      console.log("isLive");
      eligibility = {
        eligibility: 1,
        score: 100,
        employmentDurationScore: 20,
        creditHistoryScore: 25,
        averageBalanceScore: 15,
        employmentStatusScore: 25,
        overdraftScore: 15,
      };
    } else {
      eligibility = this.calculateEligibility({
        employmentStatus,
        employmentDuration,
        overdraft,
        creditHistory,
        averageBalance,
        monthlyIncome,
      });
    }

    if (eligibility.eligibility === 0) {
      return {
        eligibility: 0,
        score: 0,
        valid: false,
        approvedLoanAmount: 0,
        requiredDownPayment: 0,
        customerDownPayment: 0,
        message:
          "Not Eligible. Some criteria such as employment stability, bank balance, credit history, or DTI did not meet the minimum requirements. You may reapply once these are improved.",
        approved: false,
        reason:
          "Not Eligible. Some criteria such as employment stability, bank balance, credit history, or DTI did not meet the minimum requirements. You may reapply once these are improved.",
        finalApprovedLoan: 0,
        maxEligibleLoan: 0,
        monthlyRepayment: 0,
        approvedPurchaseAmount: 0,
        adminCharge: 0,
        insurance: 0,
      };
    }

    const minDownPaymentPercent = 20;
    const maxLoanCap = 500000;
    const monthlyInterestRate = 7.5;
    const insurancePercentage = 0.02;
    const repaymentRatio = 35;

    let fakePurchaseAmount;
    if (!purchaseAmount && !downPaymentAmount) {
      const fakeLoanAmount = this.PV(
        monthlyInterestRate / 100,
        months,
        monthlyIncome * (repaymentRatio / 100) - (existingMonthlyRepayment || 0)
      );
      fakePurchaseAmount = fakeLoanAmount / (1 - minDownPaymentPercent / 100);
    }

    let evaluatePurchaseLoanWithFinalApproval;
    if (purchaseAmount && eligibility.eligibility > 0) {
      evaluatePurchaseLoanWithFinalApproval =
        this.evaluatePurchaseLoanWithFinalApproval({
          purchaseAmount: purchaseAmount * eligibility.eligibility,
          minDownPaymentPercent,
          maxLoanCap,
          downPaymentAmount,
          monthlyIncome,
          months,
          monthlyInterestRate,
          existingMonthlyRepayment,
        });
    } else {
      const initialEvaluatePurchaseLoanWithFinalApproval =
        this.evaluatePurchaseLoanWithFinalApproval({
          ...(!downPaymentAmount && { purchaseAmount: fakePurchaseAmount }),
          minDownPaymentPercent,
          maxLoanCap,
          downPaymentAmount,
          monthlyIncome,
          months,
          monthlyInterestRate,
          existingMonthlyRepayment,
        });

      const assumedPurchaseAmount1 =
        initialEvaluatePurchaseLoanWithFinalApproval?.approvedPurchaseAmount ||
        0 * eligibility.eligibility;
      const assumedPurchaseAmount = downPaymentAmount
        ? Math.min(
            assumedPurchaseAmount1,
            (downPaymentAmount * 100) / minDownPaymentPercent
          )
        : assumedPurchaseAmount1;

      evaluatePurchaseLoanWithFinalApproval =
        this.evaluatePurchaseLoanWithFinalApproval({
          purchaseAmount: assumedPurchaseAmount,
          minDownPaymentPercent,
          maxLoanCap,
          downPaymentAmount,
          monthlyIncome,
          months,
          monthlyInterestRate,
          existingMonthlyRepayment,
        });
    }

    return {
      eligibility: eligibility.eligibility,
      score: eligibility.score,
      ...evaluatePurchaseLoanWithFinalApproval,
      requiredDownPayment: evaluatePurchaseLoanWithFinalApproval?.approved
        ? evaluatePurchaseLoanWithFinalApproval?.customerDownPayment
        : evaluatePurchaseLoanWithFinalApproval?.requiredDownPayment,
      insurance:
        ((evaluatePurchaseLoanWithFinalApproval?.finalApprovedLoan || 0) *
          insurancePercentage *
          months) /
        12,
      adminCharge: this.calculateAdminFee(
        evaluatePurchaseLoanWithFinalApproval?.finalApprovedLoan || 0,
        months
      ),
    };
  }

  async liveEligibilityPurchase({
    purchaseAmount,
    downPaymentAmount,
    months,
    buyerId,
  }: {
    purchaseAmount: number;
    downPaymentAmount: number;
    months: number;
    buyerId: string;
  }): Promise<
    | { eligibility: number; score: number; monthlyIncome: number }
    | (PurchaseLoanResult &
        LoanEvaluationWithFinalApprovalResult & {
          adminCharge: number;
          insurance: number;
          monthlyIncome: number;
          eligibility: {
            eligibility: number;
            score: number;
            monthlyIncome: number;
          };
        })
    | undefined
  > {
    //To be implemeted later
    // const eligibilityAndScore =
    //   await eligibilityAndScoreService.getEligibilityAndScoreByBuyerId(buyerId);
    // if (!eligibilityAndScore) {
    //   return {
    //     eligibility: 0,
    //     score: 0,
    //   };
    // }
    //get latest account details by buyerId
    const latestAccountDetails =
      await accountDetailsService.getLatestAccountDetailsByBuyerId(buyerId);
    if (!latestAccountDetails) {
      return {
        eligibility: 0,
        score: 0,
        valid: false,
        approvedLoanAmount: 0,
        requiredDownPayment: 0,
        customerDownPayment: 0,
        message: "No account details found",
        approved: false,
        reason: "No account details found",
        finalApprovedLoan: 0,
        monthlyIncome: 0,
      };
    }
    const latestAccountDetailsData = latestAccountDetails.data;

    const livedata = {
      employmentStatus:
        latestAccountDetailsData?.employmentType === "Employed" ||
        latestAccountDetailsData?.employmentType === "Self-employed"
          ? 25
          : 0,
      employmentDuration:
        latestAccountDetailsData?.employmentType === "Self-employed"
          ? 12
          : latestAccountDetailsData?.employmentDuration ?? 0,
      overdraft: Number(latestAccountDetailsData?.overdraft ?? 0),
      creditHistory:
        latestAccountDetailsData?.creditHistory === "Good" ? 25 : 0,
      averageBalance: Number(latestAccountDetailsData?.averageBalance ?? 0),
      monthlyIncome: Number(latestAccountDetailsData?.monthlyIncome ?? 0),
      months,
      purchaseAmount,
      downPaymentAmount,
      existingMonthlyRepayment: Number(
        latestAccountDetailsData?.existingLoanRepayment ?? 0
      ),
    };

    const eligibilityAndScore = await this.eligibilityAndScore(livedata);
    return { ...eligibilityAndScore, monthlyIncome: livedata.monthlyIncome } as
      | { eligibility: number; score: number; monthlyIncome: number }
      | (PurchaseLoanResult &
          LoanEvaluationWithFinalApprovalResult & {
            adminCharge: number;
            insurance: number;
            monthlyIncome: number;
            eligibility: {
              eligibility: number;
              score: number;
              monthlyIncome: number;
            };
          })
      | undefined;
  }
}
export const loanSettingService = new LoanSettingService();
