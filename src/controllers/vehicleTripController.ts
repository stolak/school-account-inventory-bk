import { Request, Response } from "express";
import { Direction, VehicleTripStatus } from "@prisma/client";
import { vehicleTripService } from "../services/vehicleTripService";
import { handleAssessmentError, requireRouteId } from "../utils/assessmentController";
import { getAuthenticatedUserId } from "../middlewares/auth";
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

function parseTripDirection(raw: unknown): Direction | undefined | "invalid" {
  if (raw === undefined) return undefined;
  if (raw === Direction.HomeToSchool || raw === Direction.SchoolToHome) return raw;
  return "invalid";
}

/**
 * @openapi
 * /api/v1/vehicle-trips:
 *   post:
 *     summary: Start or record a vehicle trip
 *     description: |
 *       driverId is optional. If omitted, the authenticated user must be staff;
 *       their staff id is used as driverId. Non-staff users are denied.
 *     tags: [VehicleTrips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, routeId]
 *             properties:
 *               vehicleId:
 *                 type: string
 *               routeId:
 *                 type: string
 *               driverId:
 *                 type: string
 *                 description: Optional; defaults to authenticated staff id when omitted
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
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
 *               tripDirection:
 *                 type: string
 *                 enum: [HomeToSchool, SchoolToHome]
 *               status:
 *                 type: string
 *                 enum: [Pending, InProgress, Completed, Cancelled]
 *     responses:
 *       201:
 *         description: Vehicle trip created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Authenticated user is not staff (when driverId omitted)
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
 *         name: tripDirection
 *         schema:
 *           type: string
 *           enum: [HomeToSchool, SchoolToHome]
 *       - in: query
 *         name: fromDate
 *         description: Inclusive lower bound matched against startTime or createdAt
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: toDate
 *         description: Inclusive upper bound matched against startTime or createdAt
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
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
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
 *               tripDirection:
 *                 type: string
 *                 enum: [HomeToSchool, SchoolToHome]
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
      const {
        vehicleId,
        routeId,
        driverId,
        startTime,
        endTime,
        latitude,
        longitude,
        tripDirection,
        status,
      } = req.body ?? {};
      if (!vehicleId || typeof vehicleId !== "string" || !vehicleId.trim()) {
        return res.status(400).json({ success: false, message: "vehicleId is required" });
      }
      if (!routeId || typeof routeId !== "string" || !routeId.trim()) {
        return res.status(400).json({ success: false, message: "routeId is required" });
      }
      if (
        driverId !== undefined &&
        driverId !== null &&
        (typeof driverId !== "string" || !driverId.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "driverId must be a non-empty string when provided",
        });
      }

      const parsedStatus = parseVehicleTripStatus(status);
      if (parsedStatus === "invalid") {
        return res.status(400).json({
          success: false,
          message: "status must be one of Pending, InProgress, Completed, Cancelled",
        });
      }

      const parsedTripDirection = parseTripDirection(tripDirection);
      if (parsedTripDirection === "invalid") {
        return res.status(400).json({
          success: false,
          message: "tripDirection must be one of HomeToSchool, SchoolToHome",
        });
      }

      const authenticatedUserId = getAuthenticatedUserId(req);
      const providedDriverId =
        typeof driverId === "string" && driverId.trim() ? driverId.trim() : undefined;

      const created = await vehicleTripService.create({
        vehicleId: vehicleId.trim(),
        routeId: routeId.trim(),
        ...(providedDriverId ? { driverId: providedDriverId } : {}),
        authenticatedUserId,
        ...(startTime !== undefined ? { startTime } : {}),
        ...(endTime !== undefined ? { endTime } : {}),
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
        ...(parsedTripDirection !== undefined ? { tripDirection: parsedTripDirection } : {}),
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

      const tripDirection = parseTripDirection(queryString(req.query, "tripDirection"));
      if (tripDirection === "invalid") {
        return res.status(400).json({
          success: false,
          message: "tripDirection must be one of HomeToSchool, SchoolToHome",
        });
      }

      const result = await vehicleTripService.list({
        vehicleId: queryString(req.query, "vehicleId"),
        routeId: queryString(req.query, "routeId"),
        driverId: queryString(req.query, "driverId"),
        ...(status !== undefined ? { status } : {}),
        ...(tripDirection !== undefined ? { tripDirection } : {}),
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

      const {
        startTime,
        endTime,
        latitude,
        longitude,
        driverId,
        routeId,
        tripDirection,
        status,
      } = req.body ?? {};
      if (
        startTime === undefined &&
        endTime === undefined &&
        latitude === undefined &&
        longitude === undefined &&
        driverId === undefined &&
        routeId === undefined &&
        tripDirection === undefined &&
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

      const parsedTripDirection = parseTripDirection(tripDirection);
      if (parsedTripDirection === "invalid") {
        return res.status(400).json({
          success: false,
          message: "tripDirection must be one of HomeToSchool, SchoolToHome",
        });
      }

      const updated = await vehicleTripService.update(id, {
        ...(startTime !== undefined ? { startTime } : {}),
        ...(endTime !== undefined ? { endTime } : {}),
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
        ...(driverId !== undefined ? { driverId: String(driverId) } : {}),
        ...(routeId !== undefined ? { routeId: String(routeId) } : {}),
        ...(parsedTripDirection !== undefined ? { tripDirection: parsedTripDirection } : {}),
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
