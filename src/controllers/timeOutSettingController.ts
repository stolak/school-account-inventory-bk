import { Request, Response } from "express";
import {
  timeOutSettingService,
  UpsertTimeOutSettingInput,
} from "../services/timeOutSettingService";

export class TimeOutSettingController {
  async get(req: Request, res: Response) {
    try {
      const setting = await timeOutSettingService.getTimeOutSetting();

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: "Timeout setting not found",
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
      const input: UpsertTimeOutSettingInput = req.body;

      if (!input || Object.keys(input).length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one field is required",
        });
      }

      const setting = await timeOutSettingService.upsertTimeOutSetting(input);

      return res.status(200).json({
        success: true,
        message: "Timeout setting upserted successfully",
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

export const timeOutSettingController = new TimeOutSettingController();

