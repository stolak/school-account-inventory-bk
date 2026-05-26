import prisma from "../utils/prisma";
import bcrypt from "bcryptjs";
import { AppRole, Prisma, StaffPosition, Status, UserType } from "@prisma/client";

export interface StaffData {
  id: string;
  StaffNumber: string;
  email: string;
  name: string;
  position: StaffPosition;
  status: Status;
  profileImageUrl: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
  } | null;
  createdBy?: { firstName: string | null; lastName: string | null } | null;
}

export interface ListStaffParams {
  q?: string;
  position?: StaffPosition;
  status?: Status | "All";
  page?: number;
  limit?: number;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function splitName(fullName: string): { firstName: string | null; lastName: string | null } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export class StaffService {
  private prisma = prisma;

  async createStaffWithUser(input: {
    StaffNumber: string;
    email: string;
    name: string;
    status?: Status;
    profileImageUrl?: string | null;
    createdById: string;
    password?: string;
    phoneNumber?: string | null;
    isActive?: boolean;
    isVerified?: boolean;
    isEmailVerified?: boolean;
    position?: StaffPosition;
    appRoleId?: string | null;
    userType?: UserType;
  }): Promise<StaffData> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedStaffNumber = input.StaffNumber.trim();
    const normalizedName = input.name.trim();
    if (!normalizedStaffNumber) throw new Error("StaffNumber is required");
    if (!normalizedEmail) throw new Error("email is required");
    if (!normalizedName) throw new Error("name is required");

    const { firstName, lastName } = splitName(normalizedName);
    const rawPassword = input.password ?? "12345";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    try {
      return await this.prisma.$transaction(async (tx) => {
        let appRole: AppRole | null = null;
        if (input.appRoleId) {
          appRole = await tx.appRole.findUnique({ where: { id: input.appRoleId } });
          if (!appRole) throw new Error("App role not found");
        }
        // verify if email already exists
        const existingUser = await tx.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) throw new Error("Email already exists");
        // verify if staff number already exists
        const existingStaff = await tx.staff.findFirst({
          where: {
            OR: [{ StaffNumber: normalizedStaffNumber }, { email: normalizedEmail }],
          },
        });
        if (existingStaff) throw new Error("Staff number or email already exists");

        const createdUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            firstName,
            lastName,
            ...(input.phoneNumber !== undefined ? { phoneNumber: input.phoneNumber } : {}),
            ...(input.profileImageUrl !== undefined
              ? { profileImageUrl: input.profileImageUrl }
              : {}),
            userType: input.userType ?? UserType.Staff,
            isActive: input.isActive ?? true,
            ...(input.isVerified !== undefined ? { isVerified: input.isVerified } : {}),
            ...(input.isEmailVerified !== undefined
              ? { isEmailVerified: input.isEmailVerified }
              : {}),
            createdById: input.createdById,
          },
          select: { id: true },
        });

        if (appRole) {
          await tx.userRole.create({
            data: {
              userId: createdUser.id,
              roleId: appRole.id,
            },
          });
        }

        const staff = await tx.staff.create({
          data: {
            StaffNumber: normalizedStaffNumber,
            email: normalizedEmail,
            name: normalizedName,
            ...(input.position !== undefined ? { position: input.position } : {}),
            status: input.status ?? Status.Active,
            profileImageUrl: input.profileImageUrl ?? null,
            createdById: input.createdById,
            userId: createdUser.id,
          },
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
            },
            createdBy: { select: { firstName: true, lastName: true } },
          },
        });

        return staff;
      });
    } catch (e: any) {
      if (e?.code === "P2002") {
        throw new Error("StaffNumber or email already exists");
      }
      throw e;
    }
  }

  async listStaff(params: ListStaffParams = {}): Promise<{
    staff: StaffData[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = clampInt(params.page ?? 1, 1, 1_000_000);
    const limit = clampInt(params.limit ?? 20, 1, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.StaffWhereInput = {};

    if (params.status === undefined) {
      where.status = Status.Active;
    } else if (params.status !== "All") {
      where.status = params.status;
    }

    if (params.position) where.position = params.position;

    if (params.q) {
      where.OR = [
        { StaffNumber: { contains: params.q } },
        { name: { contains: params.q } },
        { email: { contains: params.q } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.staff.count({ where }),
      this.prisma.staff.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
          },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { staff: rows, pagination: { page, limit, total, totalPages } };
  }

  async getStaffById(id: string): Promise<StaffData | null> {
    return await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
        },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async updateStaff(
    id: string,
    input: {
      StaffNumber?: string;
      email?: string;
      name?: string;
      position?: StaffPosition;
      status?: Status;
      profileImageUrl?: string | null;
    }
  ): Promise<StaffData> {
    const existing = await this.getStaffById(id);
    if (!existing) throw new Error("Staff not found");

    const email = input.email !== undefined ? input.email.trim().toLowerCase() : undefined;
    const staffNumber = input.StaffNumber !== undefined ? input.StaffNumber.trim() : undefined;
    const name = input.name !== undefined ? input.name.trim() : undefined;

    try {
      return await this.prisma.staff.update({
        where: { id },
        data: {
          ...(staffNumber !== undefined ? { StaffNumber: staffNumber } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(name !== undefined ? { name } : {}),
          ...(input.position !== undefined ? { position: input.position } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.profileImageUrl !== undefined
            ? { profileImageUrl: input.profileImageUrl }
            : {}),
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
          },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      });
    } catch (e: any) {
      if (e?.code === "P2002") throw new Error("StaffNumber or email already exists");
      throw e;
    }
  }

  async deleteStaff(id: string): Promise<StaffData> {
    const existing = await this.getStaffById(id);
    if (!existing) throw new Error("Staff not found");
    return await this.prisma.staff.delete({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
        },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }
}

export const staffService = new StaffService();
