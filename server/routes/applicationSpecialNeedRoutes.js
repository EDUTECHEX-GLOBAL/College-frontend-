import express from "express";
import {
  getSpecialNeedsByStudent,
  saveSpecialNeeds
} from "../controllers/applicationspecialneedcontroller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET Special Needs (JWT-based)
 * URL: GET /api/application/special-needs
 */
router.get(
  "/",
  authMiddleware,
  getSpecialNeedsByStudent
);

/**
 * SAVE / UPDATE Special Needs (JWT-based)
 * URL: POST /api/application/special-needs
 */
router.post(
  "/",
  authMiddleware,
  saveSpecialNeeds
);

export default router;