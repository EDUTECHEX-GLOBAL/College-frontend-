import express from "express";
import {
  getAddressInfo,
  saveAddressInfo,
  uploadNationalId,
  removeNationalId,
  getAllAddressInfo,
} from "../controllers/applicationAddressController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();

/* =====================================================
   MULTER CONFIG FOR NATIONAL ID
===================================================== */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/nationalId");
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

/* =====================================================
   PROTECTED ROUTES
===================================================== */
router.use(authMiddleware);

/* USER ROUTES */
router.get("/", getAddressInfo);
router.post("/", saveAddressInfo);
router.post("/upload/nationalId", upload.single("file"), uploadNationalId);
router.delete("/files/nationalId", removeNationalId);

/* ADMIN */
router.get("/admin/all", getAllAddressInfo);

export default router;
