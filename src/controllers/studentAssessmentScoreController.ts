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
/**
 * @openapi
 * /api/v1/student-assessment-scores/bulk:
 *   post:
 *     summary: Create or update assessment scores for multiple students for one component
 *     tags: [StudentAssessmentScores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [componentId, subjectScores]
 *             properties:
 *               componentId:
 *                 type: string
 *                 description: Assessment component ID (max score applies to every entry)
 *               subjectScores:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [studentSubjectRegistrationId, score]
 *                   properties:
 *                     studentSubjectRegistrationId:
 *                       type: string
 *                     score:
 *                       type: number
 *                       minimum: 0
 *           example:
 *             componentId: "a1b2c3d4-e5f6-4789-a012-345678901234"
 *             subjectScores:
 *               - studentSubjectRegistrationId: "783efb59-9eea-4ec0-bd69-0e076558419a"
 *                 score: 7
 *               - studentSubjectRegistrationId: "65ffa15a-065d-42e0-8dbf-033e9d47b17f"
 *                 score: 12
 *     responses:
 *       201:
 *         description: Student assessment scores created or updated
 *       400:
 *         description: Validation error (including score exceeding component maxScore)
 *       409:
 *         description: Component locked or conflict
 *       500:
 *         description: Server error
 */
/**
 * @openapi
 * /api/v1/student-assessment-scores/score-sheet:
 *   get:
 *     summary: List registered students with scores for a component (0 when not yet recorded)
 *     tags: [StudentAssessmentScores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: subclassId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Score entry sheet for registered students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     componentId:
 *                       type: string
 *                     subjectScores:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           studentName:
 *                             type: string
 *                           studentSubjectRegistrationId:
 *                             type: string
 *                           score:
 *                             type: number
 *             example:
 *               success: true
 *               message: Score sheet retrieved successfully
 *               data:
 *                 componentId: "a1b2c3d4-e5f6-4789-a012-345678901234"
 *                 subjectScores:
 *                   - studentName: "Chioma Adebayo"
 *                     studentSubjectRegistrationId: "783efb59-9eea-4ec0-bd69-0e076558419a"
 *                     score: 0
 *                   - studentName: "John Doe"
 *                     studentSubjectRegistrationId: "65ffa15a-065d-42e0-8dbf-033e9d47b17f"
 *                     score: 12
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
export const studentAssessmentScoreController = {
  createBulk: async (req: Request, res: Response) => {
    try {
      const { componentId, subjectScores } = req.body ?? {};

      if (!componentId || typeof componentId !== "string" || !componentId.trim()) {
        return res.status(400).json({ success: false, message: "componentId is required" });
      }
      if (!Array.isArray(subjectScores) || subjectScores.length === 0) {
        return res.status(400).json({ success: false, message: "subjectScores must be a non-empty array" });
      }

      for (let i = 0; i < subjectScores.length; i++) {
        const entry = subjectScores[i];
        if (!entry || typeof entry !== "object") {
          return res.status(400).json({
            success: false,
            message: `subjectScores[${i}] must be an object`,
          });
        }
        const { studentSubjectRegistrationId, score } = entry as {
          studentSubjectRegistrationId?: unknown;
          score?: unknown;
        };
        if (
          !studentSubjectRegistrationId ||
          typeof studentSubjectRegistrationId !== "string" ||
          !studentSubjectRegistrationId.trim()
        ) {
          return res.status(400).json({
            success: false,
            message: `subjectScores[${i}].studentSubjectRegistrationId is required`,
          });
        }
        const parsedScore = parseBodyDecimal(score, "score");
        if (parsedScore === "missing") {
          return res.status(400).json({
            success: false,
            message: `subjectScores[${i}].score is required`,
          });
        }
        if (parsedScore === "invalid") {
          return res.status(400).json({
            success: false,
            message: `subjectScores[${i}].score must be a number`,
          });
        }
      }

      const created = await studentAssessmentScoreService.createMany({
        componentId: componentId.trim(),
        subjectScores: subjectScores.map(
          (entry: { studentSubjectRegistrationId: string; score: string | number }) => ({
            studentSubjectRegistrationId: entry.studentSubjectRegistrationId.trim(),
            score: entry.score,
          })
        ),
      });

      return res.status(201).json({
        success: true,
        message: "Student assessment scores saved successfully",
        data: created,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to create student assessment scores");
    }
  },

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

  scoreSheet: async (req: Request, res: Response) => {
    try {
      const classId = queryString(req.query, "classId");
      const subclassId = queryString(req.query, "subclassId");
      const sessionId = queryString(req.query, "sessionId");
      const termId = queryString(req.query, "termId");
      const subjectId = queryString(req.query, "subjectId");
      const componentId = queryString(req.query, "componentId");

      if (!classId?.trim()) {
        return res.status(400).json({ success: false, message: "classId is required" });
      }
      if (!sessionId?.trim()) {
        return res.status(400).json({ success: false, message: "sessionId is required" });
      }
      if (!termId?.trim()) {
        return res.status(400).json({ success: false, message: "termId is required" });
      }
      if (!subjectId?.trim()) {
        return res.status(400).json({ success: false, message: "subjectId is required" });
      }
      if (!componentId?.trim()) {
        return res.status(400).json({ success: false, message: "componentId is required" });
      }

      const result = await studentAssessmentScoreService.getScoreSheet({
        classId: classId.trim(),
        sessionId: sessionId.trim(),
        termId: termId.trim(),
        subjectId: subjectId.trim(),
        componentId: componentId.trim(),
        ...(subclassId?.trim() ? { subclassId: subclassId.trim() } : {}),
      });

      return res.json({
        success: true,
        message: "Score sheet retrieved successfully",
        data: result,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve score sheet");
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
