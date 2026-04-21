import { Router } from "express";
import { bankStatementAnalysisController } from "../controllers/bankStatementAnalysisController";

const router = Router();

router.post("/rework", bankStatementAnalysisController.analyzeRework);
router.post("/normalize-gtbank", bankStatementAnalysisController.normalizeGtbank);

export default router;

