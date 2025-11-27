import express from "express";
import {
  getInternationalData,
  saveInternationalData,
  clearInternationalField,
  getAllStudentInternationalRecords,
} from "../controllers/InternationalStudentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// ==============================
// 🔐 Protected Routes
// ==============================

// Get international student data for specific college
router.get("/:collegeId", getInternationalData);

// Save international student data for specific college
router.post("/:collegeId", saveInternationalData);

// Clear specific field
router.delete("/:collegeId/clear/:field", clearInternationalField);

// Get all international student records for student
router.get("/", getAllStudentInternationalRecords);

export default router;