import { Router } from "express";
import { locationController } from "../controllers/locationController";

const router = Router();

// Get all states
router.get("/states", locationController.getAllStates);

// Get all data (states with LGAs)
router.get("/data", locationController.getAllData);

// Get location metadata with statistics
router.get("/metadata", locationController.getMetadata);

// Get LGAs for a specific state
router.get("/states/:state/lgas", locationController.getLGAsByState);

// Search endpoints
router.get("/search/states", locationController.searchStates);
router.get("/search/lgas", locationController.searchLGAs);

export default router;
