// server/routes/educationRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getEducation,
  updateEducationSection,
  getEducationSummary,
  uploadDocument,
  removeDocument,
  uploadCVAndExtract,
} from "../controllers/educationController.js";

import { createUploader } from "../middleware/uploadMiddleware.js";

const upload = createUploader("education", 10);

const router = express.Router();

router.get("/",        authMiddleware, getEducation);
router.get("/summary", authMiddleware, getEducationSummary);
router.put("/update",  authMiddleware, updateEducationSection);

router.post(
  "/documents/upload",
  authMiddleware,
  upload.single("file"),
  uploadDocument
);

router.delete("/documents", authMiddleware, removeDocument);

router.post(
  "/upload-cv",
  authMiddleware,
  upload.single("cv"),
  uploadCVAndExtract
);

export default router;