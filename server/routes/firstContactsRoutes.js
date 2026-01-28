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

// 🔐 Apply auth middleware
router.use(authMiddleware);

// ==============================
// ADMIN ROUTES (place FIRST)
// ==============================
router.get("/admin/all", getAllContactsForAdmin);

// ==============================
// STUDENT ROUTES
// ==============================
router.get("/", getAllStudentContacts);

router.get("/:collegeId", getContacts);
router.post("/:collegeId", saveContacts);
router.delete("/:collegeId/clear/:field", clearContactField);

export default router;
