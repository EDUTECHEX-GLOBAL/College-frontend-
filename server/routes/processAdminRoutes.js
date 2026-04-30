// routes/processAdminRoutes.js
import express from "express";
import {
  registerProcessAdmin,
  verifyProcessAdminOtp,
  resendProcessAdminOtp,
  loginProcessAdmin,
  approveProcessAdmin,
  rejectProcessAdmin,
  getPendingProcessAdmins,
  getAllProcessAdmins,        // ← ADD THIS IMPORT
  getProcessAdminProfile,
  logoutProcessAdmin,
  verifyProcessAdminToken,
    deactivateProcessAdmin,   
} from "../controllers/processAdminController.js";

const router = express.Router();

// Public
router.post("/register",    registerProcessAdmin);
router.post("/verify-otp",  verifyProcessAdminOtp);
router.post("/resend-otp",  resendProcessAdminOtp);
router.post("/login",       loginProcessAdmin);

// Admin actions
router.get("/all",          getAllProcessAdmins);     // ← ADD THIS ROUTE
router.get("/pending",      getPendingProcessAdmins);
router.post("/approve/:id", approveProcessAdmin);
router.patch("/deactivate/:id", deactivateProcessAdmin);  // ← ADD
router.post("/reject/:id",  rejectProcessAdmin);

// Private
router.get("/me",           getProcessAdminProfile);
router.post("/logout",      logoutProcessAdmin);
router.get("/verify",       verifyProcessAdminToken);

export default router;