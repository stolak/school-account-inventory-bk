import { MandateStatus, DirectPayStatus } from "@prisma/client";
import prisma from "../utils/prisma";
import { directPayService } from "./directPayService";
import { invoiceService } from "./invoiceService";

export interface PostTransactionValidationResult {
  success: boolean;
  data?: {
    invoiceId: string;
    mandate?: {
      id: string;
      referenceId: string | null;
      status: MandateStatus | string;
    };
    directPay?: {
      id: string;
      reference: string;
      status: DirectPayStatus | string;
    };
  };
  message?: string;
}

export class PostTransactionValidationService {
  /**
   * Validate post-transaction state for an invoice:
   * 1) Check latest mandate status (if any)
   * 2) If mandate is approved, check latest direct pay
   * 3) If latest direct pay is Pending, verify with Mono and update
   * 4) Return current statuses
   */
  async validateInvoicePostTransaction(
    invoiceId: string
  ): Promise<PostTransactionValidationResult> {
    try {
      // Ensure invoice exists
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: { id: true },
      });
      if (!invoice) {
        return { success: false, message: "Invoice not found" };
      }

      // Get latest mandate for invoice
      const latestMandate = await prisma.invoiceMandate.findFirst({
        where: { invoiceId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          referenceId: true,
          status: true,
        },
      });

      // Prepare result shell
      const result: PostTransactionValidationResult = {
        success: true,
        data: {
          invoiceId,
          mandate: latestMandate
            ? {
                id: latestMandate.id,
                referenceId: latestMandate.referenceId,
                status: latestMandate.status || "Unknown",
              }
            : undefined,
          directPay: undefined,
        },
      };

      // If no mandate, return early
      if (!latestMandate) {
        result.message = "No mandate found for this invoice";
        return result;
      }

      // If mandate is pending in DB, verify with Mono before judgement
      if (
        latestMandate.status &&
        String(latestMandate.status).toLowerCase() === "pending"
      ) {
        // This will call Mono and may update the mandate status
        await invoiceService.validateMandate({
          invoiceId,
          referenceId: undefined,
        } as any);
        // Re-fetch mandate after validation
        const refreshedMandate = await prisma.invoiceMandate.findFirst({
          where: { invoiceId },
          orderBy: { createdAt: "desc" },
          select: { id: true, referenceId: true, status: true },
        });
        result.data!.mandate = refreshedMandate
          ? {
              id: refreshedMandate.id,
              referenceId: refreshedMandate.referenceId,
              status: refreshedMandate.status || "Unknown",
            }
          : result.data!.mandate;
      }

      // Determine approval after possible refresh
      const currentMandateStatus =
        result.data!.mandate?.status || latestMandate.status || "Unknown";
      const mandateApproved =
        currentMandateStatus &&
        (String(currentMandateStatus).toLowerCase() === "approved"||String(currentMandateStatus).toLowerCase() === "active");

      if (!mandateApproved) {
   
        // Not approved yet; just return mandate status
        result.message = "Mandate is not approved yet";
        return result;
      }

      // Find latest direct pay for invoice
      const latestDirectPay = await prisma.directPay.findFirst({
        where: { invoiceId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reference: true,
          status: true,
        },
      });

      if (!latestDirectPay) {
        result.message = "No direct pay found for this invoice";
        return result;
      }

      // If latest direct pay is Pending, verify with Mono and update
      if (latestDirectPay.status === DirectPayStatus.Pending) {
        if (latestDirectPay.reference) {
         const latest= await directPayService.verifyMonoDirectPay(latestDirectPay.reference);
          // update direct pay status to completed if successful
          if ( latest.success && result.data  && latest.data.status === "successful") {
            await directPayService.updateDirectPay(latestDirectPay.id, {
              status: DirectPayStatus.Completed,
            });
            // implement   finalizeAfterUpfrontAndMandate(mandateId: string) {
            await invoiceService.finalizeAfterUpfrontAndMandate(latestMandate.id);
          }

        }
        // Re-fetch latest direct pay after potential update
        const refreshed = await prisma.directPay.findUnique({
          where: { id: latestDirectPay.id },
          select: { id: true, reference: true, status: true },
        });
        result.data!.directPay = {
          id: refreshed?.id || latestDirectPay.id,
          reference: refreshed?.reference || latestDirectPay.reference,
          status: refreshed?.status || latestDirectPay.status,
        };
        result.message = "Direct pay verified";
        return result;
      }

      // Otherwise just return current direct pay status
      result.data!.directPay = {
        id: latestDirectPay.id,
        reference: latestDirectPay.reference,
        status: latestDirectPay.status,
      };
      result.message = "Mandate and direct pay status returned";
      return result;
    } catch (error: any) {
      return { success: false, message: error.message || "Validation failed" };
    }
  }
}

export const postTransactionValidationService =
  new PostTransactionValidationService();

