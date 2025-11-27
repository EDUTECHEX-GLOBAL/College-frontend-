import express from "express";
import {
  getUserColleges,
  addCollege,
  removeCollege,
  getCollegeDetails,
  updateCollege,
  getCollegeStats
} from "../controllers/collegeController.js";

import authMiddleware from "../middleware/authMiddleware.js"; // Use your existing middleware

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// GET /api/colleges - Get user's college list
router.get("/", getUserColleges);

// POST /api/colleges - Add college to user's list
router.post("/", addCollege);

// GET /api/colleges/stats - Get college statistics
router.get("/stats", getCollegeStats);

// GET /api/colleges/:collegeId - Get college details
router.get("/:collegeId", getCollegeDetails);

// PUT /api/colleges/:collegeId - Update college information
router.put("/:collegeId", updateCollege);

// DELETE /api/colleges/:collegeId - Remove college from list
router.delete("/:collegeId", removeCollege);

export default router;