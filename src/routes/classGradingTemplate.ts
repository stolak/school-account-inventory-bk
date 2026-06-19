import { Router } from "express";
import { classGradingTemplateController } from "../controllers/classGradingTemplateController";

const router = Router();

router.post("/", classGradingTemplateController.create);
router.get("/", classGradingTemplateController.list);
router.get("/:id", classGradingTemplateController.getById);
router.put("/:id", classGradingTemplateController.update);
router.delete("/:id", classGradingTemplateController.remove);

export default router;
