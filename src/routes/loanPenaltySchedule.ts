import { Router } from "express";
import { loanPenaltyScheduleController } from "../controllers/loanPenaltyScheduleController";

const router = Router();

// Create new penalty schedule
router.post("/", loanPenaltyScheduleController.create);

// Get pending penalty schedules by date (must be before /:id route)
router.get("/pending", loanPenaltyScheduleController.getPendingByDate);

// Get all penalty schedules for a specific loan schedule
router.get(
  "/schedule/:scheduleId",
  loanPenaltyScheduleController.getByScheduleId
);

// Get penalty schedule by ID
router.get("/:id", loanPenaltyScheduleController.getById);

// Execute penalty schedule (mark as executed)
router.patch("/:id/execute", loanPenaltyScheduleController.execute);

// Update penalty schedule
router.patch("/:id", loanPenaltyScheduleController.update);

// Delete penalty schedule
router.delete("/:id", loanPenaltyScheduleController.delete);

export default router;
