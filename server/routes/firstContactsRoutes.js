import express from "express";
import {
  getContacts,
  saveContacts,
  clearField,
  getAllStudentContacts,
} from "../controllers/firstContactsController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// 🔐 Protected Routes (require JWT)
// ==============================

// Get contacts data for specific college
router.get("/:collegeId", authMiddleware, getContacts);

// Save/update contacts data for specific college
router.post("/:collegeId", authMiddleware, saveContacts);

// Clear specific field
router.delete("/:collegeId/clear/:field", authMiddleware, clearField);

// Get all contacts for student (across all colleges)
router.get("/", authMiddleware, getAllStudentContacts);

export default router;