// server/routes/masterpreviewroutes.js

import express from "express";
import { getMasterPreview } from "../controllers/masterpreviewcontroller.js";
import authenticateToken from "../middleware/authmiddleware.js";

const router = express.Router();

/**
 * 📥 GET MASTER PREVIEW (Protected Route)
 * Returns full application data for logged-in user
 *
 * Route: GET /api/master-preview
 */
router.get(
  "/",
  authenticateToken, // 🔐 Protect route
  getMasterPreview
);

export default router;