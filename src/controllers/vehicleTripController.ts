import { Request, Response } from "express";
import { VehicleTripStatus } from "@prisma/client";
import { vehicleTripService } from "../services/vehicleTripService";
import { handleAssessmentError, requireRouteId } from "../utils/assessmentController";
import { parseIntOrUndefined } from "../utils/request";

function queryString(query: Request["query"], key: string): string | undefined {
  const raw = query[key];
  return typeof raw === "string" ? raw : undefined;
}

function parseVehicleTripStatus(
  raw: unknown
): VehicleTripStatus | undefined | "invalid" {
  if (raw === undefined) return undefined;
  if (
    raw === VehicleTripStatus.Pending ||
    raw === VehicleTripStatus.InProgress ||
    raw === VehicleTripStatus.Completed ||
    raw === VehicleTripStatus.Cancelled
  ) {
    return raw;
  }
  return "invalid";
}

/**
 * @openapi
 * /api/v1/vehicle-trips:
 *   post:
 *     summary: Start or record a vehicle trip
 *     tags: [VehicleTrips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, routeId, driverId, startTime]
 *             properties:
 *               vehicleId:
 *                 type: string
 *               routeId:
 *                 type: string
 *               driverId:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               latitude:
 *                 type: number
 *                 nullable: true
 *               longitude:
 *                 type: number
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [Pending, InProgress, Completed, Cancelled]
 *     responses:
 *       201:
 *         description: Vehicle trip created
 *   get:
 *     summary: List vehicle trips
 *     tags: [VehicleTrips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, InProgress, Completed, Cancelled]
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
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
 *         description: Vehicle trips list
 */
/**
 * @openapi
 * /api/v1/vehicle-trips/{id}:
 *   get:
 *     summary: Get a vehicle trip by ID
 *     tags: [VehicleTrips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vehicle trip details
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a vehicle trip
 *     tags: [VehicleTrips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               latitude:
 *                 type: number
 *                 nullable: true
 *               longitude:
 *                 type: number
 *                 nullable: true
 *               driverId:
 *                 type: string
 *               routeId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Pending, InProgress, Completed, Cancelled]
 *     responses:
 *       200:
 *         description: Vehicle trip updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a vehicle trip
 *     tags: [VehicleTrips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vehicle trip deleted
 *       400:
 *         description: Cannot delete because histories exist
 *       404:
 *         description: Not found
 */
export const vehicleTripController = {
  create: async (req: Request, res: Response) => {
    try {
      const { vehicleId, routeId, driverId, startTime, endTime, latitude, longitude, status } =
        req.body ?? {};
      if (!vehicleId || typeof vehicleId !== "string" || !vehicleId.trim()) {
        return res.status(400).json({ success: false, message: "vehicleId is required" });
      }
      if (!routeId || typeof routeId !== "string" || !routeId.trim()) {
        return res.status(400).json({ success: false, message: "routeId is required" });
      }
      if (!driverId || typeof driverId !== "string" || !driverId.trim()) {
        return res.status(400).json({ success: false, message: "driverId is required" });
      }
      if (startTime === undefined || startTime === null) {
        return res.status(400).json({ success: false, message: "startTime is required" });
      }

      const parsedStatus = parseVehicleTripStatus(status);
      if (parsedStatus === "invalid") {
        return res.status(400).json({
          success: false,
          message: "status must be one of Pending, InProgress, Completed, Cancelled",
        });
      }

      const created = await vehicleTripService.create({
        vehicleId: vehicleId.trim(),
        routeId: routeId.trim(),
        driverId: driverId.trim(),
        startTime,
        ...(endTime !== undefined ? { endTime } : {}),
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
        ...(parsedStatus !== undefined ? { status: parsedStatus } : {}),
      });

      return res.status(201).json({
        success: true,
        message: "Vehicle trip created successfully",
        data: created,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to create vehicle trip");
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const status = parseVehicleTripStatus(queryString(req.query, "status"));
      if (status === "invalid") {
        return res.status(400).json({
          success: false,
          message: "status must be one of Pending, InProgress, Completed, Cancelled",
        });
      }

      const result = await vehicleTripService.list({
        vehicleId: queryString(req.query, "vehicleId"),
        routeId: queryString(req.query, "routeId"),
        driverId: queryString(req.query, "driverId"),
        ...(status !== undefined ? { status } : {}),
        fromDate: queryString(req.query, "fromDate"),
        toDate: queryString(req.query, "toDate"),
        page: parseIntOrUndefined(req.query.page),
        limit: parseIntOrUndefined(req.query.limit),
      });

      return res.json({
        success: true,
        message: "Vehicle trips retrieved successfully",
        data: result,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve vehicle trips");
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const row = await vehicleTripService.getById(id);
      if (!row) {
        return res.status(404).json({ success: false, message: "Vehicle trip not found" });
      }

      return res.json({
        success: true,
        message: "Vehicle trip retrieved successfully",
        data: row,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve vehicle trip");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const { endTime, latitude, longitude, driverId, routeId, status } = req.body ?? {};
      if (
        endTime === undefined &&
        latitude === undefined &&
        longitude === undefined &&
        driverId === undefined &&
        routeId === undefined &&
        status === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "At least one field must be provided",
        });
      }

      const parsedStatus = parseVehicleTripStatus(status);
      if (parsedStatus === "invalid") {
        return res.status(400).json({
          success: false,
          message: "status must be one of Pending, InProgress, Completed, Cancelled",
        });
      }

      const updated = await vehicleTripService.update(id, {
        ...(endTime !== undefined ? { endTime } : {}),
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
        ...(driverId !== undefined ? { driverId: String(driverId) } : {}),
        ...(routeId !== undefined ? { routeId: String(routeId) } : {}),
        ...(parsedStatus !== undefined ? { status: parsedStatus } : {}),
      });

      return res.json({
        success: true,
        message: "Vehicle trip updated successfully",
        data: updated,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to update vehicle trip");
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const deleted = await vehicleTripService.delete(id);

      return res.json({
        success: true,
        message: "Vehicle trip deleted successfully",
        data: deleted,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to delete vehicle trip");
    }
  },
};
