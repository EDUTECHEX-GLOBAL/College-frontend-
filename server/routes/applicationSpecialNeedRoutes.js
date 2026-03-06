import express from "express";
import {
  getSpecialNeedsByStudent,
  saveSpecialNeeds,
  getAllSpecialNeeds,  // ← add this export to applicationspecialneedcontroller.js
} from "../controllers/applicationspecialneedcontroller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { protectProcessAdmin } from "../middleware/processAdminAuth.js";

const router = express.Router();

/* =====================================================
   ADMIN ROUTES (before authMiddleware)
===================================================== */

// GET all special needs records (regular admin)
router.get("/admin/all", authMiddleware, getAllSpecialNeeds);

// GET all special needs records (process admin)
router.get("/process-admin/all", protectProcessAdmin, getAllSpecialNeeds);

/* =====================================================
   STUDENT ROUTES
===================================================== */

/**
 * GET Special Needs (JWT-based)
 * URL: GET /api/application/special-needs
 */
router.get("/", authMiddleware, getSpecialNeedsByStudent);

/**
 * SAVE / UPDATE Special Needs (JWT-based)
 * URL: POST /api/application/special-needs
 */
router.post("/", authMiddleware, saveSpecialNeeds);

export default router;