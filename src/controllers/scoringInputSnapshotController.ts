import { Request, Response } from "express";
import type { ScoringInput } from "../services/scoringService";
import {
  scoringInputSnapshotService,
  UpdateScoringInputSnapshotInput,
} from "../services/scoringInputSnapshotService";

function validateScoringInput(body: unknown): body is ScoringInput {
  if (!body || typeof body !== "object") return false;
  const s = body as ScoringInput;
  if (!s.incomeRecurrent || typeof s.incomeRecurrent !== "object") return false;
  if (
    typeof s.incomeRecurrent.incomeMonths !== "number" ||
    typeof s.incomeRecurrent.dominantSourceCount !== "number" ||
    typeof s.incomeRecurrent.isFiftMonth !== "boolean" ||
    typeof s.incomeRecurrent.isSixtMonth !== "boolean"
  ) {
    return false;
  }
  if (!s.incomeStability || typeof s.incomeStability !== "object") return false;
  if (
    typeof s.incomeStability.averageIncome !== "number" ||
    !Array.isArray(s.incomeStability.monthlyIncomes)
  ) {
    return false;
  }
  if (typeof s.netCashFlowPositiveCount !== "number") return false;
  if (!s.liquidityBuffer || typeof s.liquidityBuffer !== "object") return false;
  if (typeof s.creditHistory !== "number") return false;
  if (!s.riskFactor || typeof s.riskFactor !== "object") return false;
  if (
    typeof s.riskFactor.M1 !== "number" ||
    typeof s.riskFactor.M2 !== "number" ||
    typeof s.riskFactor.M3 !== "number" ||
    typeof s.riskFactor.M4 !== "number" ||
    typeof s.riskFactor.M5 !== "number" ||
    typeof s.riskFactor.M6 !== "number"
  ) {
    return false;
  }
  if (typeof s.overdraftRecent !== "boolean") return false;
  if (typeof s.existingLoanRepayment !== "number") return false;
  if (s.overdraftEvents !== undefined && typeof s.overdraftEvents !== "number") {
    return false;
  }
  if (
    s.overdraftDeepestNegativeBalance !== undefined &&
    typeof s.overdraftDeepestNegativeBalance !== "number"
  ) {
    return false;
  }
  if (
    s.overdraftNegativeDays !== undefined &&
    typeof s.overdraftNegativeDays !== "number"
  ) {
    return false;
  }
  return true;
}

/**
 * @swagger
 * /api/v1/scoring-input-snapshots:
 *   post:
 *     summary: Create a scoring input snapshot
 *     description: Persists a full ScoringInput payload for later retrieval and processing.
 *     tags: [ScoringInputSnapshot]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateScoringInputSnapshotRequest'
 *     responses:
 *       201:
 *         description: Snapshot created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScoringInputSnapshotSuccessResponse'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Buyer not found
 */
/**
 * @swagger
 * /api/v1/scoring-input-snapshots/upsert:
 *   post:
 *     summary: Create or replace a scoring input snapshot by id
 *     description: |
 *       If `id` is omitted, behaves like create (new UUID).
 *       If `id` is provided and exists, updates that row with `scoringInput` (and optional `buyerId`).
 *       If `id` is provided and does not exist, creates a row with that id.
 *     tags: [ScoringInputSnapshot]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpsertScoringInputSnapshotRequest'
 *     responses:
 *       200:
 *         description: Existing snapshot updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScoringInputSnapshotUpsertResponse'
 *       201:
 *         description: New snapshot created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScoringInputSnapshotUpsertResponse'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Buyer not found
 */
/**
 * @swagger
 * /api/v1/scoring-input-snapshots:
 *   get:
 *     summary: List scoring input snapshots
 *     tags: [ScoringInputSnapshot]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: When set, only snapshots for this buyer are returned
 *     responses:
 *       200:
 *         description: List of snapshots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScoringInputSnapshotListResponse'
 */
/**
 * @swagger
 * /api/v1/scoring-input-snapshots/buyer/{buyerId}:
 *   get:
 *     summary: List snapshots for a buyer
 *     tags: [ScoringInputSnapshot]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Snapshots for buyer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScoringInputSnapshotListResponse'
 *       404:
 *         description: Buyer not found
 */
/**
 * @swagger
 * /api/v1/scoring-input-snapshots/buyer/{buyerId}/latest:
 *   get:
 *     summary: Get the latest snapshot for a buyer
 *     tags: [ScoringInputSnapshot]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest snapshot
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScoringInputSnapshotSuccessResponse'
 *       404:
 *         description: Buyer or snapshot not found
 */
/**
 * @swagger
 * /api/v1/scoring-input-snapshots/{id}:
 *   get:
 *     summary: Get a scoring input snapshot by ID
 *     tags: [ScoringInputSnapshot]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Snapshot found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScoringInputSnapshotSuccessResponse'
 *       404:
 *         description: Not found
 */
/**
 * @swagger
 * /api/v1/scoring-input-snapshots/{id}:
 *   patch:
 *     summary: Update a scoring input snapshot
 *     description: Optional buyerId and/or a full scoringInput object. When scoringInput is sent, it replaces all stored scoring fields.
 *     tags: [ScoringInputSnapshot]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateScoringInputSnapshotRequest'
 *     responses:
 *       200:
 *         description: Snapshot updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScoringInputSnapshotSuccessResponse'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 */
/**
 * @swagger
 * /api/v1/scoring-input-snapshots/{id}:
 *   delete:
 *     summary: Delete a scoring input snapshot
 *     tags: [ScoringInputSnapshot]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScoringInputSnapshotDeleteResponse'
 *       404:
 *         description: Not found
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateScoringInputSnapshotRequest:
 *       type: object
 *       required:
 *         - scoringInput
 *       properties:
 *         buyerId:
 *           type: string
 *           nullable: true
 *           description: Optional link to a buyer
 *         scoringInput:
 *           $ref: '#/components/schemas/ScoringInput'
 *     UpsertScoringInputSnapshotRequest:
 *       type: object
 *       required:
 *         - scoringInput
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Optional. Target row id for update-or-insert.
 *         buyerId:
 *           type: string
 *           nullable: true
 *         scoringInput:
 *           $ref: '#/components/schemas/ScoringInput'
 *     UpdateScoringInputSnapshotRequest:
 *       type: object
 *       properties:
 *         buyerId:
 *           type: string
 *           nullable: true
 *         scoringInput:
 *           $ref: '#/components/schemas/ScoringInput'
 *           description: When provided, replaces all flattened scoring fields on the row
 *     ScoringInputSnapshotRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         buyerId:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         scoringInput:
 *           $ref: '#/components/schemas/ScoringInput'
 *     ScoringInputSnapshotSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/ScoringInputSnapshotRecord'
 *     ScoringInputSnapshotUpsertResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/ScoringInputSnapshotRecord'
 *         wasCreated:
 *           type: boolean
 *           description: True when a new row was inserted; false when an existing row was updated
 *     ScoringInputSnapshotListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ScoringInputSnapshotRecord'
 *     ScoringInputSnapshotDeleteResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 */
export class ScoringInputSnapshotController {
  async create(req: Request, res: Response) {
    try {
      const { buyerId, scoringInput } = req.body ?? {};

      if (!validateScoringInput(scoringInput)) {
        return res.status(400).json({
          success: false,
          message:
            "scoringInput is required and must match the ScoringInput shape",
        });
      }

      const result = await scoringInputSnapshotService.create({
        buyerId: buyerId ?? null,
        scoringInput,
      });

      return res.status(201).json(result);
    } catch (error: any) {
      console.error("Error creating scoring input snapshot:", error);
      const msg = error.message || "Failed to create scoring input snapshot";
      const status = msg === "Buyer not found" ? 404 : 400;
      return res.status(status).json({ success: false, message: msg });
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const { id, buyerId, scoringInput } = req.body ?? {};

      if (!validateScoringInput(scoringInput)) {
        return res.status(400).json({
          success: false,
          message:
            "scoringInput is required and must match the ScoringInput shape",
        });
      }

      if (id !== undefined && id !== null && typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "id must be a string when provided",
        });
      }

      const result = await scoringInputSnapshotService.upsert({
        ...(typeof id === "string" && id.length > 0 ? { id } : {}),
        buyerId: buyerId ?? null,
        scoringInput,
      });

      const status = result.wasCreated ? 201 : 200;
      return res.status(status).json(result);
    } catch (error: any) {
      console.error("Error upserting scoring input snapshot:", error);
      const msg = error.message || "Failed to upsert scoring input snapshot";
      const status = msg === "Buyer not found" ? 404 : 400;
      return res.status(status).json({ success: false, message: msg });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const buyerId =
        typeof req.query.buyerId === "string" ? req.query.buyerId : undefined;

      const result = await scoringInputSnapshotService.list(buyerId);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error listing scoring input snapshots:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to list scoring input snapshots",
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const result = await scoringInputSnapshotService.getById(req.params.id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching scoring input snapshot:", error);
      return res.status(404).json({
        success: false,
        message: error.message || "Scoring input snapshot not found",
      });
    }
  }

  async getByBuyerId(req: Request, res: Response) {
    try {
      const result = await scoringInputSnapshotService.getByBuyerId(
        req.params.buyerId
      );
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching scoring input snapshots by buyer:", error);
      const msg = error.message || "Failed to fetch snapshots";
      const status = msg === "Buyer not found" ? 404 : 400;
      return res.status(status).json({ success: false, message: msg });
    }
  }

  async getLatestByBuyerId(req: Request, res: Response) {
    try {
      const result = await scoringInputSnapshotService.getLatestByBuyerId(
        req.params.buyerId
      );
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching latest scoring input snapshot:", error);
      const msg = error.message || "Not found";
      const status =
        msg === "Buyer not found" || msg.includes("No scoring")
          ? 404
          : 400;
      return res.status(status).json({ success: false, message: msg });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { buyerId, scoringInput } = req.body ?? {};

      if (
        buyerId === undefined &&
        scoringInput === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide at least one of buyerId or scoringInput",
        });
      }

      if (scoringInput !== undefined && !validateScoringInput(scoringInput)) {
        return res.status(400).json({
          success: false,
          message:
            "scoringInput must match the ScoringInput shape when provided",
        });
      }

      const payload: UpdateScoringInputSnapshotInput = {};
      if (buyerId !== undefined) payload.buyerId = buyerId ?? null;
      if (scoringInput !== undefined) payload.scoringInput = scoringInput;

      const result = await scoringInputSnapshotService.update(
        req.params.id,
        payload
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error updating scoring input snapshot:", error);
      const msg = error.message || "Failed to update scoring input snapshot";
      const status =
        msg === "Buyer not found" || msg.includes("not found") ? 404 : 400;
      return res.status(status).json({ success: false, message: msg });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const result = await scoringInputSnapshotService.remove(req.params.id);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error deleting scoring input snapshot:", error);
      return res.status(404).json({
        success: false,
        message: error.message || "Scoring input snapshot not found",
      });
    }
  }
}

export const scoringInputSnapshotController =
  new ScoringInputSnapshotController();
