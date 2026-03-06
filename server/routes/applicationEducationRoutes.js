import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { protectProcessAdmin } from "../middleware/processAdminAuth.js";

import {
  getEducationInfo,
  saveEducationInfo,
  uploadTranscript,
  removeTranscript,
  getAllEducationInfo,
} from "../controllers/applicationEducationController.js";

import {
  createUploader,
  ensureDirectoryExists,
  validateFileUpload,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =====================================================
   ENSURE EDUCATION UPLOAD DIRECTORY EXISTS
===================================================== */
ensureDirectoryExists("education");

/* =====================================================
   MULTER CONFIGURATION
   - Folder: education
   - Max file size: 5MB
===================================================== */
const transcriptUpload = createUploader("education", 5);

/* =====================================================
   OPTIONAL DEBUG LOGGER
===================================================== */
const logUploadRequest = (req, res, next) => {
  console.log("📁 Transcript upload request");
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Body:", req.body);
  next();
};

/* =====================================================
   ADMIN ROUTES (before authMiddleware)
===================================================== */

// GET all education records (regular admin)
router.get("/admin/all", authMiddleware, getAllEducationInfo);

// GET all education records (process admin)
router.get("/process-admin/all", protectProcessAdmin, getAllEducationInfo);

/* =====================================================
   AUTHENTICATION MIDDLEWARE
===================================================== */
router.use(authMiddleware);

/* =====================================================
   USER ROUTES
===================================================== */

router.get("/", getEducationInfo);

router.post(
  "/upload/transcript",
  logUploadRequest,
  transcriptUpload.single("file"),
  validateFileUpload,
  uploadTranscript
);

router.post("/", saveEducationInfo);

router.delete("/remove/transcript", removeTranscript);

/* =====================================================
   CENTRALIZED ERROR HANDLER (MULTER + VALIDATION)
===================================================== */
router.use((err, req, res, next) => {
  if (err && err.name === "MulterError") {
    console.error("❌ Multer Error:", err);

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum allowed size is 5MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }

  if (err && err.message) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
});

export default router;