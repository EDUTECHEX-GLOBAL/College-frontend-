// routes/masterUniversityRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Add the new sendDocumentEmailToStudent import and POST route below.
// Everything else stays exactly the same as your original file.
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import {
  getMasterUniversityApplications,
  getMasterUniversityApplicationById,
  getMasterUniversityStats,
  sendDocumentEmailToStudent,          // ← NEW import
} from "../controllers/masterUniversityController.js";

const router = express.Router();

// ── Existing routes (unchanged) ────────────────────────────────────────────
router.get("/process-admin/all",           getMasterUniversityApplications);
router.get("/process-admin/stats",         getMasterUniversityStats);
router.get("/process-admin/:studentId",    getMasterUniversityApplicationById);

// ── NEW: Send document correction email to student ─────────────────────────
// Must be declared BEFORE "/:studentId" to avoid Express treating
// "send-document-email" as a studentId param.
router.post("/process-admin/send-document-email", sendDocumentEmailToStudent);

export default router;