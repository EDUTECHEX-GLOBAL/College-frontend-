import express from "express";
const router = express.Router();

import {
  createMasterPersonal,
  getAllMasterPersonal,
  getMasterPersonalById,
  updateMasterPersonal,
  deleteMasterPersonal,
} from "../controllers/masterpersonalcontroller.js";

// 🔥 TEMP: no auth (add later)
router.post("/", createMasterPersonal);
router.get("/", getAllMasterPersonal);
router.get("/:id", getMasterPersonalById);
router.put("/:id", updateMasterPersonal);
router.delete("/:id", deleteMasterPersonal);

export default router;