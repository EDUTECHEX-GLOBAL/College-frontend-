import express from "express";
import {
  getFamilyData,
  saveHouseholdData,
  saveParent1Data,
  saveParent2Data,
  saveSiblingData,
  getFamilyProgress,
  clearFamilyData,
} from "../controllers/firstfamilydashbController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// 🔐 Protected Routes (require JWT)
// ==============================

// Get all family data
router.get("/", authMiddleware, getFamilyData);

// Get family progress
router.get("/progress", authMiddleware, getFamilyProgress);

// Save household data
router.post("/household", authMiddleware, saveHouseholdData);

// Save parent 1 data
router.post("/parent1", authMiddleware, saveParent1Data);

// Save parent 2 data
router.post("/parent2", authMiddleware, saveParent2Data);

// Save sibling data
router.post("/sibling", authMiddleware, saveSiblingData);

// Clear all family data
router.delete("/clear", authMiddleware, clearFamilyData);

export default router;