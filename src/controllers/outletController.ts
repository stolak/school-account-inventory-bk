import { Request, Response } from "express";
import { outletService } from "../services/outletService";
import { OutletStatus } from "@prisma/client";

export class OutletController {
  /**
   * Create a new outlet
   */
  async createOutlet(req: Request, res: Response) {
    try {
      const { name, address, managerId, merchantId, status } = req.body;

      if (!name || !address || !merchantId) {
        return res.status(400).json({
          success: false,
          message: "Name, address, and merchantId are required",
        });
      }

      const result = await outletService.createOutlet({
        name,
        address,
        managerId,
        merchantId,
        status,
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
   * Get outlet by ID
   */
  async getOutletById(req: Request, res: Response) {
    try {
      const result = await outletService.getOutletById(req.params.id);

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
   * Get all outlets with filters
   */
  async getAllOutlets(req: Request, res: Response) {
    try {
      const result = await outletService.getAllOutlets({
        merchantId: req.query.merchantId as string,
        managerId: req.query.managerId as string,
        status: req.query.status as OutletStatus,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
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
   * Get outlets by merchant ID
   */
  async getOutletsByMerchantId(req: Request, res: Response) {
    try {
      const result = await outletService.getOutletsByMerchantId(
        req.params.merchantId,
        {
          status: req.query.status as OutletStatus,
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
  }

  /**
   * Update outlet
   */
  async updateOutlet(req: Request, res: Response) {
    try {
      const { name, address, managerId, status } = req.body;

      const result = await outletService.updateOutlet(req.params.id, {
        name,
        address,
        managerId,
        status,
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
   * Toggle outlet status
   */
  async toggleOutletStatus(req: Request, res: Response) {
    try {
      const result = await outletService.toggleOutletStatus(req.params.id);

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
   * Delete outlet
   */
  async deleteOutlet(req: Request, res: Response) {
    try {
      const result = await outletService.deleteOutlet(req.params.id);

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
   * Get outlet statistics
   */
  async getOutletStatistics(req: Request, res: Response) {
    try {
      const result = await outletService.getOutletStatistics(req.params.id);

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
   * Get all outlets with revenue statistics
   */
  async getAllOutletsWithRevenue(req: Request, res: Response) {
    try {
      const result = await outletService.getAllOutletsWithRevenue({
        merchantId: req.query.merchantId as string,
        status: req.query.status as OutletStatus,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
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
}

export const outletController = new OutletController();

