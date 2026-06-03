import { Router } from "express";
import { payrollController } from "../controllers/payrollController";

const router = Router();

router.post("/compute", payrollController.compute);

export default router;
