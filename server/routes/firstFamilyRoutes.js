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

const router = express.Router();

// ==============================
// 🔐 Protected Routes (JWT)
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

/**
 * ===============================
 * ADMIN ROUTE
 * ===============================
 */

// Get all family records (ADMIN)
router.get("/admin/all", getAllFamilyRecordsForAdmin);

export default router;
