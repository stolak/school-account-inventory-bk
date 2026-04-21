import { Router } from "express";
import { scoringInputSnapshotController } from "../controllers/scoringInputSnapshotController";

const router = Router();

router.post("/", scoringInputSnapshotController.create);
router.post("/upsert", scoringInputSnapshotController.upsert);
router.get("/", scoringInputSnapshotController.list);
router.get(
  "/buyer/:buyerId/latest",
  scoringInputSnapshotController.getLatestByBuyerId
);
router.get("/buyer/:buyerId", scoringInputSnapshotController.getByBuyerId);
router.get("/:id", scoringInputSnapshotController.getById);
router.patch("/:id", scoringInputSnapshotController.update);
router.delete("/:id", scoringInputSnapshotController.remove);

export default router;
