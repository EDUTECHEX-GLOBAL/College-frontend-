import express from "express";
import {
  getPersonalInfo,
  savePersonalInfo,
  uploadFiles,
  removeFile,
  getFile,
  verifyPersonalInfo,
  getAllPersonalInfo,
  checkFilesExist,
} from "../controllers/applicationPersonalController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { protectProcessAdmin } from "../middleware/processAdminAuth.js";
import {
  passportUpload,
  photographUpload,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =====================================================
   ADMIN ROUTES (before authMiddleware)
===================================================== */

// GET all personal info (regular admin)
router.get("/admin/all", authMiddleware, getAllPersonalInfo);

// GET all personal info (process admin)
router.get("/process-admin/all", protectProcessAdmin, getAllPersonalInfo);

// PUT verify personal info (regular admin)
router.put("/admin/verify/:userId", authMiddleware, verifyPersonalInfo);

/* =====================================================
   ALL ROUTES BELOW REQUIRE AUTH
===================================================== */
router.use(authMiddleware);

/* =====================================================
   USER ROUTES
===================================================== */
router.get("/", getPersonalInfo);
router.post("/", savePersonalInfo);
router.get("/files/check", checkFilesExist);

/* =====================================================
   DYNAMIC FILE UPLOAD ROUTE
===================================================== */
router.post(
  "/upload/:fileType",
  (req, res, next) => {
    const { fileType } = req.params;

    if (fileType === "passport") {
      return passportUpload.single("file")(req, res, next);
    }

    if (fileType === "photograph") {
      return photographUpload.single("file")(req, res, next);
    }

    return res.status(400).json({
      success: false,
      message: "Invalid file type",
    });
  },
  uploadFiles
);

/* =====================================================
   REMOVE FILE
===================================================== */
router.delete("/files/:fileType", removeFile);

/* =====================================================
   GET FILE
===================================================== */
router.get("/files/:fileKey", getFile);

/* =====================================================
   EXPORT
===================================================== */
export default router;