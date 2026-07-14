import { Router } from "express";
import { studentTransportHistoryController } from "../controllers/studentTransportHistoryController";

const router = Router();

router.post("/", studentTransportHistoryController.create);
router.get("/", studentTransportHistoryController.list);
router.get("/:id", studentTransportHistoryController.getById);
router.put("/:id", studentTransportHistoryController.update);
router.delete("/:id", studentTransportHistoryController.remove);

export default router;
