// In server/routes/accountRoutes.js - ADD the new route

import express from "express";
import {
  createFirstYearAccount,
  loginAccount,
  verifyOtp,
  getProfile,
  updateProfile,
  verifyToken,
  getDetailedProfile // Add this import
} from "../controllers/accountController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// 🔓 Public Routes
// ==============================
router.post("/register", createFirstYearAccount);
router.post("/login", loginAccount);
router.post("/verify-otp", verifyOtp);
router.post("/verify-token", verifyToken);

// ==============================
// 🔐 Protected Routes (require JWT)
// ==============================
router.get("/profile", authMiddleware, getProfile);
router.get("/profile/detailed", authMiddleware, getDetailedProfile); // NEW ROUTE
router.put("/profile", authMiddleware, updateProfile);

export default router;