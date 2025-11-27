import express from "express";
import {
  getApplicationReview,
  submitApplication,
  getApplicationStatus,
  saveReviewNotes,
} from "../controllers/FirstReviewController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// 🔐 Protected Routes (require JWT)
// ==============================

// Get complete application review
router.get("/:collegeId/review", authMiddleware, getApplicationReview);

// Submit application
router.post("/:collegeId/submit", authMiddleware, submitApplication);

// Get application status
router.get("/:collegeId/status", authMiddleware, getApplicationStatus);

// Save review notes
router.post("/:collegeId/notes", authMiddleware, saveReviewNotes);

export default router;