import express from "express";
import { getAdminNotifications } from "../controllers/notificationController.js";

// ✅ MUST MATCH FILE NAME EXACTLY
import authenticateAdmin from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// ==============================
// 🔔 Admin Notifications
// ==============================
router.get("/", authenticateAdmin, getAdminNotifications);

export default router;
