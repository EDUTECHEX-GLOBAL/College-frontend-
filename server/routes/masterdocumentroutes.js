// server/routes/masterdocumentroutes.js
import express from "express";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
} from "../controllers/masterdocumentcontroller.js";

import { createUploader } from "../middleware/uploadMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 Dynamic uploader (important)
const upload = createUploader("documents", 10);

// GET
router.get("/", authMiddleware, getDocuments);

// UPLOAD (dynamic field)
router.post(
  "/upload/:field",
  authMiddleware,
  upload.single("file"),
  uploadDocument
);

// DELETE
router.delete("/files/:field", authMiddleware, deleteDocument);

export default router;