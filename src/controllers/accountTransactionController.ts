import { Request, Response } from "express";
import { accountTransactionService } from "../services/accountTransactionService";
import { parseQueryDateEndInclusive, parseQueryDateStart } from "../utils/queryDate";

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
 *
 * /api/v1/account-transactions/transaction-log:
 *   get:
 *     summary: Account transaction log for one account
 *     description: |
 *       Lists `AccountTransaction` rows for one `accountId` between `transactionDateFrom` and `transactionDateTo` (inclusive).
 *       If both dates are omitted, the window is the current UTC calendar month from the 1st through end of today.
 *       If only `transactionDateFrom` is set, `transactionDateTo` defaults to end of today UTC.
 *       If only `transactionDateTo` is set, `transactionDateFrom` defaults to the first day of that date's UTC month.
 *       `balanceBeforeFromDate` is sum(debit) − sum(credit) for rows strictly before the window start.
 *     tags: [AccountTransactions]
 *     parameters:
 *       - in: query
 *         name: accountId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: transactionDateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: transactionDateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Account summary, date window, opening balance, and transactions
 *       400:
 *         description: Invalid parameters or date range
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 *
 * /api/v1/account-transactions/report-by-account:
 *   get:
 *     summary: Grouped account transaction report by accountId
 *     description: |
 *       Groups `AccountTransaction` by `accountId` and returns `sumCreditMinusDebit` = sum(credit) − sum(debit).
 *       Supports optional date window filters; if omitted, aggregation is all-time.
 *       Rows are ordered by headId, subhead rank, subheadId, account chart rank, then accountId.
 *     tags: [AccountTransactions]
 *     parameters:
 *       - in: query
 *         name: transactionDateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: transactionDateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Grouped rows with account chart details and sum(credit - debit)
 *       400:
 *         description: Invalid date parameters or date range
 *       500:
 *         description: Server error
 *
 * /api/v1/account-transactions/report-by-head-subhead:
 *   get:
 *     summary: Grouped account report by head and subhead
 *     description: |
 *       Returns an object keyed as `headcode{head.code}` from `AccountHead`.
 *       Each key contains the head details and `subheads` from `AccountSubhead`, where
 *       each subhead `balance` is sum(credit) − sum(debit) from `AccountTransaction`
 *       grouped by `(headId, subheadId)` for the optional date window.
 *     tags: [AccountTransactions]
 *     parameters:
 *       - in: query
 *         name: transactionDateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: transactionDateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Object of headcode buckets with nested subhead balances
 *       400:
 *         description: Invalid date parameters or date range
 *       500:
 *         description: Server error
 *
 * /api/v1/account-transactions/balance-as-at:
 *   get:
 *     summary: Account balance as at a selected date
 *     description: |
 *       Returns balance for one account from inception through the selected date (inclusive):
 *       `sum(credit) - sum(debit)` for rows where `transactionDate <= asAtDate`.
 *     tags: [AccountTransactions]
 *     parameters:
 *       - in: query
 *         name: accountId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: asAtDate
 *         required: false
 *         schema: { type: string, format: date }
 *         description: Date or date-time. If omitted, defaults to end of today UTC. Date-only values are treated as end of that UTC day.
 *     responses:
 *       200:
 *         description: Account details and balance as at the selected date
 *       400:
 *         description: Invalid accountId or asAtDate
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
export const accountTransactionController = {
  getAccountBalanceAsAtDate: async (req: Request, res: Response) => {
    try {
      const accountIdRaw = typeof req.query.accountId === "string" ? req.query.accountId.trim() : "";
      if (!accountIdRaw) {
        return res.status(400).json({ success: false, message: "accountId is required" });
      }

      const asAtDateRaw = parseQueryDateEndInclusive(req.query.asAtDate);
      if (asAtDateRaw === "invalid") {
        return res.status(400).json({ success: false, message: "asAtDate is invalid" });
      }

      const data = await accountTransactionService.getAccountBalanceAsAtDate({
        accountId: accountIdRaw,
        ...(asAtDateRaw === "missing" ? {} : { asAtDate: asAtDateRaw }),
      });

      return res.json({
        success: true,
        message: "Account balance as at date retrieved successfully",
        data,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to retrieve account balance as at date";
      const code =
        message === "Account not found for accountId"
          ? 404
          : message === "accountId is required" || message === "accountId must be a positive integer"
            ? 400
            : 500;

      return res.status(code).json({
        success: false,
        message,
        ...(code === 500 && error instanceof Error ? { error: error.message } : {}),
      });
    }
  },

  getAccountTransactionByAccountReport: async (req: Request, res: Response) => {
    try {
      const fromRaw = parseQueryDateStart(req.query.transactionDateFrom);
      const toRaw = parseQueryDateEndInclusive(req.query.transactionDateTo);

      if (fromRaw === "invalid") {
        return res.status(400).json({ success: false, message: "transactionDateFrom is invalid" });
      }
      if (toRaw === "invalid") {
        return res.status(400).json({ success: false, message: "transactionDateTo is invalid" });
      }

      const transactionDateFrom = fromRaw === "missing" ? undefined : fromRaw;
      const transactionDateTo = toRaw === "missing" ? undefined : toRaw;

      const data = await accountTransactionService.getAccountTransactionByAccountReport({
        ...(transactionDateFrom !== undefined ? { transactionDateFrom } : {}),
        ...(transactionDateTo !== undefined ? { transactionDateTo } : {}),
      });

      return res.json({
        success: true,
        message: "Account report by account retrieved successfully",
        data,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to retrieve account report by account";
      const code =
        message === "transactionDateFrom must be before or equal to transactionDateTo" ? 400 : 500;

      return res.status(code).json({
        success: false,
        message,
        ...(code === 500 && error instanceof Error ? { error: error.message } : {}),
      });
    }
  },

  getAccountTransactionByHeadSubheadReport: async (req: Request, res: Response) => {
    try {
      const fromRaw = parseQueryDateStart(req.query.transactionDateFrom);
      const toRaw = parseQueryDateEndInclusive(req.query.transactionDateTo);

      if (fromRaw === "invalid") {
        return res.status(400).json({ success: false, message: "transactionDateFrom is invalid" });
      }
      if (toRaw === "invalid") {
        return res.status(400).json({ success: false, message: "transactionDateTo is invalid" });
      }

      const transactionDateFrom = fromRaw === "missing" ? undefined : fromRaw;
      const transactionDateTo = toRaw === "missing" ? undefined : toRaw;

      const data = await accountTransactionService.getAccountTransactionByHeadSubheadReport({
        ...(transactionDateFrom !== undefined ? { transactionDateFrom } : {}),
        ...(transactionDateTo !== undefined ? { transactionDateTo } : {}),
      });

      return res.json({
        success: true,
        message: "Account report by head/subhead retrieved successfully",
        data,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to retrieve account report by head/subhead";
      const code =
        message === "transactionDateFrom must be before or equal to transactionDateTo" ? 400 : 500;

      return res.status(code).json({
        success: false,
        message,
        ...(code === 500 && error instanceof Error ? { error: error.message } : {}),
      });
    }
  },

  getAccountTransactionLog: async (req: Request, res: Response) => {
    try {
      const accountIdRaw = typeof req.query.accountId === "string" ? req.query.accountId.trim() : "";
      if (!accountIdRaw) {
        return res.status(400).json({ success: false, message: "accountId is required" });
      }

      const fromRaw = parseQueryDateStart(req.query.transactionDateFrom);
      const toRaw = parseQueryDateEndInclusive(req.query.transactionDateTo);

      if (fromRaw === "invalid") {
        return res.status(400).json({ success: false, message: "transactionDateFrom is invalid" });
      }
      if (toRaw === "invalid") {
        return res.status(400).json({ success: false, message: "transactionDateTo is invalid" });
      }

      const transactionDateFrom = fromRaw === "missing" ? undefined : fromRaw;
      const transactionDateTo = toRaw === "missing" ? undefined : toRaw;

      const data = await accountTransactionService.getAccountTransactionLog({
        accountId: accountIdRaw,
        ...(transactionDateFrom !== undefined ? { transactionDateFrom } : {}),
        ...(transactionDateTo !== undefined ? { transactionDateTo } : {}),
      });

      return res.json({
        success: true,
        message: "Account transaction log retrieved successfully",
        data,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to retrieve account transaction log";
      const code =
        message === "Account not found for accountId"
          ? 404
          : message === "accountId is required" ||
              message === "accountId must be a positive integer" ||
              message === "transactionDateFrom must be before or equal to transactionDateTo"
            ? 400
            : 500;

      return res.status(code).json({
        success: false,
        message,
        ...(code === 500 && error instanceof Error ? { error: error.message } : {}),
      });
    }
  },

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
