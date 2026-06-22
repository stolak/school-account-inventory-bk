import { Router } from "express";
import { studentAssessmentScoreController } from "../controllers/studentAssessmentScoreController";

const router = Router();

router.post("/bulk", studentAssessmentScoreController.createBulk);
router.post("/", studentAssessmentScoreController.create);
router.get("/", studentAssessmentScoreController.list);
router.get("/:id", studentAssessmentScoreController.getById);
router.put("/:id", studentAssessmentScoreController.update);
router.delete("/:id", studentAssessmentScoreController.remove);

export default router;
