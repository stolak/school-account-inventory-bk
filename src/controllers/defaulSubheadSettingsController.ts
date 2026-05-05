import { Request, Response } from "express";
import { defaulSubheadSettingsService } from "../services/defaulSubheadSettingsService";

/**
 * @openapi
 * /api/v1/default-subhead-settings/{settingsId}:
 *   patch:
 *     summary: Update default subhead settings (partial)
 *     description: Update-only endpoint — no create/list/delete. Identifies the row by `settingsId`.
 *     tags: [DefaultSubheadSettings]
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
 *               subheadId:
 *                 type: integer
 *                 nullable: true
 *                 description: Link to account subhead; null clears the link
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
export const defaulSubheadSettingsController = {
  patch: async (req: Request, res: Response) => {
    try {
      const settingsId =
        typeof req.params.settingsId === "string" ? req.params.settingsId : "";
      const body = req.body ?? {};

      const hasSettings = body.settings !== undefined;
      const hasSubheadId = body.subheadId !== undefined;

      if (!hasSettings && !hasSubheadId) {
        return res.status(400).json({
          success: false,
          message: "At least one of settings or subheadId must be provided",
        });
      }

      let subheadId: number | null | undefined;
      if (hasSubheadId) {
        if (body.subheadId === null) {
          subheadId = null;
        } else {
          const n =
            typeof body.subheadId === "number" && Number.isInteger(body.subheadId)
              ? body.subheadId
              : typeof body.subheadId === "string"
                ? Number.parseInt(body.subheadId, 10)
                : NaN;
          if (!Number.isFinite(n) || n < 1) {
            return res.status(400).json({
              success: false,
              message: "subheadId must be a positive integer or null",
            });
          }
          subheadId = n;
        }
      }

      const updated = await defaulSubheadSettingsService.update(settingsId, {
        ...(hasSettings ? { settings: body.settings as string } : {}),
        ...(hasSubheadId ? { subheadId } : {}),
      });

      return res.json({
        success: true,
        message: "Default subhead settings updated successfully",
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
      console.error("Error updating default subhead settings:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update default subhead settings",
        error: message,
      });
    }
  },
};
