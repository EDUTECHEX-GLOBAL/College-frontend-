import express from "express";
import { getUniversityInfo, getChatResponse } from "../controllers/universityController.js";

const router = express.Router();

// Legacy: POST /api/university-info
router.post("/", getUniversityInfo);

// ✅ New: POST /api/chat-response
router.post("/chat-response", getChatResponse);

export default router;
