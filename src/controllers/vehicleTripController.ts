import { Request, Response } from "express";
import { vehicleTripService } from "../services/vehicleTripService";
import { handleAssessmentError, requireRouteId } from "../utils/assessmentController";
import { parseIntOrUndefined } from "../utils/request";

function queryString(query: Request["query"], key: string): string | undefined {
  const raw = query[key];
  return typeof raw === "string" ? raw : undefined;
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
export const vehicleTripController = {
  create: async (req: Request, res: Response) => {
    try {
      const { vehicleId, routeId, driverId, startTime, endTime, latitude, longitude } =
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

      const created = await vehicleTripService.create({
        vehicleId: vehicleId.trim(),
        routeId: routeId.trim(),
        driverId: driverId.trim(),
        startTime,
        ...(endTime !== undefined ? { endTime } : {}),
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
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
      const result = await vehicleTripService.list({
        vehicleId: queryString(req.query, "vehicleId"),
        routeId: queryString(req.query, "routeId"),
        driverId: queryString(req.query, "driverId"),
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

      const { endTime, latitude, longitude, driverId, routeId } = req.body ?? {};
      if (
        endTime === undefined &&
        latitude === undefined &&
        longitude === undefined &&
        driverId === undefined &&
        routeId === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "At least one field must be provided",
        });
      }

      const updated = await vehicleTripService.update(id, {
        ...(endTime !== undefined ? { endTime } : {}),
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
        ...(driverId !== undefined ? { driverId: String(driverId) } : {}),
        ...(routeId !== undefined ? { routeId: String(routeId) } : {}),
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
