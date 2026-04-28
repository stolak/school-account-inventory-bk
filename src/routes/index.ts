import { Router } from "express";

// NOTE: `auth.ts` uses `export = router` (CommonJS-style), so we import it with `require` syntax.
import authRouter = require("./auth");

import bankRouter from "./bank";

import uploadRouter from "./upload";
import categoryRouter from "./category";
import subCategoryRouter from "./subCategory";
import brandRouter from "./brand";
import uomRouter from "./uom";
import inventoryItemRouter from "./inventoryItem";
import supplierRouter from "./supplier";
import purchaseRouter from "./purchase";
import schoolClassRouter from "./schoolClass";
import studentRouter from "./student";
import subClassRouter from "./subClass";

const router = Router();

router.use("/auth", authRouter);
router.use("/banks", bankRouter);
router.use("/categories", categoryRouter);
router.use("/sub-categories", subCategoryRouter);
router.use("/brands", brandRouter);
router.use("/uoms", uomRouter);
router.use("/inventory-items", inventoryItemRouter);
router.use("/suppliers", supplierRouter);
router.use("/purchases", purchaseRouter);
router.use("/school-classes", schoolClassRouter);
router.use("/students", studentRouter);
router.use("/sub-classes", subClassRouter);

router.use("/upload", uploadRouter);

export default router;

