import express from "express";
import {
  getResidencyData,
  saveResidencyData,
  saveResidencyDataAtomic,
  clearResidencyField,
  getAllStudentResidencies,
  getAllResidencyRecordsForAdmin,
} from "../controllers/FirstResidencyController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { protectProcessAdmin } from "../middleware/processAdminAuth.js";

const router = express.Router();

// ==============================
// ADMIN ROUTES (place FIRST, before authMiddleware)
// ==============================

// Get all residency records for admin view (regular admin)
router.get("/admin/all", authMiddleware, getAllResidencyRecordsForAdmin);

// Get all residency records for process admin view
router.get("/process-admin/all", protectProcessAdmin, getAllResidencyRecordsForAdmin);

// ==============================
// STUDENT ROUTES (protected by authMiddleware)
// ==============================
router.use(authMiddleware);

// Get residency data for specific college
router.get("/:collegeId", getResidencyData);

// Save residency data for specific college (atomic to avoid conflicts)
router.post("/:collegeId", saveResidencyDataAtomic);

// Clear specific field
router.delete("/:collegeId/clear/:field", clearResidencyField);

// Get all residency records for the logged-in student
router.get("/", getAllStudentResidencies);

export default router;