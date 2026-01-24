import express from "express";
import {
  getHighSchoolCurriculum,
  saveHighSchoolCurriculum,
  clearHighSchoolCurriculumField,
  getAllHighSchoolCurricula,
  getAllHighSchoolCurriculaForAdmin, // ✅ NEW
} from "../controllers/highSchoolCurriculumController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// ==============================
// 🎓 STUDENT ROUTES
// ==============================

// Get or create curriculum
router.get("/:collegeId", getHighSchoolCurriculum);

// Save / update curriculum
router.post("/:collegeId", saveHighSchoolCurriculum);

// Clear specific field
router.delete("/:collegeId/clear/:field", clearHighSchoolCurriculumField);

// Get all curricula for logged-in student
router.get("/", getAllHighSchoolCurricula);

// ==============================
// 👨‍💼 ADMIN ROUTE (🔥 REQUIRED)
// ==============================
router.get("/admin/all", authMiddleware, getAllHighSchoolCurriculaForAdmin);

export default router;
