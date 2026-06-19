import { Request, Response } from "express";
import { classGradingTemplateService } from "../services/classGradingTemplateService";
import { handleAssessmentError, requireRouteId } from "../utils/assessmentController";
import { parseBodyStatus, parseStatusQuery } from "../utils/assessmentHttp";

function queryString(query: Request["query"], key: string): string | undefined {
  const raw = query[key];
  return typeof raw === "string" ? raw : undefined;
}

/**
 * @openapi
 * /api/v1/class-grading-templates:
 *   post:
 *     summary: Assign a grading template to a class
 *     tags: [ClassGradingTemplates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, classId, sessionId, termId, gradingTemplateId]
 *             properties:
 *               name:
 *                 type: string
 *               classId:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               termId:
 *                 type: string
 *               gradingTemplateId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Archived]
 *     responses:
 *       201:
 *         description: Class grading template created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Conflict
 *       500:
 *         description: Server error
 *   get:
 *     summary: List class grading template assignments
 *     tags: [ClassGradingTemplates]
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
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: termId
 *         schema:
 *           type: string
 *       - in: query
 *         name: gradingTemplateId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class grading templates list
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
export const classGradingTemplateController = {
  create: async (req: Request, res: Response) => {
    try {
      const { name, classId, sessionId, termId, gradingTemplateId, status } = req.body ?? {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ success: false, message: "name is required" });
      }
      if (!classId || typeof classId !== "string" || !classId.trim()) {
        return res.status(400).json({ success: false, message: "classId is required" });
      }
      if (!sessionId || typeof sessionId !== "string" || !sessionId.trim()) {
        return res.status(400).json({ success: false, message: "sessionId is required" });
      }
      if (!termId || typeof termId !== "string" || !termId.trim()) {
        return res.status(400).json({ success: false, message: "termId is required" });
      }
      if (!gradingTemplateId || typeof gradingTemplateId !== "string" || !gradingTemplateId.trim()) {
        return res.status(400).json({ success: false, message: "gradingTemplateId is required" });
      }

      const parsedStatus = parseBodyStatus(status);
      if (status !== undefined && parsedStatus === undefined) {
        return res.status(400).json({
          success: false,
          message: "status must be Active, Inactive, or Archived",
        });
      }

      const created = await classGradingTemplateService.create({
        name: name.trim(),
        classId: classId.trim(),
        sessionId: sessionId.trim(),
        termId: termId.trim(),
        gradingTemplateId: gradingTemplateId.trim(),
        ...(parsedStatus !== undefined ? { status: parsedStatus } : {}),
      });

      return res.status(201).json({
        success: true,
        message: "Class grading template created successfully",
        data: created,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to create class grading template");
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const statusRaw = queryString(req.query, "status");
      const status = parseStatusQuery(statusRaw);
      if (typeof statusRaw === "string" && status === undefined) {
        return res.status(400).json({
          success: false,
          message: "status must be Active, Inactive, Archived, or All",
        });
      }

      const result = await classGradingTemplateService.list({
        q: queryString(req.query, "q"),
        status,
        classId: queryString(req.query, "classId"),
        sessionId: queryString(req.query, "sessionId"),
        termId: queryString(req.query, "termId"),
        gradingTemplateId: queryString(req.query, "gradingTemplateId"),
      });

      return res.json({
        success: true,
        message: "Class grading templates retrieved successfully",
        data: result,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve class grading templates");
    }
  },

  /**
   * @openapi
   * /api/v1/class-grading-templates/{id}:
   *   get:
   *     summary: Get a class grading template by ID
   *     tags: [ClassGradingTemplates]
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
   *         description: Class grading template details
   *       404:
   *         description: Not found
   *       500:
   *         description: Server error
   *   put:
   *     summary: Update a class grading template assignment
   *     tags: [ClassGradingTemplates]
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
   *               name:
   *                 type: string
   *               classId:
   *                 type: string
   *               sessionId:
   *                 type: string
   *               termId:
   *                 type: string
   *               gradingTemplateId:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [Active, Inactive, Archived]
   *     responses:
   *       200:
   *         description: Class grading template updated
   *       400:
   *         description: Validation error
   *       404:
   *         description: Not found
   *       409:
   *         description: Conflict
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Delete a class grading template assignment
   *     tags: [ClassGradingTemplates]
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
   *         description: Class grading template deleted
   *       404:
   *         description: Not found
   *       500:
   *         description: Server error
   */
  getById: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const row = await classGradingTemplateService.getById(id);
      if (!row) {
        return res.status(404).json({ success: false, message: "Class grading template not found" });
      }

      return res.json({
        success: true,
        message: "Class grading template retrieved successfully",
        data: row,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve class grading template");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const { name, classId, sessionId, termId, gradingTemplateId, status } = req.body ?? {};
      if (
        name === undefined &&
        classId === undefined &&
        sessionId === undefined &&
        termId === undefined &&
        gradingTemplateId === undefined &&
        status === undefined
      ) {
        return res.status(400).json({ success: false, message: "At least one field must be provided" });
      }

      if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        return res.status(400).json({ success: false, message: "name must be a non-empty string" });
      }
      if (classId !== undefined && (typeof classId !== "string" || !classId.trim())) {
        return res.status(400).json({ success: false, message: "classId must be a non-empty string" });
      }
      if (sessionId !== undefined && (typeof sessionId !== "string" || !sessionId.trim())) {
        return res.status(400).json({ success: false, message: "sessionId must be a non-empty string" });
      }
      if (termId !== undefined && (typeof termId !== "string" || !termId.trim())) {
        return res.status(400).json({ success: false, message: "termId must be a non-empty string" });
      }
      if (
        gradingTemplateId !== undefined &&
        (typeof gradingTemplateId !== "string" || !gradingTemplateId.trim())
      ) {
        return res.status(400).json({ success: false, message: "gradingTemplateId must be a non-empty string" });
      }

      const parsedStatus = parseBodyStatus(status);
      if (status !== undefined && parsedStatus === undefined) {
        return res.status(400).json({
          success: false,
          message: "status must be Active, Inactive, or Archived",
        });
      }

      const updated = await classGradingTemplateService.update(id, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(classId !== undefined ? { classId: classId.trim() } : {}),
        ...(sessionId !== undefined ? { sessionId: sessionId.trim() } : {}),
        ...(termId !== undefined ? { termId: termId.trim() } : {}),
        ...(gradingTemplateId !== undefined ? { gradingTemplateId: gradingTemplateId.trim() } : {}),
        ...(parsedStatus !== undefined ? { status: parsedStatus } : {}),
      });

      return res.json({
        success: true,
        message: "Class grading template updated successfully",
        data: updated,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to update class grading template");
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const deleted = await classGradingTemplateService.delete(id);

      return res.json({
        success: true,
        message: "Class grading template deleted successfully",
        data: deleted,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to delete class grading template");
    }
  },
};
