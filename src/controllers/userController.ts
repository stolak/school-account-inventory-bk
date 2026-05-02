import { Request, Response } from "express";
import { Role, UserType } from "@prisma/client";
import { userService } from "../services/userService";
import { parseIntOrUndefined } from "../utils/request";

const USER_TYPES = new Set<string>(Object.values(UserType));
const ROLES = new Set<string>(Object.values(Role));

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: List users with filters
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Paginated list. Passwords are never returned.
 *       By default excludes users with isDeleted=true unless includeDeleted=true.
 *       Filters combine with AND. Optional q searches email, firstName, lastName (substring).
 *     parameters:
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [Admin, Merchant, Buyer]
 *         description: Filter by Prisma UserType
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Visitor, Admin, Merchant, Buyer, SuperAdmin, CustomerSupport]
 *         description: Filter by Prisma Role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by User.status string (e.g. active)
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search email, firstName, lastName (contains)
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *         description: If true, include soft-deleted users
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: users array and pagination
 *       400:
 *         description: Invalid userType or role
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export const userController = {
  listUsers: async (req: Request, res: Response) => {
    try {
      const userTypeRaw = typeof req.query.userType === "string" ? req.query.userType : undefined;
      const roleRaw = typeof req.query.role === "string" ? req.query.role : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const includeDeletedRaw = req.query.includeDeleted;

      let userType: UserType | undefined;
      if (userTypeRaw !== undefined) {
        if (!USER_TYPES.has(userTypeRaw)) {
          return res.status(400).json({
            success: false,
            message: "userType must be Admin, Merchant, or Buyer",
          });
        }
        userType = userTypeRaw as UserType;
      }

      let role: Role | undefined;
      if (roleRaw !== undefined) {
        if (!ROLES.has(roleRaw)) {
          return res.status(400).json({
            success: false,
            message: "role must be Visitor, Admin, Merchant, Buyer, SuperAdmin, or CustomerSupport",
          });
        }
        role = roleRaw as Role;
      }

      const includeDeleted =
        includeDeletedRaw === "true" ||
        includeDeletedRaw === "1" ||
        (Array.isArray(includeDeletedRaw) && includeDeletedRaw[0] === "true");

      const page = parseIntOrUndefined(req.query.page);
      const limit = parseIntOrUndefined(req.query.limit);

      const result = await userService.listUsers({
        ...(userType !== undefined ? { userType } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(q !== undefined ? { q } : {}),
        includeDeleted,
        page,
        limit,
      });

      return res.json({ success: true, message: "Users retrieved successfully", data: result });
    } catch (error: unknown) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve users",
        error: error instanceof Error ? error.message : undefined,
      });
    }
  },
};
