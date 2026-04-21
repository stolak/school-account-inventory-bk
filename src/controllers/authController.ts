import { Request, Response } from "express";
import { authService } from "../services/authService";
import { UserRegistrationInput } from "../services/authService";
import { userService } from "../services/userService";

/**
 * @openapi
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@admin.com
 *               password:
 *                 type: string
 *                 example: 12345
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phoneNumber:
 *                 type: string
 *                 example: '+1234567890'
 *               role:
 *                 type: string
 *                 enum: [Visitor, Admin, Merchant, Buyer, SuperAdmin, CustomerSupport]
 *                 example: Admin
 *               userType:
 *                 type: string
 *                 enum: [Admin, Merchant, Buyer]
 *                 example: Admin
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role = "Admin",
      userType = "Admin",
    }: UserRegistrationInput = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await authService.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      userType,
    });
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const registerBuyer = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role = "Buyer",
      userType = "Buyer",
    }: UserRegistrationInput = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await authService.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      userType,
    });
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const result = await authService.login(email, password, userType);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @openapi
 * /api/v1/auth/register-merchant-user:
 *   post:
 *     summary: Create a merchant user with optional outlet assignment
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - merchantId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "staff@retailstore.com"
 *               password:
 *                 type: string
 *                 example: "securepassword"
 *                 description: "Optional - will default to '12345' if not provided"
 *               firstName:
 *                 type: string
 *                 example: "Jane"
 *               lastName:
 *                 type: string
 *                 example: "Smith"
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348012345678"
 *               merchantId:
 *                 type: string
 *                 format: uuid
 *                 description: "ID of the merchant this user belongs to"
 *               outletId:
 *                 type: string
 *                 format: uuid
 *                 description: "Optional - ID of the outlet this user is assigned to"
 *               role:
 *                 type: string
 *                 enum: [Visitor, Admin, Merchant, Buyer, SuperAdmin, CustomerSupport]
 *                 default: Merchant
 *                 example: "Merchant"
 *     responses:
 *       201:
 *         description: Merchant user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Merchant user created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         userType:
 *                           type: string
 *                           example: "merchant"
 *                         isVerified:
 *                           type: boolean
 *                         isTermsAndConditionAccepted:
 *                           type: boolean
 *                         merchantId:
 *                           type: string
 *                           format: uuid
 *                         merchantName:
 *                           type: string
 *                         merchantCharge:
 *                           type: number
 *                         outletId:
 *                           type: string
 *                           format: uuid
 *                         outletName:
 *                           type: string
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         expiresIn:
 *                           type: number
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Merchant or outlet not found
 *       500:
 *         description: Internal server error
 */
export const registerMerchantUser = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      merchantId,
      outletId,
      role = "Merchant",
    }: UserRegistrationInput = req.body;

    if (!email || !merchantId) {
      return res.status(400).json({
        success: false,
        message: "Email and merchantId are required",
      });
    }

    const result = await authService.createMerchantUser({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      merchantId,
      outletId,
      role,
      userType: "Merchant",
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @openapi
 * /api/v1/auth/users:
 *   get:
 *     summary: Get users filtered by merchant ID
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID to filter users
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [Admin, Merchant, Buyer]
 *         description: Filter by user type
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Visitor, Admin, Merchant, Buyer, SuperAdmin, CustomerSupport]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           email:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *                           userType:
 *                             type: string
 *                           role:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           isVerified:
 *                             type: boolean
 *                           isEmailVerified:
 *                             type: boolean
 *                           isPhoneVerified:
 *                             type: boolean
 *                           outletId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                             description: ID of the outlet this user is assigned to
 *                           outlet:
 *                             type: object
 *                             nullable: true
 *                             description: Outlet details if user is assigned to an outlet
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Bad request - merchantId is required
 *       404:
 *         description: Merchant not found
 *       500:
 *         description: Internal server error
 */
/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset email with a token that expires in 10 minutes
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent (or message indicating email sent if account exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "If an account with that email exists, a password reset link has been sent."
 *       500:
 *         description: Internal server error
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process password reset request",
    });
  }
};

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     description: Resets user password using the token received via email. Token expires after 10 minutes and can only be used once.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               token:
 *                 type: string
 *                 description: Reset token received via email
 *                 example: "a1b2c3d4e5f6..."
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "newSecurePassword123"
 *               confirmPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "newSecurePassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password has been reset successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Passwords do not match"
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired reset token"
 *       500:
 *         description: Internal server error
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword, confirmPassword } = req.body;

    if (!email || !token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, token, newPassword, and confirmPassword are required",
      });
    }

    const result = await authService.resetPassword(
      email,
      token,
      newPassword,
      confirmPassword
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
};

export const getUsersByMerchant = async (req: Request, res: Response) => {
  try {
    const { merchantId, userType, role, isActive, page, limit } = req.query;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "merchantId is required",
      });
    }

    const result = await userService.getUsersByMerchantId(
      merchantId as string,
      {
        userType: userType as string,
        role: role as string,
        isActive: isActive ? isActive === "true" : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      }
    );

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
