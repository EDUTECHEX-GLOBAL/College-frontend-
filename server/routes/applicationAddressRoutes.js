import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getAddressInfo,
  saveAddressInfo,
  uploadNationalId,
  removeNationalId,
  getAllAddressInfo,
} from "../controllers/applicationAddressController.js";
import { createUploader, ensureDirectoryExists } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =====================================================
   ENSURE NATIONAL ID UPLOAD FOLDER EXISTS
   This ensures the folder exists before any upload
===================================================== */
ensureDirectoryExists("nationalId");

/* =====================================================
   MULTER UPLOADER FOR NATIONAL ID
   - Max size: 10MB
   - Accepts: PNG, JPG, JPEG, PDF
===================================================== */
const nationalIdUpload = createUploader("nationalId", 10); // 10MB max

/* =====================================================
   PROTECTED ROUTES
   All routes below require authentication
===================================================== */
router.use(authMiddleware);

/* =====================================================
   USER ROUTES
===================================================== */

// GET current user's address info
router.get("/", getAddressInfo);

// POST save or update address info
router.post("/", saveAddressInfo);

// POST upload National ID
router.post(
  "/upload/nationalId",
  nationalIdUpload.single("file"), // Multer handles file validation & upload
  uploadNationalId
);

// DELETE remove National ID
router.delete("/files/nationalId", removeNationalId);

/* =====================================================
   ADMIN ROUTES
===================================================== */

// GET all addresses (admin only)
router.get("/admin/all", getAllAddressInfo);

/* =====================================================
   EXPORT ROUTER
===================================================== */
export default router;
