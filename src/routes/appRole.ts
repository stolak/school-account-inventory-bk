import { Router } from "express";
import { appRoleController } from "../controllers/appRoleController";

const router = Router();

router.post("/", appRoleController.createAppRole);
router.get("/", appRoleController.listAppRoles);
router.post("/:id/privileges", appRoleController.addPrivilegesToRole);
router.delete("/:id/privileges/:privilegeId", appRoleController.removePrivilegeFromRole);
router.post("/:id/menus", appRoleController.addMenusToRole);
router.get("/:id/menus", appRoleController.listRoleMenus);
router.delete("/:id/menus/:roleMenuId", appRoleController.deleteRoleMenu);
router.get("/:id", appRoleController.getAppRoleById);
router.put("/:id", appRoleController.updateAppRole);
router.delete("/:id", appRoleController.deleteAppRole);

export default router;
