import axios from "axios";

const PAYSTACK_API_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_SECRET_KEY_FOR_BANK = process.env.PAYSTACK_SECRET_KEY_FOR_BANK;

// ==================== INTERFACES ====================

export interface CreateTransferRecipientInput {
  type: "nuban" | "mobile_money" | "basa";
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
  description?: string;
  email?: string;
}

export interface TransferRecipientDetails {
  authorization_code: string | null;
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_name: string;
}

export interface TransferRecipientData {
  active: boolean;
  createdAt: string;
  currency: string;
  domain: string;
  id: number;
  integration: number;
  name: string;
  recipient_code: string;
  type: string;
  updatedAt: string;
  is_deleted: boolean;
  details: TransferRecipientDetails;
}

export interface CreateTransferRecipientResponse {
  status: boolean;
  message: string;
  data: TransferRecipientData;
}

export interface InitiateTransferInput {
  source: string;
  amount: number;
  recipient: string;
  reference: string;
  reason?: string;
  currency?: string;
}

export interface TransferData {
  transfersessionid: any[];
  transfertrials: any[];
  domain: string;
  amount: number;
  currency: string;
  reference: string;
  source: string;
  source_details: any | null;
  reason: string;
  status: string;
  failures: any | null;
  transfer_code: string;
  titan_code: string | null;
  transferred_at: string | null;
  id: number;
  integration: number;
  request: number;
  recipient: number;
  createdAt: string;
  updatedAt: string;
}

export interface InitiateTransferResponse {
  status: boolean;
  message: string;
  data: TransferData;
}

export interface VerifyTransferRecipientDetails {
  authorization_code: string | null;
  account_number: string;
  account_name: string | null;
  bank_code: string;
  bank_name: string;
}

export interface VerifyTransferRecipient {
  active: boolean;
  createdAt: string;
  currency: string;
  description: string;
  email: string | null;
  id: number;
  integration: number;
  metadata: any | null;
  name: string;
  recipient_code: string;
  type: string;
  updatedAt: string;
  is_deleted: boolean;
  isDeleted: boolean;
  details: VerifyTransferRecipientDetails;
}

export interface TransferSession {
  provider: string | null;
  id: string | null;
}

export interface VerifyTransferData {
  amount: number;
  createdAt: string;
  currency: string;
  domain: string;
  failures: any | null;
  id: number;
  integration: number;
  reason: string;
  reference: string;
  source: string;
  source_details: any | null;
  status: string;
  titan_code: string | null;
  transfer_code: string;
  request: number;
  transferred_at: string | null;
  updatedAt: string;
  recipient: VerifyTransferRecipient;
  session: TransferSession;
  fee_charged: number;
  fees_breakdown: any | null;
  gateway_response: any | null;
}

export interface VerifyTransferResponse {
  status: boolean;
  message: string;
  data: VerifyTransferData;
}

export interface BulkTransferItem {
  amount: number;
  reference: string;
  reason: string;
  recipient: string;
}

export interface InitiateBulkTransferInput {
  currency: string;
  source: string;
  transfers: BulkTransferItem[];
}

export interface BulkTransferResult {
  reference: string;
  recipient: string;
  amount: number;
  transfer_code: string;
  currency: string;
  status: string;
}

export interface InitiateBulkTransferResponse {
  status: boolean;
  message: string;
  data: BulkTransferResult[];
}

export interface ResolvedAccountData {
  account_number: string;
  account_name: string;
}

export interface ValidateAccountNumberResponse {
  status: boolean;
  message: string;
  data: ResolvedAccountData;
}

export interface BankData {
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface BanksMeta {
  next: string | null;
  previous: string | null;
  perPage: number;
}

export interface GetBanksResponse {
  status: boolean;
  message: string;
  data: BankData[];
  meta: BanksMeta;
}

// ==================== PAYSTACK SERVICE ====================

export class PaystackService {
  private baseUrl: string;
  private secretKey: string | undefined;
  private secretKeyForBank: string | undefined;

  constructor() {
    this.baseUrl = PAYSTACK_API_BASE_URL;
    this.secretKey = PAYSTACK_SECRET_KEY;
    this.secretKeyForBank = PAYSTACK_SECRET_KEY_FOR_BANK;
  }

  /**
   * Create a transfer recipient
   * @param input - Transfer recipient details
   * @returns Transfer recipient response from Paystack
   */
  async createTransferRecipient(
    input: CreateTransferRecipientInput
  ): Promise<CreateTransferRecipientResponse> {
    if (!this.secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not set in environment variables");
    }

    try {
      const response = await axios.post<CreateTransferRecipientResponse>(
        `${this.baseUrl}/transferrecipient`,
        {
          type: input.type,
          name: input.name,
          account_number: input.account_number,
          bank_code: input.bank_code,
          currency: input.currency,
          ...(input.description && { description: input.description }),
          ...(input.email && { email: input.email }),
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to create transfer recipient";
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Initiate a transfer
   * @param input - Transfer details
   * @returns Transfer response from Paystack
   */
  async initiateTransfer(
    input: InitiateTransferInput
  ): Promise<InitiateTransferResponse> {
    if (!this.secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not set in environment variables");
    }
console.log(input);
    try {
      const response = await axios.post<InitiateTransferResponse>(
        `${this.baseUrl}/transfer`,
        {
          source: input.source,
          amount: input.amount,
          recipient: input.recipient,
          reference: input.reference,
          ...(input.reason && { reason: input.reason }),
          ...(input.currency && { currency: input.currency }),
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to initiate transfer";
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Verify a transfer by reference
   * @param reference - Transfer reference to verify
   * @returns Verified transfer response from Paystack
   */
  async verifyTransfer(reference: string): Promise<VerifyTransferResponse> {
    if (!this.secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not set in environment variables");
    }

    if (!reference) {
      throw new Error("Transfer reference is required");
    }

    try {
      const response = await axios.get<VerifyTransferResponse>(
        `${this.baseUrl}/transfer/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to verify transfer";
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Initiate bulk transfers
   * @param input - Bulk transfer details
   * @returns Bulk transfer response from Paystack
   */
  async initiateBulkTransfer(
    input: InitiateBulkTransferInput
  ): Promise<InitiateBulkTransferResponse> {
    if (!this.secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not set in environment variables");
    }

    if (!input.transfers || input.transfers.length === 0) {
      throw new Error("At least one transfer is required");
    }

    try {
      const response = await axios.post<InitiateBulkTransferResponse>(
        `${this.baseUrl}/transfer/bulk`,
        {
          currency: input.currency,
          source: input.source,
          transfers: input.transfers,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to initiate bulk transfer";
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Validate/Resolve account number
   * @param accountNumber - Bank account number to validate
   * @param bankCode - Bank code
   * @returns Resolved account details from Paystack
   */
  async validateAccountNumber(
    accountNumber: string,
    bankCode: string
  ): Promise<ValidateAccountNumberResponse> {
    if (!this.secretKeyForBank) {
      throw new Error("PAYSTACK_SECRET_KEY is not set in environment variables");
    }

    if (!accountNumber) {
      throw new Error("Account number is required");
    }

    if (!bankCode) {
      throw new Error("Bank code is required");
    }
    // console.log(accountNumber, bankCode);

    try {
      const response = await axios.get<ValidateAccountNumberResponse>(
        `${this.baseUrl}/bank/resolve`,
        {
          params: {
            account_number: accountNumber,
            bank_code: bankCode,
          },
          headers: {
            Authorization: `Bearer ${this.secretKeyForBank}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to validate account number";
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get list of banks with codes
   * @param queryParams - Optional query parameters (currency, country, type, perPage, page)
   * @returns List of banks from Paystack
   */
  async getBanks(queryParams?: {
    currency?: string;
    country?: string;
    type?: string;
    perPage?: number;
    page?: number;
  }): Promise<GetBanksResponse> {
    if (!this.secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not set in environment variables");
    }

    try {
      const response = await axios.get<GetBanksResponse>(
        `${this.baseUrl}/bank`,
        {
          params: queryParams || {},
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to get banks";
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

export const paystackService = new PaystackService();

