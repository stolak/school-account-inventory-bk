import { Router } from "express";

// NOTE: `auth.ts` uses `export = router` (CommonJS-style), so we import it with `require` syntax.
import authRouter = require("./auth");

import bankRouter from "./bank";
import accountGroupRouter from "./accountGroup";
import accountHeadRouter from "./accountHead";
import accountSubheadRouter from "./accountSubhead";
import accountChartRouter from "./accountChart";
import accountTransactionRouter from "./accountTransaction";
import defaulSubheadSettingsRouter from "./defaulSubheadSettings";
import defaultAccountSettingsRouter from "./defaultAccountSettings";
import billingItemRouter from "./billingItem";
import concessionDiscountRouter from "./concessionDiscount";

import uploadRouter from "./upload";
import categoryRouter from "./category";
import subCategoryRouter from "./subCategory";
import brandRouter from "./brand";
import uomRouter from "./uom";
import inventoryItemRouter from "./inventoryItem";
import supplierRouter from "./supplier";
import purchaseRouter from "./purchase";
import studentCollectionRouter from "./studentCollection";
import staffCollectionRouter from "./staffCollection";
import donationRouter from "./donation";
import schoolClassRouter from "./schoolClass";
import studentRouter from "./student";
import subClassRouter from "./subClass";
import termRouter from "./term";
import sessionRouter from "./session";
import activePeriodRouter from "./activePeriod";
import staffRouter from "./staff";
import projectRouter from "./project";
import projectCollectionRouter from "./projectCollection";
import storeRouter from "./store";
import storeTransferRouter from "./storeTransfer";
import userRouter from "./user";

const router = Router();

router.use("/auth", authRouter);
router.use("/banks", bankRouter);
router.use("/account-groups", accountGroupRouter);
router.use("/account-heads", accountHeadRouter);
router.use("/account-subheads", accountSubheadRouter);
router.use("/account-charts", accountChartRouter);
router.use("/account-transactions", accountTransactionRouter);
router.use("/default-subhead-settings", defaulSubheadSettingsRouter);
router.use("/default-account-settings", defaultAccountSettingsRouter);
router.use("/billing-items", billingItemRouter);
router.use("/concession-discounts", concessionDiscountRouter);
router.use("/categories", categoryRouter);
router.use("/sub-categories", subCategoryRouter);
router.use("/brands", brandRouter);
router.use("/uoms", uomRouter);
router.use("/inventory-items", inventoryItemRouter);
router.use("/suppliers", supplierRouter);
router.use("/purchases", purchaseRouter);
router.use("/student-collections", studentCollectionRouter);
router.use("/staff-collections", staffCollectionRouter);
router.use("/donations", donationRouter);
router.use("/school-classes", schoolClassRouter);
router.use("/students", studentRouter);
router.use("/sub-classes", subClassRouter);
router.use("/terms", termRouter);
router.use("/sessions", sessionRouter);
router.use("/active-period", activePeriodRouter);
router.use("/staff", staffRouter);
router.use("/projects", projectRouter);
router.use("/project-collections", projectCollectionRouter);
router.use("/stores", storeRouter);
router.use("/store-transfers", storeTransferRouter);
router.use("/users", userRouter);

router.use("/upload", uploadRouter);

export default router;

