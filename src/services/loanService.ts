import {
  PrismaClient,
  LoanStatus,
  LoanType,
  DocumentStatus,
  TransactionType,
  TransactionStatus,
  LoanPenaltyStatus,
  LoanScheduleStatus,
  RevenueType,
  Loan,
  DirectPayType,
} from "@prisma/client";
import {
  normalizeToMidnight,
  getDayBeforeNextCycle,
  getNextCycle,
} from "../utils/helper";
import { RevenueService } from "./revenueService";
import { AccountDetailsService } from "./accountDetailsService";
import { InvoiceMandateService } from "./invoiceMandateService";
import { generateShortReferenceId } from "./invoiceService";
import { directPayService } from "./directPayService";
import { DirectPayStatus } from "@prisma/client";
import prisma from "../utils/prisma";

const revenueService = new RevenueService();
const accountDetailsService = new AccountDetailsService();
const invoiceMandateService = new InvoiceMandateService();
// ==================== INTERFACES ====================

// Loan interfaces
export interface CreateLoanInput {
  buyerId: string;
  loanAmount: number;
  purchaseAmount?: number;
  downPaymentAmount?: number;
  merchantId?: string;
  referenceNumber?: string;
  adminCharge?: number;
  insurance?: number;
  monthlyRepayment?: number;
  loanTenure: number;
  loanInterestRate: number;
  loanStartDate: Date;
  loanEndDate?: Date;
  loanStatus: LoanStatus;
  loanType: LoanType;
  loanPurpose: string;
  loanDocument?: string;
  loanDocumentVerified?: DocumentStatus;
  invoiceId?: string;
}

export interface UpdateLoanInput {
  loanAmount?: number;
  purchaseAmount?: number;
  downPaymentAmount?: number;
  merchantId?: string;
  referenceNumber?: string;
  adminCharge?: number;
  insurance?: number;
  monthlyRepayment?: number;
  loanTenure?: number;
  loanInterestRate?: number;
  loanStartDate?: Date;
  loanEndDate?: Date;
  loanStatus?: LoanStatus;
  loanType?: LoanType;
  loanPurpose?: string;
  loanDocument?: string;
  loanDocumentVerified?: DocumentStatus;
  invoiceId?: string | null;
}

// LoanSchedule interfaces
export interface CreateLoanScheduleInput {
  loanId: string;
  start: Date;
  end: Date;
  expectedPayment: number;
  actualPayment?: number;
  expectedBalance?: number;
  expectedClosingBalance?: number;
}

export interface UpdateLoanScheduleInput {
  start?: Date;
  end?: Date;
  expectedPayment?: number;
  actualPayment?: number;
}

// LoanPenaltySchedule interfaces
export interface CreateLoanPenaltyScheduleInput {
  loanScheduleId: string;
  start: Date;
  end: Date;
  percentage: number;
  isExecuted?: boolean;
  executedAt?: Date;
}

export interface UpdateLoanPenaltyScheduleInput {
  start?: Date;
  end?: Date;
  percentage?: number;
  isExecuted?: boolean;
  executedAt?: Date;
}

// LoanPenalty interfaces
export interface CreateLoanPenaltyInput {
  dayAfter: number;
  percentage: number;
  status?: LoanPenaltyStatus;
}

export interface UpdateLoanPenaltyInput {
  dayAfter?: number;
  percentage?: number;
  status?: LoanPenaltyStatus;
}

// LoanDebitTrial interfaces
export interface CreateLoanDebitTrialInput {
  dayAfter: number;
  status?: LoanPenaltyStatus;
}

export interface UpdateLoanDebitTrialInput {
  dayAfter?: number;
  status?: LoanPenaltyStatus;
}

// LoanDebitTrialSchedule interfaces
export interface CreateLoanDebitTrialScheduleInput {
  loanScheduleId: string;
  start: Date;
  end: Date;
  isExecuted?: boolean;
  executedAt?: Date;
}

export interface UpdateLoanDebitTrialScheduleInput {
  start?: Date;
  end?: Date;
  isExecuted?: boolean;
  executedAt?: Date;
}

// LoanTransaction interfaces
export interface CreateLoanTransactionInput {
  loanId: string;
  transactionType: TransactionType;
  transactionStatus?: TransactionStatus;
  creditAmount: number;
  debitAmount: number;
  transactionDate: Date;
  description: string;
  scheduleId?: string;
}

export interface UpdateLoanTransactionInput {
  transactionType?: TransactionType;
  transactionStatus?: TransactionStatus;
  creditAmount?: number;
  debitAmount?: number;
  transactionDate?: Date;
}
export interface GetLoanBalanceInput {
  transactionType: TransactionType;
  transactionStatus: TransactionStatus;
  creditAmount: number;
  debitAmount: number;
}
type RecordItem = {
  status: string;
  [key: string]: any;
};
const INTEREST_RATE = 7.5;
export class LoanService {
  // ==================== LOAN CRUD ====================

  /**
   * Create a new loan
   */
  async createLoan(input: CreateLoanInput) {
    try {
      // Verify buyer exists
      const buyer = await prisma.buyer.findUnique({
        where: { id: input.buyerId },
      });

      if (!buyer) {
        throw new Error("Buyer not found");
      }

      if (input.referenceNumber) {
        // check if reference number is already used
        const existingLoan = await prisma.loan.findFirst({
          where: { referenceNumber: input.referenceNumber },
        });
        if (existingLoan) {
          throw new Error(
            "Reference number already used. Duplicate loan not allowed."
          );
        }
      }

      if (input.invoiceId) {
        const invoice = await prisma.invoice.findUnique({
          where: { id: input.invoiceId },
        });

        if (!invoice) {
          throw new Error("Invoice not found");
        }

        const existingLoanForInvoice = await prisma.loan.findFirst({
          where: { invoiceId: input.invoiceId },
        });

        if (existingLoanForInvoice) {
          throw new Error("Invoice already linked to another loan");
        }
      }
      // Convert dates to Date objects if they're strings
      const loanStartDate = new Date(input.loanStartDate);
      const loanEndDate = input.loanEndDate
        ? new Date(input.loanEndDate)
        : undefined;

      const loan = await prisma.loan.create({
        data: {
          liftpayId: "", // Will be auto-generated by trigger
          buyerId: input.buyerId,
          invoiceId: input.invoiceId,
          loanAmount: input.loanAmount,
          purchaseAmount: input.purchaseAmount,
          downPaymentAmount: input.downPaymentAmount,
          merchantId: input.merchantId,
          referenceNumber: input.referenceNumber,
          adminCharge: input.adminCharge,
          insurance: input.insurance,
          monthlyRepayment: input.monthlyRepayment,
          loanTenure: input.loanTenure,
          loanInterestRate: input.loanInterestRate,
          loanStartDate: loanStartDate,
          loanEndDate: loanEndDate,
          loanStatus: input.loanStatus,
          loanType: input.loanType,
          loanPurpose: input.loanPurpose,
          loanDocument: input.loanDocument,
          loanDocumentVerified:
            input.loanDocumentVerified || DocumentStatus.Pending,
        },
        include: {
          buyer: {
            select: {
              id: true,
              liftpayId: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create loan schedules
      let expectedBalance = input.loanAmount;
      let nextcycle = getNextCycle(new Date(loanStartDate).toISOString());
      for (let i = 1; i <= input.loanTenure; i++) {
        this.createLoanSchedule({
          loanId: loan.id,
          start: nextcycle,
          end: getDayBeforeNextCycle(new Date(nextcycle).toISOString()),
          expectedPayment: Number(input.monthlyRepayment),
          expectedBalance: expectedBalance,
          expectedClosingBalance:
            expectedBalance +
            INTEREST_RATE * 0.01 * expectedBalance -
            Number(input.monthlyRepayment),
        });
        nextcycle = getNextCycle(new Date(nextcycle).toISOString());
        expectedBalance =
          expectedBalance +
          INTEREST_RATE * 0.01 * expectedBalance -
          Number(input.monthlyRepayment);
      }
      if (input.loanStatus === LoanStatus.Active) {
        await this.createLoanTransaction({
          loanId: loan.id,
          transactionType: TransactionType.principal,
          transactionStatus: TransactionStatus.Completed,
          creditAmount: input.loanAmount,
          debitAmount: 0,
          transactionDate: new Date(),
          description: "Initial Loan disbursement",
        });
      }

      return { success: true, data: loan };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan by ID
   */
  async getLoanById(loanId: string) {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
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
          merchant: {
            select: {
              id: true,
              liftpayId: true,
              businessName: true,
              businessEmail: true,
            },
          },
          loanSchedules: {
            orderBy: { start: "asc" },
          },
          loanTransactions: {
            orderBy: { transactionDate: "desc" },
          },
        },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      const principalBalance = this.getLoanBalanceByTransactionType3(
        TransactionType.principal,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const interestBalance = this.getLoanBalanceByTransactionType3(
        TransactionType.interest,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const penaltyBalance = this.getLoanBalanceByTransactionType3(
        TransactionType.penalty,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const overallBalance = this.getLoanBalance(
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const amountDue = this.getAmountDue(loan);
      return {
        success: true,
        data: {
          ...loan,
          principalBalance,
          interestBalance,
          penaltyBalance,
          overallBalance,
          nextPaymentDate: loan.loanSchedules[0]?.end,
          nextPaymentAmount: loan.loanSchedules[0]?.expectedPayment,
          monthCompleted: this.countClosedSchedules(
            loan.loanSchedules as unknown as RecordItem[]
          ),
          ...amountDue,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan by liftpayId
   */
  async getLoanByLiftpayId(liftpayId: string) {
    try {
      const loan = await prisma.loan.findUnique({
        where: { liftpayId },
        include: {
          buyer: true,
          merchant: {
            select: {
              id: true,
              liftpayId: true,
              businessName: true,
              businessEmail: true,
            },
          },
          loanSchedules: true,
          loanTransactions: true,
        },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      return { success: true, data: loan };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan by invoice ID
   */
  async getLoanByInvoiceId(invoiceId: string) {
    try {
      const loan = await prisma.loan.findFirst({
        where: { invoiceId },
        include: {
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
          merchant: {
            select: {
              id: true,
              liftpayId: true,
              businessName: true,
              businessEmail: true,
            },
          },
          loanSchedules: {
            orderBy: { start: "asc" },
          },
          loanTransactions: {
            orderBy: { transactionDate: "desc" },
          },
        },
      });

      if (!loan) {
        throw new Error("Loan not found for this invoice");
      }

      const principalBalance = this.getLoanBalanceByTransactionType3(
        TransactionType.principal,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const interestBalance = this.getLoanBalanceByTransactionType3(
        TransactionType.interest,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const penaltyBalance = this.getLoanBalanceByTransactionType3(
        TransactionType.penalty,
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const overallBalance = this.getLoanBalance(
        loan.loanTransactions as unknown as GetLoanBalanceInput[]
      );
      const amountDue = this.getAmountDue(loan);
      return {
        success: true,
        data: {
          ...loan,
          principalBalance,
          interestBalance,
          penaltyBalance,
          overallBalance,
          nextPaymentDate: loan.loanSchedules[0]?.end,
          nextPaymentAmount: loan.loanSchedules[0]?.expectedPayment,
          monthCompleted: this.countClosedSchedules(
            loan.loanSchedules as unknown as RecordItem[]
          ),
          ...amountDue,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all loans with optional filters
   */
  async getAllLoans(filters?: {
    buyerId?: string;
    loanStatus?: LoanStatus;
    loanType?: LoanType;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.buyerId) where.buyerId = filters.buyerId;
      if (filters?.loanStatus) where.loanStatus = filters.loanStatus;
      if (filters?.loanType) where.loanType = filters.loanType;

      const [loans, total] = await Promise.all([
        prisma.loan.findMany({
          where,
          skip,
          take: limit,
          include: {
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
            merchant: {
              select: {
                id: true,
                liftpayId: true,
                businessName: true,
                businessEmail: true,
                businessCategory: true,
              },
            },
            loanSchedules: {
              orderBy: { start: "asc" },
            },
            loanTransactions: {
              orderBy: [
                { transactionDate: "desc" },
                { updatedAt: "desc" },
                { id: "desc" },
              ],
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.loan.count({ where }),
      ]);
      const loanWithBalance = loans.map((loan) => {
        const principalBalance = this.getLoanBalanceByTransactionType3(
          TransactionType.principal,
          loan.loanTransactions as unknown as GetLoanBalanceInput[]
        );
        const interestBalance = this.getLoanBalanceByTransactionType3(
          TransactionType.interest,
          loan.loanTransactions as unknown as GetLoanBalanceInput[]
        );
        const penaltyBalance = this.getLoanBalanceByTransactionType3(
          TransactionType.penalty,
          loan.loanTransactions as unknown as GetLoanBalanceInput[]
        );
        const overallBalance = this.getLoanBalance(
          loan.loanTransactions as unknown as GetLoanBalanceInput[]
        );
        return {
          ...loan,
          principalBalance,
          interestBalance,
          penaltyBalance,
          overallBalance,
          nextPaymentDate: loan.loanSchedules[0]?.end,
          nextPaymentAmount: loan.loanSchedules[0]?.expectedPayment,
          monthCompleted: this.countClosedSchedules(
            loan.loanSchedules as unknown as RecordItem[]
          ),
        };
      });
      return {
        success: true,
        data: {
          loans: loanWithBalance,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan
   */
  async updateLoan(loanId: string, input: UpdateLoanInput) {
    if (input.referenceNumber) {
      // check if reference number is already used
      const existingLoan = await prisma.loan.findFirst({
        where: { referenceNumber: input.referenceNumber, id: { not: loanId } },
      });
      if (existingLoan) {
        throw new Error(
          "Reference number already used. Duplicate loan not allowed."
        );
      }
    }
    const prevLoan = await this.getLoanById(loanId);
    if (!prevLoan.success) {
      throw new Error(prevLoan.error);
    }
    const { data: prevLoanData } = prevLoan;

    if (input.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: input.invoiceId },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const existingLoanForInvoice = await prisma.loan.findFirst({
        where: {
          invoiceId: input.invoiceId,
          id: { not: loanId },
        },
      });

      if (existingLoanForInvoice) {
        throw new Error("Invoice already linked to another loan");
      }
    }
    try {
      const loan = await prisma.loan.update({
        where: { id: loanId },
        data: input,
        include: {
          buyer: true,
          merchant: {
            select: {
              id: true,
              liftpayId: true,
              businessName: true,
              businessEmail: true,
            },
          },
        },
      });

      if (
        input.loanStatus === LoanStatus.Active &&
        prevLoanData?.loanStatus !== LoanStatus.Active
      ) {
        await this.createLoanTransaction({
          loanId: loan.id,
          transactionType: TransactionType.principal,
          transactionStatus: TransactionStatus.Pending,
          creditAmount: input.loanAmount
            ? Number(input.loanAmount)
            : Number(prevLoanData?.loanAmount) || 0,
          debitAmount: 0,
          transactionDate: new Date(),
          description: `Initial load disbursement`,
        });
      }

      return { success: true, data: loan };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan (soft delete by updating status)
   */
  async deleteLoan(loanId: string) {
    try {
      // Check if loan has transactions
      const transactionsCount = await prisma.loanTransaction.count({
        where: { loanId },
      });

      if (transactionsCount > 0) {
        throw new Error("Cannot delete loan with existing transactions");
      }

      const loan = await prisma.loan.delete({
        where: { id: loanId },
      });

      return {
        success: true,
        data: loan,
        message: "Loan deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN SCHEDULE CRUD ====================

  /**
   * Create loan schedule
   */
  async createLoanSchedule(input: CreateLoanScheduleInput) {
    try {
      // Verify loan exists
      const loan = await prisma.loan.findUnique({
        where: { id: input.loanId },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      const schedule = await prisma.loanSchedule.create({
        data: {
          loanId: input.loanId,
          start: input.start,
          end: input.end,
          expectedPayment: input.expectedPayment,
          actualPayment: input.actualPayment,
          expectedBalance: input.expectedBalance || 0,
          expectedClosingBalance: input.expectedClosingBalance || 0,
        },
        include: {
          loan: {
            select: {
              id: true,
              liftpayId: true,
              loanAmount: true,
            },
          },
        },
      });
      // Create penalty schedules
      const getAllLoanPenalties = await this.getAllLoanPenalties(
        LoanPenaltyStatus.Active
      );
      if (getAllLoanPenalties.success && getAllLoanPenalties.data) {
        for (let i = 0; i < getAllLoanPenalties.data.length; i++) {
          const penalty = getAllLoanPenalties.data[i];

          await this.createLoanPenaltySchedule({
            loanScheduleId: schedule.id,
            start: new Date(
              schedule.start.getTime() + penalty.dayAfter * 24 * 60 * 60 * 1000
            ),
            end: input.end,
            percentage: Number(penalty.percentage),
            isExecuted: false,
          });
        }
      }

      // Create debit trial schedules
      const getAllLoanDebitTrials = await this.getAllLoanDebitTrials(
        LoanPenaltyStatus.Active
      );
      if (getAllLoanDebitTrials.success && getAllLoanDebitTrials.data) {
        for (let i = 0; i < getAllLoanDebitTrials.data.length; i++) {
          const debitTrial = getAllLoanDebitTrials.data[i];

          await this.createLoanDebitTrialSchedule({
            loanScheduleId: schedule.id,
            start: new Date(
              schedule.start.getTime() +
                debitTrial.dayAfter * 24 * 60 * 60 * 1000
            ),
            end: input.end,
            isExecuted: false,
          });
        }
      }

      return { success: true, data: schedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan schedule by ID
   */
  async getLoanScheduleById(scheduleId: string) {
    try {
      const schedule = await prisma.loanSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          loan: true,
          penaltySchedule: true,
        },
      });

      if (!schedule) {
        throw new Error("Loan schedule not found");
      }

      return { success: true, data: schedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all schedules for a loan
   */
  async getLoanSchedulesByLoanId(loanId: string) {
    try {
      const schedules = await prisma.loanSchedule.findMany({
        where: { loanId },
        include: {
          penaltySchedule: true,
        },
        orderBy: { start: "asc" },
      });

      return { success: true, data: schedules };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan schedule
   */
  async updateLoanSchedule(scheduleId: string, input: UpdateLoanScheduleInput) {
    try {
      const schedule = await prisma.loanSchedule.update({
        where: { id: scheduleId },
        data: input,
      });

      return { success: true, data: schedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan schedule
   */
  async deleteLoanSchedule(scheduleId: string) {
    try {
      const schedule = await prisma.loanSchedule.delete({
        where: { id: scheduleId },
      });

      return {
        success: true,
        data: schedule,
        message: "Loan schedule deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN PENALTY SCHEDULE CRUD ====================

  /**
   * Create loan penalty schedule
   */
  async createLoanPenaltySchedule(input: CreateLoanPenaltyScheduleInput) {
    try {
      // Verify loan schedule exists
      const loanSchedule = await prisma.loanSchedule.findUnique({
        where: { id: input.loanScheduleId },
      });

      if (!loanSchedule) {
        throw new Error("Loan schedule not found");
      }

      const penaltySchedule = await prisma.loanPenaltySchedule.create({
        data: {
          loanScheduleId: input.loanScheduleId,
          start: input.start,
          end: input.end,
          percentage: input.percentage,
          isExecuted: input.isExecuted || false,
          executedAt: input.executedAt,
        },
        include: {
          loanSchedule: {
            include: {
              loan: true,
            },
          },
        },
      });

      return { success: true, data: penaltySchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan penalty schedule by ID
   */
  async getLoanPenaltyScheduleById(penaltyScheduleId: string) {
    try {
      const penaltySchedule = await prisma.loanPenaltySchedule.findUnique({
        where: { id: penaltyScheduleId },
        include: {
          loanSchedule: {
            include: {
              loan: true,
            },
          },
        },
      });

      if (!penaltySchedule) {
        throw new Error("Loan penalty schedule not found");
      }

      return { success: true, data: penaltySchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all penalty schedules for a loan schedule
   */
  async getLoanPenaltySchedulesByScheduleId(scheduleId: string) {
    try {
      const penaltySchedules = await prisma.loanPenaltySchedule.findMany({
        where: { loanScheduleId: scheduleId },
        orderBy: { start: "asc" },
      });

      return { success: true, data: penaltySchedules };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan penalty schedule
   */
  async updateLoanPenaltySchedule(
    penaltyScheduleId: string,
    input: UpdateLoanPenaltyScheduleInput
  ) {
    try {
      const penaltySchedule = await prisma.loanPenaltySchedule.update({
        where: { id: penaltyScheduleId },
        data: input,
      });

      return { success: true, data: penaltySchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute penalty schedule
   */
  async executeLoanPenaltySchedule(penaltyScheduleId: string) {
    try {
      const penaltySchedule = await prisma.loanPenaltySchedule.update({
        where: { id: penaltyScheduleId },
        data: {
          isExecuted: true,
          executedAt: new Date(),
        },
      });

      return {
        success: true,
        data: penaltySchedule,
        message: "Penalty schedule executed successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan penalty schedule
   */
  async deleteLoanPenaltySchedule(penaltyScheduleId: string) {
    try {
      const penaltySchedule = await prisma.loanPenaltySchedule.delete({
        where: { id: penaltyScheduleId },
      });

      return {
        success: true,
        data: penaltySchedule,
        message: "Loan penalty schedule deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending penalty schedules by date
   * Finds penalty schedules where the given date is between start and end dates and isExecuted is false
   */
  async getPendingPenaltySchedulesByDate(date: Date = new Date()) {
    try {
      const penaltySchedules = await prisma.loanPenaltySchedule.findMany({
        where: {
          isExecuted: false,
          start: {
            lte: normalizeToMidnight(date), // start date is less than or equal to the given date
          },
          end: {
            gte: normalizeToMidnight(date), // end date is greater than or equal to the given date
          },
        },
        include: {
          loanSchedule: {
            include: {
              loan: {
                include: {
                  buyer: {
                    select: {
                      id: true,
                      liftpayId: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { start: "asc" },
      });

      return {
        success: true,
        data: penaltySchedules,
        count: penaltySchedules.length,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN PENALTY CRUD ====================

  /**
   * Create loan penalty
   */
  async createLoanPenalty(input: CreateLoanPenaltyInput) {
    try {
      const penalty = await prisma.loanPenalty.create({
        data: {
          dayAfter: input.dayAfter,
          percentage: input.percentage,
          status: input.status || LoanPenaltyStatus.Inactive,
        },
      });

      return { success: true, data: penalty };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan penalty by ID
   */
  async getLoanPenaltyById(penaltyId: string) {
    try {
      const penalty = await prisma.loanPenalty.findUnique({
        where: { id: penaltyId },
      });

      if (!penalty) {
        throw new Error("Loan penalty not found");
      }

      return { success: true, data: penalty };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all loan penalties
   */
  async getAllLoanPenalties(status?: LoanPenaltyStatus) {
    try {
      const where = status ? { status } : {};

      const penalties = await prisma.loanPenalty.findMany({
        where,
        orderBy: { dayAfter: "asc" },
      });

      return { success: true, data: penalties };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan penalty
   */
  async updateLoanPenalty(penaltyId: string, input: UpdateLoanPenaltyInput) {
    try {
      const penalty = await prisma.loanPenalty.update({
        where: { id: penaltyId },
        data: input,
      });

      return { success: true, data: penalty };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan penalty
   */
  async deleteLoanPenalty(penaltyId: string) {
    try {
      const penalty = await prisma.loanPenalty.delete({
        where: { id: penaltyId },
      });

      return {
        success: true,
        data: penalty,
        message: "Loan penalty deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN DEBIT TRIAL CRUD ====================

  /**
   * Create loan debit trial
   */
  async createLoanDebitTrial(input: CreateLoanDebitTrialInput) {
    try {
      const debitTrial = await prisma.loanDebitTrial.create({
        data: {
          dayAfter: input.dayAfter,
          status: input.status || LoanPenaltyStatus.Inactive,
        },
      });

      return { success: true, data: debitTrial };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan debit trial by ID
   */
  async getLoanDebitTrialById(debitTrialId: string) {
    try {
      const debitTrial = await prisma.loanDebitTrial.findUnique({
        where: { id: debitTrialId },
      });

      if (!debitTrial) {
        throw new Error("Loan debit trial not found");
      }

      return { success: true, data: debitTrial };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all loan debit trials
   */
  async getAllLoanDebitTrials(status?: LoanPenaltyStatus) {
    try {
      const where = status ? { status } : {};

      const debitTrials = await prisma.loanDebitTrial.findMany({
        where,
        orderBy: { dayAfter: "asc" },
      });

      return { success: true, data: debitTrials };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan debit trial
   */
  async updateLoanDebitTrial(
    debitTrialId: string,
    input: UpdateLoanDebitTrialInput
  ) {
    try {
      const debitTrial = await prisma.loanDebitTrial.update({
        where: { id: debitTrialId },
        data: input,
      });

      return { success: true, data: debitTrial };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan debit trial
   */
  async deleteLoanDebitTrial(debitTrialId: string) {
    try {
      const debitTrial = await prisma.loanDebitTrial.delete({
        where: { id: debitTrialId },
      });

      return {
        success: true,
        data: debitTrial,
        message: "Loan debit trial deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN DEBIT TRIAL SCHEDULE CRUD ====================

  /**
   * Create loan debit trial schedule
   */
  async createLoanDebitTrialSchedule(input: CreateLoanDebitTrialScheduleInput) {
    try {
      // Verify loan schedule exists
      const loanSchedule = await prisma.loanSchedule.findUnique({
        where: { id: input.loanScheduleId },
      });

      if (!loanSchedule) {
        throw new Error("Loan schedule not found");
      }

      const debitTrialSchedule = await prisma.loanDebitTrialSchedule.create({
        data: {
          loanScheduleId: input.loanScheduleId,
          start: input.start,
          end: input.end,
          isExecuted: input.isExecuted || false,
          executedAt: input.executedAt,
        },
        include: {
          loanSchedule: {
            include: {
              loan: true,
            },
          },
        },
      });

      return { success: true, data: debitTrialSchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan debit trial schedule by ID
   */
  async getLoanDebitTrialScheduleById(debitTrialScheduleId: string) {
    try {
      const debitTrialSchedule = await prisma.loanDebitTrialSchedule.findUnique(
        {
          where: { id: debitTrialScheduleId },
          include: {
            loanSchedule: {
              include: {
                loan: true,
              },
            },
          },
        }
      );

      if (!debitTrialSchedule) {
        throw new Error("Loan debit trial schedule not found");
      }

      return { success: true, data: debitTrialSchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all debit trial schedules for a loan schedule
   */
  async getLoanDebitTrialSchedulesByScheduleId(scheduleId: string) {
    try {
      const debitTrialSchedules = await prisma.loanDebitTrialSchedule.findMany({
        where: { loanScheduleId: scheduleId },
        orderBy: { start: "asc" },
      });

      return { success: true, data: debitTrialSchedules };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan debit trial schedule
   */
  async updateLoanDebitTrialSchedule(
    debitTrialScheduleId: string,
    input: UpdateLoanDebitTrialScheduleInput
  ) {
    try {
      const debitTrialSchedule = await prisma.loanDebitTrialSchedule.update({
        where: { id: debitTrialScheduleId },
        data: input,
      });

      return { success: true, data: debitTrialSchedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute debit trial schedule
   */
  async executeLoanDebitTrialSchedule(debitTrialScheduleId: string) {
    try {
      const debitTrialSchedule = await prisma.loanDebitTrialSchedule.update({
        where: { id: debitTrialScheduleId },
        data: {
          isExecuted: true,
          executedAt: new Date(),
        },
      });

      return {
        success: true,
        data: debitTrialSchedule,
        message: "Debit trial schedule executed successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan debit trial schedule
   */
  async deleteLoanDebitTrialSchedule(debitTrialScheduleId: string) {
    try {
      const debitTrialSchedule = await prisma.loanDebitTrialSchedule.delete({
        where: { id: debitTrialScheduleId },
      });

      return {
        success: true,
        data: debitTrialSchedule,
        message: "Loan debit trial schedule deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN TRANSACTION CRUD ====================

  /**
   * Create loan transaction
   */
  async createLoanTransaction(input: CreateLoanTransactionInput) {
    const { creditAmount, debitAmount, loanId } = input;

    if (creditAmount > 0 && debitAmount > 0) {
      return {
        success: false,
        error:
          "Transaction not successful! credit and debit cannot be present at the same time",
      };
    }
    try {
      // Verify loan exists
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      const transaction = await prisma.loanTransaction.create({
        data: {
          liftpayId: "", // Will be auto-generated by trigger
          loanId: input.loanId,
          transactionType: input.transactionType,
          transactionStatus:
            input.transactionStatus || TransactionStatus.Pending,
          description: input.description,
          creditAmount: input.creditAmount,
          debitAmount: input.debitAmount,
          transactionDate: input.transactionDate,
          scheduleId: input.scheduleId,
        },
        include: {
          loan: {
            select: {
              id: true,
              liftpayId: true,
              loanAmount: true,
              buyer: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return { success: true, data: transaction };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan transaction by ID
   */
  async getLoanTransactionById(transactionId: string) {
    try {
      const transaction = await prisma.loanTransaction.findUnique({
        where: { id: transactionId },
        include: {
          loan: {
            include: {
              buyer: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new Error("Loan transaction not found");
      }

      return { success: true, data: transaction };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan transaction by liftpayId
   */
  async getLoanTransactionByLiftpayId(liftpayId: string) {
    try {
      const transaction = await prisma.loanTransaction.findUnique({
        where: { liftpayId },
        include: {
          loan: {
            include: {
              buyer: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new Error("Loan transaction not found");
      }

      return { success: true, data: transaction };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all transactions for a loan
   */
  async getLoanTransactionsByLoanId(
    loanId: string,
    filters?: {
      transactionType?: TransactionType;
      transactionStatus?: TransactionStatus;
    }
  ) {
    try {
      const where: any = { loanId };
      if (filters?.transactionType)
        where.transactionType = filters.transactionType;
      if (filters?.transactionStatus)
        where.transactionStatus = filters.transactionStatus;

      const transactions = await prisma.loanTransaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
      });

      return { success: true, data: transactions };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all loan transactions with filters
   */
  async getAllLoanTransactions(filters?: {
    transactionType?: TransactionType;
    transactionStatus?: TransactionStatus;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.transactionType)
        where.transactionType = filters.transactionType;
      if (filters?.transactionStatus)
        where.transactionStatus = filters.transactionStatus;

      const [transactions, total] = await Promise.all([
        prisma.loanTransaction.findMany({
          where,
          skip,
          take: limit,
          include: {
            loan: {
              select: {
                id: true,
                liftpayId: true,
                loanAmount: true,
                buyer: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { transactionDate: "desc" },
        }),
        prisma.loanTransaction.count({ where }),
      ]);

      return {
        success: true,
        data: {
          transactions,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update loan transaction
   */
  async updateLoanTransaction(
    transactionId: string,
    input: UpdateLoanTransactionInput
  ) {
    try {
      const transaction = await prisma.loanTransaction.update({
        where: { id: transactionId },
        data: input,
      });

      return { success: true, data: transaction };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete a transaction
   */
  async completeLoanTransaction(transactionId: string) {
    try {
      const transaction = await prisma.loanTransaction.update({
        where: { id: transactionId },
        data: {
          transactionStatus: TransactionStatus.Completed,
        },
      });

      return {
        success: true,
        data: transaction,
        message: "Transaction completed successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete loan transaction (restricted if linked to loan)
   */
  async deleteLoanTransaction(transactionId: string) {
    try {
      const transaction = await prisma.loanTransaction.delete({
        where: { id: transactionId },
      });

      return {
        success: true,
        data: transaction,
        message: "Loan transaction deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get loan summary
   */
  async getLoanSummary(loanId: string) {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
          buyer: true,
          loanSchedules: {
            include: {
              penaltySchedule: true,
            },
          },
          loanTransactions: true,
        },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      // Calculate totals
      const totalPaid = loan.loanTransactions
        .filter((t) => t.transactionStatus === TransactionStatus.Completed)
        .reduce((sum, t) => sum + Number(t.creditAmount), 0);

      const totalPending = loan.loanTransactions
        .filter((t) => t.transactionStatus === TransactionStatus.Pending)
        .reduce((sum, t) => sum + Number(t.creditAmount), 0);

      const scheduledPayments = loan.loanSchedules.length;
      const completedPayments = loan.loanSchedules.filter(
        (s) => s.actualPayment
      ).length;

      return {
        success: true,
        data: {
          loan,
          summary: {
            totalPaid,
            totalPending,
            scheduledPayments,
            completedPayments,
            remainingPayments: scheduledPayments - completedPayments,
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get buyer's loan history
   */
  async getBuyerLoanHistory(buyerId: string) {
    try {
      const loans = await prisma.loan.findMany({
        where: { buyerId },
        include: {
          loanTransactions: {
            where: {
              transactionStatus: TransactionStatus.Completed,
            },
          },
          loanSchedules: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: loans };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loan balance grouped by transaction type
   * Calculates sum(creditAmount - debitAmount) for each transaction type
   */
  async getLoanBalanceByTransactionType(loanId: string) {
    try {
      // Verify loan exists
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
      });

      if (!loan) {
        throw new Error("Loan not found");
      }

      // Get all transactions for the loan
      const transactions = await prisma.loanTransaction.findMany({
        where: { loanId },
      });
      // Group by transaction type and calculate balance
      const balanceByType: Record<
        string,
        {
          transactionType: TransactionType;
          balance: number;
          totalCredit: number;
          totalDebit: number;
          transactionCount: number;
        }
      > = {};

      // Initialize all transaction types
      Object.values(TransactionType).forEach((type) => {
        balanceByType[type] = {
          transactionType: type,
          balance: 0,
          totalCredit: 0,
          totalDebit: 0,
          transactionCount: 0,
        };
      });

      // Calculate totals for each transaction type
      transactions.forEach((transaction) => {
        const type = transaction.transactionType;
        const credit = Number(transaction.creditAmount);
        const debit = Number(transaction.debitAmount);

        balanceByType[type].totalCredit += credit;
        balanceByType[type].totalDebit += debit;
        balanceByType[type].balance += credit - debit;
        balanceByType[type].transactionCount += 1;
      });

      // Convert to array and filter out types with no transactions
      const result = Object.values(balanceByType).filter(
        (item) => item.transactionCount > 0
      );

      // Calculate overall balance
      const overallBalance = result.reduce(
        (sum, item) => sum + item.balance,
        0
      );
      const overallCredit = result.reduce(
        (sum, item) => sum + item.totalCredit,
        0
      );
      const overallDebit = result.reduce(
        (sum, item) => sum + item.totalDebit,
        0
      );

      return {
        success: true,
        data: {
          loanId,
          balanceByType: result,
          overall: {
            balance: overallBalance,
            totalCredit: overallCredit,
            totalDebit: overallDebit,
            transactionCount: transactions.length,
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getLoanBalanceByTransactionType2(loanId: string) {
    try {
      const balances = await prisma.$queryRaw<
        { transactionType: string; balance: number }[]
      >`
        SELECT
          "transactionType",
          SUM("creditAmount" - "debitAmount") AS "balance"
        FROM "LoanTransaction"
        WHERE "loanId" = ${loanId}
        GROUP BY "transactionType"
      `;

      const overallBalance = balances.reduce(
        (sum, b) => sum + Number(b.balance),
        0
      );

      return {
        success: true,
        data: {
          loanId,
          balanceByType: balances.map((b) => ({
            transactionType: b.transactionType,
            balance: Number(b.balance),
          })),
          overall: {
            balance: overallBalance,
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  getLoanBalance(input: GetLoanBalanceInput[]): Number {
    const balance = input.reduce(
      (sum, item) => Number(sum) + Number(item.creditAmount) - item.debitAmount,
      0
    );
    return balance;
  }
  getAmountDue(
    input: Loan & { loanSchedules?: any[]; loanTransactions?: any[] }
  ) {
    // get next loan schedule that is not executed use Loan
    const nextSchedule = input.loanSchedules
      ?.filter((schedule) => !schedule.isExecuted)
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      )[0];

    const lastExecutedSchedule = input.loanSchedules
      ?.filter((schedule) => schedule.isExecuted)
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      )[0];
    // get loan overall balance at the last executed schedule
    const lastExecutedScheduleBalance = input.loanSchedules
      ?.filter((schedule) => schedule.isExecuted)
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      )[0];

    // get the last executed transaction loan schedule

    const overallBalance = this.getLoanBalance(
      input.loanTransactions as unknown as GetLoanBalanceInput[]
    );
    if (lastExecutedScheduleBalance) {
      const amountDue =
        Number(overallBalance) -
        Number(lastExecutedScheduleBalance.expectedClosingBalance);
      return { amountDue: amountDue > 0 ? amountDue : 0 };
    } else {
      return { amountDue: 0 };
    }
  }

  getLoanBalanceByTransactionType3(
    transactionType: TransactionType,
    input: GetLoanBalanceInput[]
  ): Number {
    const balance = input
      .filter((item) => item.transactionType === transactionType)
      .reduce(
        (sum, item) =>
          Number(sum) + Number(item.creditAmount) - Number(item.debitAmount),
        0
      );
    return balance;
  }
  async penaltyEnforcement(date: Date) {
    try {
      // interest enforcement
      await this.interestEnforcement(normalizeToMidnight(date));
      // First,re find the penalty schedules that need to be updated
      const penaltySchedules = await this.getPenaltySchedulesToUpdate(
        normalizeToMidnight(date)
      );
      if (penaltySchedules.success) {
        const loanPenaltySchedules = penaltySchedules.data.penaltySchedules;
        for (const loanPenaltySchedule of loanPenaltySchedules) {
          const scheduleId = loanPenaltySchedule?.loanSchedule?.id;
          const schedulePenaltyTransactions =
            await this.getLoanTransactionsByScheduleId(scheduleId);
          // sum all the debit amount of the transactions
          const sumPayment = schedulePenaltyTransactions.reduce(
            (sum, transaction) => sum + Number(transaction.debitAmount),
            0
          );
          if (
            sumPayment >= loanPenaltySchedule.loanSchedule.loan.monthlyRepayment
          ) {
            continue;
          }
          const loan = await this.getLoanById(
            loanPenaltySchedule.loanSchedule.loanId
          );

          if (loan.success && loan.data) {
            const loanData = loan.data;
            const balance = loanData.overallBalance;
            const expectedBalance = loanPenaltySchedule.expectedBalance;

            if (Number(balance) <= Number(expectedBalance)) {
              continue;
            }
            let penalty =
              (Number(balance) * Number(loanPenaltySchedule.percentage)) / 100;

            if (schedulePenaltyTransactions.length > 0) {
              //sum the debit amount of the transactions where the transaction type is penalty
              const schedulePenaltyDebitAmount = schedulePenaltyTransactions
                .filter(
                  (transaction) =>
                    transaction.transactionType === TransactionType.penalty
                )
                .reduce(
                  (sum, transaction) => sum + Number(transaction.creditAmount),
                  0
                );
              if (schedulePenaltyDebitAmount >= penalty) {
                continue;
              }
              penalty -= schedulePenaltyDebitAmount;
            }

            await this.createLoanTransaction({
              loanId: loanData.id,
              scheduleId: loanPenaltySchedule?.loanSchedule?.id,
              transactionType: TransactionType.penalty,
              transactionStatus: TransactionStatus.Completed,
              creditAmount: penalty,
              debitAmount: 0,
              transactionDate: loanPenaltySchedule.start,
              description:
                " Penalty enforcement adjusted balance on" +
                balance.toFixed(2) +
                " on " +
                loanPenaltySchedule.start,
            });
          }
        }

        return { success: true, data: penaltySchedules.data };
      }
      return { success: false, error: "Failed to get penalty schedules" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async getPenaltySchedulesToUpdate(
    date: Date
  ): Promise<{ success: boolean; data: any }> {
    try {
      const penaltySchedulesToUpdate =
        await prisma.loanPenaltySchedule.findMany({
          where: {
            start: { lte: new Date(date) },
            end: { gte: new Date(date) },
            isExecuted: false,
          },
          select: {
            id: true,
          },
          orderBy: {
            start: "asc",
          },
        });

      // Get IDs of schedules to update
      const scheduleIds = penaltySchedulesToUpdate.map(
        (schedule) => schedule.id
      );

      // Update all matching schedules
      await prisma.loanPenaltySchedule.updateMany({
        where: {
          id: { in: scheduleIds },
        },
        data: {
          isExecuted: true,
          executedAt: new Date(),
        },
      });

      // Fetch the updated records
      const updatedPenaltySchedules = await prisma.loanPenaltySchedule.findMany(
        {
          where: {
            id: { in: scheduleIds },
          },
          include: {
            loanSchedule: {
              include: {
                loan: {
                  include: {
                    buyer: {
                      select: {
                        id: true,
                        liftpayId: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            start: "asc",
          },
        }
      );

      return {
        success: true,
        data: {
          count: updatedPenaltySchedules.length,
          penaltySchedules: updatedPenaltySchedules,
        },
      };
    } catch (error: any) {
      return { success: false, data: { count: 0, penaltySchedules: [] } };
    }
  }
  async interestEnforcement(date: Date) {
    try {
      const interestSchedules = await this.getInterestSchedulesToUpdate(
        normalizeToMidnight(date)
      );

      if (interestSchedules.success) {
        const loanInterestSchedules = Array.isArray(interestSchedules.data)
          ? interestSchedules.data
          : [];

        for (const loanInterestSchedule of loanInterestSchedules) {
          const loan = await this.getLoanById(loanInterestSchedule.loanId);
          if (loan.success && loan.data) {
            const balance = Number(loan.data?.overallBalance);

            await prisma.loanSchedule.update({
              where: { id: loanInterestSchedule.id },
              data: {
                openingBalance: balance,
              },
            });
            const interest = balance * INTEREST_RATE * 0.01;
            await this.createLoanTransaction({
              loanId: loan.data.id,
              scheduleId: loanInterestSchedule.id,
              transactionType: TransactionType.interest,
              transactionStatus: TransactionStatus.Completed,
              creditAmount: interest,
              debitAmount: 0,
              transactionDate: loanInterestSchedule.start,
              description:
                "Interest enforcement on " +
                balance.toFixed(2) +
                " on " +
                loanInterestSchedule.start,
            });
          }
        }
        return {
          success: true,
          data: {
            count: loanInterestSchedules.length,
            interestSchedules: loanInterestSchedules,
          },
        };
      }
      return { success: false, error: "Failed to get interest schedules" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async getInterestSchedulesToUpdate(date: Date) {
    try {
      const interestSchedules = await prisma.loanSchedule.findMany({
        where: { start: { lte: date }, end: { gte: date }, isExecuted: false },
        include: {
          loan: {
            include: {
              buyer: true,
            },
          },
        },
      });

      await prisma.loanSchedule.updateMany({
        where: {
          id: { in: interestSchedules.map((schedule) => schedule.id) },
        },
        data: {
          isExecuted: true,
          executedAt: new Date(),
        },
      });
      return { success: true, data: interestSchedules };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async loanRepayment(loanId: string, amount: number, date: Date = new Date()) {
    try {
      // First, enforce penalties
      await this.penaltyEnforcement(date);
      const loan = await this.getLoanById(loanId);
      if (loan.success && loan.data) {
        const loanData = loan.data;
        const balance = loanData.overallBalance;
        if (amount > Number(balance)) {
          return { success: false, error: "Amount is greater than balance" };
        }
        const principalRepayment = Number(loanData.principalBalance);
        const interestRepayment = Number(loanData.interestBalance);
        const penaltyRepayment = Number(loanData.penaltyBalance);
        const scheduleId = loanData.loanSchedules.filter(
          (schedule) => schedule.status === LoanScheduleStatus.Open
        )[0]?.id;
        let balanceAmount = Number(amount);
        if (penaltyRepayment > 0 && balanceAmount > 0) {
          const penaltyAmount = Math.min(balanceAmount, penaltyRepayment);
          balanceAmount -= penaltyAmount;
          await this.createLoanTransaction({
            loanId: loanData.id,
            scheduleId: scheduleId,
            transactionType: TransactionType.penalty,
            transactionStatus: TransactionStatus.Completed,
            creditAmount: 0,
            debitAmount: penaltyAmount,
            transactionDate: date,
            description: "Penalty repayment",
          });
        }
        if (interestRepayment > 0 && balanceAmount > 0) {
          const interestAmount = Math.min(balanceAmount, interestRepayment);
          balanceAmount -= interestAmount;
          await this.createLoanTransaction({
            loanId: loanData.id,
            scheduleId: scheduleId,
            transactionType: TransactionType.interest,
            transactionStatus: TransactionStatus.Completed,
            creditAmount: 0,
            debitAmount: interestAmount,
            transactionDate: date,
            description: "Interest repayment",
          });
        }
        if (principalRepayment > 0 && balanceAmount > 0) {
          const principalAmount = Math.min(balanceAmount, principalRepayment);
          balanceAmount -= principalAmount;
          await this.createLoanTransaction({
            loanId: loanData.id,
            scheduleId: scheduleId,
            transactionType: TransactionType.principal,
            transactionStatus: TransactionStatus.Completed,
            creditAmount: 0,
            debitAmount: principalAmount,
            transactionDate: date,
            description: "Principal repayment",
          });
        }
        if (loanData) {
          const loan = await this.getLoanById(loanData.id);
          if (loan.success && loan.data) {
            await this.updateClosedSchedules(
              date,
              Number(loan.data?.overallBalance),
              loanData.id
            );
          }
        }
        await revenueService.createRevenue({
          type: RevenueType.Repayment,
          credit: Number(amount),
          debit: 0,
          parentTable: "loan",
          description: "Loan repayment",
          referenceIds: [loanId],
          transactionDate: date,
          buyerId: loanData.buyerId,
        });
        return { success: true, data: { loanId, amount, date } };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  countClosedSchedules(records: RecordItem[]): number {
    return records.filter((r) => r.status === "Closed").length;
  }
  async updateClosedSchedules(
    date: Date,
    balance: number,
    loanId: string
  ): Promise<void> {
    const adjustedBalance = balance - 0.00999;
    const closedSchedules = await prisma.loanSchedule.updateMany({
      where: {
        loanId: loanId, // (loanId = loanId)
        OR: [
          { end: { lte: date } }, // (end <= date)
          { expectedClosingBalance: { gte: adjustedBalance } }, // (expectedBalance >= balance)
        ],
      },
      data: {
        isExecuted: true,
        executedAt: new Date(),
        status: LoanScheduleStatus.Closed,
      },
    });

    return;
  }
  async getLoanTransactionsByScheduleId(scheduleId: string) {
    return await prisma.loanTransaction.findMany({
      where: { scheduleId: scheduleId },
    });
  }

  /**
   * Get loan counts grouped by status
   */
  async getLoanCountsByStatus() {
    try {
      const counts = await prisma.loan.groupBy({
        by: ["loanStatus"],
        _count: {
          loanStatus: true,
        },
        orderBy: {
          loanStatus: "asc",
        },
      });

      // Transform the result into a more readable format
      const countsByStatus = counts.map((item) => ({
        status: item.loanStatus,
        count: item._count.loanStatus,
      }));

      // Calculate total
      const total = countsByStatus.reduce((sum, item) => sum + item.count, 0);

      return {
        success: true,
        data: {
          countsByStatus,
          total,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get total loans created within a date range
   */
  async getLoansCreatedByDateRange(startDate: Date, endDate: Date) {
    try {
      // Validate dates
      if (!startDate || !endDate) {
        throw new Error("Start date and end date are required");
      }

      if (startDate > endDate) {
        throw new Error("Start date must be before or equal to end date");
      }

      const where: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Get total count
      const totalCount = await prisma.loan.count({ where });

      // Get counts grouped by status
      const countsByStatus = await prisma.loan.groupBy({
        by: ["loanStatus"],
        where,
        _count: {
          loanStatus: true,
        },
      });

      // Get loans with basic info
      const loans = await prisma.loan.findMany({
        where,
        select: {
          id: true,
          liftpayId: true,
          loanAmount: true,
          loanStatus: true,
          loanType: true,
          createdAt: true,
          buyer: {
            select: {
              id: true,
              liftpayId: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          merchant: {
            select: {
              id: true,
              liftpayId: true,
              businessName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Calculate total loan amount
      const totalLoanAmount = loans.reduce(
        (sum, loan) => sum + Number(loan.loanAmount),
        0
      );

      return {
        success: true,
        data: {
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          totalCount,
          totalLoanAmount,
          countsByStatus: countsByStatus.map((item) => ({
            status: item.loanStatus,
            count: item._count.loanStatus,
          })),
          loans,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get loans count grouped by day within a date range
   */
  async getLoansCountGroupedByDay(startDate: Date, endDate: Date) {
    try {
      // Validate dates
      if (!startDate || !endDate) {
        throw new Error("Start date and end date are required");
      }

      if (startDate > endDate) {
        throw new Error("Start date must be before or equal to end date");
      }

      // Get all loans in the date range
      const loans = await prisma.loan.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
          loanAmount: true,
        },
      });

      // Create a map to store counts and amounts by date
      const dataByDate = new Map<
        string,
        { count: number; totalAmount: number }
      >();

      // Generate all dates in the range
      const currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);
      const endDateNormalized = new Date(endDate);
      endDateNormalized.setHours(23, 59, 59, 999);

      // Initialize all dates with 0 count and 0 amount
      while (currentDate <= endDateNormalized) {
        const dateKey = currentDate.toISOString().split("T")[0];
        dataByDate.set(dateKey, { count: 0, totalAmount: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count loans and sum amounts for each date
      loans.forEach((loan) => {
        const dateKey = loan.createdAt.toISOString().split("T")[0];
        const currentData = dataByDate.get(dateKey) || {
          count: 0,
          totalAmount: 0,
        };
        dataByDate.set(dateKey, {
          count: currentData.count + 1,
          totalAmount: currentData.totalAmount + Number(loan.loanAmount),
        });
      });

      // Convert map to array
      const countsByDay = Array.from(dataByDate.entries()).map(
        ([date, data]) => ({
          date,
          count: data.count,
          totalAmount: data.totalAmount,
        })
      );

      // Calculate totals
      const totalCount = loans.length;
      const totalLoanAmount = loans.reduce(
        (sum, loan) => sum + Number(loan.loanAmount),
        0
      );

      return {
        success: true,
        data: {
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          totalCount,
          totalLoanAmount,
          countsByDay,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async processLoanRepayment(loanId: string, date: Date) {
    try {
      const reference = generateShortReferenceId();
      const loan = await this.getLoanById(loanId);
      if (!loan.success || !loan.data) {
        return { success: false, error: "Loan not found" };
      }
      const loanData = loan.data;
      const amountDue = loanData.amountDue;

      if (amountDue <= 0) {
        return { success: false, error: "Amount due is less than 0" };
      }
      // get invoiceMandate by invoice id
      const invoiceMandates =
        await invoiceMandateService.getMandatesByInvoiceId(
          loanData.invoiceId as string
        );
      if (!invoiceMandates) {
        return { success: false, error: "Invoice mandates not found" };
      }
      const invoiceMandate = invoiceMandates[0];
      if (!invoiceMandate) {
        return { success: false, error: "Invoice mandate not found" };
      }
      const invoiceMandateData = invoiceMandate;
      // perform debit on the invoice mandate
      const validatedAmount = Math.min(
        amountDue,
        Number(invoiceMandateData.amount)
      );
      const debitResult = await accountDetailsService.debitMonoMandate(
        invoiceMandateData.monoMandateId as string,
        validatedAmount * 100,
        reference,
        `Loan repayment for ${loanData.buyer.firstName} ${loanData.buyer.lastName}-loanId: ${loanData.liftpayId}`
      );

      if (!debitResult.success) {
        return { success: false, error: debitResult.error };
      }

      await this.loanRepayment(loanId, validatedAmount, date);
      return { success: true, data: validatedAmount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async initiateLoanRepayment(loanId: string, amount: number) {
    const reference = generateShortReferenceId();
    try {
      const date = new Date();
      // First, enforce penalties
      const loan = await this.getLoanById(loanId);
      if (loan.success && loan.data) {
        const loanData = loan.data;
        const invoiceId = loanData.invoiceId;
        if (!invoiceId) {
          return { success: false, error: "Invoice ID not found" };
        }
        const invoiceMandates =
          await invoiceMandateService.getMandatesByInvoiceId(invoiceId);

        if (!invoiceMandates || invoiceMandates?.length === 0) {
          throw new Error("Mandate not found");
        }

        const invoiceMandate = invoiceMandates[0];
        const mandateBuyerId = invoiceMandate.buyerId;
        const mandateMonoAccountId = invoiceMandate.monoAccountId;
        const mandateMonoCustomerId = invoiceMandate.monoCustomerId;

        const directPay = await directPayService.initiateMonoDirectPay({
          amount: amount * 100,
          customerId: mandateMonoCustomerId,
          reference: reference,
          account: mandateMonoAccountId,
          redirectUrl: `${process.env.FRONTEND_URL}/buyer/dashboard/direct-pay/loan-repayment`,
          description: `Loan repayment for ${loanData.buyer.firstName} ${loanData.buyer.lastName}-loanId: ${loanData.liftpayId}`,
        });
        if (!directPay.success) {
          throw new Error("Failed to initiate loan repayment");
        }
        // create direct pay
        const createdDirectPay = await directPayService.createDirectPay({
          invoiceId: invoiceId,
          mandateId: invoiceMandate.id,
          amount: amount,
          buyerId: mandateBuyerId,
          monoCustomerId: mandateMonoCustomerId,
          reference: reference,
          monoAccountId: mandateMonoAccountId,
          monoUrl: directPay.data.data.mono_url,
          status: DirectPayStatus.Pending,
          type: DirectPayType.LoanRepayment,
        });
        return { success: true, monoUrl: directPay.data.data.mono_url };

        // perform debit on the invoice mandate
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async validateLoanRepayment(referenceid: string) {
    const directPay = await directPayService.getDirectPayByReference(
      referenceid
    );

    if (!directPay || !directPay.id) {
      return { success: false, error: "Direct pay not found" };
    }
    if (directPay.status === DirectPayStatus.Completed) {
      return { success: true, data: directPay };
    }
    const loan = await this.getLoanByInvoiceId(directPay.invoiceId);
    if (!loan.success || !loan.data) {
      return { success: false, error: "Loan not found" };
    }
    const loanData = loan.data;
    const loanId = loanData.id;
    const amount = Number(directPay.amount);
    const date = new Date();
    const result = await directPayService.verifyMonoDirectPay(referenceid);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    //update direct pay status to completed
    if (result.data.status === "successful") {
      const updatedDirectPay = await directPayService.updateDirectPay(
        directPay.id,
        {
          status: DirectPayStatus.Completed,
        }
      );
      if (!updatedDirectPay) {
        return { success: false, error: "Failed to update direct pay" };
      }

      await this.loanRepayment(loanId, amount, date);
      return { success: true, data: updatedDirectPay };
    } else {
      return { success: false, error: "Failed to validate loan repayment" };
    }
  }
}
export const loanService = new LoanService();
