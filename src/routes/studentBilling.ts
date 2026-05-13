import { Router } from "express";
import { studentBillingController } from "../controllers/studentBillingController";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();
router.use(authenticateJWT);

router.post("/", studentBillingController.create);
router.post("/bulk", studentBillingController.createBulk);
router.patch("/status/bulk", studentBillingController.updateStatusBulk);
router.patch("/post/bulk", studentBillingController.postBulk);
router.get("/report/summary", studentBillingController.reportSummary);
router.get("/", studentBillingController.list);
router.get("/:id", studentBillingController.getById);
router.put("/:id", studentBillingController.update);
router.delete("/:id", studentBillingController.delete);

export default router;
