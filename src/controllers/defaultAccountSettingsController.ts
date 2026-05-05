import { Request, Response } from "express";
import { defaultAccountSettingsService } from "../services/defaultAccountSettingsService";

/**
 * @openapi
 * /api/v1/default-account-settings/{settingsId}:
 *   patch:
 *     summary: Update default account settings (partial)
 *     description: Update-only endpoint — no create/list/delete. Identifies the row by `settingsId`.
 *     tags: [DefaultAccountSettings]
 *     parameters:
 *       - in: path
 *         name: settingsId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique settings key (e.g. configured identifier)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: string
 *                 description: JSON or text blob stored in `settings`
 *               accountId:
 *                 type: integer
 *                 nullable: true
 *                 description: Link to account chart row; null clears the link
 *     responses:
 *       200:
 *         description: Updated row
 *       400:
 *         description: Validation error
 *       404:
 *         description: Row not found for settingsId
 *       500:
 *         description: Server error
 */
export const defaultAccountSettingsController = {
  patch: async (req: Request, res: Response) => {
    try {
      const settingsId =
        typeof req.params.settingsId === "string" ? req.params.settingsId : "";
      const body = req.body ?? {};

      const hasSettings = body.settings !== undefined;
      const hasAccountId = body.accountId !== undefined;

      if (!hasSettings && !hasAccountId) {
        return res.status(400).json({
          success: false,
          message: "At least one of settings or accountId must be provided",
        });
      }

      let accountId: number | null | undefined;
      if (hasAccountId) {
        if (body.accountId === null) {
          accountId = null;
        } else {
          const n =
            typeof body.accountId === "number" && Number.isInteger(body.accountId)
              ? body.accountId
              : typeof body.accountId === "string"
                ? Number.parseInt(body.accountId, 10)
                : NaN;
          if (!Number.isFinite(n) || n < 1) {
            return res.status(400).json({
              success: false,
              message: "accountId must be a positive integer or null",
            });
          }
          accountId = n;
        }
      }

      const updated = await defaultAccountSettingsService.update(settingsId, {
        ...(hasSettings ? { settings: body.settings as string } : {}),
        ...(hasAccountId ? { accountId } : {}),
      });

      return res.json({
        success: true,
        message: "Default account settings updated successfully",
        data: updated,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("not found")) {
        return res.status(404).json({ success: false, message });
      }
      if (
        message.includes("required") ||
        message.includes("must be") ||
        message.includes("cannot be empty") ||
        message.includes("At least one field")
      ) {
        return res.status(400).json({ success: false, message });
      }
      console.error("Error updating default account settings:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update default account settings",
        error: message,
      });
    }
  },
};
