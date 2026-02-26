import express from "express";
import {
  getInternationalData,
  saveInternationalData,
  clearInternationalField,
  getAllStudentInternationalRecords,
  getAllInternationalRecordsForAdmin,
} from "../controllers/InternationalStudentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { protectProcessAdmin } from "../middleware/processAdminAuth.js";

const router = express.Router();

// ==============================
// ADMIN ROUTES (place FIRST, before authMiddleware)
// ==============================

// ✅ Regular Admin route
router.get("/admin/all", authMiddleware, getAllInternationalRecordsForAdmin);

// ✅ Process Admin route
router.get("/process-admin/all", protectProcessAdmin, getAllInternationalRecordsForAdmin);

// ==============================
// STUDENT ROUTES (protected by authMiddleware)
// ==============================
router.use(authMiddleware);

router.get("/:collegeId", getInternationalData);
router.post("/:collegeId", saveInternationalData);
router.delete("/:collegeId/clear/:field", clearInternationalField);
router.get("/", getAllStudentInternationalRecords);

export default router;