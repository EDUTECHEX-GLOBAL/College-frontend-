import express from "express";
import {
  getInternationalData,
  saveInternationalData,
  clearInternationalField,
  getAllStudentInternationalRecords,
  getAllInternationalRecordsForAdmin,
} from "../controllers/InternationalStudentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes
router.use(authMiddleware); // ✅ All routes now require valid token

router.get("/:collegeId", getInternationalData);
router.post("/:collegeId", saveInternationalData);
router.delete("/:collegeId/clear/:field", clearInternationalField);
router.get("/", getAllStudentInternationalRecords);
router.get("/admin/all", authMiddleware, getAllInternationalRecordsForAdmin);

export default router;
