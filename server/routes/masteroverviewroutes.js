import express from "express";
import {
  saveOrUpdateOverview,
  getOverview,
  deleteOverview,
} from "../controllers/masteroverviewcontroller.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Save or update
router.post("/save", authenticateToken, saveOrUpdateOverview);

// Get overview
router.get("/", authenticateToken, getOverview);

// Delete (optional)
router.delete("/", authenticateToken, deleteOverview);

export default router;