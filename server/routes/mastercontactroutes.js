import express from "express";
import {
  createMasterContact,
  getAllMasterContact,
  getMasterContactById,
  updateMasterContact,
  deleteMasterContact
} from "../controllers/mastercontactcontroller.js";

const router = express.Router();

router.post("/", createMasterContact);
router.get("/", getAllMasterContact);
router.get("/:id", getMasterContactById);
router.put("/:id", updateMasterContact);
router.delete("/:id", deleteMasterContact);

export default router;