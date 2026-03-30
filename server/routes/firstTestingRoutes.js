// server/routes/firstTestingRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createOrUpdateFirstTesting,
  getFirstTesting,
  getDetailedFirstTesting,
  deleteFirstTesting,
  parseCV, // Add this import
} from "../controllers/firstTestingController.js";

const router = express.Router();

// Protected routes
router.get("/", authMiddleware, getFirstTesting);
router.get("/detailed", authMiddleware, getDetailedFirstTesting);
router.put("/", authMiddleware, createOrUpdateFirstTesting);
router.delete("/", authMiddleware, deleteFirstTesting);

// CV Parser Route
router.post("/parse-cv", authMiddleware, parseCV); // Add this route

export default router;