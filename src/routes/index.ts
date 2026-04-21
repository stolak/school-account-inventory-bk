import { Router } from "express";

// NOTE: `auth.ts` uses `export = router` (CommonJS-style), so we import it with `require` syntax.
import authRouter = require("./auth");

import bankRouter from "./bank";

import uploadRouter from "./upload";

const router = Router();

router.use("/auth", authRouter);
router.use("/banks", bankRouter);

router.use("/upload", uploadRouter);

export default router;

