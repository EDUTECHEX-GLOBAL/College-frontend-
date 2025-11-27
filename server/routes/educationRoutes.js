// server/routes/educationRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getEducation,
  updateEducationSection,
  getEducationSummary,
  uploadDocument,
  removeDocument
} from "../controllers/educationController.js";

import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getEducation);
router.get("/summary", authMiddleware, getEducationSummary);
router.put("/update", authMiddleware, updateEducationSection);

// upload single file: query param 'field' required (passport | tenthMarksheet | twelfthMarksheet | additional)
router.post("/documents/upload", authMiddleware, upload.single("file"), uploadDocument);

// remove document: query params field and optionally id (for additional)
router.delete("/documents", authMiddleware, removeDocument);

export default router;
