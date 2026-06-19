import { Request, Response } from "express";
import { studentAssessmentScoreService } from "../services/studentAssessmentScoreService";
import { handleAssessmentError, requireRouteId } from "../utils/assessmentController";
import { parseBodyDecimal } from "../utils/assessmentHttp";

function queryString(query: Request["query"], key: string): string | undefined {
  const raw = query[key];
  return typeof raw === "string" ? raw : undefined;
}

/**
 * @openapi
 * /api/v1/student-assessment-scores:
 *   post:
 *     summary: Record a student assessment score
 *     tags: [StudentAssessmentScores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentSubjectRegistrationId, componentId, score]
 *             properties:
 *               studentSubjectRegistrationId:
 *                 type: string
 *               componentId:
 *                 type: string
 *               score:
 *                 type: number
 *     responses:
 *       201:
 *         description: Student assessment score created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Conflict
 *       500:
 *         description: Server error
 *   get:
 *     summary: List student assessment scores
 *     tags: [StudentAssessmentScores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentSubjectRegistrationId
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
 *         name: componentId
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
 *         name: studentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student assessment scores list
 *       500:
 *         description: Server error
 */
export const studentAssessmentScoreController = {
  create: async (req: Request, res: Response) => {
    try {
      const {
        studentSubjectRegistrationId,
        componentId,
        score,
      } = req.body ?? {};

      if (
        !studentSubjectRegistrationId ||
        typeof studentSubjectRegistrationId !== "string" ||
        !studentSubjectRegistrationId.trim()
      ) {
        return res.status(400).json({ success: false, message: "studentSubjectRegistrationId is required" });
      }
      if (!componentId || typeof componentId !== "string" || !componentId.trim()) {
        return res.status(400).json({ success: false, message: "componentId is required" });
      }

      const parsedScore = parseBodyDecimal(score, "score");
      if (parsedScore === "missing") {
        return res.status(400).json({ success: false, message: "score is required" });
      }
      if (parsedScore === "invalid") {
        return res.status(400).json({ success: false, message: "score must be a number" });
      }

      const created = await studentAssessmentScoreService.create({
        studentSubjectRegistrationId: studentSubjectRegistrationId.trim(),
        componentId: componentId.trim(),
        score: parsedScore,
      });

      return res.status(201).json({
        success: true,
        message: "Student assessment score created successfully",
        data: created,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to create student assessment score");
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const result = await studentAssessmentScoreService.list({
        studentSubjectRegistrationId: queryString(req.query, "studentSubjectRegistrationId"),
        classId: queryString(req.query, "classId"),
        subclassId: queryString(req.query, "subclassId"),
        subjectId: queryString(req.query, "subjectId"),
        componentId: queryString(req.query, "componentId"),
        sessionId: queryString(req.query, "sessionId"),
        termId: queryString(req.query, "termId"),
        studentId: queryString(req.query, "studentId"),
      });

      return res.json({
        success: true,
        message: "Student assessment scores retrieved successfully",
        data: result,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve student assessment scores");
    }
  },

  /**
   * @openapi
   * /api/v1/student-assessment-scores/{id}:
   *   get:
   *     summary: Get a student assessment score by ID
   *     tags: [StudentAssessmentScores]
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
   *         description: Student assessment score details
   *       404:
   *         description: Not found
   *       500:
   *         description: Server error
   *   put:
   *     summary: Update a student assessment score
   *     tags: [StudentAssessmentScores]
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
   *               score:
   *                 type: number
   *               componentId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Student assessment score updated
   *       400:
   *         description: Validation error
   *       404:
   *         description: Not found
   *       409:
   *         description: Conflict
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Delete a student assessment score
   *     tags: [StudentAssessmentScores]
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
   *         description: Student assessment score deleted
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

      const row = await studentAssessmentScoreService.getById(id);
      if (!row) {
        return res.status(404).json({ success: false, message: "Student assessment score not found" });
      }

      return res.json({
        success: true,
        message: "Student assessment score retrieved successfully",
        data: row,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve student assessment score");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const { score, componentId } = req.body ?? {};
      if (score === undefined && componentId === undefined) {
        return res.status(400).json({ success: false, message: "At least one of score or componentId must be provided" });
      }

      let parsedScore: string | number | undefined;
      if (score !== undefined) {
        const parsed = parseBodyDecimal(score, "score");
        if (parsed === "invalid" || parsed === "missing") {
          return res.status(400).json({ success: false, message: "score must be a number" });
        }
        parsedScore = parsed;
      }

      if (componentId !== undefined && (typeof componentId !== "string" || !componentId.trim())) {
        return res.status(400).json({ success: false, message: "componentId must be a non-empty string" });
      }

      const updated = await studentAssessmentScoreService.update(id, {
        ...(parsedScore !== undefined ? { score: parsedScore } : {}),
        ...(componentId !== undefined ? { componentId: componentId.trim() } : {}),
      });

      return res.json({
        success: true,
        message: "Student assessment score updated successfully",
        data: updated,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to update student assessment score");
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const deleted = await studentAssessmentScoreService.delete(id);

      return res.json({
        success: true,
        message: "Student assessment score deleted successfully",
        data: deleted,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to delete student assessment score");
    }
  },
};
