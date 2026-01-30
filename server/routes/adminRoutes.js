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

// ✅ CORRECT IMPORT (case-sensitive)
import authenticateAdmin, {
  authorize,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// ==============================
// ✅ Validation
// ==============================
const loginValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

// ==============================
// 🌐 Public Routes
// ==============================
router.post("/login", loginValidation, loginAdmin);
router.post("/setup", createInitialAdmin);

// ==============================
// 🔐 Protected Routes
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
