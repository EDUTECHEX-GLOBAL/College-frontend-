import express from "express";
import {
  getActivities,
  saveHasActivities,
  saveActivitiesDetails,
  clearHasActivities
} from "../controllers/activitiesController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// GET activities data
router.get("/activities", getActivities);

// POST save hasActivities preference
router.post("/activities/has-activities", saveHasActivities);

// POST save activities details
router.post("/activities/details", saveActivitiesDetails);

// DELETE clear hasActivities answer
router.delete("/activities/has-activities", clearHasActivities);

export default router;