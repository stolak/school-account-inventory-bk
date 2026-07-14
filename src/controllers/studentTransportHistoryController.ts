import { Request, Response } from "express";
import { studentTransportHistoryService } from "../services/studentTransportHistoryService";
import { handleAssessmentError, requireRouteId } from "../utils/assessmentController";
import { parseIntOrUndefined } from "../utils/request";

function queryString(query: Request["query"], key: string): string | undefined {
  const raw = query[key];
  return typeof raw === "string" ? raw : undefined;
}

/**
 * @openapi
 * /api/v1/student-transport-histories:
 *   post:
 *     summary: Record a student transport history entry
 *     tags: [StudentTransportHistories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, routeId, bustopId, driverId, vehicleId, startTime]
 *             properties:
 *               studentId:
 *                 type: string
 *               routeId:
 *                 type: string
 *               bustopId:
 *                 type: string
 *               driverId:
 *                 type: string
 *               vehicleId:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       201:
 *         description: History created
 *   get:
 *     summary: List student transport histories
 *     tags: [StudentTransportHistories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: bustopId
 *         schema:
 *           type: string
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *       - in: query
 *         name: vehicleId
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
 *         description: Histories list
 */
export const studentTransportHistoryController = {
  create: async (req: Request, res: Response) => {
    try {
      const { studentId, routeId, bustopId, driverId, vehicleId, startTime, endTime } =
        req.body ?? {};
      if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
        return res.status(400).json({ success: false, message: "studentId is required" });
      }
      if (!routeId || typeof routeId !== "string" || !routeId.trim()) {
        return res.status(400).json({ success: false, message: "routeId is required" });
      }
      if (!bustopId || typeof bustopId !== "string" || !bustopId.trim()) {
        return res.status(400).json({ success: false, message: "bustopId is required" });
      }
      if (!driverId || typeof driverId !== "string" || !driverId.trim()) {
        return res.status(400).json({ success: false, message: "driverId is required" });
      }
      if (!vehicleId || typeof vehicleId !== "string" || !vehicleId.trim()) {
        return res.status(400).json({ success: false, message: "vehicleId is required" });
      }
      if (startTime === undefined || startTime === null) {
        return res.status(400).json({ success: false, message: "startTime is required" });
      }

      const created = await studentTransportHistoryService.create({
        studentId: studentId.trim(),
        routeId: routeId.trim(),
        bustopId: bustopId.trim(),
        driverId: driverId.trim(),
        vehicleId: vehicleId.trim(),
        startTime,
        ...(endTime !== undefined ? { endTime } : {}),
      });

      return res.status(201).json({
        success: true,
        message: "Student transport history created successfully",
        data: created,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to create student transport history");
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const result = await studentTransportHistoryService.list({
        studentId: queryString(req.query, "studentId"),
        routeId: queryString(req.query, "routeId"),
        bustopId: queryString(req.query, "bustopId"),
        driverId: queryString(req.query, "driverId"),
        vehicleId: queryString(req.query, "vehicleId"),
        fromDate: queryString(req.query, "fromDate"),
        toDate: queryString(req.query, "toDate"),
        page: parseIntOrUndefined(req.query.page),
        limit: parseIntOrUndefined(req.query.limit),
      });

      return res.json({
        success: true,
        message: "Student transport histories retrieved successfully",
        data: result,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve student transport histories");
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const row = await studentTransportHistoryService.getById(id);
      if (!row) {
        return res
          .status(404)
          .json({ success: false, message: "Student transport history not found" });
      }

      return res.json({
        success: true,
        message: "Student transport history retrieved successfully",
        data: row,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve student transport history");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const { endTime } = req.body ?? {};
      if (endTime === undefined) {
        return res.status(400).json({ success: false, message: "endTime is required" });
      }

      const updated = await studentTransportHistoryService.update(id, { endTime });

      return res.json({
        success: true,
        message: "Student transport history updated successfully",
        data: updated,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to update student transport history");
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const deleted = await studentTransportHistoryService.delete(id);

      return res.json({
        success: true,
        message: "Student transport history deleted successfully",
        data: deleted,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to delete student transport history");
    }
  },
};
