import { Router } from "express";
import { menuController } from "../controllers/menuController";

const router = Router();

router.post("/", menuController.createMenu);
router.get("/", menuController.listMenus);
router.get("/:id", menuController.getMenuById);
router.put("/:id", menuController.updateMenu);
router.delete("/:id", menuController.deleteMenu);

export default router;
