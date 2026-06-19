import { Router } from "express";
import { studentSubjectRegistrationController } from "../controllers/studentSubjectRegistrationController";

const router = Router();

router.post("/", studentSubjectRegistrationController.create);
router.get("/", studentSubjectRegistrationController.list);
router.get("/:id", studentSubjectRegistrationController.getById);
router.put("/:id", studentSubjectRegistrationController.update);
router.delete("/:id", studentSubjectRegistrationController.remove);

export default router;
