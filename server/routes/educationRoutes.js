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

import { createUploader } from "../middleware/uploadMiddleware.js";

// Create education uploader instance (uploads to S3 -> education/ folder)
const upload = createUploader("education", 10);

const router = express.Router();

router.get("/", authMiddleware, getEducation);
router.get("/summary", authMiddleware, getEducationSummary);
router.put("/update", authMiddleware, updateEducationSection);

// Upload single file: query param 'field' required (passport | tenthMarksheet | twelfthMarksheet | additional)
router.post("/documents/upload", authMiddleware, upload.single("file"), uploadDocument);

// Remove document: query params field and optionally id (for additional)
router.delete("/documents", authMiddleware, removeDocument);

export default router;