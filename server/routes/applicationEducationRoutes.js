// routes/applicationEducationRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getEducationInfo,
  saveEducationInfo,
  uploadTranscript,
  removeTranscript,
} from "../controllers/applicationEducationController.js";

import {
  createUploader,
  ensureDirectoryExists,
  validateFileUpload,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =====================================================
   ENSURE EDUCATION UPLOAD DIRECTORY EXISTS
   (MUST match uploadMiddleware.js folder name)
===================================================== */
ensureDirectoryExists("education");

/* =====================================================
   MULTER CONFIGURATION
   - Folder: education
   - Max file size: 5MB
===================================================== */
const transcriptUpload = createUploader("education", 5);

/* =====================================================
   OPTIONAL DEBUG LOGGER (SAFE)
   Can be removed in production
===================================================== */
const logUploadRequest = (req, res, next) => {
  console.log("📁 Transcript upload request");
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Body:", req.body);
  next();
};

/* =====================================================
   AUTHENTICATION MIDDLEWARE
===================================================== */
router.use(authMiddleware);

/* =====================================================
   GET EDUCATION INFO (CURRENT USER)
===================================================== */
router.get("/", getEducationInfo);

/* =====================================================
   UPLOAD TRANSCRIPT
   IMPORTANT:
   - Must be BEFORE POST "/"
   - Field name MUST be "file"
===================================================== */
router.post(
  "/upload/transcript",
  logUploadRequest,
  transcriptUpload.single("file"),
  validateFileUpload,
  uploadTranscript
);

/* =====================================================
   SAVE OR UPDATE EDUCATION
===================================================== */
router.post("/", saveEducationInfo);

/* =====================================================
   REMOVE TRANSCRIPT
===================================================== */
router.delete("/remove/transcript", removeTranscript);

/* =====================================================
   CENTRALIZED ERROR HANDLER (MULTER + VALIDATION)
===================================================== */
router.use((err, req, res, next) => {
  // Multer-specific errors
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

  // Validation / file filter errors
  if (err && err.message) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
});

export default router;
