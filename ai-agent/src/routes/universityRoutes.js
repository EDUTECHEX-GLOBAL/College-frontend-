import express from "express";
import { getUniversityInfo } from "../controllers/universityController.js";

const router = express.Router();

// POST /api/university-info
router.post("/", getUniversityInfo);

export default router;
