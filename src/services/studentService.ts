import prisma from "../utils/prisma";
import { Gender, Prisma, StudentStatus } from "@prisma/client";

export interface StudentData {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  studentEmail: string | null;
  gender: Gender;
  dateOfBirth: Date;
  classId: string | null;
  subClassId?: string | null;
  guardianName: string | null;
  guardianEmail: string | null;
  guardianContact: string | null;
  address: string | null;
  status: StudentStatus;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  class?: { id: string; name: string } | null;
  subClass?: { id: string; name: string; classId: string | null } | null;
  createdBy?: { firstName: string | null; lastName: string | null } | null;
}

export interface ListStudentsParams {
  q?: string;
  classId?: string;
  subClassId?: string;
  status?: StudentStatus | "All";
  page?: number;
  limit?: number;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isPrismaKnownErrorWithCode(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as any).code === "string";
}

export class StudentService {
  private prisma = prisma;

  private async assertClassExists(classId: string) {
    const cls = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      select: { id: true },
    });
    if (!cls) throw new Error("Invalid classId");
  }

  private async assertSubClassExists(subClassId: string) {
    const sub = await this.prisma.subClass.findUnique({
      where: { id: subClassId },
      select: { id: true },
    });
    if (!sub) throw new Error("Invalid subClassId");
  }

  async createStudent(input: {
    admissionNumber: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    studentEmail?: string | null;
    gender: Gender;
    dateOfBirth: Date;
    classId?: string | null;
    subClassId?: string | null;
    guardianName?: string | null;
    guardianEmail?: string | null;
    guardianContact?: string | null;
    address?: string | null;
    status?: StudentStatus;
    createdById: string;
  }): Promise<StudentData> {
    if (input.classId) await this.assertClassExists(input.classId);
    if (input.subClassId) await this.assertSubClassExists(input.subClassId);

    try {
      return await this.prisma.student.create({
        data: {
          admissionNumber: input.admissionNumber,
          firstName: input.firstName,
          middleName: input.middleName ?? null,
          lastName: input.lastName,
          studentEmail: input.studentEmail ?? null,
          gender: input.gender,
          dateOfBirth: input.dateOfBirth,
          classId: input.classId ?? null,
          subClassId: input.subClassId ?? null,
          guardianName: input.guardianName ?? null,
          guardianEmail: input.guardianEmail ?? null,
          guardianContact: input.guardianContact ?? null,
          address: input.address ?? null,
          createdById: input.createdById,
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
        include: {
          class: { select: { id: true, name: true } },
          subClass: { select: { id: true, name: true, classId: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Admission number already exists");
      }
      throw e;
    }
  }

  async listStudents(params: ListStudentsParams = {}): Promise<{
    students: StudentData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {};

    if (params.status === undefined) {
      where.status = StudentStatus.Active;
    } else if (params.status !== "All") {
      where.status = params.status;
    }

    if (params.classId) {
      where.classId = params.classId;
    }

    if (params.subClassId) {
      where.subClassId = params.subClassId;
    }

    if (params.q) {
      where.OR = [
        { admissionNumber: { contains: params.q } },
        { firstName: { contains: params.q } },
        { middleName: { contains: params.q } },
        { lastName: { contains: params.q } },
        { studentEmail: { contains: params.q } },
        { guardianName: { contains: params.q } },
        { guardianEmail: { contains: params.q } },
        { guardianContact: { contains: params.q } },
      ];
    }

    const finalWhere = Object.keys(where).length ? where : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.student.count({ where: finalWhere }),
      this.prisma.student.findMany({
        where: finalWhere,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: limit,
        include: {
          class: { select: { id: true, name: true } },
          subClass: { select: { id: true, name: true, classId: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const qLower = params.q?.toLowerCase();
    const students = qLower
      ? rows.filter((s) => {
          const hay = [
            s.admissionNumber,
            s.firstName,
            s.middleName ?? "",
            s.lastName,
            s.studentEmail ?? "",
            s.guardianName ?? "",
            s.guardianEmail ?? "",
            s.guardianContact ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(qLower);
        })
      : rows;

    return { students, pagination: { page, limit, total, totalPages } };
  }

  async getStudentById(id: string): Promise<StudentData | null> {
    return await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, name: true } },
        subClass: { select: { id: true, name: true, classId: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async updateStudent(
    id: string,
    input: {
      admissionNumber?: string;
      firstName?: string;
      middleName?: string | null;
      lastName?: string;
      studentEmail?: string | null;
      gender?: Gender;
      dateOfBirth?: Date;
      classId?: string | null;
      subClassId?: string | null;
      guardianName?: string | null;
      guardianEmail?: string | null;
      guardianContact?: string | null;
      address?: string | null;
      status?: StudentStatus;
    }
  ): Promise<StudentData> {
    if (input.classId) await this.assertClassExists(input.classId);
    if (input.subClassId) await this.assertSubClassExists(input.subClassId);

    try {
      return await this.prisma.student.update({
        where: { id },
        data: {
          ...(input.admissionNumber !== undefined ? { admissionNumber: input.admissionNumber } : {}),
          ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
          ...(input.middleName !== undefined ? { middleName: input.middleName } : {}),
          ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
          ...(input.studentEmail !== undefined ? { studentEmail: input.studentEmail } : {}),
          ...(input.gender !== undefined ? { gender: input.gender } : {}),
          ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth } : {}),
          ...(input.classId !== undefined ? { classId: input.classId } : {}),
          ...(input.subClassId !== undefined ? { subClassId: input.subClassId } : {}),
          ...(input.guardianName !== undefined ? { guardianName: input.guardianName } : {}),
          ...(input.guardianEmail !== undefined ? { guardianEmail: input.guardianEmail } : {}),
          ...(input.guardianContact !== undefined ? { guardianContact: input.guardianContact } : {}),
          ...(input.address !== undefined ? { address: input.address } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date(),
        },
        include: {
          class: { select: { id: true, name: true } },
          subClass: { select: { id: true, name: true, classId: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2002") {
        throw new Error("Admission number already exists");
      }
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Record to update not found");
      }
      throw e;
    }
  }

  async deleteStudent(id: string): Promise<StudentData> {
    try {
      return await this.prisma.student.delete({
        where: { id },
        include: {
          class: { select: { id: true, name: true } },
          subClass: { select: { id: true, name: true, classId: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      });
    } catch (e) {
      if (isPrismaKnownErrorWithCode(e) && e.code === "P2025") {
        throw new Error("Record to delete does not exist");
      }
      throw e;
    }
  }
}

export const studentService = new StudentService();
