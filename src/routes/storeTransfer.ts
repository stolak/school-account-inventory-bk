import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { storeTransferController } from "../controllers/storeTransferController";

const router = Router();

router.use(authenticateJWT);

router.post("/", storeTransferController.transfer);

export default router;
