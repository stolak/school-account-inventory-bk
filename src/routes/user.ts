import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { userController } from "../controllers/userController";

const router = Router();

router.use(authenticateJWT);

router.get("/", userController.listUsers);

export default router;
