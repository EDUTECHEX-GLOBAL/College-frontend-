// src/routes/collegesearchRoutes.js
import express from "express";
import { 
  searchColleges, 
  getRecommendedUniversities, 
  getUniversityById,
  getUniversityPrograms,
  searchCollegesLegacy 
} from "../controllers/collegeSearchController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public search (with optional auth) - THIS WILL AUTO-FILTER BASED ON PROFILE
router.get("/", authenticateToken, searchColleges);

// Get recommendations (requires auth)
router.get("/recommendations", authenticateToken, getRecommendedUniversities);

// Get university by ID
router.get("/university/:id", authenticateToken, getUniversityById);

// Get university programs (NEW)
router.get("/university/:id/programs", authenticateToken, getUniversityPrograms);

// Legacy endpoint for backward compatibility
router.get("/legacy", searchCollegesLegacy);

export default router;