import express from "express";
import {
  getFamilyApplication,
  saveFamilyApplication,
  clearFamilyField,
  getUserFamilyApplications,
  deleteFamilyApplication,
} from "../controllers/firstFamilyController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// 🔐 Protected Routes (require JWT)
// ==============================

// Get family application for specific college
router.get("/:collegeId", authMiddleware, getFamilyApplication);

// Save/update family application for specific college
router.post("/:collegeId", authMiddleware, saveFamilyApplication);

// Clear specific field in family application
router.delete("/:collegeId/clear/:field", authMiddleware, clearFamilyField);

// Get all family applications for user
router.get("/", authMiddleware, getUserFamilyApplications);

// Delete family application for specific college
router.delete("/:collegeId", authMiddleware, deleteFamilyApplication);

export default router;