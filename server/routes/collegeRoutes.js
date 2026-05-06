import express from "express";
import {
  getUserColleges,
  addCollege,
  removeCollege,
  getCollegeDetails,
  updateCollege,
  updateCollegeCourses, // ✅ ADD THIS
  getCollegeStats
} from "../controllers/collegeController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/",                   getUserColleges);
router.post("/",                  addCollege);
router.get("/stats",              getCollegeStats);
router.get("/:collegeId",         getCollegeDetails);
router.put("/:collegeId",         updateCollege);
router.put("/:collegeId/courses", updateCollegeCourses); // ✅ ADD THIS
router.delete("/:collegeId",      removeCollege);

export default router;