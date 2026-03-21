import express from "express";
import { body } from "express-validator";

import {
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
  updateAdminProfile,
  changePassword,
  createInitialAdmin,
} from "../controllers/adminController.js";

import authenticateAdmin, {
  authorize,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// ==============================
// ✅ Validation
// ==============================
const loginValidation = [
  // ❌ REMOVED: .normalizeEmail() — it transforms the email (strips dots, lowercases
  //    domain parts) BEFORE your controller sees it, causing a mismatch with the
  //    hardcoded "admin@edutechex.com" credential.
  // ✅ Only validate format; let the controller handle normalization itself.
  body("email").isEmail().withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ==============================
// 🌐 Public Routes
// ==============================
router.post("/login", loginValidation, loginAdmin);
router.post("/setup", createInitialAdmin);

// ==============================
// 🔐 Protected Routes (require valid JWT)
// ==============================
router.use(authenticateAdmin);

router.get("/profile", getAdminProfile);
router.post("/logout", logoutAdmin);
router.put("/profile", updateAdminProfile);
router.put("/change-password", changePassword);

// ==============================
// 🔒 Super Admin Only
// ==============================
router.use(authorize("super_admin"));

export default router;