import mongoose from "mongoose";
import MasterContact from "../models/mastercontactmodel.js";

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
export const createMasterContact = async (req, res) => {
  try {
    console.log("🔥 CONTACT SAVE API HIT");

    // FIX: get userId from token, never from body
    const userId = resolveUserId(getRawUserId(req));
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user ID not found in token.",
      });
    }

    const { _id, userId: _ignoredUserId, ...cleanData } = req.body;

    if (!cleanData.emailAddress) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // FIX: upsert by userId — one document per user, not per email
    const saved = await MasterContact.findOneAndUpdate(
      { userId },                               // ← scope to THIS user
      { $set: { ...cleanData, userId } },       // ← always stamp userId
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Contact saved — userId: ${userId} | _id: ${saved._id}`);

    res.status(200).json({
      success: true,
      message: "Saved successfully",
      data: saved,
    });

  } catch (error) {
    console.error("❌ CONTACT SAVE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET MY CONTACT — scoped to logged-in user
export const getMyMasterContact = async (req, res) => {
  try {
    const userId = resolveUserId(getRawUserId(req));
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const data = await MasterContact.findOne({ userId }); // ← scoped
    if (!data) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("❌ getMyMasterContact Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL — scoped to logged-in user
export const getAllMasterContact = async (req, res) => {
  try {
    const userId = resolveUserId(getRawUserId(req));
    const filter = userId ? { userId } : {};           // ← never leak other users' data
    const data   = await MasterContact.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("❌ Fetch Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET BY ID
export const getMasterContactById = async (req, res) => {
  try {
    const data = await MasterContact.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE BY ID
export const updateMasterContact = async (req, res) => {
  try {
    const { _id, userId: _uid, ...cleanData } = req.body;
    const updated = await MasterContact.findByIdAndUpdate(
      req.params.id,
      { $set: cleanData },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Record not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE BY ID
export const deleteMasterContact = async (req, res) => {
  try {
    const deleted = await MasterContact.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Record not found" });
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};