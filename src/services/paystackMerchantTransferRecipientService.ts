import prisma from "../utils/prisma";
import { paystackService } from "./paystackService";

// ==================== INTERFACES ====================

export interface CreatePaystackMerchantTransferRecipientInput {
  merchantId: string;
  recipientId?: string;
  recipientCode: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface UpdatePaystackMerchantTransferRecipientInput {
  recipientId?: string;
  recipientCode?: string;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

const paystackMerchantTransferRecipientSelect = {
  id: true,
  merchantId: true,
  recipientId: true,
  recipientCode: true,
  bankCode: true,
  bankName: true,
  accountNumber: true,
  accountName: true,
  createdAt: true,
  updatedAt: true,
  merchant: {
    select: {
      id: true,
      liftpayId: true,
      businessName: true,
      businessEmail: true,
    },
  },
} as const;

// ==================== PAYSTACK MERCHANT TRANSFER RECIPIENT SERVICE ====================

export class PaystackMerchantTransferRecipientService {
  /**
   * Get existing Paystack merchant transfer recipient by merchantId + accountNumber + bankCode,
   * or create it on Paystack and persist locally if it doesn't exist.
   */
  async getOrCreatePaystackMerchantTransferRecipient(
    merchantId: string,
    accountNumber: string,
    bankCode: string
  ) {
    try {
      // Check if merchant exists
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant) {
        return { success: false, error: "Merchant not found" };
      }

      // Check if recipient already exists for this merchant + account
      const existingRecipient =
        await prisma.paystackMerchantTransferRecipient.findFirst({
          where: {
            merchantId,
            accountNumber,
            bankCode,
          },
          select: paystackMerchantTransferRecipientSelect,
        });

      if (existingRecipient) {
        return {
          success: true,
          data: existingRecipient,
          message: "Recipient already exists",
        };
      }

      // Resolve account name (Paystack bank resolve)
      const resolved = await paystackService.validateAccountNumber(
        accountNumber,
        bankCode
      );

      if (!resolved.status) {
        return {
          success: false,
          error: resolved.message || "Failed to resolve account number",
        };
      }

      // Best-effort fetch bank name from Paystack bank list
      let bankName = bankCode;
      try {
        const banks = await paystackService.getBanks();
        const found = banks.data?.find((b) => b.code === bankCode);
        if (found?.name) bankName = found.name;
      } catch {
        // ignore - fallback to bankCode
      }

      // Create transfer recipient on Paystack
      const paystackRecipient = await paystackService.createTransferRecipient({
        type: "nuban",
        name: resolved.data.account_name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      });

      if (!paystackRecipient.status) {
        return {
          success: false,
          error: paystackRecipient.message || "Failed to create transfer recipient",
        };
      }

      const created = await prisma.paystackMerchantTransferRecipient.create({
        data: {
          merchantId,
          recipientId: String(paystackRecipient.data.id),
          recipientCode: paystackRecipient.data.recipient_code,
          bankCode,
          bankName: paystackRecipient.data.details?.bank_name || bankName,
          accountNumber,
          accountName:
            paystackRecipient.data.details?.account_name ||
            resolved.data.account_name,
        },
        select: paystackMerchantTransferRecipientSelect,
      });

      return { success: true, data: created };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new Paystack merchant transfer recipient
   */
  async createPaystackMerchantTransferRecipient(
    input: CreatePaystackMerchantTransferRecipientInput
  ) {
    try {
      // Check if merchant exists
      const merchant = await prisma.merchant.findUnique({
        where: { id: input.merchantId },
      });

      if (!merchant) {
        throw new Error("Merchant not found");
      }

      // Check if recipient code already exists
      const existingRecipient = await prisma.paystackMerchantTransferRecipient.findUnique({
        where: { recipientCode: input.recipientCode },
      });

      if (existingRecipient) {
        throw new Error("Recipient code already exists");
      }

      const recipient = await prisma.paystackMerchantTransferRecipient.create({
        data: {
          merchantId: input.merchantId,
          recipientId: input.recipientId,
          recipientCode: input.recipientCode,
          bankCode: input.bankCode,
          bankName: input.bankName,
          accountNumber: input.accountNumber,
          accountName: input.accountName,
        },
        select: paystackMerchantTransferRecipientSelect,
      });

      return { success: true, data: recipient };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all Paystack merchant transfer recipients
   */
  async getAllPaystackMerchantTransferRecipients(merchantId?: string) {
    try {
      const where = merchantId ? { merchantId } : {};

      const recipients = await prisma.paystackMerchantTransferRecipient.findMany({
        where,
        select: paystackMerchantTransferRecipientSelect,
        orderBy: {
          createdAt: "desc",
        },
      });

      return { success: true, data: recipients };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Paystack merchant transfer recipient by ID
   */
  async getPaystackMerchantTransferRecipientById(id: string) {
    try {
      const recipient = await prisma.paystackMerchantTransferRecipient.findUnique({
        where: { id },
        select: paystackMerchantTransferRecipientSelect,
      });

      if (!recipient) {
        return { success: false, error: "Recipient not found" };
      }

      return { success: true, data: recipient };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Paystack merchant transfer recipient by recipient code
   */
  async getPaystackMerchantTransferRecipientByCode(recipientCode: string) {
    try {
      const recipient = await prisma.paystackMerchantTransferRecipient.findUnique({
        where: { recipientCode },
        select: paystackMerchantTransferRecipientSelect,
      });

      if (!recipient) {
        return { success: false, error: "Recipient not found" };
      }

      return { success: true, data: recipient };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Paystack merchant transfer recipients by merchant ID
   */
  async getPaystackMerchantTransferRecipientsByMerchantId(merchantId: string) {
    try {
      // Check if merchant exists
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant) {
        return { success: false, error: "Merchant not found" };
      }
      const recipients = await prisma.paystackMerchantTransferRecipient.findMany({
        where: { merchantId },
        select: paystackMerchantTransferRecipientSelect,
        orderBy: {
          createdAt: "desc",
        },
      });

      return { success: true, data: recipients };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update Paystack merchant transfer recipient
   */
  async updatePaystackMerchantTransferRecipient(
    id: string,
    input: UpdatePaystackMerchantTransferRecipientInput
  ) {
    try {
      // Check if recipient exists
      const existingRecipient = await prisma.paystackMerchantTransferRecipient.findUnique({
        where: { id },
      });

      if (!existingRecipient) {
        return { success: false, error: "Recipient not found" };
      }

      // If recipientCode is being updated, check if new code already exists
      if (input.recipientCode && input.recipientCode !== existingRecipient.recipientCode) {
        const codeExists = await prisma.paystackMerchantTransferRecipient.findUnique({
          where: { recipientCode: input.recipientCode },
        });

        if (codeExists) {
          return { success: false, error: "Recipient code already exists" };
        }
      }

      const recipient = await prisma.paystackMerchantTransferRecipient.update({
        where: { id },
        data: input,
        select: paystackMerchantTransferRecipientSelect,
      });

      return { success: true, data: recipient };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete Paystack merchant transfer recipient
   */
  async deletePaystackMerchantTransferRecipient(id: string) {
    try {
      const recipient = await prisma.paystackMerchantTransferRecipient.findUnique({
        where: { id },
      });

      if (!recipient) {
        return { success: false, error: "Recipient not found" };
      }

      await prisma.paystackMerchantTransferRecipient.delete({
        where: { id },
      });

      return { success: true, message: "Recipient deleted successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const paystackMerchantTransferRecipientService =
  new PaystackMerchantTransferRecipientService();

