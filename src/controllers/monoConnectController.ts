import { Request, Response } from "express";
import { monoConnectService } from "../services/monoConnectService";
import { MonoConnectStatus } from "@prisma/client";

export class MonoConnectController {
  /**
   * Create a new MonoConnect record
   */
  async create(req: Request, res: Response) {
    try {
      const { buyerId, accountId, status } = req.body;

      if (!buyerId || !accountId) {
        return res.status(400).json({
          success: false,
          message: "buyerId and accountId are required",
        });
      }

      const result = await monoConnectService.createMonoConnect({
        buyerId,
        accountId,
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
   * Get MonoConnect by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const result = await monoConnectService.getMonoConnectById(req.params.id);

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
   * Get MonoConnects by buyerId
   */
  async getByBuyerId(req: Request, res: Response) {
    try {
      const result = await monoConnectService.getMonoConnectsByBuyerId(
        req.params.buyerId
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
   * Get MonoConnect by accountId
   */
  async getByAccountId(req: Request, res: Response) {
    try {
      const result = await monoConnectService.getMonoConnectByAccountId(
        req.params.accountId
      );

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
   * Get all MonoConnect records with filters
   */
  async list(req: Request, res: Response) {
    try {
      const result = await monoConnectService.getAllMonoConnects({
        buyerId: req.query.buyerId as string,
        status: req.query.status as MonoConnectStatus,
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
   * Update MonoConnect record
   */
  async update(req: Request, res: Response) {
    try {
      const { accountId, status } = req.body;

      const updateData: any = {};
      if (accountId !== undefined) updateData.accountId = accountId;
      if (status !== undefined) updateData.status = status;

      const result = await monoConnectService.updateMonoConnect(
        req.params.id,
        updateData
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
   * Update MonoConnect status
   */
  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;

      if (!status || !Object.values(MonoConnectStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Valid status is required (Active or Inactive)",
        });
      }

      const result = await monoConnectService.updateMonoConnectStatus(
        req.params.id,
        status
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
   * Delete MonoConnect record
   */
  async delete(req: Request, res: Response) {
    try {
      const result = await monoConnectService.deleteMonoConnect(req.params.id);

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
   * Get active MonoConnect by buyerId
   */
  async getActiveByBuyerId(req: Request, res: Response) {
    try {
      const result = await monoConnectService.getActiveMonoConnectByBuyerId(
        req.params.buyerId
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
}

export const monoConnectController = new MonoConnectController();

