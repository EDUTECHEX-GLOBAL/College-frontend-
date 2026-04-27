import express from "express";
import authenticateToken from "../middleware/authMiddleware.js";
import {
  saveMasterAcademic,
  getMasterAcademicByUser,
  deleteMasterAcademic,
} from "../controllers/masteracademiccontroller.js";

const router = express.Router();

// FIX: all routes protected — userId comes from token, not URL params
router.post("/",   authenticateToken, saveMasterAcademic);
router.get("/",    authenticateToken, getMasterAcademicByUser);  // ← was /:userId
router.delete("/", authenticateToken, deleteMasterAcademic);     // ← was /:userId

export default router;