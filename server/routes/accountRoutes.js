import express from "express";
import {
  createFirstYearAccount,
  loginAccount,
  verifyOtp,
  getProfile,
  updateProfile,
  verifyToken,
  getDetailedProfile,
  forgotPasswordRequestOtp,
  forgotPasswordReset,
  getUserNotifications,
  markNotificationRead
} from "../controllers/accountController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔓 Public
router.post("/register", createFirstYearAccount);
router.post("/login", loginAccount);
router.post("/verify-otp", verifyOtp);
router.post("/verify-token", verifyToken);
router.post("/forgot-password/request-otp", forgotPasswordRequestOtp);
router.post("/forgot-password/reset", forgotPasswordReset);

// 🔐 Protected
router.get("/profile", authMiddleware, getProfile);
router.get("/profile/detailed", authMiddleware, getDetailedProfile);
router.put("/profile", authMiddleware, updateProfile);

// 🔔 Notifications
router.get("/notifications", authMiddleware, getUserNotifications);
router.post("/notifications/mark-read", authMiddleware, markNotificationRead);

export default router;
