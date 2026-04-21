import { Request, Response } from "express";
import { locationService } from "../services/locationService";

/**
 * @openapi
 * /api/v1/locations/states:
 *   get:
 *     summary: Get all Nigerian states
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: List of all Nigerian states
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     states:
 *                       type: array
 *                       items:
 *                         type: string
 *                     count:
 *                       type: number
 *       500:
 *         description: Server error
 */
export const locationController = {
  getAllStates: async (req: Request, res: Response) => {
    try {
      const states = locationService.getAllStates();

      res.json({
        success: true,
        message: "States retrieved successfully",
        data: {
          states,
          count: states.length,
        },
      });
    } catch (error: any) {
      console.error("Error getting states:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve states",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/locations/data:
   *   get:
   *     summary: Get all Nigerian states and LGAs data
   *     tags: [Locations]
   *     responses:
   *       200:
   *         description: Complete Nigerian states and LGAs data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   additionalProperties:
   *                     type: array
   *                     items:
   *                       type: string
   *       500:
   *         description: Server error
   */
  getAllData: async (req: Request, res: Response) => {
    try {
      const data = locationService.getAllData();

      res.json({
        success: true,
        message: "Location data retrieved successfully",
        data,
      });
    } catch (error: any) {
      console.error("Error getting location data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve location data",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/locations/metadata:
   *   get:
   *     summary: Get location metadata with statistics
   *     tags: [Locations]
   *     responses:
   *       200:
   *         description: Location metadata with statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalStates:
   *                       type: number
   *                     totalLGAs:
   *                       type: number
   *                     states:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           name:
   *                             type: string
   *                           lgaCount:
   *                             type: number
   *                           lgAs:
   *                             type: array
   *                             items:
   *                               type: string
   *       500:
   *         description: Server error
   */
  getMetadata: async (req: Request, res: Response) => {
    try {
      const metadata = locationService.getLocationMetadata();

      res.json({
        success: true,
        message: "Location metadata retrieved successfully",
        data: metadata,
      });
    } catch (error: any) {
      console.error("Error getting location metadata:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve location metadata",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/locations/states/{state}/lgas:
   *   get:
   *     summary: Get LGAs for a specific state
   *     tags: [Locations]
   *     parameters:
   *       - in: path
   *         name: state
   *         required: true
   *         schema:
   *           type: string
   *         description: State name
   *     responses:
   *       200:
   *         description: LGAs for the specified state
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     state:
   *                       type: string
   *                     lgAs:
   *                       type: array
   *                       items:
   *                         type: string
   *                     count:
   *                       type: number
   *       404:
   *         description: State not found
   *       500:
   *         description: Server error
   */
  getLGAsByState: async (req: Request, res: Response) => {
    try {
      const { state } = req.params;

      if (!state) {
        return res.status(400).json({
          success: false,
          message: "State parameter is required",
        });
      }

      const lgAs = locationService.getLGAsByState(state);

      res.json({
        success: true,
        message: `LGAs for ${state} retrieved successfully`,
        data: {
          state,
          lgAs,
          count: lgAs.length,
        },
      });
    } catch (error: any) {
      console.error(`Error getting LGAs for state ${req.params.state}:`, error);

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to retrieve LGAs",
          error: error.message,
        });
      }
    }
  },

  /**
   * @openapi
   * /api/v1/locations/search/states:
   *   get:
   *     summary: Search states by name
   *     tags: [Locations]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query for state name
   *     responses:
   *       200:
   *         description: Matching states
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     query:
   *                       type: string
   *                     states:
   *                       type: array
   *                       items:
   *                         type: string
   *                     count:
   *                       type: number
   *       400:
   *         description: Missing search query
   *       500:
   *         description: Server error
   */
  searchStates: async (req: Request, res: Response) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query parameter 'q' is required",
        });
      }

      const states = locationService.searchStates(q);

      res.json({
        success: true,
        message: `States matching "${q}" retrieved successfully`,
        data: {
          query: q,
          states,
          count: states.length,
        },
      });
    } catch (error: any) {
      console.error("Error searching states:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search states",
        error: error.message,
      });
    }
  },

  /**
   * @openapi
   * /api/v1/locations/search/lgas:
   *   get:
   *     summary: Search LGAs by name
   *     tags: [Locations]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query for LGA name
   *       - in: query
   *         name: state
   *         required: false
   *         schema:
   *           type: string
   *         description: Filter by specific state (optional)
   *     responses:
   *       200:
   *         description: Matching LGAs
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     query:
   *                       type: string
   *                     state:
   *                       type: string
   *                     lgAs:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           lga:
   *                             type: string
   *                           state:
   *                             type: string
   *                     count:
   *                       type: number
   *       400:
   *         description: Missing search query
   *       500:
   *         description: Server error
   */
  searchLGAs: async (req: Request, res: Response) => {
    try {
      const { q, state } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query parameter 'q' is required",
        });
      }

      const lgAs = locationService.searchLGAs(q, state as string);

      res.json({
        success: true,
        message: `LGAs matching "${q}" retrieved successfully`,
        data: {
          query: q,
          state: state || "All states",
          lgAs,
          count: lgAs.length,
        },
      });
    } catch (error: any) {
      console.error("Error searching LGAs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search LGAs",
        error: error.message,
      });
    }
  },
};
