import express from "express";
import {
  saveMasterAcademic,
  getMasterAcademicByUser,
  deleteMasterAcademic,
} from "../controllers/masteracademiccontroller.js";

const router = express.Router();

// ✅ UPSERT (create/update)
router.post("/", saveMasterAcademic);

// ✅ GET by user
router.get("/:userId", getMasterAcademicByUser);

// ✅ DELETE
router.delete("/:userId", deleteMasterAcademic);

export default router;