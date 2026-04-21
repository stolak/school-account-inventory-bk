import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { getJwtSecret } from "../utils/env";
import prisma from "../utils/prisma";
import { emailService } from "./emailService";

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      profileImageUrl?: string;
      name: string;
      userType: "buyer" | "merchant" | "admin";
      isVerified: boolean;
      isTermsAndConditionAccepted: boolean;
      merchantId?: string;
      merchantName?: string;
      buyerId?: string;
      merchantCharge?: number;
      outletId?: string;
      outletName?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
}

export interface UserRegistrationInput {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  merchantId?: string;
  outletId?: string;
  role?:
    | "Visitor"
    | "Admin"
    | "Merchant"
    | "Buyer"
    | "SuperAdmin"
    | "CustomerSupport";
  userType?: "Admin" | "Merchant" | "Buyer";
  isVerified?: boolean;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  isActive?: boolean;
}

function mapUserType(
  userType?: "Admin" | "Merchant" | "Buyer"
): "buyer" | "merchant" | "admin" {
  switch (userType) {
    case "Admin":
      return "admin";
    case "Merchant":
      return "merchant";
    case "Buyer":
    default:
      return "buyer";
  }
}

function buildTokens(user: any) {
  const accessExpiresInSeconds = 60 * 60 * 24 * 7; // 7 DAYS
  const refreshExpiresInSeconds = 60 * 60 * 24 * 7; // 7 days

  const accessToken = jwt.sign({ user }, getJwtSecret(), {
    expiresIn: accessExpiresInSeconds,
  });
  const refreshToken = jwt.sign({ ...user, type: "refresh" }, getJwtSecret(), {
    expiresIn: refreshExpiresInSeconds,
  });

  return { accessToken, refreshToken, expiresIn: accessExpiresInSeconds };
}

export class AuthService {
  async create(input: UserRegistrationInput): Promise<AuthResponse> {
    const { email, password, outletId, merchantId, profileImageUrl } = input;
    // Check if user already exists by email
    let existingUser;
    existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // If outletId is provided, verify outlet exists and belongs to the merchant
    if (outletId) {
      const outlet = await prisma.outlet.findUnique({
        where: { id: outletId },
      });

      if (!outlet) {
        throw new Error("Outlet not found");
      }

      // If merchantId is provided, verify outlet belongs to that merchant
      if (merchantId && outlet.merchantId !== merchantId) {
        throw new Error("Outlet does not belong to the specified merchant");
      }
    }

    // Hash password
    const validatedPassoword = password || "12345"; // auto-generated password
    const hashedPassword: string = await bcrypt.hash(validatedPassoword, 10);
    // Create user
    const user = await prisma.user.create({
      data: { ...input, password: hashedPassword, profileImageUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImageUrl: true,
        userType: true,
        isVerified: true,
        merchantId: true,
        outletId: true,
        merchant: {
          select: {
            isAgreedToTerms: true,
            businessName: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "";
    const tokens = buildTokens(user.id);

    return {
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          profileImageUrl: user.profileImageUrl ?? undefined,
          name,
          userType: mapUserType(user.userType as any),
          isVerified: user.isVerified ?? false,
          isTermsAndConditionAccepted: user.merchant?.isAgreedToTerms || false,
          merchantId: user?.merchantId ?? undefined,
          merchantName: user?.merchant?.businessName ?? undefined,
          outletId: user?.outletId ?? undefined,
          outletName: user?.outlet?.name ?? undefined,
        },
        tokens,
      },
    };
  }

  async login(
    email: string,
    password: string,
    userType?: string
  ): Promise<AuthResponse> {
    // Find user by email
    const where: any = { email };
    if (userType) {
      where.userType = userType;
    }
    // `findUnique` only works with unique fields; `userType` is not unique.
    // Use `findFirst` so the extra filter doesn't crash Prisma.
    const user = await prisma.user.findFirst({
      where,
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        userType: true,
        isVerified: true,
        profileImageUrl: true,
        merchantId: true,
        outletId: true,
        merchant: {
          select: {
            isAgreedToTerms: true,
            businessName: true,
            id: true,
            liftpayId: true,
            merchantCharge: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
        buyer: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!user) {
      throw new Error("Invalid credentials");
    }
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "";
    const tokens = buildTokens({
      id: user.id,
      email: user.email,
      name,
      profileImageUrl: user.profileImageUrl ?? undefined,
      merchantId: user.merchantId,
      outletId: user.outletId,
      userType: mapUserType(user.userType as any),
      isVerified: user.isVerified ?? false,
      isTermsAndConditionAccepted: user.merchant?.isAgreedToTerms ?? false,
      buyerId: user.buyer?.id ?? undefined,
      merchantCharge: user.merchant?.merchantCharge,
    });

    return {
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name,
          profileImageUrl: user.profileImageUrl ?? undefined,
          userType: mapUserType(user.userType as any),
          isVerified: user.isVerified ?? false,
          isTermsAndConditionAccepted: user.merchant?.isAgreedToTerms ?? false,
          merchantId: user?.merchantId ?? undefined,
          merchantName: user?.merchant?.businessName ?? undefined,
          buyerId: user.buyer?.id ?? undefined,
          merchantCharge: user?.merchant?.merchantCharge
            ? Number(user.merchant.merchantCharge)
            : 0,
          outletId: user?.outletId ?? undefined,
          outletName: user?.outlet?.name ?? undefined,
        },
        tokens,
      },
    };
  }

  /**
   * Create a merchant user with optional outlet assignment
   */
  async createMerchantUser(
    input: UserRegistrationInput
  ): Promise<AuthResponse> {
    const { email, password, phoneNumber, outletId, merchantId } = input;

    // Validate required fields for merchant user
    if (!merchantId) {
      throw new Error("merchantId is required for merchant users");
    }

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    // Check if user already exists by email or phoneNumber
    let existingUser;
    existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // If outletId is provided, verify outlet exists and belongs to the merchant
    if (outletId) {
      const outlet = await prisma.outlet.findUnique({
        where: { id: outletId },
      });

      if (!outlet) {
        throw new Error("Outlet not found");
      }

      if (outlet.merchantId !== merchantId) {
        throw new Error("Outlet does not belong to the specified merchant");
      }
    }

    // Hash password
    const validatedPassword = password || "12345"; // auto-generated password
    const hashedPassword: string = await bcrypt.hash(validatedPassword, 10);

    // Create merchant user
    const user = await prisma.user.create({
      data: {
        ...input,
        password: hashedPassword,
        userType: "Merchant",
        role: input.role || "Merchant",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        userType: true,
        role: true,
        isVerified: true,
        profileImageUrl: true,
        merchantId: true,
        outletId: true,
        merchant: {
          select: {
            id: true,
            liftpayId: true,
            businessName: true,
            businessEmail: true,
            isAgreedToTerms: true,
            merchantCharge: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "";
    const tokens = buildTokens({
      id: user.id,
      email: user.email,
      name,
      profileImageUrl: user.profileImageUrl ?? undefined,
      merchantId: user.merchantId,
      outletId: user.outletId,
      userType: "merchant",
      isVerified: user.isVerified ?? false,
      isTermsAndConditionAccepted: user.merchant?.isAgreedToTerms ?? false,
      merchantCharge: user.merchant?.merchantCharge,
    });

    return {
      success: true,
      message: "Merchant user created successfully",
      data: {
        user: {
          id: user.id,
          profileImageUrl: user.profileImageUrl ?? undefined,
          email: user.email,
          name,
          userType: "merchant",
          isVerified: user.isVerified ?? false,
          isTermsAndConditionAccepted: user.merchant?.isAgreedToTerms || false,
          merchantId: user.merchantId ?? undefined,
          merchantName: user.merchant?.businessName ?? undefined,
          merchantCharge: user.merchant?.merchantCharge
            ? Number(user.merchant.merchantCharge)
            : 0,
          outletId: user.outletId ?? undefined,
          outletName: user.outlet?.name ?? undefined,
        },
        tokens,
      },
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Request password reset - generates token and sends email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      // Don't reveal if user exists or not for security
      if (!user) {
        return {
          success: true,
          message: "If an account with that email exists, a password reset link has been sent.",
        };
      }

      // Generate secure random token
      const resetToken = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiration

      // Delete any existing reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Create new reset token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
          used: false,
        },
      });

      // Build reset URL
      const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000";
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // Get user name
      const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";

      // Send password reset email
      await emailService.sendTemplateEmail({
        to: email,
        templateName: "passwordReset",
        data: {
          appName: "Lift Platform",
          userName,
          userEmail: email,
          resetLink,
          expirationTime: "10",
        },
      });

      return {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      };
    } catch (error: any) {
      console.error("Error in forgotPassword:", error);
      // Still return success to prevent email enumeration
      return {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      };
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Validate password strength (minimum 6 characters)
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new Error("Invalid reset token or email");
      }

      // Find valid reset token
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          userId: user.id,
          token,
          used: false,
          expiresAt: {
            gt: new Date(), // Token not expired
          },
        },
      });

      if (!resetToken) {
        throw new Error("Invalid or expired reset token");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and mark token as used (transaction)
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { used: true },
        }),
      ]);

      return {
        success: true,
        message: "Password has been reset successfully",
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to reset password");
    }
  }
}

export const authService = new AuthService();
