import express from "express";
import authenticateToken from "../middleware/authMiddleware.js";
import {
  createMasterContact,
  getMyMasterContact,       // ← add this
  getAllMasterContact,
  getMasterContactById,
  updateMasterContact,
  deleteMasterContact,
} from "../controllers/mastercontactcontroller.js";

const router = express.Router();

router.post("/",      authenticateToken, createMasterContact);
router.get("/me",     authenticateToken, getMyMasterContact);    // ← BEFORE /:id
router.get("/",       authenticateToken, getAllMasterContact);
router.get("/:id",    authenticateToken, getMasterContactById);
router.put("/:id",    authenticateToken, updateMasterContact);
router.delete("/:id", authenticateToken, deleteMasterContact);

export default router;