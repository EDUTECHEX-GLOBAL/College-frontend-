// routes/masterUniversityRoutes.js

import express from "express";
import {
  getMasterUniversityApplications,
  getMasterUniversityApplicationById,
  getMasterUniversityStats
} from "../controllers/masterUniversityController.js";

const router = express.Router();

router.get("/process-admin/all", getMasterUniversityApplications);
router.get("/process-admin/stats", getMasterUniversityStats);
router.get("/process-admin/:studentId", getMasterUniversityApplicationById);

export default router;