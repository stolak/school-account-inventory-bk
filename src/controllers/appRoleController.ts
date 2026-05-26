import { Request, Response } from "express";
import { appRoleService, AppRoleStatus } from "../services/appRoleService";

const APP_ROLE_STATUSES: AppRoleStatus[] = ["active", "inactive"];

function parseAppRoleStatus(value: string | undefined): AppRoleStatus | "all" | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "all") {
    return "all";
  }
  if (value === "active" || value === "inactive") {
    return value;
  }
  return undefined;
}

function parsePrivilegeIds(body: unknown): string[] | null {
  const privilegeIds = (body as { privilegeIds?: unknown })?.privilegeIds;
  if (!Array.isArray(privilegeIds) || privilegeIds.length === 0) {
    return null;
  }
  if (!privilegeIds.every((id) => typeof id === "string" && id.trim())) {
    return null;
  }
  return privilegeIds.map((id) => id.trim());
}

/**
 * @openapi
 * /api/v1/app-roles:
 *   post:
 *     summary: Create an application role
 *     tags: [AppRoles]
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
 *                 example: "Store Manager"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Optional status (defaults to active)
 *     responses:
 *       201:
 *         description: Role created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 *   get:
 *     summary: List application roles
 *     tags: [AppRoles]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional search query (matches role name)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *         description: Defaults to active only. Use all to include active and inactive.
 *     responses:
 *       200:
 *         description: Roles list
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
export const appRoleController = {
  createAppRole: async (req: Request, res: Response) => {
    try {
      const { name, status } = req.body ?? {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Role name is required",
        });
      }

      if (status !== undefined && !APP_ROLE_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "status must be active or inactive",
        });
      }

      const role = await appRoleService.createAppRole({
        name: name.trim(),
        ...(status !== undefined ? { status } : {}),
      });

      return res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: role,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to create role",
      });
    }
  },

  listAppRoles: async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
      const status = parseAppRoleStatus(statusRaw);

      if (statusRaw !== undefined && status === undefined) {
        return res.status(400).json({
          success: false,
          message: "status must be active, inactive, or all",
        });
      }

      const roles = await appRoleService.listAppRoles({ q, status });

      return res.json({
        success: true,
        message: "Roles retrieved successfully",
        data: { roles },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve roles",
        error: error?.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/app-roles/{id}:
   *   get:
   *     summary: Get an application role by ID (includes privileges)
   *     tags: [AppRoles]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: Role details with privileges
   *       404:
   *         description: Role not found
   *       500:
   *         description: Server error
   *   put:
   *     summary: Update an application role
   *     tags: [AppRoles]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *     responses:
   *       200:
   *         description: Role updated
   *       400:
   *         description: Validation error
   *       404:
   *         description: Role not found
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Delete an application role
   *     tags: [AppRoles]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: Role deleted
   *       404:
   *         description: Role not found
   *       409:
   *         description: Role is referenced by users or menus
   *       500:
   *         description: Server error
   */
  getAppRoleById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Role id parameter is required",
        });
      }

      const role = await appRoleService.getAppRoleById(id);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      return res.json({
        success: true,
        message: "Role retrieved successfully",
        data: role,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve role",
        error: error?.message,
      });
    }
  },

  updateAppRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, status } = req.body ?? {};

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Role id parameter is required",
        });
      }

      if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        return res.status(400).json({
          success: false,
          message: "name must be a non-empty string",
        });
      }

      if (status !== undefined && !APP_ROLE_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "status must be active or inactive",
        });
      }

      const existing = await appRoleService.getAppRoleById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      const updated = await appRoleService.updateAppRole(id, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(status !== undefined ? { status } : {}),
      });

      return res.json({
        success: true,
        message: "Role updated successfully",
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to update role",
      });
    }
  },

  deleteAppRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Role id parameter is required",
        });
      }

      const existing = await appRoleService.getAppRoleById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      const deleted = await appRoleService.deleteAppRole(id);

      return res.json({
        success: true,
        message: "Role deleted successfully",
        data: deleted,
      });
    } catch (error: any) {
      const message = error?.message ?? "Failed to delete role";
      const httpStatus = message.includes("Cannot delete role") ? 409 : 500;
      return res.status(httpStatus).json({ success: false, message });
    }
  },

  /**
   * @openapi
   * /api/v1/app-roles/{id}/privileges:
   *   post:
   *     summary: Assign privileges to a role
   *     tags: [AppRoles]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [privilegeIds]
   *             properties:
   *               privilegeIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["uuid-1", "uuid-2"]
   *     responses:
   *       200:
   *         description: Privileges assigned; returns role with updated privileges
   *       400:
   *         description: Validation error
   *       404:
   *         description: Role or privilege not found
   *       500:
   *         description: Server error
   */
  addPrivilegesToRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const privilegeIds = parsePrivilegeIds(req.body);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Role id parameter is required",
        });
      }

      if (!privilegeIds) {
        return res.status(400).json({
          success: false,
          message: "privilegeIds must be a non-empty array of strings",
        });
      }

      const role = await appRoleService.addPrivilegesToRole(id, privilegeIds);

      return res.json({
        success: true,
        message: "Privileges added to role successfully",
        data: role,
      });
    } catch (error: any) {
      const message = error?.message ?? "Failed to add privileges to role";
      const httpStatus =
        message === "Role not found" || message.includes("privilege IDs were not found")
          ? 404
          : 500;
      return res.status(httpStatus).json({ success: false, message });
    }
  },

  /**
   * @openapi
   * /api/v1/app-roles/{id}/privileges/{privilegeId}:
   *   delete:
   *     summary: Remove a privilege from a role
   *     tags: [AppRoles]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *       - in: path
   *         name: privilegeId
   *         required: true
   *         schema:
   *           type: string
   *         description: Privilege ID
   *     responses:
   *       200:
   *         description: Privilege removed; returns role with updated privileges
   *       404:
   *         description: Role not found or privilege not assigned
   *       500:
   *         description: Server error
   */
  removePrivilegeFromRole: async (req: Request, res: Response) => {
    try {
      const { id, privilegeId } = req.params;

      if (!id || !privilegeId) {
        return res.status(400).json({
          success: false,
          message: "Role id and privilege id parameters are required",
        });
      }

      const role = await appRoleService.removePrivilegeFromRole(id, privilegeId);

      return res.json({
        success: true,
        message: "Privilege removed from role successfully",
        data: role,
      });
    } catch (error: any) {
      const message = error?.message ?? "Failed to remove privilege from role";
      const httpStatus =
        message === "Role not found" || message === "Privilege is not assigned to this role"
          ? 404
          : 500;
      return res.status(httpStatus).json({ success: false, message });
    }
  },
};
