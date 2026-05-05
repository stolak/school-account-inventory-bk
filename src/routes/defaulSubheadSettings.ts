import { Router } from "express";
import { defaulSubheadSettingsController } from "../controllers/defaulSubheadSettingsController";

const router = Router();

router.patch("/:settingsId", defaulSubheadSettingsController.patch);

export default router;
