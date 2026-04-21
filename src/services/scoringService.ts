import prisma from '../utils/prisma';

export interface IncomeRecurrentInput {
  incomeMonths: number;
  dominantSourceCount: number;
  isFiftMonth: boolean;
  isSixtMonth: boolean;
}
export interface IncomeStabilityInput {
  averageIncome: number;
  monthlyIncomes: number[];
}

export interface MonthlyScores {
  M1: number; // Month 1
  M2: number; // Month 2
  M3: number; // Month 3
  M4: number; // Month 4
  M5: number; // Month 5
  M6: number; // Month 6
}

export interface LiquidityBufferMonthSnapshot {
  /**
   * Balance immediately before the month's primary income credit.
   * Used only when recurring income exists.
   */
  preIncomeBalance: number;
  /**
   * Month-end balance.
   * Used only when recurring income does NOT exist.
   */
  monthEndBalance: number;
}

export interface LiquidityBufferInput {
  /**
   * Up to the last 6 months of snapshots (most recent can be first or last).
   * The scoring logic uses the number of months provided (typically 6).
   */
  months: LiquidityBufferMonthSnapshot[];

  /**
   * If recurring income exists, liquidity ratio is computed as:
   * preIncomeBalance / estimatedMonthlyIncome.
   */
  recurringIncomeExists: boolean;

  /**
   * Estimated monthly income (used when recurringIncomeExists is true).
   */
  estimatedMonthlyIncome?: number;

  /**
   * Average monthly inflow (used when recurringIncomeExists is false).
   */
  averageMonthlyInflow?: number;
}

export interface ScoringInput {
  incomeRecurrent: IncomeRecurrentInput;
  incomeStability: IncomeStabilityInput;
  /**
   * Number of months (out of the observed window) with positive net cash flow.
   */
  netCashFlowPositiveCount: number;
  liquidityBuffer: LiquidityBufferInput;

  /**
   * Credit history bucket (expected values based on your `creditBehaviorScore`):
   * 1 => best, 2 => medium, 3 => weak, else => 0.
   */
  creditHistory: number;
  /**
   * Risk factor monthly inputs used in `riskFactorScore`.
   */
  riskFactor: MonthlyScores;
  overdraftEvents?: number;
  overdraftDeepestNegativeBalance?: number;
  overdraftNegativeDays?: number;
  overdraftRecent: boolean;

  /**
   * Existing monthly loan repayment amount (₦) used for eligibility determination.
   */
  existingLoanRepayment: number;
}

export interface SelfAssessmentScoringInput {
  /**
   * Used to compute:
   * - incomeRecurrentScore (via `incomeRecurrent`)
   * - incomeStabilityScore / netCashFlowScore / liquidityBufferScore (self-assessment rules)
   */
  incomeRecurrent: IncomeRecurrentInput;
  /**
   * Number of overdraft events in the observed window.
   */
  overdraftCount: number;
  /**
   * Overdraft event count used for self-assessment overdraft scoring.
   */
  overdraftEvents: number;
  /**
   * Deepest negative balance during overdraft window.
   */
  overdraftDeepestNegativeBalance: number;
  /**
   * Total number of days with negative balance.
   */
  overdraftNegativeDays: number;
  /**
   * Whether overdraft occurred in last 2 months.
   */
  overdraftRecent: boolean;
  /**
   * Credit history bucket (expected values based on your `creditBehaviorScore`):
   * 1 => best, 2 => medium, 3 => weak, else => 0.
   */
  creditHistory: number;
  /**
   * Risk factor monthly inputs used in `riskFactorScore`.
   */
  totalFlags: number;

  /**
   * Estimated monthly income (₦) used for eligibility determination.
   */
  estimatedMonthlyIncome: number;

  /**
   * Existing monthly loan repayment amount (₦) used for eligibility determination.
   */
  existingLoanRepayment: number;
}

export type EligibilityRiskLevel = 'high' | 'medium' | 'low';

export interface EligibilityDeterminationResult {
  eligible: boolean;
  riskLevel: EligibilityRiskLevel;
  dtiRatio: number;
}
export class ScoringService {
  // scoring score max 100 points
  async scoring(input: ScoringInput) {
    const incomeRecurrentResult = await this.incomeRecurrent(input.incomeRecurrent);
    const incomeRecurrentScore = Number(incomeRecurrentResult?.score ?? 0) || 0;

    const incomeStabilityScore = Number(await this.incomeStability(input.incomeStability)) || 0;
    const netCashFlowScore = Number(await this.netCashFlow(input.netCashFlowPositiveCount)) || 0;

    const liquidityBufferResult = await this.liquidityBuffer(input.liquidityBuffer);
    const liquidityBufferScore = Number(liquidityBufferResult?.score ?? 0) || 0;

    const overdraftScore =
      Number(
        this.overdraftScore(
          input.overdraftEvents ?? 0,
          input.overdraftDeepestNegativeBalance ?? 0,
          input.overdraftNegativeDays ?? 0,
          input.overdraftRecent ?? false,
        ),
      ) || 0;
    const creditBehaviorScore = Number(await this.creditBehaviorScore(input.creditHistory)) || 0;
    const riskFactorScore = Number(this.riskFactorScore(input.riskFactor)) || 0;

    const finalScore =
      incomeRecurrentScore +
      incomeStabilityScore +
      netCashFlowScore +
      liquidityBufferScore +
      overdraftScore +
      creditBehaviorScore +
      riskFactorScore;
    let eligibility = 0;
    if (finalScore >= 50 && finalScore <= 55) {
      eligibility = 0.5;
    } else if (finalScore >= 55 && finalScore <= 60) {
      eligibility = 0.75;
    } else if (finalScore > 60) {
      eligibility = 1;
    }
    const eligible = this.determineEligibility(
      finalScore,
      input.existingLoanRepayment,
      input.incomeStability.averageIncome,
    );
    return {
      finalScore,
      eligibility,
      eligible,
      breakdown: {
        incomeRecurrentScore,
        incomeStabilityScore,
        netCashFlowScore,
        liquidityBufferScore,
        overdraftScore,
        creditBehaviorScore,
        riskFactorScore,
      },
      details: {
        incomeRecurrent: incomeRecurrentResult,
        liquidityBuffer: liquidityBufferResult,
      },
    };
  }

  determineEligibility(
    totalScore: number,
    existingLoanRepayment: number,
    estimatedMonthlyIncome: number,
  ): EligibilityDeterminationResult {
    const safeTotalScore = Number(totalScore) || 0;
    const safeExistingLoanRepayment = Number(existingLoanRepayment) || 0;
    const safeIncome = Number(estimatedMonthlyIncome) || 0;

    const dtiRatio = safeIncome > 0 ? (safeExistingLoanRepayment / safeIncome) * 100 : 0;

    const eligible = safeTotalScore >= 50 && dtiRatio <= 35 && safeIncome >= 30000;

    let riskLevel: EligibilityRiskLevel = 'low';
    if (safeTotalScore < 50) riskLevel = 'high';
    else if (safeTotalScore < 70) riskLevel = 'medium';

    return { eligible, riskLevel, dtiRatio };
  }

  incomeStabilitySelfAssessment(incomeMonths: number, dominantMonths: number): number {
    const safeIncomeMonths = Number(incomeMonths) || 0;
    const safeDominantMonths = Number(dominantMonths) || 0;

    if (safeIncomeMonths <= 0) return 0;

    const consistency = safeDominantMonths / safeIncomeMonths;

    if (consistency >= 0.85 && safeIncomeMonths >= 5) return 15;
    if (consistency >= 0.7 && safeIncomeMonths >= 4) return 12;
    if (consistency >= 0.5 && safeIncomeMonths >= 3) return 8;
    if (safeIncomeMonths >= 2) return 3;
    return 0;
  }

  netCashFlowSelfAssessment(incomeMonths: number, overdrafts: number): number {
    const safeIncomeMonths = Number(incomeMonths) || 0;
    const safeOverdrafts = Number(overdrafts) || 0;

    if (safeIncomeMonths <= 0) return 0;

    if (safeIncomeMonths >= 5 && safeOverdrafts <= 1) return 15;
    if (safeIncomeMonths >= 4 && safeOverdrafts <= 2) return 12;
    if (safeIncomeMonths >= 3 && safeOverdrafts <= 3) return 8;
    if (safeIncomeMonths >= 2) return 3;
    return 0;
  }

  liquidityBufferSelfAssessment(incomeMonths: number, overdrafts: number): number {
    const safeIncomeMonths = Number(incomeMonths) || 0;
    const safeOverdrafts = Number(overdrafts) || 0;

    if (safeIncomeMonths <= 0) return 0;

    if (safeOverdrafts === 0 && safeIncomeMonths >= 4) return 10;
    if (safeOverdrafts <= 1 && safeIncomeMonths >= 4) return 8;
    if (safeOverdrafts <= 2 && safeIncomeMonths >= 3) return 6;
    if (safeOverdrafts <= 3) return 4;
    if (safeOverdrafts <= 5) return 1;
    return 0;
  }

  riskFactorScoreSelfAssessment(totalFlags: number): number {
    if (totalFlags === 0) return 10;
    if (totalFlags <= 3) return 7;
    if (totalFlags <= 6) return 4;
    return 0;
  }

  overdraftScoreSelfAssessment(
    events: number,
    deepest: number,
    days: number,
    recent: boolean,
  ): number {
    const safeEvents = Number(events) || 0;
    const safeDeepest = Number(deepest) || 0;
    const safeDays = Number(days) || 0;
    const safeRecent = recent === true;

    if (safeEvents === 0) return 10;

    if (safeEvents <= 2 && safeDeepest <= 5000 && safeDays <= 5 && safeRecent === false) return 7;

    if (safeEvents <= 4 || safeRecent === true) return 4;

    return 0;
  }
  // self assement scoring score max 100 points
  async selfAssessmentScoring(input: SelfAssessmentScoringInput) {
    console.log('input', input);
    const incomeRecurrentResult = await this.incomeRecurrent(input.incomeRecurrent);
    const incomeRecurrentScore = Number(incomeRecurrentResult?.score ?? 0) || 0;

    const incomeStabilityScore =
      Number(
        this.incomeStabilitySelfAssessment(
          input.incomeRecurrent?.incomeMonths,
          input.incomeRecurrent?.dominantSourceCount,
        ),
      ) || 0;
    const netCashFlowScore =
      Number(
        this.netCashFlowSelfAssessment(input.incomeRecurrent?.incomeMonths, input.overdraftCount),
      ) || 0;

    const liquidityBufferScore =
      Number(
        this.liquidityBufferSelfAssessment(
          input.incomeRecurrent?.incomeMonths,
          input.overdraftCount,
        ),
      ) || 0;

    const overdraftScore =
      Number(
        this.overdraftScoreSelfAssessment(
          input.overdraftEvents,
          input.overdraftDeepestNegativeBalance,
          input.overdraftNegativeDays,
          input.overdraftRecent,
        ),
      ) || 0;
    const creditBehaviorScore = Number(await this.creditBehaviorScore(input.creditHistory)) || 0;
    const riskFactorScore = Number(this.riskFactorScoreSelfAssessment(input.totalFlags)) || 0;

    const finalScore =
      incomeRecurrentScore +
      incomeStabilityScore +
      netCashFlowScore +
      liquidityBufferScore +
      overdraftScore +
      creditBehaviorScore +
      riskFactorScore;

    const eligibility = this.determineEligibility(
      finalScore,
      input.existingLoanRepayment,
      input.estimatedMonthlyIncome,
    );

    return {
      finalScore,
      breakdown: {
        incomeRecurrentScore: { weight: 25, score: incomeRecurrentScore },
        incomeStabilityScore: { weight: 15, score: incomeStabilityScore },
        netCashFlowScore: { weight: 15, score: netCashFlowScore },
        liquidityBufferScore: { weight: 10, score: liquidityBufferScore },
        overdraftScore: { weight: 10, score: overdraftScore },
        creditBehaviorScore: { weight: 15, score: creditBehaviorScore },
        riskFactorScore: { weight: 10, score: riskFactorScore },
      },
      eligibility,
    };
  }
  /**
   * Calculate the income recurrent score max 25 points
   * @param input - The input data
   * @returns The income recurrent score
   */
  async incomeRecurrent(input: IncomeRecurrentInput) {
    const { incomeMonths, dominantSourceCount, isFiftMonth, isSixtMonth } = input;
    const recurrentCoverage = incomeMonths / 6;
    const recencyStrength = (isFiftMonth ? 0.4 : 0) + (isSixtMonth ? 0.6 : 0);
    const sourceConsistency = dominantSourceCount / incomeMonths;
    const score =
      25 * (0.45 * recurrentCoverage + 0.3 * recencyStrength + 0.25 * sourceConsistency);

    return {
      recurrentCoverage,
      recencyStrength,
      sourceConsistency,
      score,
    };
  }

  /**
   * Calculate the income stability score max 15 points
   * @param input - The input data
   * @returns The income stability score
   */
  async incomeStability(input: IncomeStabilityInput) {
    const { monthlyIncomes, averageIncome } = input;
    if (monthlyIncomes.length === 0) {
      return 0;
    }
    const incomeRatio = (await this.standardDeviation(monthlyIncomes)) / averageIncome;

    let score = 0;

    if (incomeRatio <= 0.1) {
      score = 15;
    } else if (incomeRatio <= 0.2) {
      score = 12;
    } else if (incomeRatio <= 0.35) {
      score = 38;
    } else {
      score = 3;
    }

    return score;
  }
  // net cash flow score max 15 points
  async netCashFlow(positiveCount: number) {
    let score = 0;
    if (positiveCount >= 5) {
      score = 15;
    } else if (positiveCount === 4) {
      score = 12;
    } else if (positiveCount === 3) {
      score = 8;
    } else if (positiveCount === 2) {
      score = 3;
    } else if (positiveCount === 1) {
      score = 3;
    } else {
      score = 0;
    }
    return score;
  }

  //liquidity buffer score max 10 points
  async liquidityBuffer(input: LiquidityBufferInput) {
    const months = input.months ?? [];
    const monthCount = months.length;

    if (monthCount === 0) {
      return {
        monthCount: 0,
        score: 0,
      };
    }

    const denom =
      input.recurringIncomeExists === true
        ? (input.estimatedMonthlyIncome ?? 0)
        : (input.averageMonthlyInflow ?? 0);

    const safeDenom = typeof denom === 'number' && denom > 0 ? denom : 0;

    const monthlyRatios = months.map((m) => {
      if (safeDenom === 0) return 0;
      const numerator = input.recurringIncomeExists ? m.preIncomeBalance : m.monthEndBalance;
      if (typeof numerator !== 'number' || !Number.isFinite(numerator)) return 0;
      return numerator / safeDenom;
    });

    const countAtOrAbove = (threshold: number) =>
      monthlyRatios.reduce((acc, r) => (r >= threshold ? acc + 1 : acc), 0);

    const monthsGte10pct = countAtOrAbove(0.1);
    const monthsGte5pct = countAtOrAbove(0.05);
    const monthsGte2pct = countAtOrAbove(0.02);
    const monthsLt2pct = monthlyRatios.reduce((acc, r) => (r < 0.02 ? acc + 1 : acc), 0);

    const zeroOrNegativePreIncomeMonths = input.recurringIncomeExists
      ? months.reduce((acc, m) => (m.preIncomeBalance <= 0 ? acc + 1 : acc), 0)
      : 0;

    // Spreadsheet rule: frequent zero/negative pre-income balance => score 0
    // Interpreting "frequent" as at least half the observed months.
    const frequentZeroOrNegativePreIncome =
      input.recurringIncomeExists && zeroOrNegativePreIncomeMonths >= Math.ceil(monthCount / 2);

    let score = 0;

    if (frequentZeroOrNegativePreIncome) {
      score = 0;
    } else if (monthsGte10pct >= 4) {
      // ≥ 10% in 4–6 months
      score = 10;
    } else if (monthsGte5pct >= 4) {
      // ≥ 5% in 4–6 months
      score = 8;
    } else if (monthsGte5pct === 3) {
      // ≥ 5% in 3 months
      score = 6;
    } else if (monthsGte2pct >= 3 && monthsGte2pct <= 4) {
      // ≥ 2% in 3–4 months
      score = 4;
    } else if (monthsLt2pct >= Math.ceil((monthCount * 2) / 3)) {
      // < 2% most months (interpreting "most" as ≥ 2/3 of observed months)
      score = 1;
    } else {
      // Default to the lowest non-zero bucket when not fitting other patterns.
      score = 1;
    }

    return {
      monthCount,
      score,
    };
  }

  // overdraft score max 10 points
  overdraftScore(events: number, deepest: number, days: number, recent: boolean): number {
    const safeEvents = Number(events) || 0;
    const safeDeepest = Number(deepest) || 0;
    const safeDays = Number(days) || 0;
    const safeRecent = recent === true;

    if (safeEvents === 0) return 10;

    if (safeEvents <= 2 && safeDeepest <= 5000 && safeDays <= 5 && safeRecent === false) return 7;

    if (safeEvents <= 4 || safeRecent === true) return 4;

    return 0;
  }

  // credit behavior score max 15 points
  async creditBehaviorScore(creditHistory: number) {
    let score = 0;
    if (creditHistory === 1) {
      score = 15;
    } else if (creditHistory === 2) {
      score = 10;
    } else if (creditHistory === 3) {
      score = 8;
    } else {
      score = 0;
    }
    return score;
  }
  // risk factor score max 10 points

  riskFactorScore(months: MonthlyScores): number {
    const { M1, M2, M3, M4, M5, M6 } = months;
    const sumAll = M1 + M2 + M3 + M4 + M5 + M6;
    const sumM1toM4 = M1 + M2 + M3 + M4;
    const sumM5toM6 = M5 + M6;

    // 1. Special rule: If M1:M4 > 6 AND M5+M6 = 0 → score 4
    if (sumM1toM4 > 6 && sumM5toM6 === 0) {
      return 4;
    }

    // 2. If total sum > 6 → score 0
    if (sumAll > 6) {
      return 0;
    }

    // 3. If M5 > 0 AND M6 > 0 → score 4
    if (M5 > 0 && M6 > 0) {
      return 4;
    }

    // 4. Normal scoring tiers
    if (sumAll === 0) {
      return 10;
    }

    if (sumAll <= 3) {
      return 7;
    }

    if (sumAll <= 6) {
      return 4;
    }

    // Fallback (should never be reached)
    return 0;
  }
  /**
   * Calculate the standard deviation of the data
   * @param data - The data
   * @returns The standard deviation
   */
  async standardDeviation(data: number[]): Promise<number> {
    const n = data.length;
    if (n === 0) return 0;

    const mean = data.reduce((sum, val) => sum + val, 0) / n;

    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;

    return Math.sqrt(variance);
  }
}

export const scoreService = new ScoringService();
