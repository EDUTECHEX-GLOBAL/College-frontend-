import express from "express";
import {
  getGeneralApplication,
  saveGeneralApplication,
  updateGeneralApplication,
  clearField,
  getAllGeneralApplications,
  deleteGeneralApplication,
  getAllGeneralApplicationsForAdmin, // ✅ New function for admin
} from "../controllers/generalController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Apply authMiddleware to all routes
router.use(authMiddleware);

// Student routes
router.get("/:collegeId", getGeneralApplication);              // Get general application for a specific college
router.post("/:collegeId", saveGeneralApplication);            // Create or update general application
router.put("/:collegeId", updateGeneralApplication);           // Update general application
router.delete("/:collegeId", deleteGeneralApplication);        // Delete general application
router.delete("/:collegeId/clear/:field", clearField);         // Clear a specific field

// Fetch all general applications for student
router.get("/", getAllGeneralApplications);

// Admin route: fetch all general applications
router.get("/admin/all", getAllGeneralApplicationsForAdmin);

export default router;
