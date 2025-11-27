import express from "express";
import {
  getWritingData,
  updatePersonalEssay,
  updateAdditionalInformation,
  getWritingProgress,
  initializeWritingData,
} from "../controllers/writingController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// 🔐 Protected Routes (require JWT)
// ==============================

// GET /api/writing - Get all writing data
router.get("/", authMiddleware, getWritingData);

// GET /api/writing/progress - Get writing progress only
router.get("/progress", authMiddleware, getWritingProgress);

// POST /api/writing/initialize - Initialize writing data for new user
router.post("/initialize", authMiddleware, initializeWritingData);

// PUT /api/writing/personal-essay - Update personal essay
router.put("/personal-essay", authMiddleware, updatePersonalEssay);

// PUT /api/writing/additional-information - Update additional information
router.put("/additional-information", authMiddleware, updateAdditionalInformation);

export default router;