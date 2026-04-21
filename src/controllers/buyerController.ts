import { Request, Response } from "express";
import {
  buyerService,
  CreateBuyerInput,
  UpdateBuyerInput,
} from "../services/buyerService";
import { authService } from "../services/authService";

/**
 * @swagger
 * /api/v1/buyers:
 *   post:
 *     summary: Create a buyer profile for a user
 *     tags: [Buyer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBuyerInput'
 *     responses:
 *       201:
 *         description: Buyer created
 *       400:
 *         description: Validation error
 */
/**
 * @swagger
 * /api/v1/buyers:
 *   get:
 *     summary: List buyers
 *     tags: [Buyer]
 *     responses:
 *       200:
 *         description: List of buyers
 */
/**
 * @swagger
 * /api/v1/buyers/{id}:
 *   get:
 *     summary: Get buyer by ID
 *     tags: [Buyer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Buyer found
 *       404:
 *         description: Buyer not found
 */
/**
 * @swagger
 * /api/v1/buyers/{id}:
 *   patch:
 *     summary: Update buyer by ID
 *     tags: [Buyer]
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
 *             $ref: '#/components/schemas/UpdateBuyerInput'
 *     responses:
 *       200:
 *         description: Buyer updated
 *       404:
 *         description: Buyer not found
 */
/**
 * @swagger
 * /api/v1/buyers/{id}:
 *   delete:
 *     summary: Delete buyer by ID
 *     tags: [Buyer]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Buyer deleted
 *       404:
 *         description: Buyer not found
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateBuyerInput:
 *       type: object
 *       required: [userId, phoneNumber, email]
 *       properties:
 *         userId:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         DOB:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         address:
 *           type: string
 *         gender:
 *           type: string
 *         idType:
 *           type: string
 *         idNumber:
 *           type: string
 *         nin:
 *           type: string
 *         bvn:
 *           type: string
 *         photo:
 *           type: string
 *         state:
 *           type: string
 *         LGA:
 *           type: string
 *         streetName:
 *           type: string
 *         houseNo:
 *           type: string
 *         zipCode:
 *           type: string
 *         password:
 *           type: string
 *     UpdateBuyerInput:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         DOB:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         address:
 *           type: string
 *         gender:
 *           type: string
 *         idType:
 *           type: string
 *         idNumber:
 *           type: string
 *         nin:
 *           type: string
 *         bvn:
 *           type: string
 *         photo:
 *           type: string
 *         state:
 *           type: string
 *         LGA:
 *           type: string
 *         streetName:
 *           type: string
 *         houseNo:
 *           type: string
 *         zipCode:
 *           type: string
 */
export const buyerController = {
  create: async (req: Request, res: Response) => {
    try {
      const input = req.body as CreateBuyerInput;
      //   const userId = (req.user as any)?.userId;

      const buyer = await buyerService.createBuyer(input);
      if (buyer) {
        const { email, password } = input;
        const user = await authService.login(email, password);
        return res.json(user);
      }
      return res.status(201).json({
        success: true,
        message: "Registration successful",
        data: {
          buyer,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  getById: async (req: Request, res: Response) => {
    try {
      const buyer = await buyerService.getBuyerById(req.params.id);
      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: {
          buyer,
        },
      });
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  },
  list: async (_req: Request, res: Response) => {
    try {
      const buyers = await buyerService.listBuyers();
      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: {
          buyers,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const data = req.body as UpdateBuyerInput;
      const buyer = await buyerService.updateBuyer(req.params.id, data);
      res.json(buyer);
    } catch (error: any) {
      const status = /not found/i.test(error.message) ? 404 : 400;
      res.status(status).json({ message: error.message });
    }
  },
  remove: async (req: Request, res: Response) => {
    try {
      const result = await buyerService.deleteBuyer(req.params.id);
      res.json(result);
    } catch (error: any) {
      const status = /not found/i.test(error.message) ? 404 : 400;
      res.status(status).json({ message: error.message });
    }
  },
  getBuyersCreatedByDateRange: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      const result = await buyerService.getBuyersCreatedByDateRange(start, end);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting buyers by date range:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
  getBuyersCountGroupedByDay: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      const result = await buyerService.getBuyersCountGroupedByDay(start, end);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      console.error("Error getting buyers count by day:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
};
