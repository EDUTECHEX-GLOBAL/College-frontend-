import express from "express";
import {
  getActivities,
  saveHasActivities,
  saveActivitiesDetails,
  clearHasActivities,
  parseCVForActivities,
} from "../controllers/activitiesController.js";
import authenticateToken from "../middleware/authMiddleware.js";
import { createUploader } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Create uploader for activities CV folder with 10MB size limit
const cvUpload = createUploader("activities", 10);

// All routes are protected
router.use(authenticateToken);

// GET activities data
router.get("/activities", getActivities);

// POST save hasActivities preference
router.post("/activities/has-activities", saveHasActivities);

// POST save activities details
router.post("/activities/details", saveActivitiesDetails);

// DELETE clear hasActivities answer
router.delete("/activities/has-activities", clearHasActivities);

// POST parse CV for activities
router.post("/activities/parse-cv", cvUpload.single("cv"), parseCVForActivities);

export default router;