import { Router } from "express";
import { monoController } from "../controllers/monoController";

const router = Router();

router.post("/nin", monoController.lookupNin);
router.post("/nin-registration", monoController.lookupNinForRegistration);
router.post("/tin", monoController.lookupTin);
router.post("/account-number", monoController.lookupAccountNumber);

export default router;
