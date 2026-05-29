import { Request, Response } from "express";
import { staffService } from "../services/staffService";
import { StaffPosition, Status, UserType } from "@prisma/client";

const STAFF_POSITIONS = Object.values(StaffPosition) as string[];
import { isStringOrNullOrUndefined, parseIntOrUndefined, routeParam } from "../utils/request";

/**
 * @openapi
 * /api/v1/staff:
 *   post:
 *     summary: Register a staff member and create a linked user
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Creates a User and a Staff row linked via Staff.userId.
 *       Email is checked on users and staff; StaffNumber must be unique on staff.
 *       Optional `appRoleId` is an AppRole id (UUID) — when provided, a UserRole row is created for the new user.
 *       Password defaults to `12345` if omitted. Staff `position` defaults to teacher when omitted.
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
 *                 description: Unique staff number
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *                 description: Full name (split into user firstName/lastName)
 *               position:
 *                 type: string
 *                 enum: [class_teacher, assistant_teacher, subject_teacher, principal, vice_principal, teacher, admin, other]
 *                 description: Staff job position (defaults to teacher)
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Archived]
 *                 description: Staff record status (defaults to Active)
 *               profileImageUrl:
 *                 type: string
 *                 nullable: true
 *               password:
 *                 type: string
 *                 description: User login password (defaults to 12345)
 *               phoneNumber:
 *                 type: string
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *                 description: User.isActive (defaults to true)
 *               isVerified:
 *                 type: boolean
 *               isEmailVerified:
 *                 type: boolean
 *               appRoleId:
 *                 type: string
 *                 format: uuid
 *                 description: AppRole id to assign via UserRole (optional)
 *               userType:
 *                 type: string
 *                 enum: [SuperAdmin, Staff, Student, Parent]
 *                 description: User.userType (defaults to Staff)
 *     responses:
 *       201:
 *         description: Staff and user created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: App role not found
 *       409:
 *         description: Duplicate StaffNumber or email
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
 *         name: position
 *         schema:
 *           type: string
 *           enum: [class_teacher, assistant_teacher, subject_teacher, principal, vice_principal, teacher, admin, other]
 *         description: Filter by Staff.position
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
      const {
        StaffNumber,
        email,
        name,
        position,
        appRoleId,
        status,
        profileImageUrl,
        password,
        phoneNumber,
        isActive,
        isVerified,
        isEmailVerified,
        userType,
      } = req.body ?? {};

      if (!StaffNumber || typeof StaffNumber !== "string" || !StaffNumber.trim()) {
        return res.status(400).json({ success: false, message: "StaffNumber is required" });
      }
      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ success: false, message: "email is required" });
      }
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ success: false, message: "name is required" });
      }
      if (
        position !== undefined &&
        position !== null &&
        !STAFF_POSITIONS.includes(position)
      ) {
        return res.status(400).json({ success: false, message: "Invalid position" });
      }
      if (
        appRoleId !== undefined &&
        appRoleId !== null &&
        (typeof appRoleId !== "string" || !appRoleId.trim())
      ) {
        return res
          .status(400)
          .json({ success: false, message: "appRoleId must be a non-empty AppRole id" });
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
      if (phoneNumber !== undefined && !isStringOrNullOrUndefined(phoneNumber)) {
        return res
          .status(400)
          .json({ success: false, message: "phoneNumber must be a string or null" });
      }
      if (password !== undefined && typeof password !== "string") {
        return res.status(400).json({ success: false, message: "password must be a string" });
      }
      if (userType !== undefined && !Object.values(UserType).includes(userType)) {
        return res.status(400).json({
          success: false,
          message: "userType must be SuperAdmin, Staff, Student, or Parent",
        });
      }

      const createdById = (req as any).user?.id;
      if (!createdById) return res.status(401).json({ success: false, message: "Unauthorized" });

      const created = await staffService.createStaffWithUser({
        StaffNumber: StaffNumber.trim(),
        email: email.trim(),
        name: name.trim(),
        ...(position !== undefined && position !== null ? { position } : {}),
        ...(status !== undefined && status !== null ? { status } : {}),
        profileImageUrl:
          profileImageUrl === undefined
            ? undefined
            : profileImageUrl === ""
              ? null
              : profileImageUrl,
        createdById,
        ...(typeof password === "string" ? { password } : {}),
        ...(phoneNumber !== undefined
          ? { phoneNumber: phoneNumber === "" ? null : phoneNumber }
          : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(typeof isVerified === "boolean" ? { isVerified } : {}),
        ...(typeof isEmailVerified === "boolean" ? { isEmailVerified } : {}),
        ...(appRoleId !== undefined && appRoleId !== null
          ? { appRoleId: appRoleId.trim() }
          : {}),
        ...(userType !== undefined ? { userType } : {}),
      });

      return res
        .status(201)
        .json({ success: true, message: "Staff created successfully", data: created });
    } catch (error: any) {
      const message = error?.message ?? "Failed to create staff";
      const status = message.includes("already exists")
        ? 409
        : message === "App role not found"
          ? 404
          : message.includes("required") || message.includes("must be")
            ? 400
            : 500;
      return res.status(status).json({ success: false, message });
    }
  },

  listStaff: async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const positionRaw =
        typeof req.query.position === "string" ? req.query.position : undefined;
      const position =
        positionRaw && STAFF_POSITIONS.includes(positionRaw)
          ? (positionRaw as StaffPosition)
          : undefined;
      if (positionRaw !== undefined && position === undefined) {
        return res.status(400).json({ success: false, message: "Invalid position" });
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

      const result = await staffService.listStaff({ q, position, status, page, limit });
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
 *               position:
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
      const id = routeParam(req.params.id);
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
      const id = routeParam(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const { StaffNumber, email, name, position, status, profileImageUrl } = req.body ?? {};
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
      if (position !== undefined && position !== null && !STAFF_POSITIONS.includes(position)) {
        return res.status(400).json({ success: false, message: "Invalid position" });
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
        ...(position !== undefined && position !== null ? { position } : {}),
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
      const id = routeParam(req.params.id);
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
