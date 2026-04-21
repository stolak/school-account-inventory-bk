import axios from "axios";

// ==================== INTERFACES ====================

export interface CreateSourceAccountInput {
  app: string;
  account_number: string;
  bank_code: string;
  email: string;
}

export interface MonoSourceAccountResponse {
  status: "successful" | "failed";
  message: string;
  timestamp: string;
  data: {
    id: string;
    mandate_activation_url: string;
  } | null;
}

export interface DisbursementDistribution {
  reference: string;
  recipient_email: string;
  account: {
    account_number: string;
    bank_code: string;
  };
  amount: number;
  narration: string;
}

export interface CreateDisbursementInput {
  reference: string;
  source: "mandate";
  account: string;
  type: "instant" | string;
  total_amount: number;
  description: string;
  distribution: DisbursementDistribution[];
}

export interface MonoDisbursementResponse {
  status: "successful" | "failed";
  message: string;
  timestamp: string;
  data: {
    id: string;
    reference: string;
    status: string;
  } | null;
}

// ==================== SERVICE ====================

export class DisbursementService {
  /**
   * Create a source account for disbursements
   * This endpoint creates a source account that can be used for disbursements
   */
  async createSourceAccountWithMono(input: CreateSourceAccountInput) {
    try {
      const url =
        "https://api.withmono.com/v3/payments/disburse/source-accounts";

      const response = await axios.post<MonoSourceAccountResponse>(
        url,
        {
          app: input.app,
          account_number: input.account_number,
          bank_code: input.bank_code,
          email: input.email,
        },
        {
          headers: {
            "mono-sec-key": process.env.MONO_SECRET_KEY!,
            accept: "application/json",
            "content-type": "application/json",
          },
        }
      );

      // Check if the response indicates failure
      if (response.data.status === "failed") {
        return {
          success: false,
          error: response.data.message || "Failed to create source account",
          data: response.data,
        };
      }

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data ||
          error.message,
        data: error.response?.data || null,
      };
    }
  }

  /**
   * Create a disbursement
   * This endpoint creates a disbursement to multiple recipients from a source account
   */
  async createDisbursementWithMono(input: CreateDisbursementInput) {
    try {
      const url = "https://api.withmono.com/v3/payments/disburse/disbursements";

      const response = await axios.post<MonoDisbursementResponse>(
        url,
        {
          reference: input.reference,
          source: input.source,
          account: input.account,
          type: input.type,
          total_amount: input.total_amount,
          description: input.description,
          distribution: input.distribution,
        },
        {
          headers: {
            "mono-sec-key": process.env.MONO_SECRET_KEY!,
            accept: "application/json",
            "content-type": "application/json",
          },
        }
      );

      // Check if the response indicates failure
      if (response.data.status === "failed") {
        return {
          success: false,
          error: response.data.message || "Failed to create disbursement",
          data: response.data,
        };
      }

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data ||
          error.message,
        data: error.response?.data || null,
      };
    }
  }
}

export const disbursementService = new DisbursementService();
