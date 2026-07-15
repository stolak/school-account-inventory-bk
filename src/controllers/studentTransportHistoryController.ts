import { Request, Response } from "express";
import { Direction } from "@prisma/client";
import { studentTransportHistoryService } from "../services/studentTransportHistoryService";
import { handleAssessmentError, requireRouteId } from "../utils/assessmentController";
import { parseIntOrUndefined } from "../utils/request";

function queryString(query: Request["query"], key: string): string | undefined {
  const raw = query[key];
  return typeof raw === "string" ? raw : undefined;
}

function parseDirection(raw: unknown): Direction | undefined | "invalid" {
  if (raw === undefined) return undefined;
  if (raw === Direction.HomeToSchool || raw === Direction.SchoolToHome) return raw;
  return "invalid";
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
 *             required: [studentId, bustopId, vehicleTripId, startTime]
 *             properties:
 *               studentId:
 *                 type: string
 *               bustopId:
 *                 type: string
 *               vehicleTripId:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               direction:
 *                 type: string
 *                 enum: [HomeToSchool, SchoolToHome]
 *               staffId:
 *                 type: string
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
 *         name: bustopId
 *         schema:
 *           type: string
 *       - in: query
 *         name: vehicleTripId
 *         schema:
 *           type: string
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [HomeToSchool, SchoolToHome]
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
/**
 * @openapi
 * /api/v1/student-transport-histories/{id}:
 *   get:
 *     summary: Get a student transport history by ID
 *     tags: [StudentTransportHistories]
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
 *         description: Student transport history
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a student transport history
 *     tags: [StudentTransportHistories]
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
 *               direction:
 *                 type: string
 *                 enum: [HomeToSchool, SchoolToHome]
 *               staffId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: History updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a student transport history
 *     tags: [StudentTransportHistories]
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
 *         description: History deleted
 *       404:
 *         description: Not found
 */
export const studentTransportHistoryController = {
  create: async (req: Request, res: Response) => {
    try {
      const { studentId, bustopId, vehicleTripId, startTime, endTime, direction, staffId } =
        req.body ?? {};
      if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
        return res.status(400).json({ success: false, message: "studentId is required" });
      }
      if (!bustopId || typeof bustopId !== "string" || !bustopId.trim()) {
        return res.status(400).json({ success: false, message: "bustopId is required" });
      }
      if (!vehicleTripId || typeof vehicleTripId !== "string" || !vehicleTripId.trim()) {
        return res.status(400).json({ success: false, message: "vehicleTripId is required" });
      }
      if (startTime === undefined || startTime === null) {
        return res.status(400).json({ success: false, message: "startTime is required" });
      }

      const parsedDirection = parseDirection(direction);
      if (parsedDirection === "invalid") {
        return res.status(400).json({
          success: false,
          message: "direction must be one of HomeToSchool, SchoolToHome",
        });
      }

      const created = await studentTransportHistoryService.create({
        studentId: studentId.trim(),
        bustopId: bustopId.trim(),
        vehicleTripId: vehicleTripId.trim(),
        startTime,
        ...(endTime !== undefined ? { endTime } : {}),
        ...(parsedDirection !== undefined ? { direction: parsedDirection } : {}),
        ...(staffId !== undefined ? { staffId } : {}),
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
      const direction = parseDirection(queryString(req.query, "direction"));
      if (direction === "invalid") {
        return res.status(400).json({
          success: false,
          message: "direction must be one of HomeToSchool, SchoolToHome",
        });
      }

      const result = await studentTransportHistoryService.list({
        studentId: queryString(req.query, "studentId"),
        bustopId: queryString(req.query, "bustopId"),
        vehicleTripId: queryString(req.query, "vehicleTripId"),
        staffId: queryString(req.query, "staffId"),
        ...(direction !== undefined ? { direction } : {}),
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

      const { endTime, direction, staffId } = req.body ?? {};
      if (endTime === undefined && direction === undefined && staffId === undefined) {
        return res.status(400).json({
          success: false,
          message: "At least one of endTime, direction, or staffId must be provided",
        });
      }

      const parsedDirection = parseDirection(direction);
      if (parsedDirection === "invalid") {
        return res.status(400).json({
          success: false,
          message: "direction must be one of HomeToSchool, SchoolToHome",
        });
      }

      const updated = await studentTransportHistoryService.update(id, {
        ...(endTime !== undefined ? { endTime } : {}),
        ...(parsedDirection !== undefined ? { direction: parsedDirection } : {}),
        ...(staffId !== undefined ? { staffId } : {}),
      });

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
