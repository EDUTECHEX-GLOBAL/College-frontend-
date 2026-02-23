import express from "express";
import {
    getSpecialNeedsByStudent,
    saveSpecialNeeds
} from "../controllers/applicationspecialneedcontroller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// GET special needs
router.get(
    "/application/special-needs/student/:studentId",
    authMiddleware,
    getSpecialNeedsByStudent
);

// SAVE / UPDATE special needs
router.post(
    "/application/special-needs/student/:studentId",
    authMiddleware,
    saveSpecialNeeds
);

export default router;