import express from "express";
import {
  getContacts,
  saveContacts,
  clearContactField,
  getAllStudentContacts,
  getAllContactsForAdmin,
} from "../controllers/firstContactsController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// 🔐 Protected Routes (require JWT)
// ==============================
router.use(authMiddleware); // Apply auth to all routes

// ------------------------------
// Student Routes
// ------------------------------
// Get contacts data for a specific college
router.get("/:collegeId", getContacts);

// Save/update contacts data for a specific college
router.post("/:collegeId", saveContacts);

// Clear a specific field
router.delete("/:collegeId/clear/:field", clearContactField);

// Get all contacts for the logged-in student
router.get("/", getAllStudentContacts);

// ------------------------------
// Admin Routes
// ------------------------------
// Get all contacts (admin view)
router.get("/admin/all", getAllContactsForAdmin);

export default router;
