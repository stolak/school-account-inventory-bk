import { Request, Response } from "express";
import { staffService } from "../services/staffService";
import { StaffRole, Status, UserType } from "@prisma/client";
import { isStringOrNullOrUndefined, parseIntOrUndefined } from "../utils/request";

/**
 * @openapi
 * /api/v1/staff:
 *   post:
 *     summary: Register a staff and create a linked user
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a Staff row and also creates a User row, then links them via Staff.userId.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [StaffNumber, email, name]
 *             properties:
 *               StaffNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [class_teacher, assistant_teacher, subject_teacher, principal, vice_principal, teacher, admin, other]
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Archived]
 *               profileImageUrl:
 *                 type: string
 *                 nullable: true
 *               user:
 *                 type: object
 *                 description: Optional user overrides (password defaults to 12345)
 *                 properties:
 *                   password:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                     nullable: true
 *                   isActive:
 *                     type: boolean
 *                   isVerified:
 *                     type: boolean
 *                   isEmailVerified:
 *                     type: boolean
 *                   role:
 *                     type: string
 *                     enum: [Visitor, Admin, Merchant, Buyer, SuperAdmin, CustomerSupport]
 *                   userType:
 *                     type: string
 *                     enum: [Admin, Merchant, Buyer]
 *     responses:
 *       201:
 *         description: Staff created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Duplicate StaffNumber/email
 *       500:
 *         description: Server error
 *   get:
 *     summary: List staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Optional search in StaffNumber, name, email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [class_teacher, assistant_teacher, subject_teacher, principal, vice_principal, teacher, admin, other]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Archived, All]
 *         description: Defaults to Active only
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Staff list
 *       500:
 *         description: Server error
 */
export const staffController = {
  createStaff: async (req: Request, res: Response) => {
    try {
      const { StaffNumber, email, name, role, status, profileImageUrl, user } = req.body ?? {};

      if (!StaffNumber || typeof StaffNumber !== "string" || !StaffNumber.trim()) {
        return res.status(400).json({ success: false, message: "StaffNumber is required" });
      }
      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ success: false, message: "email is required" });
      }
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ success: false, message: "name is required" });
      }
      if (role !== undefined && role !== null && !Object.values(StaffRole).includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role" });
      }
      if (
        status !== undefined &&
        status !== null &&
        status !== Status.Active &&
        status !== Status.Inactive &&
        status !== Status.Archived
      ) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }
      if (!isStringOrNullOrUndefined(profileImageUrl)) {
        return res
          .status(400)
          .json({ success: false, message: "profileImageUrl must be a string or null" });
      }

      if (user !== undefined && (typeof user !== "object" || user === null)) {
        return res.status(400).json({ success: false, message: "user must be an object" });
      }

      const createdById = (req as any).user?.id;
      if (!createdById) return res.status(401).json({ success: false, message: "Unauthorized" });

      const created = await staffService.createStaffWithUser({
        StaffNumber: StaffNumber.trim(),
        email: email.trim(),
        name: name.trim(),
        ...(role !== undefined ? { role } : {}),
        ...(status !== undefined ? { status } : {}),
        profileImageUrl:
          profileImageUrl === undefined
            ? undefined
            : profileImageUrl === ""
              ? null
              : profileImageUrl,
        createdById,
        user:
          user === undefined
            ? undefined
            : {
                ...(typeof user.password === "string" ? { password: user.password } : {}),
                ...(user.phoneNumber === undefined
                  ? {}
                  : { phoneNumber: user.phoneNumber === "" ? null : user.phoneNumber }),
                ...(typeof user.isActive === "boolean" ? { isActive: user.isActive } : {}),
                ...(typeof user.isVerified === "boolean" ? { isVerified: user.isVerified } : {}),
                ...(typeof user.isEmailVerified === "boolean"
                  ? { isEmailVerified: user.isEmailVerified }
                  : {}),
                ...(user.role !== undefined ? { role: user.role } : {}),
                ...(user.userType !== undefined && Object.values(UserType).includes(user.userType)
                  ? { userType: user.userType }
                  : {}),
              },
      });

      return res
        .status(201)
        .json({ success: true, message: "Staff created successfully", data: created });
    } catch (error: any) {
      const message = error?.message ?? "Failed to create staff";
      const status = message.includes("already exists")
        ? 409
        : message.includes("required")
          ? 400
          : 500;
      return res.status(status).json({ success: false, message });
    }
  },

  listStaff: async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const roleRaw = typeof req.query.role === "string" ? req.query.role : undefined;
      const role =
        roleRaw && (Object.values(StaffRole) as string[]).includes(roleRaw)
          ? (roleRaw as StaffRole)
          : undefined;
      if (roleRaw !== undefined && role === undefined) {
        return res.status(400).json({ success: false, message: "Invalid role" });
      }

      const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
      const status =
        statusRaw === undefined
          ? undefined
          : statusRaw === "All"
            ? "All"
            : statusRaw === "Active"
              ? Status.Active
              : statusRaw === "Inactive"
                ? Status.Inactive
                : statusRaw === "Archived"
                  ? Status.Archived
                  : undefined;
      if (statusRaw !== undefined && status === undefined) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }

      const page = parseIntOrUndefined(req.query.page);
      const limit = parseIntOrUndefined(req.query.limit);

      const result = await staffService.listStaff({ q, role, status, page, limit });
      return res.json({ success: true, message: "Staff retrieved successfully", data: result });
    } catch (error: any) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to retrieve staff", error: error?.message });
    }
  },

  /**
   * @openapi
   * /api/v1/staff/{id}:
   *   get:
   *     summary: Get staff by ID
   *     tags: [Staff]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Staff found }
   *       404: { description: Staff not found }
   *   put:
   *     summary: Update staff
   *     tags: [Staff]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               StaffNumber: { type: string }
   *               email: { type: string }
   *               name: { type: string }
   *               role:
   *                 type: string
   *                 enum: [class_teacher, assistant_teacher, subject_teacher, principal, vice_principal, teacher, admin, other]
   *               status:
   *                 type: string
   *                 enum: [Active, Inactive, Archived]
   *               profileImageUrl:
   *                 type: string
   *                 nullable: true
   *     responses:
   *       200: { description: Staff updated }
   *       400: { description: Validation error }
   *       404: { description: Staff not found }
   *       409: { description: Duplicate StaffNumber/email }
   *   delete:
   *     summary: Delete staff
   *     tags: [Staff]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Staff deleted }
   *       404: { description: Staff not found }
   */
  getStaffById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      const staff = await staffService.getStaffById(id);
      if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
      return res.json({ success: true, message: "Staff retrieved successfully", data: staff });
    } catch (error: any) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to retrieve staff", error: error?.message });
    }
  },

  updateStaff: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const { StaffNumber, email, name, role, status, profileImageUrl } = req.body ?? {};
      if (StaffNumber !== undefined && (typeof StaffNumber !== "string" || !StaffNumber.trim())) {
        return res
          .status(400)
          .json({ success: false, message: "StaffNumber must be a non-empty string" });
      }
      if (email !== undefined && (typeof email !== "string" || !email.trim())) {
        return res
          .status(400)
          .json({ success: false, message: "email must be a non-empty string" });
      }
      if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        return res.status(400).json({ success: false, message: "name must be a non-empty string" });
      }
      if (role !== undefined && role !== null && !Object.values(StaffRole).includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role" });
      }
      if (
        status !== undefined &&
        status !== null &&
        status !== Status.Active &&
        status !== Status.Inactive &&
        status !== Status.Archived
      ) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }
      if (profileImageUrl !== undefined && !isStringOrNullOrUndefined(profileImageUrl)) {
        return res
          .status(400)
          .json({ success: false, message: "profileImageUrl must be a string or null" });
      }

      const updated = await staffService.updateStaff(id, {
        ...(StaffNumber !== undefined ? { StaffNumber } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(profileImageUrl !== undefined
          ? { profileImageUrl: profileImageUrl === "" ? null : profileImageUrl }
          : {}),
      });

      return res.json({ success: true, message: "Staff updated successfully", data: updated });
    } catch (error: any) {
      const message = error?.message ?? "Failed to update staff";
      const code =
        message === "Staff not found" ? 404 : message.includes("already exists") ? 409 : 500;
      return res.status(code).json({ success: false, message });
    }
  },

  deleteStaff: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });
      const deleted = await staffService.deleteStaff(id);
      return res.json({ success: true, message: "Staff deleted successfully", data: deleted });
    } catch (error: any) {
      const message = error?.message ?? "Failed to delete staff";
      const code = message === "Staff not found" ? 404 : 500;
      return res.status(code).json({ success: false, message });
    }
  },
};
