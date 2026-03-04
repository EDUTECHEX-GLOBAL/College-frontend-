import express from "express";
import {
  saveApplicationScore,
  getApplicationScore,
  deleteApplicationScore,
} from "../controllers/applicationscorecontroller.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", saveApplicationScore);
router.get("/", getApplicationScore);
router.delete("/", deleteApplicationScore);

export default router;