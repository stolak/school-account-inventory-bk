import { Request, Response } from "express";
import { Status, VehicleType } from "@prisma/client";
import { vehicleService } from "../services/vehicleService";
import { handleAssessmentError, requireRouteId } from "../utils/assessmentController";
import { getAuthenticatedUserId } from "../middlewares/auth";
import { parseIntOrUndefined } from "../utils/request";

function queryString(query: Request["query"], key: string): string | undefined {
  const raw = query[key];
  return typeof raw === "string" ? raw : undefined;
}

function parseVehicleType(raw: unknown): VehicleType | undefined | "invalid" {
  if (raw === undefined) return undefined;
  if (raw === VehicleType.Car || raw === VehicleType.Bus) return raw;
  return "invalid";
}

function parseStatus(raw: unknown): Status | "All" | undefined | "invalid" {
  if (raw === undefined) return undefined;
  if (raw === "All") return "All";
  if (raw === Status.Active || raw === Status.Inactive || raw === Status.Archived) return raw;
  return "invalid";
}

/**
 * @openapi
 * /api/v1/vehicles:
 *   post:
 *     summary: Create a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleNumber, driverId]
 *             properties:
 *               vehicleNumber:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *                 enum: [Car, Bus]
 *               capacity:
 *                 type: integer
 *               driverId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Archived]
 *               latitude:
 *                 type: number
 *                 nullable: true
 *               longitude:
 *                 type: number
 *                 nullable: true
 *               remarks:
 *                 type: string
 *                 nullable: true
 *               userId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Vehicle created
 *       400:
 *         description: Validation error
 *   get:
 *     summary: List vehicles
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Archived, All]
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [Car, Bus]
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehicles list
 */
export const vehicleController = {
  create: async (req: Request, res: Response) => {
    try {
      const createdById = getAuthenticatedUserId(req);
      if (!createdById) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const {
        vehicleNumber,
        vehicleType,
        capacity,
        driverId,
        status,
        latitude,
        longitude,
        remarks,
        userId,
      } = req.body ?? {};

      if (!vehicleNumber || typeof vehicleNumber !== "string" || !vehicleNumber.trim()) {
        return res.status(400).json({ success: false, message: "vehicleNumber is required" });
      }
      if (!driverId || typeof driverId !== "string" || !driverId.trim()) {
        return res.status(400).json({ success: false, message: "driverId is required" });
      }

      const parsedType = parseVehicleType(vehicleType);
      if (parsedType === "invalid") {
        return res.status(400).json({ success: false, message: "vehicleType must be Car or Bus" });
      }
      const parsedStatus = parseStatus(status);
      if (parsedStatus === "invalid" || parsedStatus === "All") {
        return res.status(400).json({
          success: false,
          message: "status must be Active, Inactive, or Archived",
        });
      }
      if (
        capacity !== undefined &&
        (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 1)
      ) {
        return res.status(400).json({
          success: false,
          message: "capacity must be a positive integer",
        });
      }

      const created = await vehicleService.create({
        vehicleNumber: vehicleNumber.trim(),
        driverId: driverId.trim(),
        createdById,
        ...(parsedType !== undefined ? { vehicleType: parsedType } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
        ...(parsedStatus !== undefined ? { status: parsedStatus } : {}),
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
        ...(remarks !== undefined
          ? { remarks: remarks === null ? null : String(remarks) }
          : {}),
        ...(userId !== undefined
          ? { userId: userId === null ? null : String(userId) }
          : {}),
      });

      return res.status(201).json({
        success: true,
        message: "Vehicle created successfully",
        data: created,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to create vehicle");
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const status = parseStatus(queryString(req.query, "status"));
      if (status === "invalid") {
        return res.status(400).json({
          success: false,
          message: "status must be Active, Inactive, Archived, or All",
        });
      }
      const vehicleType = parseVehicleType(queryString(req.query, "vehicleType"));
      if (vehicleType === "invalid") {
        return res.status(400).json({ success: false, message: "vehicleType must be Car or Bus" });
      }

      const result = await vehicleService.list({
        q: queryString(req.query, "q"),
        status,
        vehicleType,
        driverId: queryString(req.query, "driverId"),
        page: parseIntOrUndefined(req.query.page),
        limit: parseIntOrUndefined(req.query.limit),
      });

      return res.json({
        success: true,
        message: "Vehicles retrieved successfully",
        data: result,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve vehicles");
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const row = await vehicleService.getById(id);
      if (!row) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
      }

      return res.json({
        success: true,
        message: "Vehicle retrieved successfully",
        data: row,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve vehicle");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const {
        vehicleNumber,
        vehicleType,
        capacity,
        driverId,
        status,
        latitude,
        longitude,
        remarks,
        userId,
      } = req.body ?? {};

      if (
        vehicleNumber === undefined &&
        vehicleType === undefined &&
        capacity === undefined &&
        driverId === undefined &&
        status === undefined &&
        latitude === undefined &&
        longitude === undefined &&
        remarks === undefined &&
        userId === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "At least one field must be provided for update",
        });
      }

      const parsedType = parseVehicleType(vehicleType);
      if (parsedType === "invalid") {
        return res.status(400).json({ success: false, message: "vehicleType must be Car or Bus" });
      }
      const parsedStatus = parseStatus(status);
      if (parsedStatus === "invalid" || parsedStatus === "All") {
        return res.status(400).json({
          success: false,
          message: "status must be Active, Inactive, or Archived",
        });
      }
      if (
        capacity !== undefined &&
        (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 1)
      ) {
        return res.status(400).json({
          success: false,
          message: "capacity must be a positive integer",
        });
      }
      if (vehicleNumber !== undefined && (typeof vehicleNumber !== "string" || !vehicleNumber.trim())) {
        return res.status(400).json({ success: false, message: "vehicleNumber cannot be empty" });
      }
      if (driverId !== undefined && (typeof driverId !== "string" || !driverId.trim())) {
        return res.status(400).json({ success: false, message: "driverId cannot be empty" });
      }

      const updated = await vehicleService.update(id, {
        ...(vehicleNumber !== undefined ? { vehicleNumber: vehicleNumber.trim() } : {}),
        ...(parsedType !== undefined ? { vehicleType: parsedType } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
        ...(driverId !== undefined ? { driverId: driverId.trim() } : {}),
        ...(parsedStatus !== undefined ? { status: parsedStatus } : {}),
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
        ...(remarks !== undefined
          ? { remarks: remarks === null ? null : String(remarks) }
          : {}),
        ...(userId !== undefined
          ? { userId: userId === null ? null : String(userId) }
          : {}),
      });

      return res.json({
        success: true,
        message: "Vehicle updated successfully",
        data: updated,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to update vehicle");
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const deleted = await vehicleService.delete(id);

      return res.json({
        success: true,
        message: "Vehicle deleted successfully",
        data: deleted,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to delete vehicle");
    }
  },
};
