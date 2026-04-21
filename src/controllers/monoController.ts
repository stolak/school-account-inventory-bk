import { Request, Response } from "express";
import {
  lookupNIN,
  lookupTIN,
  lookupAccountNumber,
} from "../services/monoService";
import prisma from "../utils/prisma";

/**
 * @openapi
 * /api/v1/verify/nin:
 *   post:
 *     summary: Lookup NIN using Mono API
 *     tags:
 *       - Verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nin:
 *                 type: string
 *                 example: "70368907799"
 *     responses:
 *       200:
 *         description: NIN lookup result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
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

/**
 * @openapi
 * /api/v1/verify/tin/:
 *   post:
 *     summary: Lookup TIN using Mono API
 *     tags:
 *       - Verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: string
 *                 example: "1234567890"
 *               channel:
 *                 type: string
 *                 example: "TIN"
 *     responses:
 *       200:
 *         description: TIN lookup result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
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

/**
 * @openapi
 * /api/v1/verify/account-number:
 *   post:
 *     summary: Lookup account number using Mono API
 *     tags:
 *       - Verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nip_code:
 *                 type: string
 *                 example: "044"
 *               account_number:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       200:
 *         description: Account number lookup result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
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

/**
 * @openapi
 * /api/v1/verify/nin-registration:
 *   post:
 *     summary: Validate NIN for new registration
 *     tags:
 *       - Verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nin
 *             properties:
 *               nin:
 *                 type: string
 *                 example: "70368907799"
 *     responses:
 *       200:
 *         description: NIN lookup result from Mono
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: NIN already exists with buyer or bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: NIN already exists with a buyer and cannot be used for new registration
 */

export const monoController = {
  lookupNin: async (req: Request, res: Response) => {
    try {
      const { nin } = req.body;
      if (!nin) {
        return res.status(400).json({ message: "NIN is required" });
      }
      const result = await lookupNIN(nin);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  },
  lookupNinForRegistration: async (req: Request, res: Response) => {
    try {
      const { nin } = req.body;
      if (!nin) {
        return res.status(400).json({ message: "NIN is required" });
      }

      const existingBuyer = await prisma.buyer.findFirst({
        where: { nin },
        select: { id: true },
      });

      if (existingBuyer) {
        return res.status(400).json({
          message:
            "NIN already exists with a buyer and cannot be used for new registration",
        });
      }

      const result = await lookupNIN(nin);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  },
  lookupTin: async (req: Request, res: Response) => {
    try {
      const { number, channel } = req.body;
      if (!number) {
        return res.status(400).json({ message: "number is required" });
      }
      const result = await lookupTIN(number, channel);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  },
  lookupAccountNumber: async (req: Request, res: Response) => {
    try {
      const { nip_code, account_number } = req.body;
      if (!nip_code || !account_number) {
        return res
          .status(400)
          .json({ message: "nip_code and account_number are required" });
      }
      const result = await lookupAccountNumber(nip_code, account_number);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || error });
    }
  },
};
