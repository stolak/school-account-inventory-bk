import { Request, Response } from "express";
import {
  settlementSettingService,
  UpsertSettlementSettingInput,
} from "../services/settlementSettingService";

export class SettlementSettingController {
  async get(req: Request, res: Response) {
    try {
      const setting = await settlementSettingService.getSettlementSetting();

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: "Settlement setting not found",
        });
      }

      return res.status(200).json({ success: true, data: setting });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const input: UpsertSettlementSettingInput = req.body;

      if (!input || Object.keys(input).length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one field is required",
        });
      }

      const setting = await settlementSettingService.upsertSettlementSetting(
        input
      );

      return res.status(200).json({
        success: true,
        message: "Settlement setting upserted successfully",
        data: setting,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

export const settlementSettingController = new SettlementSettingController();

