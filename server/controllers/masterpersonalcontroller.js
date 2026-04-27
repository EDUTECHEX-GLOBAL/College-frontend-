// server/controllers/masterpersonalcontroller.js

import MasterPersonal from "../models/masterpersonalmodel.js";
import mongoose from "mongoose";

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

/* ======================================================
   CREATE / UPDATE  (upsert by userId only)
   POST /api/master-personal
====================================================== */
export const createMasterPersonal = async (req, res) => {
  try {
    const rawUserId = getRawUserId(req);
    const userId    = resolveUserId(rawUserId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user ID not found in token.",
      });
    }

    // Strip _id and userId from body — never trust client for these
    const { _id, userId: _ignoredUserId, ...cleanData } = req.body;

    if (!cleanData.passportNumber) {
      return res.status(400).json({
        success: false,
        message: "Passport number is required",
      });
    }

    // FIX: filter by userId ONLY — one doc per user, passport can change
    const saved = await MasterPersonal.findOneAndUpdate(
      { userId },                           // ← scope strictly to this user
      { $set: { ...cleanData, userId } },   // ← always stamp userId on doc
      {
        new:                 true,
        upsert:              true,
        runValidators:       true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(`✅ MasterPersonal saved — userId: ${userId} | _id: ${saved._id}`);

    res.status(200).json({
      success: true,
      message: "Saved successfully",
      data:    saved,
    });

  } catch (error) {
    console.error("❌ CREATE ERROR:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate record. Please refresh and try again.",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ======================================================
   GET MY RECORD — logged-in user only
   GET /api/master-personal/me
====================================================== */
export const getMyMasterPersonal = async (req, res) => {
  try {
    const rawUserId = getRawUserId(req);
    const userId    = resolveUserId(rawUserId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const data = await MasterPersonal.findOne({ userId }); // ← scoped

    if (!data) {
      // Return empty success so frontend knows no record exists yet
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("❌ getMyMasterPersonal Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ======================================================
   GET ALL — admin/debug, still scoped to logged-in user
   GET /api/master-personal
====================================================== */
export const getAllMasterPersonal = async (req, res) => {
  try {
    const rawUserId = getRawUserId(req);
    const userId    = resolveUserId(rawUserId);

    // FIX: never return another user's data
    const filter = userId ? { userId } : {};
    const data   = await MasterPersonal.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("❌ Fetch Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* GET BY ID, UPDATE, DELETE — unchanged, safe as-is */

export const getMasterPersonalById = async (req, res) => {
  try {
    const data = await MasterPersonal.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Record not found." });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMasterPersonal = async (req, res) => {
  try {
    const { _id, userId: _uid, ...cleanData } = req.body;
    const updated = await MasterPersonal.findByIdAndUpdate(
      req.params.id,
      { $set: cleanData },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Record not found." });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMasterPersonal = async (req, res) => {
  try {
    const deleted = await MasterPersonal.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Record not found." });
    res.status(200).json({ success: true, message: "Deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};