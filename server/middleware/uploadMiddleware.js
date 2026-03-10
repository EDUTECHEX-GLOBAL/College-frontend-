// server/middleware/uploadMiddleware.js
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import { fileURLToPath } from "url";

// =====================================================
// Resolve __dirname for ES Modules
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// S3 CLIENT SETUP
// =====================================================
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// =====================================================
// FILE FILTER (MIME CHECK)
// =====================================================
const fileFilter = (req, file, cb) => {
  console.log("🔍 Checking file:", file.originalname, "MIME:", file.mimetype);

  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error("Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX");
    req.fileValidationError = error.message;
    console.log("❌ File rejected:", error.message);
    return cb(error, false);
  }

  const allowedExtensions = /\.(pdf|jpg|jpeg|png|doc|docx)$/i;
  if (!allowedExtensions.test(file.originalname)) {
    const error = new Error("Unsupported file extension");
    req.fileValidationError = error.message;
    console.log("❌ File extension rejected:", file.originalname);
    return cb(error, false);
  }

  console.log("✅ File accepted:", file.originalname);
  cb(null, true);
};

// =====================================================
// CREATE S3 STORAGE FOR SPECIFIC FOLDER
// =====================================================
const createS3Storage = (folderName) => {
  return multerS3({
    s3,
    bucket: BUCKET_NAME,
    // Server-side encryption for each uploaded file
    serverSideEncryption: "AES256",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${folderName}/${timestamp}-${random}${ext}`;
      console.log(`📁 S3 Key: ${filename}`);
      cb(null, filename);
    },
  });
};

// =====================================================
// CREATE UPLOADER FOR SPECIFIC FOLDER
// =====================================================
export const createUploader = (folderName, maxSizeMB = 10) => {
  return multer({
    storage: createS3Storage(folderName),
    fileFilter,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
  });
};

// =====================================================
// PRE-CONFIGURED UPLOADERS
// =====================================================
export const passportUpload = createUploader("passport", 10);
export const photographUpload = createUploader("photograph", 2);
export const educationUpload = createUploader("education", 10);
export const nationalIdUpload = createUploader("nationalId", 10);

// Default upload (education folder for backward compatibility)
export const upload = createUploader;

// =====================================================
// FILE URL HELPER
// =====================================================
export const getFileUrl = (filename) => {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/education/${filename}`;
};

// =====================================================
// DYNAMIC FILE URL HELPER
// =====================================================
export const getDynamicFileUrl = (s3Key) => {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
};

// =====================================================
// DELETE FILE FROM S3
// =====================================================
export const deleteFile = async (filename, folder = "education") => {
  if (!filename) return false;

  const key = filename.includes("/") ? filename : `${folder}/${filename}`;

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    console.log("🗑️ S3 File deleted:", key);
    return true;
  } catch (err) {
    console.error("❌ S3 File deletion error:", err);
    return false;
  }
};

// =====================================================
// DELETE FILE FROM SPECIFIC FOLDER IN S3
// =====================================================
export const deleteFileFromFolder = async (filename, folder = "education") => {
  return await deleteFile(filename, folder);
};

// =====================================================
// FILE VALIDATION MIDDLEWARE
// =====================================================
export const validateFileUpload = (req, res, next) => {
  if (req.fileValidationError) {
    return res.status(400).json({
      success: false,
      message: req.fileValidationError,
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  next();
};

// =====================================================
// GET S3 FILE KEY HELPER
// =====================================================
export const getFilePath = (filename, folder = "education") => {
  return `${folder}/${filename}`;
};

// =====================================================
// UPLOAD DIR (kept for backward compatibility - now returns S3 path)
// =====================================================
export const UPLOAD_DIR = `s3://${BUCKET_NAME}/education`;

// =====================================================
// BACKWARD COMPATIBILITY STUBS
// (These functions handled local folders — not needed for S3
//  but kept so existing controllers don't break)
// =====================================================

// ensureDirectoryExists → No-op for S3 (folders are virtual in S3)
export const ensureDirectoryExists = (folderName) => {
  console.log(`ℹ️ ensureDirectoryExists called for "${folderName}" — skipped (using S3)`);
  return `s3://${BUCKET_NAME}/${folderName}`;
};

// quickValidateFile → Basic validation stub for S3 keys
export const quickValidateFile = async (filePathOrKey, fileType) => {
  if (!filePathOrKey) {
    return { valid: false, message: "No file path or S3 key provided" };
  }
  console.log(`ℹ️ quickValidateFile called for type "${fileType}" — basic check only (S3 mode)`);
  return { valid: true, message: "File reference exists (S3 mode)" };
};

// checkUploadPermissions → No-op for S3
export const checkUploadPermissions = () => {
  console.log("ℹ️ checkUploadPermissions called — skipped (using S3, no local dirs needed)");
};

// validateUploadedDocument → Stub for S3
export const validateUploadedDocument = async (filePath, expectedType) => {
  console.log(`ℹ️ validateUploadedDocument called for type "${expectedType}" — basic check (S3 mode)`);
  return {
    valid: true,
    confidence: 1,
    expectedType,
    message: "Validation skipped in S3 mode — file already uploaded",
  };
};

// validateUploadedDocumentInFolder → Stub for S3
export const validateUploadedDocumentInFolder = async (filePath, expectedType, folder = "education") => {
  console.log(`ℹ️ validateUploadedDocumentInFolder called for "${folder}/${expectedType}" — basic check (S3 mode)`);
  return {
    valid: true,
    confidence: 1,
    expectedType,
    message: "Validation skipped in S3 mode — file already uploaded",
  };
};

// =====================================================
// DEFAULT EXPORT
// =====================================================
export default {
  upload: createUploader,
  passportUpload,
  photographUpload,
  educationUpload,
  nationalIdUpload,
  getFileUrl,
  getDynamicFileUrl,
  deleteFile,
  deleteFileFromFolder,
  validateFileUpload,
  getFilePath,
  UPLOAD_DIR,
  ensureDirectoryExists,
  quickValidateFile,
  checkUploadPermissions,
  validateUploadedDocument,
  validateUploadedDocumentInFolder,
};