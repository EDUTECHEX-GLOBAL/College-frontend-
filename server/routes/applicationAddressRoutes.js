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
import { protectProcessAdmin } from "../middleware/processAdminAuth.js";

const router = express.Router();

/* =====================================================
   ENSURE NATIONAL ID UPLOAD FOLDER EXISTS
===================================================== */
ensureDirectoryExists("nationalId");

/* =====================================================
   MULTER UPLOADER FOR NATIONAL ID
   - Max size: 10MB
   - Accepts: PNG, JPG, JPEG, PDF
===================================================== */
const nationalIdUpload = createUploader("nationalId", 10);

/* =====================================================
   ADMIN ROUTES (before authMiddleware)
===================================================== */

// GET all addresses (regular admin)
router.get("/admin/all", authMiddleware, getAllAddressInfo);

// GET all addresses (process admin)
router.get("/process-admin/all", protectProcessAdmin, getAllAddressInfo);

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
  nationalIdUpload.single("file"),
  uploadNationalId
);

// DELETE remove National ID
router.delete("/files/nationalId", removeNationalId);

/* =====================================================
   EXPORT ROUTER
===================================================== */
export default router;