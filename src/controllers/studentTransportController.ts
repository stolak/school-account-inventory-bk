import { Request, Response } from "express";
import { Status, TransportSubscriptionType } from "@prisma/client";
import { studentTransportService } from "../services/studentTransportService";
import { handleAssessmentError, requireRouteId } from "../utils/assessmentController";
import { parseIntOrUndefined } from "../utils/request";

function queryString(query: Request["query"], key: string): string | undefined {
  const raw = query[key];
  return typeof raw === "string" ? raw : undefined;
}

function parseStatus(raw: unknown): Status | "All" | undefined | "invalid" {
  if (raw === undefined) return undefined;
  if (raw === "All") return "All";
  if (raw === Status.Active || raw === Status.Inactive || raw === Status.Archived) return raw;
  return "invalid";
}

function parseSubscriptionType(
  raw: unknown
): TransportSubscriptionType | undefined | "invalid" {
  if (raw === undefined) return undefined;
  if (
    raw === TransportSubscriptionType.RoundTrip ||
    raw === TransportSubscriptionType.OneWaySchool ||
    raw === TransportSubscriptionType.OneWayHome
  ) {
    return raw;
  }
  return "invalid";
}

/**
 * @openapi
 * /api/v1/student-transports:
 *   post:
 *     summary: Assign transport to a student
 *     tags: [StudentTransports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, routeId, bustopId]
 *             properties:
 *               studentId:
 *                 type: string
 *               routeId:
 *                 type: string
 *               bustopId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Archived]
 *               subscriptionType:
 *                 type: string
 *                 enum: [RoundTrip, OneWaySchool, OneWayHome]
 *     responses:
 *       201:
 *         description: Student transport assigned
 *   get:
 *     summary: List student transport assignments
 *     tags: [StudentTransports]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Archived, All]
 *       - in: query
 *         name: subscriptionType
 *         schema:
 *           type: string
 *           enum: [RoundTrip, OneWaySchool, OneWayHome]
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
 *         description: Student transports list
 */
/**
 * @openapi
 * /api/v1/student-transports/upsert:
 *   post:
 *     summary: Create or update a student transport assignment
 *     tags: [StudentTransports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, routeId, bustopId]
 *             properties:
 *               studentId:
 *                 type: string
 *               routeId:
 *                 type: string
 *               bustopId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Archived]
 *               subscriptionType:
 *                 type: string
 *                 enum: [RoundTrip, OneWaySchool, OneWayHome]
 *     responses:
 *       200:
 *         description: Student transport upserted
 */
/**
 * @openapi
 * /api/v1/student-transports/by-student/{studentId}:
 *   get:
 *     summary: Get transport assignment by student id
 *     tags: [StudentTransports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student transport
 *       404:
 *         description: Not found
 */
/**
 * @openapi
 * /api/v1/student-transports/{id}:
 *   get:
 *     summary: Get a student transport assignment by ID
 *     tags: [StudentTransports]
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
 *         description: Student transport assignment
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a student transport assignment
 *     tags: [StudentTransports]
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
 *               routeId:
 *                 type: string
 *               bustopId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Archived]
 *               subscriptionType:
 *                 type: string
 *                 enum: [RoundTrip, OneWaySchool, OneWayHome]
 *     responses:
 *       200:
 *         description: Student transport updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Remove a student transport assignment
 *     tags: [StudentTransports]
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
 *         description: Student transport assignment removed
 *       404:
 *         description: Not found
 */
export const studentTransportController = {
  create: async (req: Request, res: Response) => {
    try {
      const { studentId, routeId, bustopId, status, subscriptionType } = req.body ?? {};
      if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
        return res.status(400).json({ success: false, message: "studentId is required" });
      }
      if (!routeId || typeof routeId !== "string" || !routeId.trim()) {
        return res.status(400).json({ success: false, message: "routeId is required" });
      }
      if (!bustopId || typeof bustopId !== "string" || !bustopId.trim()) {
        return res.status(400).json({ success: false, message: "bustopId is required" });
      }

      const parsedStatus = parseStatus(status);
      if (parsedStatus === "invalid" || parsedStatus === "All") {
        return res.status(400).json({
          success: false,
          message: "status must be one of Active, Inactive, Archived",
        });
      }

      const parsedSubscriptionType = parseSubscriptionType(subscriptionType);
      if (parsedSubscriptionType === "invalid") {
        return res.status(400).json({
          success: false,
          message: "subscriptionType must be one of RoundTrip, OneWaySchool, OneWayHome",
        });
      }

      const created = await studentTransportService.create({
        studentId: studentId.trim(),
        routeId: routeId.trim(),
        bustopId: bustopId.trim(),
        ...(parsedStatus !== undefined ? { status: parsedStatus } : {}),
        ...(parsedSubscriptionType !== undefined
          ? { subscriptionType: parsedSubscriptionType }
          : {}),
      });

      return res.status(201).json({
        success: true,
        message: "Student transport assigned successfully",
        data: created,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to assign student transport");
    }
  },

  upsert: async (req: Request, res: Response) => {
    try {
      const { studentId, routeId, bustopId, status, subscriptionType } = req.body ?? {};
      if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
        return res.status(400).json({ success: false, message: "studentId is required" });
      }
      if (!routeId || typeof routeId !== "string" || !routeId.trim()) {
        return res.status(400).json({ success: false, message: "routeId is required" });
      }
      if (!bustopId || typeof bustopId !== "string" || !bustopId.trim()) {
        return res.status(400).json({ success: false, message: "bustopId is required" });
      }

      const parsedStatus = parseStatus(status);
      if (parsedStatus === "invalid" || parsedStatus === "All") {
        return res.status(400).json({
          success: false,
          message: "status must be one of Active, Inactive, Archived",
        });
      }

      const parsedSubscriptionType = parseSubscriptionType(subscriptionType);
      if (parsedSubscriptionType === "invalid") {
        return res.status(400).json({
          success: false,
          message: "subscriptionType must be one of RoundTrip, OneWaySchool, OneWayHome",
        });
      }

      const row = await studentTransportService.upsert({
        studentId: studentId.trim(),
        routeId: routeId.trim(),
        bustopId: bustopId.trim(),
        ...(parsedStatus !== undefined ? { status: parsedStatus } : {}),
        ...(parsedSubscriptionType !== undefined
          ? { subscriptionType: parsedSubscriptionType }
          : {}),
      });

      return res.json({
        success: true,
        message: "Student transport upserted successfully",
        data: row,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to upsert student transport");
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const status = parseStatus(queryString(req.query, "status"));
      if (status === "invalid") {
        return res.status(400).json({
          success: false,
          message: "status must be one of Active, Inactive, Archived, All",
        });
      }

      const subscriptionType = parseSubscriptionType(
        queryString(req.query, "subscriptionType")
      );
      if (subscriptionType === "invalid") {
        return res.status(400).json({
          success: false,
          message: "subscriptionType must be one of RoundTrip, OneWaySchool, OneWayHome",
        });
      }

      const result = await studentTransportService.list({
        studentId: queryString(req.query, "studentId"),
        routeId: queryString(req.query, "routeId"),
        bustopId: queryString(req.query, "bustopId"),
        status,
        ...(subscriptionType !== undefined ? { subscriptionType } : {}),
        page: parseIntOrUndefined(req.query.page),
        limit: parseIntOrUndefined(req.query.limit),
      });

      return res.json({
        success: true,
        message: "Student transports retrieved successfully",
        data: result,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve student transports");
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const row = await studentTransportService.getById(id);
      if (!row) {
        return res
          .status(404)
          .json({ success: false, message: "Student transport assignment not found" });
      }

      return res.json({
        success: true,
        message: "Student transport retrieved successfully",
        data: row,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve student transport");
    }
  },

  getByStudentId: async (req: Request, res: Response) => {
    try {
      const studentId = req.params.studentId;
      if (!studentId || !studentId.trim()) {
        return res.status(400).json({ success: false, message: "studentId is required" });
      }

      const row = await studentTransportService.getByStudentId(studentId);
      if (!row) {
        return res
          .status(404)
          .json({ success: false, message: "Student transport assignment not found" });
      }

      return res.json({
        success: true,
        message: "Student transport retrieved successfully",
        data: row,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve student transport");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const { routeId, bustopId, status, subscriptionType } = req.body ?? {};
      if (
        routeId === undefined &&
        bustopId === undefined &&
        status === undefined &&
        subscriptionType === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one of routeId, bustopId, status, or subscriptionType must be provided",
        });
      }

      const parsedStatus = parseStatus(status);
      if (parsedStatus === "invalid" || parsedStatus === "All") {
        return res.status(400).json({
          success: false,
          message: "status must be one of Active, Inactive, Archived",
        });
      }

      const parsedSubscriptionType = parseSubscriptionType(subscriptionType);
      if (parsedSubscriptionType === "invalid") {
        return res.status(400).json({
          success: false,
          message: "subscriptionType must be one of RoundTrip, OneWaySchool, OneWayHome",
        });
      }

      const updated = await studentTransportService.update(id, {
        ...(routeId !== undefined ? { routeId: String(routeId) } : {}),
        ...(bustopId !== undefined ? { bustopId: String(bustopId) } : {}),
        ...(parsedStatus !== undefined ? { status: parsedStatus } : {}),
        ...(parsedSubscriptionType !== undefined
          ? { subscriptionType: parsedSubscriptionType }
          : {}),
      });

      return res.json({
        success: true,
        message: "Student transport updated successfully",
        data: updated,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to update student transport");
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const deleted = await studentTransportService.delete(id);

      return res.json({
        success: true,
        message: "Student transport assignment removed successfully",
        data: deleted,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to remove student transport assignment");
    }
  },
};
