import { Request, Response } from "express";
import { studentService } from "../services/studentService";
import { Gender, StudentStatus } from "@prisma/client";

function parseIntOrUndefined(v: unknown): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseIsoDate(v: unknown): Date | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

const STUDENT_STATUSES: StudentStatus[] = [
  StudentStatus.Active,
  StudentStatus.Inactive,
  StudentStatus.Graduated,
  StudentStatus.Transferred,
  StudentStatus.Suspended,
  StudentStatus.Archived,
];

function parseStudentStatus(v: unknown): StudentStatus | undefined {
  if (v === undefined) return undefined;
  if (typeof v !== "string") return undefined;
  return STUDENT_STATUSES.includes(v as StudentStatus) ? (v as StudentStatus) : undefined;
}

function parseGender(v: unknown): Gender | undefined {
  if (v === undefined || typeof v !== "string") return undefined;
  return v === Gender.male || v === Gender.female || v === Gender.other ? (v as Gender) : undefined;
}

/**
 * @openapi
 * /api/v1/students:
 *   post:
 *     summary: Create a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [admissionNumber, firstName, lastName, gender, dateOfBirth]
 *             properties:
 *               admissionNumber:
 *                 type: string
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *                 nullable: true
 *               lastName:
 *                 type: string
 *               studentEmail:
 *                 type: string
 *                 nullable: true
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: ISO date (e.g. YYYY-MM-DD)
 *               classId:
 *                 type: string
 *                 nullable: true
 *               guardianName:
 *                 type: string
 *                 nullable: true
 *               guardianEmail:
 *                 type: string
 *                 nullable: true
 *               guardianContact:
 *                 type: string
 *                 nullable: true
 *               address:
 *                 type: string
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Graduated, Transferred, Suspended, Archived]
 *     responses:
 *       201:
 *         description: Student created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Invalid classId
 *       409:
 *         description: Duplicate admission number
 *       500:
 *         description: Server error
 *   get:
 *     summary: List students
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search admission number, names, emails, guardian fields
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by school class id
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Graduated, Transferred, Suspended, Archived, All]
 *         description: Defaults to Active only. Use All for every status.
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
 *         description: Students list
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export const studentController = {
  createStudent: async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const {
        admissionNumber,
        firstName,
        middleName,
        lastName,
        studentEmail,
        gender,
        dateOfBirth,
        classId,
        guardianName,
        guardianEmail,
        guardianContact,
        address,
        status,
      } = body;

      if (!admissionNumber || typeof admissionNumber !== "string" || !admissionNumber.trim()) {
        return res.status(400).json({ success: false, message: "admissionNumber is required" });
      }
      if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
        return res.status(400).json({ success: false, message: "firstName is required" });
      }
      if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
        return res.status(400).json({ success: false, message: "lastName is required" });
      }

      const g = parseGender(gender);
      if (g === undefined) {
        return res.status(400).json({ success: false, message: "gender must be male, female, or other" });
      }

      const dob = parseIsoDate(dateOfBirth);
      if (!dob) {
        return res.status(400).json({
          success: false,
          message: "dateOfBirth is required and must be a valid ISO date string",
        });
      }

      const st = parseStudentStatus(status);
      if (status !== undefined && st === undefined) {
        return res.status(400).json({
          success: false,
          message: "status must be Active, Inactive, Graduated, Transferred, Suspended, or Archived",
        });
      }

      let normalizedClassId: string | null | undefined = undefined;
      if (classId !== undefined && classId !== null) {
        if (typeof classId !== "string") {
          return res.status(400).json({ success: false, message: "classId must be a string or null" });
        }
        normalizedClassId = classId.trim() === "" ? null : classId.trim();
      }

      const createdById = (req as any).user?.id;
      if (!createdById) return res.status(401).json({ success: false, message: "Unauthorized" });

      const student = await studentService.createStudent({
        admissionNumber: admissionNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: g,
        dateOfBirth: dob,
        ...(middleName !== undefined
          ? {
              middleName:
                middleName === null || middleName === ""
                  ? null
                  : typeof middleName === "string"
                    ? middleName.trim() || null
                    : null,
            }
          : {}),
        ...(studentEmail !== undefined
          ? {
              studentEmail:
                studentEmail === null || studentEmail === ""
                  ? null
                  : typeof studentEmail === "string"
                    ? studentEmail.trim() || null
                    : null,
            }
          : {}),
        ...(normalizedClassId !== undefined ? { classId: normalizedClassId } : {}),
        ...(guardianName !== undefined
          ? {
              guardianName:
                guardianName === null || guardianName === ""
                  ? null
                  : typeof guardianName === "string"
                    ? guardianName.trim() || null
                    : null,
            }
          : {}),
        ...(guardianEmail !== undefined
          ? {
              guardianEmail:
                guardianEmail === null || guardianEmail === ""
                  ? null
                  : typeof guardianEmail === "string"
                    ? guardianEmail.trim() || null
                    : null,
            }
          : {}),
        ...(guardianContact !== undefined
          ? {
              guardianContact:
                guardianContact === null || guardianContact === ""
                  ? null
                  : typeof guardianContact === "string"
                    ? guardianContact.trim() || null
                    : null,
            }
          : {}),
        ...(address !== undefined
          ? {
              address:
                address === null || address === ""
                  ? null
                  : typeof address === "string"
                    ? address.trim() || null
                    : null,
            }
          : {}),
        ...(st !== undefined ? { status: st } : {}),
        createdById,
      });

      return res.status(201).json({
        success: true,
        message: "Student created successfully",
        data: student,
      });
    } catch (error: any) {
      const message = error?.message ?? "Failed to create student";
      const code =
        message === "Invalid classId" ? 404 : message.includes("already exists") ? 409 : 500;
      return res.status(code).json({ success: false, message });
    }
  },

  listStudents: async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const classId = typeof req.query.classId === "string" ? req.query.classId : undefined;
      const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;

      const status =
        statusRaw === undefined
          ? undefined
          : statusRaw === "All"
            ? "All"
            : parseStudentStatus(statusRaw);

      if (statusRaw !== undefined && status === undefined) {
        return res.status(400).json({
          success: false,
          message:
            "status must be Active, Inactive, Graduated, Transferred, Suspended, Archived, or All",
        });
      }

      const createdById = (req as any).user?.id;
      if (!createdById) return res.status(401).json({ success: false, message: "Unauthorized" });

      const page = parseIntOrUndefined(req.query.page);
      const limit = parseIntOrUndefined(req.query.limit);

      const result = await studentService.listStudents({
        q,
        ...(classId !== undefined && classId.trim() !== "" ? { classId: classId.trim() } : {}),
        status,
        page,
        limit,
      });

      return res.json({
        success: true,
        message: "Students retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve students",
        error: error?.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/students/{id}:
   *   get:
   *     summary: Get a student by ID
   *     tags: [Students]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Student details
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Student not found
   *       500:
   *         description: Server error
   *   put:
   *     summary: Update a student
   *     tags: [Students]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               admissionNumber:
   *                 type: string
   *               firstName:
   *                 type: string
   *               middleName:
   *                 type: string
   *                 nullable: true
   *               lastName:
   *                 type: string
   *               studentEmail:
   *                 type: string
   *                 nullable: true
   *               gender:
   *                 type: string
   *                 enum: [male, female, other]
   *               dateOfBirth:
   *                 type: string
   *                 format: date
   *               classId:
   *                 type: string
   *                 nullable: true
   *               guardianName:
   *                 type: string
   *                 nullable: true
   *               guardianEmail:
   *                 type: string
   *                 nullable: true
   *               guardianContact:
   *                 type: string
   *                 nullable: true
   *               address:
   *                 type: string
   *                 nullable: true
   *               status:
   *                 type: string
   *                 enum: [Active, Inactive, Graduated, Transferred, Suspended, Archived]
   *     responses:
   *       200:
   *         description: Student updated
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Student or class not found
   *       409:
   *         description: Duplicate admission number
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Delete a student
   *     tags: [Students]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Student deleted
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Student not found
   *       500:
   *         description: Server error
   */
  getStudentById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const createdById = (req as any).user?.id;
      if (!createdById) return res.status(401).json({ success: false, message: "Unauthorized" });

      const student = await studentService.getStudentById(id);
      if (!student) return res.status(404).json({ success: false, message: "Student not found" });

      return res.json({
        success: true,
        message: "Student retrieved successfully",
        data: student,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve student",
        error: error?.message,
      });
    }
  },

  updateStudent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const body = req.body ?? {};
      const {
        admissionNumber,
        firstName,
        middleName,
        lastName,
        studentEmail,
        gender,
        dateOfBirth,
        classId,
        guardianName,
        guardianEmail,
        guardianContact,
        address,
        status,
      } = body;

      if (admissionNumber !== undefined && (typeof admissionNumber !== "string" || !admissionNumber.trim())) {
        return res.status(400).json({
          success: false,
          message: "admissionNumber must be a non-empty string when provided",
        });
      }
      if (firstName !== undefined && (typeof firstName !== "string" || !firstName.trim())) {
        return res.status(400).json({ success: false, message: "firstName must be a non-empty string when provided" });
      }
      if (lastName !== undefined && (typeof lastName !== "string" || !lastName.trim())) {
        return res.status(400).json({ success: false, message: "lastName must be a non-empty string when provided" });
      }

      let genderParsed: Gender | undefined;
      if (gender !== undefined) {
        genderParsed = parseGender(gender);
        if (genderParsed === undefined) {
          return res.status(400).json({ success: false, message: "gender must be male, female, or other" });
        }
      }

      let dob: Date | undefined;
      if (dateOfBirth !== undefined) {
        const parsed = parseIsoDate(dateOfBirth);
        if (!parsed) {
          return res.status(400).json({
            success: false,
            message: "dateOfBirth must be a valid ISO date string when provided",
          });
        }
        dob = parsed;
      }

      const st = parseStudentStatus(status);
      if (status !== undefined && st === undefined) {
        return res.status(400).json({
          success: false,
          message: "status must be Active, Inactive, Graduated, Transferred, Suspended, or Archived",
        });
      }

      let normalizedClassId: string | null | undefined = undefined;
      if (classId !== undefined) {
        if (classId !== null && typeof classId !== "string") {
          return res.status(400).json({ success: false, message: "classId must be a string or null" });
        }
        normalizedClassId =
          classId === null || classId === "" ? null : typeof classId === "string" ? classId.trim() || null : null;
      }

      const createdById = (req as any).user?.id;
      if (!createdById) return res.status(401).json({ success: false, message: "Unauthorized" });

      const updated = await studentService.updateStudent(id, {
        ...(admissionNumber !== undefined ? { admissionNumber: admissionNumber.trim() } : {}),
        ...(firstName !== undefined ? { firstName: firstName.trim() } : {}),
        ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
        ...(middleName !== undefined
          ? {
              middleName:
                middleName === null || middleName === ""
                  ? null
                  : typeof middleName === "string"
                    ? middleName.trim() || null
                    : null,
            }
          : {}),
        ...(studentEmail !== undefined
          ? {
              studentEmail:
                studentEmail === null || studentEmail === ""
                  ? null
                  : typeof studentEmail === "string"
                    ? studentEmail.trim() || null
                    : null,
            }
          : {}),
        ...(genderParsed !== undefined ? { gender: genderParsed } : {}),
        ...(dob !== undefined ? { dateOfBirth: dob } : {}),
        ...(normalizedClassId !== undefined ? { classId: normalizedClassId } : {}),
        ...(guardianName !== undefined
          ? {
              guardianName:
                guardianName === null || guardianName === ""
                  ? null
                  : typeof guardianName === "string"
                    ? guardianName.trim() || null
                    : null,
            }
          : {}),
        ...(guardianEmail !== undefined
          ? {
              guardianEmail:
                guardianEmail === null || guardianEmail === ""
                  ? null
                  : typeof guardianEmail === "string"
                    ? guardianEmail.trim() || null
                    : null,
            }
          : {}),
        ...(guardianContact !== undefined
          ? {
              guardianContact:
                guardianContact === null || guardianContact === ""
                  ? null
                  : typeof guardianContact === "string"
                    ? guardianContact.trim() || null
                    : null,
            }
          : {}),
        ...(address !== undefined
          ? {
              address:
                address === null || address === ""
                  ? null
                  : typeof address === "string"
                    ? address.trim() || null
                    : null,
            }
          : {}),
        ...(st !== undefined ? { status: st } : {}),
      });

      return res.json({ success: true, message: "Student updated successfully", data: updated });
    } catch (error: any) {
      const message = error?.message ?? "Failed to update student";
      const statusCode =
        message === "Invalid classId"
          ? 404
          : message.includes("Record to update not found")
            ? 404
            : message.includes("already exists")
              ? 409
              : 500;
      return res.status(statusCode).json({ success: false, message });
    }
  },

  deleteStudent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "id is required" });

      const createdById = (req as any).user?.id;
      if (!createdById) return res.status(401).json({ success: false, message: "Unauthorized" });

      const deleted = await studentService.deleteStudent(id);
      return res.json({ success: true, message: "Student deleted successfully", data: deleted });
    } catch (error: any) {
      const message = error?.message ?? "Failed to delete student";
      const statusCode = message.includes("Record to delete does not exist") ? 404 : 500;
      return res.status(statusCode).json({ success: false, message });
    }
  },
};
