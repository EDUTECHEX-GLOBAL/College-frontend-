import express from "express";
import {
  saveApplicationScore,
  getApplicationScore,
  deleteApplicationScore,
  getAllApplicationScores,  // ← add this export to applicationscorecontroller.js
} from "../controllers/applicationscorecontroller.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { protectProcessAdmin } from "../middleware/processAdminAuth.js";

const router = express.Router();

/* =====================================================
   ADMIN ROUTES (before authMiddleware)
===================================================== */

// GET all scores (regular admin)
router.get("/admin/all", authMiddleware, getAllApplicationScores);

// GET all scores (process admin)
router.get("/process-admin/all", protectProcessAdmin, getAllApplicationScores);

/* =====================================================
   STUDENT ROUTES
===================================================== */
router.use(authMiddleware);

router.post("/", saveApplicationScore);
router.get("/", getApplicationScore);
router.delete("/", deleteApplicationScore);

export default router;