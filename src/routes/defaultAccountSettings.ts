import { Router } from "express";
import { defaultAccountSettingsController } from "../controllers/defaultAccountSettingsController";

const router = Router();

router.patch("/:settingsId", defaultAccountSettingsController.patch);

export default router;
