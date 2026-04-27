// masterpersonalroutes.js

import express from "express";
import authenticateToken from "../middleware/authMiddleware.js"; // ← correct import

import {
  createMasterPersonal,
  getMyMasterPersonal,
  getAllMasterPersonal,
  getMasterPersonalById,
  updateMasterPersonal,
  deleteMasterPersonal,
} from "../controllers/masterpersonalcontroller.js";

const router = express.Router();

router.post("/",      authenticateToken, createMasterPersonal);
router.get("/me",     authenticateToken, getMyMasterPersonal);
router.get("/",       authenticateToken, getAllMasterPersonal);
router.get("/:id",    authenticateToken, getMasterPersonalById);
router.put("/:id",    authenticateToken, updateMasterPersonal);
router.delete("/:id", authenticateToken, deleteMasterPersonal);

export default router;