import { Request, Response } from "express";
import { tierService } from "../services/tierService";
import { TierStatus } from "@prisma/client";

export class TierController {
  /**
   * Create a new tier
   */
  async createTier(req: Request, res: Response) {
    try {
      const result = await tierService.createTier({
        name: req.body.name,
        from: req.body.from,
        to: req.body.to,
        status: req.body.status,
        discounted: req.body.discounted,
      });

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get tier by ID
   */
  async getTierById(req: Request, res: Response) {
    try {
      const result = await tierService.getTierById(req.params.id);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get all tiers with filters
   */
  async getAllTiers(req: Request, res: Response) {
    try {
      const result = await tierService.getAllTiers({
        status: req.query.status as TierStatus,
      });

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
  }

  /**
   * Update tier
   */
  async updateTier(req: Request, res: Response) {
    try {
      const result = await tierService.updateTier(req.params.id, {
        name: req.body.name,
        from: req.body.from,
        to: req.body.to,
        status: req.body.status,
        discounted: req.body.discounted,
      });

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
  }

  /**
   * Delete tier
   */
  async deleteTier(req: Request, res: Response) {
    try {
      const result = await tierService.deleteTier(req.params.id);

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
  }

  /**
   * Get tier by amount
   */
  async getTierByAmount(req: Request, res: Response) {
    try {
      const amount = parseFloat(req.params.amount);

      if (isNaN(amount)) {
        return res.status(400).json({
          success: false,
          error: "Invalid amount provided",
        });
      }

      const result = await tierService.getTierByAmount(amount);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Calculate discount for amount
   */
  async calculateDiscount(req: Request, res: Response) {
    try {
      const amount = parseFloat(req.params.amount);

      if (isNaN(amount)) {
        return res.status(400).json({
          success: false,
          error: "Invalid amount provided",
        });
      }

      const result = await tierService.calculateDiscount(amount);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Toggle tier status
   */
  async toggleTierStatus(req: Request, res: Response) {
    try {
      const result = await tierService.toggleTierStatus(req.params.id);

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
  }
}

export const tierController = new TierController();
