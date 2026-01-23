import express from "express";
import {
  getResidencyData,
  saveResidencyData,
  saveResidencyDataAtomic,
  clearResidencyField,
  getAllStudentResidencies,
  getAllResidencyRecordsForAdmin, // ✅ new admin route
} from "../controllers/FirstResidencyController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// 🔐 All routes are protected
// ==============================
router.use(authMiddleware);

// ==============================
// 🔹 Student Routes
// ==============================

// Get residency data for specific college
router.get("/:collegeId", getResidencyData);

// Save residency data for specific college (atomic to avoid conflicts)
router.post("/:collegeId", saveResidencyDataAtomic);

// Clear specific field
router.delete("/:collegeId/clear/:field", clearResidencyField);

// Get all residency records for the logged-in student
router.get("/", getAllStudentResidencies);

// ==============================
// 🔹 Admin Routes
// ==============================

// Get all residency records for admin view
router.get("/admin/all", getAllResidencyRecordsForAdmin); // ✅ similar to InternationalStudent admin

export default router;
