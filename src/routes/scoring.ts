import { Router } from "express";
import { scoringController } from "../controllers/scoringController";

const router = Router();

router.post("/calculate", scoringController.calculate);
router.post("/self-assessment/calculate", scoringController.selfAssessmentCalculate);

export default router;
