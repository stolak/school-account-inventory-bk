import { Request, Response } from "express";
import { routeService } from "../services/routeService";
import { handleAssessmentError, requireRouteId } from "../utils/assessmentController";
import { parseIntOrUndefined } from "../utils/request";

function queryString(query: Request["query"], key: string): string | undefined {
  const raw = query[key];
  return typeof raw === "string" ? raw : undefined;
}

/**
 * @openapi
 * /api/v1/routes:
 *   post:
 *     summary: Create a transport route
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Route created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate route name
 *   get:
 *     summary: List transport routes
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
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
 *         description: Routes list
 */
/**
 * @openapi
 * /api/v1/routes/{id}:
 *   get:
 *     summary: Get a transport route by ID
 *     tags: [Routes]
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
 *         description: Route details
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a transport route
 *     tags: [Routes]
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
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Route updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 *       409:
 *         description: Duplicate route name
 *   delete:
 *     summary: Delete a transport route
 *     tags: [Routes]
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
 *         description: Route deleted
 *       400:
 *         description: Cannot delete because it is assigned to vehicles
 *       404:
 *         description: Not found
 */
export const routeController = {
  create: async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body ?? {};
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ success: false, message: "name is required" });
      }

      const created = await routeService.create({
        name: name.trim(),
        ...(description !== undefined
          ? { description: description === null ? null : String(description) }
          : {}),
      });

      return res.status(201).json({
        success: true,
        message: "Route created successfully",
        data: created,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to create route");
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const result = await routeService.list({
        q: queryString(req.query, "q"),
        page: parseIntOrUndefined(req.query.page),
        limit: parseIntOrUndefined(req.query.limit),
      });

      return res.json({
        success: true,
        message: "Routes retrieved successfully",
        data: result,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve routes");
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const row = await routeService.getById(id);
      if (!row) {
        return res.status(404).json({ success: false, message: "Route not found" });
      }

      return res.json({
        success: true,
        message: "Route retrieved successfully",
        data: row,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to retrieve route");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const { name, description } = req.body ?? {};
      if (name === undefined && description === undefined) {
        return res.status(400).json({
          success: false,
          message: "At least one of name or description must be provided",
        });
      }
      if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        return res.status(400).json({ success: false, message: "name cannot be empty" });
      }

      const updated = await routeService.update(id, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined
          ? { description: description === null ? null : String(description) }
          : {}),
      });

      return res.json({
        success: true,
        message: "Route updated successfully",
        data: updated,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to update route");
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const id = requireRouteId(req, res);
      if (!id) return;

      const deleted = await routeService.delete(id);

      return res.json({
        success: true,
        message: "Route deleted successfully",
        data: deleted,
      });
    } catch (error: unknown) {
      return handleAssessmentError(res, error, "Failed to delete route");
    }
  },
};
