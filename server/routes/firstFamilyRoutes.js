import express from "express";
import {
  getFamilyApplication,
  saveFamilyApplication,
  clearFamilyField,
  getUserFamilyApplications,
  deleteFamilyApplication,
  getAllFamilyRecordsForAdmin, // ✅ NEW (ADMIN)
} from "../controllers/firstFamilyController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { protectProcessAdmin } from "../middleware/processAdminAuth.js"; // ✅ Import process admin middleware

const router = express.Router();

console.log('✅ FirstFamilyRoutes.js loaded successfully');

// ==============================
// 🔐 ADMIN ROUTES (place FIRST, before authMiddleware)
// ==============================

// ✅ Get all family records for regular admin
router.get("/admin/all", authMiddleware, getAllFamilyRecordsForAdmin);

// ✅ NEW: Get all family records for process admin
router.get("/process-admin/all", protectProcessAdmin, getAllFamilyRecordsForAdmin);

// ==============================
// 🔐 STUDENT ROUTES (protected by authMiddleware)
// ==============================
router.use(authMiddleware);

/**
 * ===============================
 * STUDENT ROUTES
 * ===============================
 */

// Get / create family data for a specific college
router.get("/:collegeId", getFamilyApplication);

// Save / update family data
router.post("/:collegeId", saveFamilyApplication);

// Clear a specific field
router.delete("/:collegeId/clear/:field", clearFamilyField);

// Get all family records for logged-in student
router.get("/", getUserFamilyApplications);

// Delete family record for a specific college
router.delete("/:collegeId", deleteFamilyApplication);

export default router;