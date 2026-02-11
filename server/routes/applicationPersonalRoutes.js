// server/routes/applicationPersonalRoutes.js

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
import {
  passportUpload,
  photographUpload,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =====================================================
   ALL ROUTES REQUIRE AUTH
===================================================== */
router.use(authMiddleware);

/* =====================================================
   USER ROUTES
===================================================== */
router.get("/", getPersonalInfo);
router.post("/", savePersonalInfo);
router.get("/files/check", checkFilesExist);

/* =====================================================
   DYNAMIC FILE UPLOAD ROUTE (FIXED VERSION)
   Frontend: /upload/passport OR /upload/photograph
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
   ADMIN ROUTES
===================================================== */
router.put("/admin/verify/:userId", verifyPersonalInfo);
router.get("/admin/all", getAllPersonalInfo);

/* =====================================================
   EXPORT
===================================================== */
export default router;
