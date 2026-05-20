import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { userController } from "../controllers/userController";
import { userStoreController } from "../controllers/userStoreController";

const router = Router();

router.use(authenticateJWT);

router.get("/", userController.listUsers);
router.get("/:userId/stores", userStoreController.listStoresForUser);
router.get("/:userId/accessible-stores", userStoreController.listAccessibleStoresForUser);

export default router;
