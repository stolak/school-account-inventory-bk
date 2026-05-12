import { Request, Response } from "express";
import { accountTransactionService } from "../services/accountTransactionService";

/**
 * @openapi
 * /api/v1/account-transactions/debit:
 *   post:
 *     summary: Post a debit entry
 *     description: Creates one debit transaction. groupId/headId/subheadId/accountCode are derived from accountId.
 *     tags: [AccountTransactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountId, amount, ref, manualRef, transactionDate, postedBy]
 *             properties:
 *               accountId: { type: string }
 *               amount: { type: number, minimum: 0.01 }
 *               ref: { type: string }
 *               manualRef: { type: string }
 *               transactionDate: { type: string, format: date-time }
 *               postedBy: { type: string }
 *               projectId: { type: string, nullable: true }
 *               accountSub: { type: string, nullable: true }
 *     responses:
 *       201: { description: Debit posted }
 *       400: { description: Validation error }
 *       404: { description: accountId/projectId not found }
 *       500: { description: Server error }
 *
 * /api/v1/account-transactions/credit:
 *   post:
 *     summary: Post a credit entry
 *     description: Creates one credit transaction. groupId/headId/subheadId/accountCode are derived from accountId.
 *     tags: [AccountTransactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountId, amount, ref, manualRef, transactionDate, postedBy]
 *             properties:
 *               accountId: { type: string }
 *               amount: { type: number, minimum: 0.01 }
 *               ref: { type: string }
 *               manualRef: { type: string }
 *               transactionDate: { type: string, format: date-time }
 *               postedBy: { type: string }
 *               projectId: { type: string, nullable: true }
 *               accountSub: { type: string, nullable: true }
 *     responses:
 *       201: { description: Credit posted }
 *       400: { description: Validation error }
 *       404: { description: accountId/projectId not found }
 *       500: { description: Server error }
 *
 * /api/v1/account-transactions/rollback/{ref}:
 *   delete:
 *     summary: Roll back transactions by reference
 *     description: Deletes all transaction rows where `ref` equals the path parameter.
 *     tags: [AccountTransactions]
 *     parameters:
 *       - in: path
 *         name: ref
 *         required: true
 *         schema: { type: string }
 *         description: Reference value used when posting entries
 *     responses:
 *       200:
 *         description: Rollback completed
 *       400:
 *         description: Invalid ref
 *       500:
 *         description: Server error
 */
export const accountTransactionController = {
  debitAccount: async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const postedByRaw = body.postedBy ?? body.postedB;
      const amount =
        typeof body.amount === "number"
          ? body.amount
          : typeof body.amount === "string"
            ? Number.parseFloat(body.amount)
            : Number.NaN;

      const created = await accountTransactionService.debitAccount({
        accountId: String(body.accountId ?? ""),
        amount,
        ref: String(body.ref ?? ""),
        manualRef: String(body.manualRef ?? ""),
        transactionDate: String(body.transactionDate ?? ""),
        postedBy: String(postedByRaw ?? ""),
        remarks: String(body.remarks ?? ""),
        ...(body.projectId !== undefined ? { projectId: String(body.projectId) } : {}),
        ...(body.accountSub !== undefined ? { accountSub: String(body.accountSub) } : {}),
      });

      return res.status(201).json({
        success: true,
        message: "Debit posted successfully",
        data: created,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("not found") || message.includes("Account not found")) {
        return res.status(404).json({ success: false, message });
      }
      if (
        message.includes("required") ||
        message.includes("must be") ||
        message.includes("cannot be")
      ) {
        return res.status(400).json({ success: false, message });
      }
      console.error("Error posting debit:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to post debit",
        error: message,
      });
    }
  },

  creditAccount: async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const postedByRaw = body.postedBy ?? body.postedB;
      const amount =
        typeof body.amount === "number"
          ? body.amount
          : typeof body.amount === "string"
            ? Number.parseFloat(body.amount)
            : Number.NaN;

      const created = await accountTransactionService.creditAccount({
        accountId: String(body.accountId ?? ""),
        amount,
        ref: String(body.ref ?? ""),
        manualRef: String(body.manualRef ?? ""),
        transactionDate: String(body.transactionDate ?? ""),
        postedBy: String(postedByRaw ?? ""),
        remarks: String(body.remarks ?? ""),
        ...(body.projectId !== undefined ? { projectId: String(body.projectId) } : {}),
        ...(body.accountSub !== undefined ? { accountSub: String(body.accountSub) } : {}),
      });

      return res.status(201).json({
        success: true,
        message: "Credit posted successfully",
        data: created,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("not found") || message.includes("Account not found")) {
        return res.status(404).json({ success: false, message });
      }
      if (
        message.includes("required") ||
        message.includes("must be") ||
        message.includes("cannot be")
      ) {
        return res.status(400).json({ success: false, message });
      }
      console.error("Error posting credit:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to post credit",
        error: message,
      });
    }
  },

  rollBack: async (req: Request, res: Response) => {
    try {
      const ref = typeof req.params.ref === "string" ? req.params.ref : "";
      if (!ref.trim()) {
        return res.status(400).json({ success: false, message: "ref is required" });
      }

      const result = await accountTransactionService.rollBack(ref);
      return res.json({
        success: true,
        message: "Rollback completed successfully",
        data: {
          ref: ref.trim(),
          deletedCount: result.count,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("required")) {
        return res.status(400).json({ success: false, message });
      }
      console.error("Error rolling back transactions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to rollback transactions",
        error: message,
      });
    }
  },
};
