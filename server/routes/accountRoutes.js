// In server/routes/accountRoutes.js - FULL UPDATED CODE

import express from "express";
import {
  createFirstYearAccount,
  loginAccount,
  verifyOtp,
  getProfile,
  updateProfile,
  verifyToken,
  getDetailedProfile,
  forgotPasswordRequestOtp,    // NEW
  forgotPasswordReset          // NEW
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
router.post("/forgot-password/request-otp", forgotPasswordRequestOtp);  // NEW
router.post("/forgot-password/reset", forgotPasswordReset);              // NEW

// ==============================
// 🔐 Protected Routes (require JWT)
// ==============================
router.get("/profile", authMiddleware, getProfile);
router.get("/profile/detailed", authMiddleware, getDetailedProfile);
router.put("/profile", authMiddleware, updateProfile);

export default router;
