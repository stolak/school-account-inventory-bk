import prisma from "../utils/prisma";
import bcrypt from "bcryptjs";
import { Prisma, StaffRole, Status, UserType, Role } from "@prisma/client";

export interface StaffData {
  id: string;
  StaffNumber: string;
  email: string;
  name: string;
  role: StaffRole;
  status: Status;
  profileImageUrl: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
  user?: { id: string; email: string; firstName: string | null; lastName: string | null; isActive: boolean } | null;
  createdBy?: { firstName: string | null; lastName: string | null } | null;
}

export interface ListStaffParams {
  q?: string;
  role?: StaffRole;
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
    role?: StaffRole;
    status?: Status;
    profileImageUrl?: string | null;
    createdById: string;
    user?: {
      password?: string;
      phoneNumber?: string | null;
      isActive?: boolean;
      isVerified?: boolean;
      isEmailVerified?: boolean;
      role?: Role;
      userType?: UserType;
    };
  }): Promise<StaffData> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedStaffNumber = input.StaffNumber.trim();
    const normalizedName = input.name.trim();
    if (!normalizedStaffNumber) throw new Error("StaffNumber is required");
    if (!normalizedEmail) throw new Error("email is required");
    if (!normalizedName) throw new Error("name is required");

    const { firstName, lastName } = splitName(normalizedName);
    const rawPassword = input.user?.password ?? "12345";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            firstName,
            lastName,
            ...(input.user?.phoneNumber !== undefined ? { phoneNumber: input.user.phoneNumber } : {}),
            ...(input.profileImageUrl !== undefined ? { profileImageUrl: input.profileImageUrl } : {}),
            userType: input.user?.userType ?? UserType.Admin,
            role: input.user?.role ?? Role.Admin,
            isActive: input.user?.isActive ?? true,
            ...(input.user?.isVerified !== undefined ? { isVerified: input.user.isVerified } : {}),
            ...(input.user?.isEmailVerified !== undefined ? { isEmailVerified: input.user.isEmailVerified } : {}),
            createdById: input.createdById,
          },
          select: { id: true },
        });

        const staff = await tx.staff.create({
          data: {
            StaffNumber: normalizedStaffNumber,
            email: normalizedEmail,
            name: normalizedName,
            role: input.role ?? StaffRole.teacher,
            status: input.status ?? Status.Active,
            profileImageUrl: input.profileImageUrl ?? null,
            createdById: input.createdById,
            userId: createdUser.id,
          },
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } },
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

    if (params.role) where.role = params.role;

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
          user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } },
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
        user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } },
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
      role?: StaffRole;
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
          ...(input.role !== undefined ? { role: input.role } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.profileImageUrl !== undefined ? { profileImageUrl: input.profileImageUrl } : {}),
          updatedAt: new Date(),
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } },
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
        user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }
}

export const staffService = new StaffService();

