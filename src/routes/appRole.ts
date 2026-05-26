import { Router } from "express";
import { appRoleController } from "../controllers/appRoleController";

const router = Router();

router.post("/", appRoleController.createAppRole);
router.get("/", appRoleController.listAppRoles);
router.post("/:id/privileges", appRoleController.addPrivilegesToRole);
router.delete("/:id/privileges/:privilegeId", appRoleController.removePrivilegeFromRole);
router.get("/:id", appRoleController.getAppRoleById);
router.put("/:id", appRoleController.updateAppRole);
router.delete("/:id", appRoleController.deleteAppRole);

export default router;
