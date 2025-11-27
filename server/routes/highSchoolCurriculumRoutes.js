import express from "express";
import {
  getHighSchoolCurriculum,
  saveHighSchoolCurriculum,
  clearHighSchoolCurriculumField,
  getAllHighSchoolCurricula,
} from "../controllers/highSchoolCurriculumController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// ==============================
// 🎓 High School Curriculum Routes
// ==============================

// Get high school curriculum for a specific college
router.get("/:collegeId", getHighSchoolCurriculum);

// Save/update high school curriculum for a specific college
router.post("/:collegeId", saveHighSchoolCurriculum);

// Clear specific field
router.delete("/:collegeId/clear/:field", clearHighSchoolCurriculumField);

// Get all high school curricula for the student
router.get("/", getAllHighSchoolCurricula);

export default router;