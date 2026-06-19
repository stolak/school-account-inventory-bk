import { Request, Response } from "express";
import { studentSubjectRegistrationService } from "../services/studentSubjectRegistrationService";
import { handleAssessmentError, requireRouteId } from "../utils/assessmentController";
import { isStringOrNullOrUndefined } from "../utils/request";

function queryString(query: Request["query"], key: string): string | undefined {
  const raw = query[key];
  return typeof raw === "string" ? raw : undefined;
}

/**
 * @openapi
 * /api/v1/student-subject-registrations:
 *   post:
 *     summary: Register a student for a subject
 *     tags: [StudentSubjectRegistrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, classId, subjectId, sessionId, termId]
 *             properties:
 *               studentId:
 *                 type: string
 *               classId:
 *                 type: string
 *               subclassId:
 *                 type: string
 *                 nullable: true
 *               subjectId:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               termId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student subject registration created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Conflict
 *       500:
 *         description: Server error
 *   get:
 *     summary: List student subject registrations
 *     tags: [StudentSubjectRegistrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: subclassId
 *         schema:
 *           type: string
 *       - in: query
 *         name: subjectId
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
 *     responses:
 *       200:
 *         description: Student subject registrations list
 *       500:
 *         description: Server error
 */
export const studentSubjectRegistrationController = {
  create: async (req: Request, res: Response) => {
    try {
      const { studentId, classId, subclassId, subjectId, sessionId, termId } = req.body ?? {};

      if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
        return res.status(400).json({ success: false, message: "studentId is required" });
      }
      if (!classId || typeof classId !== "string" || !classId.trim()) {
        return res.status(400).json({ success: false, message: "classId is required" });
      }
      if (!subjectId || typeof subjectId !== "string" || !subjectId.trim()) {
        return res.status(400).json({ success: false, message: "subjectId is required" });
      }
      if (!sessionId || typeof sessionId !== "string" || !sessionId.trim()) {
        return res.status(400).json({ success: false, message: "sessionId is required" });
      }
      if (!termId || typeof termId !== "string" || !termId.trim()) {
        return res.status(400).json({ success: false, message: "termId is required" });
      }
      if (!isStringOrNullOrUndefined(subclassId)) {
        return res.status(400).json({ success: false, message: "subclassId must be a string or null" });
      }

      const created = await studentSubjectRegistrationService.create({
        studentId: studentId.trim(),
        classId: classId.trim(),
        subjectId: subjectId.trim(),
        sessionId: sessionId.trim(),
        termId: termId.trim(),
        ...(subclassId !== undefined ? { subclassId: subclassId?.trim() || null } : {}),
      });

      return res.status(201).json({
        success: true,
        message: "Student subject registration created successfully",
        data: created,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to create student subject registration");
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const result = await studentSubjectRegistrationService.list({
        studentId: queryString(req.query, "studentId"),
        classId: queryString(req.query, "classId"),
        subclassId: queryString(req.query, "subclassId"),
        subjectId: queryString(req.query, "subjectId"),
        sessionId: queryString(req.query, "sessionId"),
        termId: queryString(req.query, "termId"),
      });

      return res.json({
        success: true,
        message: "Student subject registrations retrieved successfully",
        data: result,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve student subject registrations");
    }
  },

  /**
   * @openapi
   * /api/v1/student-subject-registrations/{id}:
   *   get:
   *     summary: Get a student subject registration by ID
   *     tags: [StudentSubjectRegistrations]
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
   *         description: Student subject registration details
   *       404:
   *         description: Not found
   *       500:
   *         description: Server error
   *   put:
   *     summary: Update a student subject registration
   *     tags: [StudentSubjectRegistrations]
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
   *               studentId:
   *                 type: string
   *               classId:
   *                 type: string
   *               subclassId:
   *                 type: string
   *                 nullable: true
   *               subjectId:
   *                 type: string
   *               sessionId:
   *                 type: string
   *               termId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Student subject registration updated
   *       400:
   *         description: Validation error
   *       404:
   *         description: Not found
   *       409:
   *         description: Conflict
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Delete a student subject registration
   *     tags: [StudentSubjectRegistrations]
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
   *         description: Student subject registration deleted
   *       404:
   *         description: Not found
   *       409:
   *         description: Conflict
   *       500:
   *         description: Server error
   */
  getById: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const row = await studentSubjectRegistrationService.getById(id);
      if (!row) {
        return res.status(404).json({ success: false, message: "Student subject registration not found" });
      }

      return res.json({
        success: true,
        message: "Student subject registration retrieved successfully",
        data: row,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve student subject registration");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const { studentId, classId, subclassId, subjectId, sessionId, termId } = req.body ?? {};
      if (
        studentId === undefined &&
        classId === undefined &&
        subclassId === undefined &&
        subjectId === undefined &&
        sessionId === undefined &&
        termId === undefined
      ) {
        return res.status(400).json({ success: false, message: "At least one field must be provided" });
      }

      if (studentId !== undefined && (typeof studentId !== "string" || !studentId.trim())) {
        return res.status(400).json({ success: false, message: "studentId must be a non-empty string" });
      }
      if (classId !== undefined && (typeof classId !== "string" || !classId.trim())) {
        return res.status(400).json({ success: false, message: "classId must be a non-empty string" });
      }
      if (!isStringOrNullOrUndefined(subclassId)) {
        return res.status(400).json({ success: false, message: "subclassId must be a string or null" });
      }
      if (subjectId !== undefined && (typeof subjectId !== "string" || !subjectId.trim())) {
        return res.status(400).json({ success: false, message: "subjectId must be a non-empty string" });
      }
      if (sessionId !== undefined && (typeof sessionId !== "string" || !sessionId.trim())) {
        return res.status(400).json({ success: false, message: "sessionId must be a non-empty string" });
      }
      if (termId !== undefined && (typeof termId !== "string" || !termId.trim())) {
        return res.status(400).json({ success: false, message: "termId must be a non-empty string" });
      }

      const updated = await studentSubjectRegistrationService.update(id, {
        ...(studentId !== undefined ? { studentId: studentId.trim() } : {}),
        ...(classId !== undefined ? { classId: classId.trim() } : {}),
        ...(subclassId !== undefined ? { subclassId: subclassId?.trim() || null } : {}),
        ...(subjectId !== undefined ? { subjectId: subjectId.trim() } : {}),
        ...(sessionId !== undefined ? { sessionId: sessionId.trim() } : {}),
        ...(termId !== undefined ? { termId: termId.trim() } : {}),
      });

      return res.json({
        success: true,
        message: "Student subject registration updated successfully",
        data: updated,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to update student subject registration");
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const deleted = await studentSubjectRegistrationService.delete(id);

      return res.json({
        success: true,
        message: "Student subject registration deleted successfully",
        data: deleted,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to delete student subject registration");
    }
  },
};
