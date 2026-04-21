import { Router } from "express";
import { eligibilityAndScoreController } from "../controllers/eligibilityAndScoreController";

const router = Router();

// Create new eligibility and score record
router.post("/", eligibilityAndScoreController.create);
router.post("/new", eligibilityAndScoreController.createNew);

// Get all records (supports ?approved=true or ?approved=false query param)
router.get("/", eligibilityAndScoreController.list);

// Get by buyer ID (all records for a buyer, supports ?approved=true or ?approved=false)
router.get("/buyer/:buyerId", eligibilityAndScoreController.getByBuyerId);

// Get latest by buyer ID (supports ?approved=true or ?approved=false)
router.get(
  "/buyer/:buyerId/latest",
  eligibilityAndScoreController.getLatestByBuyerId
);

// Get by ID
router.get("/:id", eligibilityAndScoreController.getById);

// Update approval status
router.patch(
  "/:id/approval",
  eligibilityAndScoreController.updateApprovalStatus
);

// Update by ID
router.patch("/:id", eligibilityAndScoreController.update);

// Delete by ID
router.delete("/:id", eligibilityAndScoreController.remove);

export default router;
