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
  markNotificationRead,
  parsePassport,
  deletePassport,
  parseAadhaar,
  parseCV,          // 📄 NEW
} from "../controllers/accountController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { passportUpload, validateFileUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ================================
// 🔓 Public Routes
// ================================
router.post("/register",                     createFirstYearAccount);
router.post("/login",                        loginAccount);
router.post("/verify-otp",                   verifyOtp);
router.post("/verify-token",                 verifyToken);
router.post("/forgot-password/request-otp", forgotPasswordRequestOtp);
router.post("/forgot-password/reset",        forgotPasswordReset);

// ================================
// 🔐 Protected Routes
// ================================
router.get("/profile",          authMiddleware, getProfile);
router.get("/profile/detailed", authMiddleware, getDetailedProfile);
router.put("/profile",          authMiddleware, updateProfile);

// ================================
// 🔔 Notifications
// ================================
router.get("/notifications",            authMiddleware, getUserNotifications);
router.post("/notifications/mark-read", authMiddleware, markNotificationRead);

// ================================
// 🛂 Passport Routes
// POST /api/students/passport/parse
// Fills: name, DOB, gender, birthCountry, cityOfBirth,
//        country, citizenshipStatus, primaryLanguage
// ================================
router.post(
  "/passport/parse",
  authMiddleware,
  passportUpload.single("passport"),
  validateFileUpload,
  parsePassport
);

router.delete("/passport", authMiddleware, deletePassport);

// ================================
// 🪪 Aadhaar / Govt ID Route
// POST /api/students/aadhaar/parse
// Fills: addressLine1, addressLine2, city, state,
//        zipCode, country, phone, preferredPhoneType
//        + firstName, lastName, birthDate, gender if on front
// ================================
router.post(
  "/aadhaar/parse",
  authMiddleware,
  passportUpload.single("aadhaar"),
  validateFileUpload,
  parseAadhaar
);

// ================================
// 📄 CV / Résumé Route — NEW
// POST /api/students/cv/parse
// Fills ALL sections:
//   Profile   → firstName, lastName, birthDate, gender,
//               phone, address, country, primaryLanguage
//   Education → cvEducation[] (degree, institution, GPA, years)
//   Testing   → cvTesting   { sat, act, gre, toefl, ielts, apScores[] }
//   Activities→ cvActivities[] (role, organization, years)
// ================================
router.post(
  "/cv/parse",
  authMiddleware,
  passportUpload.single("cv"),   // reuses same S3 upload middleware
  validateFileUpload,
  parseCV
);

export default router;