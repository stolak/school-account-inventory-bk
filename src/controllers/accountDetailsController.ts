import { Request, Response } from "express";
import {
  accountDetailsService,
  CreateMonoCustomerInput,
  UpdateMonoCustomerInput,
} from "../services/accountDetailsService";
import { analyzeBankStatement } from "../services/bankStatementAnalysisService";

export class AccountDetailsController {
  /**
   * Create a new AccountDetails record
   */
  async create(req: Request, res: Response) {
    try {
      const {
        accountId,
        buyerId,
        bankStatement,
        employmentType,
        monthlyIncome,
        overdraft,
        existingLoanRepayment,
        creditHistory,
        employmentDuration,
        averageBalance,
      } = req.body;

      if (!buyerId) {
        return res.status(400).json({
          success: false,
          message: "buyerId is required",
        });
      }

      const result = await accountDetailsService.createAccountDetails({
        accountId,
        buyerId,
        bankStatement,
        employmentType,
        monthlyIncome,
        overdraft,
        existingLoanRepayment,
        creditHistory,
        employmentDuration,
        averageBalance,
      });

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get AccountDetails by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const result = await accountDetailsService.getAccountDetailsById(
        req.params.id
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get AccountDetails by buyerId
   */
  async getByBuyerId(req: Request, res: Response) {
    try {
      const result = await accountDetailsService.getAccountDetailsByBuyerId(
        req.params.buyerId
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get latest AccountDetails by buyerId
   */
  async getLatestByBuyerId(req: Request, res: Response) {
    try {
      const result =
        await accountDetailsService.getLatestAccountDetailsByBuyerId(
          req.params.buyerId
        );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get AccountDetails by accountId
   */
  async getByAccountId(req: Request, res: Response) {
    try {
      const result = await accountDetailsService.getAccountDetailsByAccountId(
        req.params.accountId
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get all AccountDetails records with filters
   */
  async list(req: Request, res: Response) {
    try {
      const result = await accountDetailsService.getAllAccountDetails({
        buyerId: req.query.buyerId as string,
        employmentType: req.query.employmentType as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      });

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update AccountDetails record
   */
  async update(req: Request, res: Response) {
    try {
      const {
        accountId,
        bankStatement,
        employmentType,
        monthlyIncome,
        overdraft,
        existingLoanRepayment,
        creditHistory,
        employmentDuration,
        averageBalance,
      } = req.body;

      const updateData: any = {};
      if (accountId !== undefined) updateData.accountId = accountId;
      if (bankStatement !== undefined) updateData.bankStatement = bankStatement;
      if (employmentType !== undefined)
        updateData.employmentType = employmentType;
      if (monthlyIncome !== undefined) updateData.monthlyIncome = monthlyIncome;
      if (overdraft !== undefined) updateData.overdraft = overdraft;
      if (existingLoanRepayment !== undefined)
        updateData.existingLoanRepayment = existingLoanRepayment;
      if (creditHistory !== undefined) updateData.creditHistory = creditHistory;
      if (employmentDuration !== undefined)
        updateData.employmentDuration = employmentDuration;
      if (averageBalance !== undefined)
        updateData.averageBalance = averageBalance;

      const result = await accountDetailsService.updateAccountDetails(
        req.params.id,
        updateData
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Delete AccountDetails record
   */
  async delete(req: Request, res: Response) {
    try {
      const result = await accountDetailsService.deleteAccountDetails(
        req.params.id
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Upsert AccountDetails - Create or update
   */
  async upsert(req: Request, res: Response) {
    try {
      const {
        accountId,
        buyerId,
        bankStatement,
        employmentType,
        monthlyIncome,
        overdraft,
        existingLoanRepayment,
        creditHistory,
        employmentDuration,
        averageBalance,
      } = req.body;

      if (!buyerId) {
        return res.status(400).json({
          success: false,
          message: "buyerId is required",
        });
      }

      const result = await accountDetailsService.upsertAccountDetails({
        accountId,
        buyerId,
        bankStatement,
        employmentType,
        monthlyIncome,
        overdraft,
        existingLoanRepayment,
        creditHistory,
        employmentDuration,
        averageBalance,
      });

      if (result.success) {
        return res.status(result.isNew ? 201 : 200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Exchange Mono code for account access
   */
  async exchangeMonoCode(req: Request, res: Response) {
    try {
      const { code, buyerId } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: "code is required",
        });
      }

      if (!buyerId) {
        return res.status(400).json({
          success: false,
          message: "buyerId is required",
        });
      }

      const result = await accountDetailsService.exchangeMonoCode(
        code,
        buyerId
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get Mono account details by account ID
   */
  async getMonoAccountById(req: Request, res: Response) {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "accountId is required",
        });
      }

      const result = await accountDetailsService.getMonoAccountById(accountId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMonoAccountByBuyerId(req: Request, res: Response) {
    try {
      const { buyerId } = req.params;

      if (!buyerId) {
        return res.status(400).json({
          success: false,
          message: "buyerId is required",
        });
      }
      const result = await accountDetailsService.getMonoAccountsByBuyerId(buyerId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get all Mono accounts
   */
  async getMonoAccounts(req: Request, res: Response) {
    try {
      const result = await accountDetailsService.getMonoAccounts();

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get account statement from Mono API
   */
  async getStatement(req: Request, res: Response) {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "accountId is required",
        });
      }

      const result = await accountDetailsService.getStatement(accountId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Create variable mandate for Mono debit
   */
  async createVariableMandate(req: Request, res: Response) {
    try {
      const { customerId, maxAmount, startDate, reference } = req.body;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "customerId is required",
        });
      }

      if (!maxAmount || maxAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "maxAmount is required and must be greater than 0",
        });
      }

      if (!reference) {
        return res.status(400).json({
          success: false,
          message: "reference is required",
        });
      }

      if (!startDate) {
        return res.status(400).json({
          success: false,
          message: "startDate is required",
        });
      }

      const result = await accountDetailsService.createVariableMandate(
        customerId,
        maxAmount,
        startDate,
        reference
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Analyze bank statement using OpenAI
   */
  async analyzeBankStatement(req: Request, res: Response) {
    try {
      const { data } = req.body;

      if (!data) {
        return res.status(400).json({
          success: false,
          message:
            "data is required and must be an array of transaction records",
        });
      }

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: "data must be a non-empty array",
        });
      }

      const result = await analyzeBankStatement(data);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ==================== MONO CUSTOMER CRUD OPERATIONS ====================

  /**
   * Create a new Mono customer
   */
  async createMonoCustomer(req: Request, res: Response) {
    try {
      const input: CreateMonoCustomerInput = req.body;

      if (!input.identity || !input.identity.type || !input.identity.number) {
        return res.status(400).json({
          success: false,
          message: "identity with type and number is required",
        });
      }

      if (!input.email) {
        return res.status(400).json({
          success: false,
          message: "email is required",
        });
      }

      if (!input.type) {
        return res.status(400).json({
          success: false,
          message: "type is required",
        });
      }

      if (!input.first_name) {
        return res.status(400).json({
          success: false,
          message: "first_name is required",
        });
      }

      if (!input.last_name) {
        return res.status(400).json({
          success: false,
          message: "last_name is required",
        });
      }

      if (!input.phone) {
        return res.status(400).json({
          success: false,
          message: "phone is required",
        });
      }

      const result = await accountDetailsService.createMonoCustomer(input);

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get Mono customer by ID
   */
  async getMonoCustomerById(req: Request, res: Response) {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "customerId is required",
        });
      }

      const result = await accountDetailsService.getMonoCustomerById(
        customerId
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get all Mono customers
   */
  async getAllMonoCustomers(req: Request, res: Response) {
    try {
      const result = await accountDetailsService.getAllMonoCustomers();

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update Mono customer by ID
   */
  async updateMonoCustomer(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const input: UpdateMonoCustomerInput = req.body;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "customerId is required",
        });
      }

      const result = await accountDetailsService.updateMonoCustomer(
        customerId,
        input
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Delete Mono customer by ID
   */
  async deleteMonoCustomer(req: Request, res: Response) {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "customerId is required",
        });
      }

      const result = await accountDetailsService.deleteMonoCustomer(customerId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Validate and create account details from Mono account
   */
  async validateAndCreateAccount(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const { buyerId } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "accountId is required in URL parameters",
        });
      }

      if (!buyerId) {
        return res.status(400).json({
          success: false,
          message: "buyerId is required in request body",
        });
      }

      const result = await accountDetailsService.validateAndCreateAccount(
        accountId,
        buyerId
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get Mono mandate by ID
   */
  async getMonoMandateById(req: Request, res: Response) {
    try {
      const { mandateId } = req.params;

      if (!mandateId) {
        return res.status(400).json({
          success: false,
          message: "mandateId is required",
        });
      }

      const result = await accountDetailsService.getMonoMandateById(mandateId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Cancel Mono mandate by ID
   */
  async cancelMonoMandate(req: Request, res: Response) {
    try {
      const { mandateId } = req.params;

      if (!mandateId) {
        return res.status(400).json({
          success: false,
          message: "mandateId is required",
        });
      }

      const result = await accountDetailsService.cancelMonoMandate(mandateId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Debit Mono mandate by ID
   */
  async debitMonoMandate(req: Request, res: Response) {
    try {
      const { mandateId } = req.params;
      const { amount, reference, narration } = req.body;

      if (!mandateId) {
        return res.status(400).json({
          success: false,
          message: "mandateId is required",
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "amount is required and must be greater than 0",
        });
      }

      if (!reference) {
        return res.status(400).json({
          success: false,
          message: "reference is required",
        });
      }

      if (!narration) {
        return res.status(400).json({
          success: false,
          message: "narration is required",
        });
      }

      const result = await accountDetailsService.debitMonoMandate(
        mandateId,
        amount,
        reference,
        narration
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Set account details status to false by buyerId
   */
  async setStatusToFalseByBuyerId(req: Request, res: Response) {
    try {
      const { buyerId } = req.params;

      if (!buyerId) {
        return res.status(400).json({
          success: false,
          message: "buyerId is required",
        });
      }

      const result =
        await accountDetailsService.setAccountDetailsStatusToFalseByBuyerId(
          buyerId
        );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Unlink buyer from account details (sets active records status=false)
   */
  async unlinkBuyerFromAccountDetails(req: Request, res: Response) {
    try {
      const { buyerId } = req.params;

      if (!buyerId) {
        return res.status(400).json({
          success: false,
          message: "buyerId is required",
        });
      }

      const result = await accountDetailsService.unlinkBuyerFromAccountDetails(
        buyerId
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get total number of accounts associated with buyer in the last 6 months
   */
  async getTotalAccountsAssociatedWithBuyerLastSixMonths(
    req: Request,
    res: Response
  ) {
    try {
      const { buyerId } = req.params;

      if (!buyerId) {
        return res.status(400).json({
          success: false,
          message: "buyerId is required",
        });
      }

      const result =
        await accountDetailsService.getTotalAccountsAssociatedWithBuyerLastSixMonths(
          buyerId
        );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export const accountDetailsController = new AccountDetailsController();
