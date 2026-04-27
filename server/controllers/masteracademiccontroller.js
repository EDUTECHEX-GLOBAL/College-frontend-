import mongoose from "mongoose";
import MasterAcademic from "../models/masteracademicmodel.js";

const QUALIFYING_DEGREES = ["Bachelor's Degree"];

const getRawUserId = (req) =>
  req.userId       ||
  req.user?.userId ||
  req.user?.id     ||
  req.user?._id    ||
  "";

const resolveUserId = (rawId) => {
  if (!rawId) return null;
  const str = rawId.toString().trim();
  if (!mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
};

// CREATE OR UPDATE (UPSERT)
export const saveMasterAcademic = async (req, res) => {
  try {
    // FIX: get userId from token, never from req.body
    const userId = resolveUserId(getRawUserId(req));
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user ID not found in token.",
      });
    }

    const { academics } = req.body;   // ← only take academics from body

    if (!Array.isArray(academics) || academics.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one academic entry is required",
      });
    }

    const hasBachelor = academics.some((entry) =>
      QUALIFYING_DEGREES.includes(entry.degree)
    );
    if (!hasBachelor) {
      return res.status(400).json({
        success: false,
        message: "At least one Bachelor's Degree is required.",
        errorCode: "NO_BACHELOR_DEGREE",
      });
    }

    for (let i = 0; i < academics.length; i++) {
      const entry   = academics[i];
      const missing = [];
      if (!entry.degree?.trim())       missing.push("degree");
      if (!entry.university?.trim())   missing.push("university");
      if (!entry.country?.trim())      missing.push("country");
      if (!entry.fieldOfStudy?.trim()) missing.push("fieldOfStudy");
      if (!entry.startDate)            missing.push("startDate");
      if (!entry.endDate)              missing.push("endDate");

      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Entry #${i + 1} is missing: ${missing.join(", ")}`,
        });
      }
      if (new Date(entry.startDate) > new Date(entry.endDate)) {
        return res.status(400).json({
          success: false,
          message: `Entry #${i + 1}: End date must be after start date`,
        });
      }
      if (entry.gpa?.trim()) {
        const gpaNum = parseFloat(entry.gpa);
        if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
          return res.status(400).json({
            success: false,
            message: `Entry #${i + 1}: GPA must be between 0 and 4.0`,
          });
        }
      }
    }

    const cleanAcademics = academics.map(({ _id, id, ...rest }) => rest);

    // FIX: upsert filtered by userId from token — never from body
    const saved = await MasterAcademic.findOneAndUpdate(
      { userId },                                        // ← scope to THIS user
      { $set: { academics: cleanAcademics, userId } },   // ← stamp userId
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Academic saved — userId: ${userId} | _id: ${saved._id}`);

    res.status(200).json({
      success: true,
      message: "Academic data saved successfully",
      data: saved,
    });

  } catch (error) {
    console.error("❌ SAVE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET BY USER — from token, not URL param
export const getMasterAcademicByUser = async (req, res) => {
  try {
    // FIX: read userId from token, not from req.params
    const userId = resolveUserId(getRawUserId(req));
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const data = await MasterAcademic.findOne({ userId });
    if (!data) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("❌ FETCH ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE — scoped to logged-in user
export const deleteMasterAcademic = async (req, res) => {
  try {
    const userId = resolveUserId(getRawUserId(req));
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const deleted = await MasterAcademic.findOneAndDelete({ userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("❌ DELETE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};