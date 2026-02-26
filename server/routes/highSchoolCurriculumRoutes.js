import express from "express";
import {
  getHighSchoolCurriculum,
  saveHighSchoolCurriculum,
  clearHighSchoolCurriculumField,
  getAllHighSchoolCurricula,
  getAllHighSchoolCurriculaForAdmin,
} from "../controllers/highSchoolCurriculumController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { protectProcessAdmin } from "../middleware/processAdminAuth.js";

const router = express.Router();

// ==============================
// ADMIN ROUTES (place FIRST, before authMiddleware)
// ==============================

// ✅ Regular Admin route
router.get("/admin/all", authMiddleware, getAllHighSchoolCurriculaForAdmin);

// ✅ Process Admin route
router.get("/process-admin/all", protectProcessAdmin, getAllHighSchoolCurriculaForAdmin);

// ==============================
// STUDENT ROUTES (protected by authMiddleware)
// ==============================
router.use(authMiddleware);

// Get or create curriculum
router.get("/:collegeId", getHighSchoolCurriculum);

// Save / update curriculum
router.post("/:collegeId", saveHighSchoolCurriculum);

// Clear specific field
router.delete("/:collegeId/clear/:field", clearHighSchoolCurriculumField);

// Get all curricula for logged-in student
router.get("/", getAllHighSchoolCurricula);

export default router;