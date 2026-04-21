import prisma from "../utils/prisma";

export interface CreateEligibilityAndScoreInput {
  buyerId: string;
  approved?: boolean;
  eligibility: number;
  score: number;
  employmentDurationScore: number;
  creditHistoryScore: number;
  averageBalanceScore: number;
  employmentStatusScore: number;
  overdraftScore: number;
  message: string;
  finalApprovedLoan: number;
  maxEligibleLoan: number;
  monthlyRepayment: number;
  approvedPurchaseAmount: number;
  requiredDownPayment: number;
}

export interface UpdateEligibilityAndScoreInput {
  approved?: boolean;
  eligibility?: number;
  score?: number;
  employmentDurationScore?: number;
  creditHistoryScore?: number;
  averageBalanceScore?: number;
  employmentStatusScore?: number;
  overdraftScore?: number;
  message?: string;
  finalApprovedLoan?: number;
  maxEligibleLoan?: number;
  monthlyRepayment?: number;
  approvedPurchaseAmount?: number;
  requiredDownPayment?: number;
}

const eligibilityAndScoreSelect = {
  id: true,
  buyerId: true,
  approved: true,
  eligibility: true,
  score: true,
  employmentDurationScore: true,
  creditHistoryScore: true,
  averageBalanceScore: true,
  employmentStatusScore: true,
  overdraftScore: true,
  message: true,
  finalApprovedLoan: true,
  maxEligibleLoan: true,
  monthlyRepayment: true,
  approvedPurchaseAmount: true,
  requiredDownPayment: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class EligibilityAndScoreService {
  /**
   * Create eligibility and score record for a buyer
   */
  async createEligibilityAndScore(input: CreateEligibilityAndScoreInput) {
    const { buyerId } = input;

    // Check if buyer exists
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const eligibilityAndScore = await prisma.eligibilityAndScore.create({
      data: {
        buyerId,
        approved: input.approved ?? false,
        eligibility: input.eligibility,
        score: input.score,
        employmentDurationScore: input.employmentDurationScore,
        creditHistoryScore: input.creditHistoryScore,
        averageBalanceScore: input.averageBalanceScore,
        employmentStatusScore: input.employmentStatusScore,
        overdraftScore: input.overdraftScore,
        message: input.message,
        finalApprovedLoan: input.finalApprovedLoan,
        maxEligibleLoan: input.maxEligibleLoan,
        monthlyRepayment: input.monthlyRepayment,
        approvedPurchaseAmount: input.approvedPurchaseAmount,
        requiredDownPayment: input.requiredDownPayment,
      },
      select: eligibilityAndScoreSelect,
    });

    return {
      success: true,
      message: "Eligibility and score created successfully",
      data: eligibilityAndScore,
    };
  }

  /**
   * Get all eligibility and score records
   */
  async getAllEligibilityAndScores(approved?: boolean) {
    const where = approved !== undefined ? { approved } : {};

    const records = await prisma.eligibilityAndScore.findMany({
      where,
      select: {
        ...eligibilityAndScoreSelect,
        buyer: {
          select: {
            id: true,
            liftpayId: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      message: "Eligibility and score records retrieved successfully",
      data: records,
    };
  }

  /**
   * Get eligibility and score by ID
   */
  async getEligibilityAndScoreById(id: string) {
    const record = await prisma.eligibilityAndScore.findUnique({
      where: { id },
      select: {
        ...eligibilityAndScoreSelect,
        buyer: {
          select: {
            id: true,
            liftpayId: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!record) {
      throw new Error("Eligibility and score record not found");
    }

    return {
      success: true,
      message: "Eligibility and score retrieved successfully",
      data: record,
    };
  }

  /**
   * Get all eligibility and score records by buyer ID
   */
  async getEligibilityAndScoreByBuyerId(buyerId: string, approved?: boolean) {
    const where: any = { buyerId };
    if (approved !== undefined) {
      where.approved = approved;
    }

    const records = await prisma.eligibilityAndScore.findMany({
      where,
      select: {
        ...eligibilityAndScoreSelect,
        buyer: {
          select: {
            id: true,
            liftpayId: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      message: "Eligibility and score records retrieved successfully",
      data: records,
    };
  }

  /**
   * Get latest eligibility and score by buyer ID
   */
  async getLatestEligibilityAndScoreByBuyerId(
    buyerId: string,
    approved?: boolean
  ) {
    const where: any = { buyerId };
    if (approved !== undefined) {
      where.approved = approved;
    }

    const record = await prisma.eligibilityAndScore.findFirst({
      where,
      select: {
        ...eligibilityAndScoreSelect,
        buyer: {
          select: {
            id: true,
            liftpayId: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!record) {
      throw new Error("Eligibility and score record not found for this buyer");
    }

    return {
      success: true,
      message: "Latest eligibility and score retrieved successfully",
      data: record,
    };
  }

  /**
   * Update eligibility and score
   */
  async updateEligibilityAndScore(
    id: string,
    input: UpdateEligibilityAndScoreInput
  ) {
    const existingRecord = await prisma.eligibilityAndScore.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      throw new Error("Eligibility and score record not found");
    }

    const updatedRecord = await prisma.eligibilityAndScore.update({
      where: { id },
      data: input,
      select: eligibilityAndScoreSelect,
    });

    return {
      success: true,
      message: "Eligibility and score updated successfully",
      data: updatedRecord,
    };
  }

  /**
   * Delete eligibility and score
   */
  async deleteEligibilityAndScore(id: string) {
    const existingRecord = await prisma.eligibilityAndScore.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      throw new Error("Eligibility and score record not found");
    }

    await prisma.eligibilityAndScore.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Eligibility and score deleted successfully",
    };
  }

  /**
   * Create new eligibility and score for a buyer (always creates new record)
   * This replaces upsert since we now support multiple records per buyer
   */
  async createNewEligibilityAndScore(input: CreateEligibilityAndScoreInput) {
    const { buyerId } = input;

    // Check if buyer exists
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const eligibilityAndScore = await prisma.eligibilityAndScore.create({
      data: {
        buyerId,
        approved: input.approved ?? false,
        eligibility: input.eligibility,
        score: input.score,
        employmentDurationScore: input.employmentDurationScore,
        creditHistoryScore: input.creditHistoryScore,
        averageBalanceScore: input.averageBalanceScore,
        employmentStatusScore: input.employmentStatusScore,
        overdraftScore: input.overdraftScore,
        message: input.message,
        finalApprovedLoan: input.finalApprovedLoan,
        maxEligibleLoan: input.maxEligibleLoan,
        monthlyRepayment: input.monthlyRepayment,
        approvedPurchaseAmount: input.approvedPurchaseAmount,
        requiredDownPayment: input.requiredDownPayment,
      },
      select: eligibilityAndScoreSelect,
    });

    return {
      success: true,
      message: "Eligibility and score saved successfully",
      data: eligibilityAndScore,
    };
  }

  /**
   * Approve or reject eligibility and score
   */
  async updateApprovalStatus(id: string, approved: boolean) {
    const existingRecord = await prisma.eligibilityAndScore.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      throw new Error("Eligibility and score record not found");
    }

    const updatedRecord = await prisma.eligibilityAndScore.update({
      where: { id },
      data: { approved },
      select: eligibilityAndScoreSelect,
    });

    return {
      success: true,
      message: `Eligibility and score ${
        approved ? "approved" : "rejected"
      } successfully`,
      data: updatedRecord,
    };
  }
}

export const eligibilityAndScoreService = new EligibilityAndScoreService();
