import { Request, Response } from "express";
import {
  merchantService,
  CreateMerchantInput,
  UpdateMerchantInput,
} from "../services/merchantService";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import { merchantStatsService } from "../services/merchantStatsService";

/**
 * @openapi
 * /api/v1/merchants:
 *   post:
 *     summary: Create a merchant profile for a user
 *     tags: [Merchant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, email, authorizedPerson, authorizedDesignation, authorizedPhoneNo, authorizedEmail, typeOfServiceOrProducts, rcNumber, dateOfIncorporation, taxIdentificationNumber, registrationAddress, operatingAddress, businessCategory, companyEmail, companyPhoneNumber, officeWebsite, password]
 *             properties:
 *               companyName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               authorizedPerson:
 *                 type: string
 *               authorizedDesignation:
 *                 type: string
 *               authorizedPhoneNo:
 *                 type: string
 *               authorizedEmail:
 *                 type: string
 *                 format: email
 *               typeOfServiceOrProducts:
 *                 type: string
 *               rcNumber:
 *                 type: string
 *               dateOfIncorporation:
 *                 type: string
 *               taxIdentificationNumber:
 *                 type: string
 *               registrationAddress:
 *                 type: string
 *               operatingAddress:
 *                 type: string
 *               businessCategory:
 *                 type: string
 *               companyEmail:
 *                 type: string
 *                 format: email
 *               companyPhoneNumber:
 *                 type: string
 *               officeWebsite:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Merchant created
 *       400:
 *         description: Validation error
 */
/**
 * @openapi
 * /api/v1/merchants:
 *   get:
 *     summary: List merchants
 *     tags: [Merchant]
 *     responses:
 *       200:
 *         description: List of merchants
 */
/**
 * @openapi
 * /api/v1/merchants/{id}:
 *   get:
 *     summary: Get merchant by ID
 *     tags: [Merchant]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Merchant found
 *       404:
 *         description: Merchant not found
 */
/**
 * @openapi
 * /api/v1/merchants/{id}:
 *   patch:
 *     summary: Update merchant by ID
 *     tags: [Merchant]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               authorizedPerson:
 *                 type: string
 *               authorizedDesignation:
 *                 type: string
 *               authorizedPhoneNo:
 *                 type: string
 *               authorizedEmail:
 *                 type: string
 *                 format: email
 *               typeOfServiceOrProducts:
 *                 type: string
 *               rcNumber:
 *                 type: string
 *               dateOfIncorporation:
 *                 type: string
 *               taxIdentificationNumber:
 *                 type: string
 *               registrationAddress:
 *                 type: string
 *               operatingAddress:
 *                 type: string
 *               businessCategory:
 *                 type: string
 *               companyEmail:
 *                 type: string
 *                 format: email
 *               companyPhoneNumber:
 *                 type: string
 *               officeWebsite:
 *                 type: string
 *     responses:
 *       200:
 *         description: Merchant updated
 *       404:
 *         description: Merchant not found
 */
/**
 * @openapi
 * /api/v1/merchants/{id}:
 *   delete:
 *     summary: Delete merchant by ID
 *     tags: [Merchant]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Merchant deleted
 *       404:
 *         description: Merchant not found
 */
export const merchantController = {
  create: async (req: Request, res: Response) => {
    try {
      const input = req.body as CreateMerchantInput;
      const merchant = await merchantService.createMerchant(input);
      if (merchant) {
        const { authorizedEmail, password } = input;
        const user = await authService.login(authorizedEmail, password);
        res.json(user);
      }
      res.status(201).json({
        success: true,
        message: "Merchant registration successful",
        data: {
          merchant,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  getById: async (req: Request, res: Response) => {
    try {
      const merchant = await merchantService.getMerchantById(req.params.id);

      res.status(201).json({
        success: true,
        message: "Merchant retrieved successfully",
        data: {
          ...merchant,
        },
      });
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  },

  getByUserMerchantId: async (req: Request, res: Response) => {
    try {
      if (!req.user?.id || !req.user.merchantId) {
        return res
          .status(401)
          .json({ message: "Unauthorized please login as merchant" });
      }
      const merchant = await merchantService.getMerchantById(
        req.user.merchantId
      );
      res.status(201).json({
        success: true,
        message: "Merchant retrieved successfully",
        data: {
          ...merchant,
        },
      });
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  },
  /**
   * @openapi
   * /api/v1/merchants:
   *   get:
   *     summary: Get list of merchants with optional filtering
   *     tags: [Merchant]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: documentStatus
   *         schema:
   *           type: string
   *           enum: [Pending, Approved, Rejected]
   *         description: Filter by document status
   *       - in: query
   *         name: applicationStatus
   *         schema:
   *           type: string
   *           enum: [Pending, Approved, Rejected, Inactive, Active, Suspended, Deleted]
   *         description: Filter by application status
   *     responses:
   *       200:
   *         description: List of merchants
   *       401:
   *         description: Unauthorized
   */
  list: async (req: Request, res: Response) => {
    try {
      const { documentStatus, applicationStatus } = req.query;

      const merchants = await merchantService.listMerchants({
        documentStatus: documentStatus as string,
        applicationStatus: applicationStatus as string,
      });

      res.status(201).json({
        success: true,
        message: "Merchant retrieved successfully",
        data: {
          merchants,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const data = req.body as UpdateMerchantInput;
      const merchant = await merchantService.updateMerchant(
        req.params.id,
        data,
        req as any
      );
      res.status(201).json({
        success: true,
        message: "Merchant retrieved successfully",
        data: {
          ...merchant,
        },
      });
    } catch (error: any) {
      const status = /not found/i.test(error.message) ? 404 : 400;
      res.status(status).json({ message: error.message });
    }
  },
  remove: async (req: Request, res: Response) => {
    try {
      const result = await merchantService.deleteMerchant(req.params.id);
      res.json(result);
    } catch (error: any) {
      const status = /not found/i.test(error.message) ? 404 : 400;
      res.status(status).json({ message: error.message });
    }
  },

  /**
   * @openapi
   * /api/v1/merchants/{merchantId}/users:
   *   get:
   *     summary: Get all users for a specific merchant
   *     tags: [Merchant]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: merchantId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Merchant ID
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
   *         description: List of users for the merchant retrieved successfully
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
   *         description: Bad request
   *       404:
   *         description: Merchant not found
   *       500:
   *         description: Internal server error
   */
  getUsersByMerchantId: async (req: Request, res: Response) => {
    try {
      const result = await userService.getUsersByMerchantId(
        req.params.merchantId,
        {
          userType: req.query.userType as string,
          role: req.query.role as string,
          isActive: req.query.isActive
            ? req.query.isActive === "true"
            : undefined,
          page: req.query.page ? parseInt(req.query.page as string) : undefined,
          limit: req.query.limit
            ? parseInt(req.query.limit as string)
            : undefined,
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
  },

  /**
   * Get paid invoices sum and statistics by merchant
   */
  getPaidInvoicesSum: async (req: Request, res: Response) => {
    try {
      const { merchantId } = req.params;
      const { startDate, endDate } = req.query;

      if (!merchantId) {
        return res.status(400).json({
          success: false,
          message: "merchantId is required",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required as query parameters",
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)",
        });
      }

      const result = await merchantStatsService.getPaidInvoicesSumByMerchant({
        merchantId,
        startDate: start,
        endDate: end,
      });

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
};
