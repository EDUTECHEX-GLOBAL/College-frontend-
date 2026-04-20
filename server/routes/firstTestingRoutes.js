// server/routes/firstTestingRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createOrUpdateFirstTesting,
  getFirstTesting,
  getDetailedFirstTesting,
  deleteFirstTesting,
  parseCV,
  parseScoreDocument,
} from "../controllers/firstTestingController.js";

const router = express.Router();

// Protected routes
router.get("/",          authMiddleware, getFirstTesting);
router.get("/detailed",  authMiddleware, getDetailedFirstTesting);
router.put("/",          authMiddleware, createOrUpdateFirstTesting);
router.delete("/",       authMiddleware, deleteFirstTesting);

// Document parsing routes
router.post("/parse-cv",           authMiddleware, parseCV);           // Full CV → all sections
router.post("/parse-score-doc",    authMiddleware, parseScoreDocument); // Single score doc → one section

export default router;