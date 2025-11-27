import express from "express";
import * as transferController from "../controllers/transferController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * ========================================
 * 🔐 AUTHENTICATION ROUTES
 * ========================================
 */
router.post("/register", transferController.registerTransferStudent);
router.post("/login", transferController.loginTransferStudent);

/**
 * ========================================
 * 📧 OTP ROUTES
 * ========================================
 */
router.post("/send-otp", transferController.sendOTP);
router.post("/verify-otp", transferController.verifyOTP);

/**
 * ========================================
 * 👤 PROFILE ROUTES (PROTECTED)
 * ========================================
 */
// ✅ IMPORTANT: More specific routes (without params) MUST come BEFORE parameterized routes

// Get current user profile (from JWT token) - for Dashboard
router.get("/profile", authenticateToken, transferController.getCurrentTransferStudentProfile);

// ✅ NEW: Update current user profile (from JWT token) - for ExtendedProfile & ProfileForm
router.put("/profile", authenticateToken, transferController.updateCurrentTransferStudentProfile);

// Get specific profile by ID (Admin route)
router.get("/profile/:id", authenticateToken, transferController.getTransferStudentProfile);

// Update specific profile by ID (Admin route)
router.put("/profile/:id", authenticateToken, transferController.updateTransferStudent);

// Delete specific profile by ID (Admin route)
router.delete("/profile/:id", authenticateToken, transferController.deleteTransferStudent);

/**
 * ========================================
 * 🧑‍💼 ADMIN ROUTES
 * ========================================
 */
router.get("/admin/all", authenticateToken, transferController.getAllTransferStudents);

/**
 * ========================================
 * 🧭 ROUTE SUMMARY
 * ========================================
 * POST   /api/transfer/register                    - Register new transfer student
 * POST   /api/transfer/login                       - Login transfer student
 * POST   /api/transfer/send-otp                    - Send OTP to email
 * POST   /api/transfer/verify-otp                  - Verify OTP code
 * 
 * GET    /api/transfer/profile           🔒        - Get current user profile (Dashboard)
 * PUT    /api/transfer/profile           🔒        - Update current user profile (ExtendedProfile/ProfileForm)
 * 
 * GET    /api/transfer/profile/:id       🔒        - Get student profile by ID (Admin)
 * PUT    /api/transfer/profile/:id       🔒        - Update student profile by ID (Admin)
 * DELETE /api/transfer/profile/:id       🔒        - Delete student account (Admin)
 * 
 * GET    /api/transfer/admin/all         🔒        - Get all transfer students (Admin)
 * ========================================
 */

// Log route registration
console.log('✅ Transfer routes loaded successfully');
console.log('📋 Available routes:');
console.log('   POST   /api/transfer/register');
console.log('   POST   /api/transfer/login');
console.log('   POST   /api/transfer/send-otp');
console.log('   POST   /api/transfer/verify-otp');
console.log('   GET    /api/transfer/profile (protected)');
console.log('   PUT    /api/transfer/profile (protected) ← NEW');
console.log('   GET    /api/transfer/profile/:id (protected)');
console.log('   PUT    /api/transfer/profile/:id (protected)');
console.log('   DELETE /api/transfer/profile/:id (protected)');
console.log('   GET    /api/transfer/admin/all (protected)');

export default router;
