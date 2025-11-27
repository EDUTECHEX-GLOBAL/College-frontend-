import express from "express";
import {
  getResidencyData,
  saveResidencyData,
  saveResidencyDataAtomic,
  clearResidencyField,
  getAllStudentResidencies,
} from "../controllers/FirstResidencyController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// ==============================
// 🔐 Protected Routes
// ==============================

// Get residency data for specific college
router.get("/:collegeId", getResidencyData);

// Save residency data for specific college (use the atomic version to avoid conflicts)
router.post("/:collegeId", saveResidencyDataAtomic);

// Clear specific field
router.delete("/:collegeId/clear/:field", clearResidencyField);

// Get all residency records for student
router.get("/", getAllStudentResidencies);

export default router;