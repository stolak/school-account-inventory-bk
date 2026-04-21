/// <reference path="../types/express/index.d.ts" />
import express, { Request, Response, Router } from "express";
import { userService } from "../services/userService";

const router = Router();

/**
 * @openapi
 * /api/v1/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /api/v1/profile/merchant:
 *   get:
 *     summary: Get authenticated merchant's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /api/v1/profile/buyer:
 *   get:
 *     summary: Get authenticated buyer's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Unauthorized
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const user = await userService.getUserById(userId);
    res.json({ message: "This is a protected route", user });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

router.get("/buyer", async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const buyer = await userService.getUserById(userId);
    res.json({
      success: true,
      message: "Buyer retrieved successfully",
      data: {
        ...buyer,
      },
    });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

router.get("/merchant", async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const merchant = await userService.getUserById(userId);
    res.json({
      success: true,
      message: "Merchant retrieved successfully",
      data: {
        ...merchant,
      },
    });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

export = router;
