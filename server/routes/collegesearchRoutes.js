import express from "express";
import { searchColleges } from "../controllers/collegeSearchController.js";

const router = express.Router();

router.get("/", searchColleges);

export default router;
