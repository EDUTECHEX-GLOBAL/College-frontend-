// routes/adminUniversityRoutes.js
import express from "express";
import {
  getImportStats,
  importUniversities,
  getAllUniversities,
  getAllColleges,
  searchUniversities,
  searchColleges,
  getUniversityById,
  getCollegeById,
  refreshData
} from "../controllers/adminUniversityController.js";

const router = express.Router();

// Stats and Import
router.get("/import-stats", getImportStats);
router.post("/import-universities", importUniversities);
router.post("/refresh", refreshData);

// Get all data
router.get("/universities", getAllUniversities);
router.get("/colleges", getAllColleges);

// Search endpoints
router.get("/universities/search", searchUniversities);
router.get("/colleges/search", searchColleges);

// Get by ID endpoints
router.get("/universities/:id", getUniversityById);
router.get("/colleges/:id", getCollegeById);

export default router;