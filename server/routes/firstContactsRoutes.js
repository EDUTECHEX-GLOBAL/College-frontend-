import express from "express";
import {
  getContacts,
  saveContacts,
  clearContactField,
  getAllStudentContacts,
  getAllContactsForAdmin,
} from "../controllers/firstContactsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { protectProcessAdmin } from "../middleware/processAdminAuth.js";

const router = express.Router();

// ==============================
// ADMIN ROUTES (place FIRST, before authMiddleware)
// ==============================

// ✅ Regular Admin route
router.get("/admin/all", authMiddleware, getAllContactsForAdmin);

// ✅ Process Admin route
router.get("/process-admin/all", protectProcessAdmin, getAllContactsForAdmin);

// ==============================
// STUDENT ROUTES (protected by authMiddleware)
// ==============================
router.use(authMiddleware); // 🔐 Apply authMiddleware only to student routes

router.get("/", getAllStudentContacts);
router.get("/:collegeId", getContacts);
router.post("/:collegeId", saveContacts);
router.delete("/:collegeId/clear/:field", clearContactField);

export default router;