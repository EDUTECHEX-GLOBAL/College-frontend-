import mongoose from "mongoose";
import MasterAcademic from "../models/masteracademicmodel.js";

const QUALIFYING_DEGREES = ["Bachelor's Degree"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRawUserId = (req) => {
  const id =
    req.userId ||
    req.user?.id ||
    req.user?.userId ||
    req.user?._id ||
    req.user?.sub ||
    "";
  console.log("🔹 getRawUserId →", JSON.stringify(id));
  return id;
};

const resolveUserId = (rawId) => {
  if (!rawId) {
    console.error("❌ resolveUserId: rawId is empty/null");
    return null;
  }
  if (rawId instanceof mongoose.Types.ObjectId) return rawId;
  const str = rawId.toString().trim();
  if (!mongoose.Types.ObjectId.isValid(str)) {
    console.error(`❌ resolveUserId: "${str}" is NOT a valid ObjectId`);
    return null;
  }
  return new mongoose.Types.ObjectId(str);
};

const validateGpa = (gpaStr) => {
  if (!gpaStr?.trim()) return true;
  const cleaned = gpaStr.trim();
  if (cleaned.endsWith("%")) {
    const num = parseFloat(cleaned);
    return !isNaN(num) && num >= 0 && num <= 100;
  }
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/");
    if (parts.length !== 2) return false;
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    return !isNaN(num) && !isNaN(den) && den > 0 && den <= 100 && num >= 0 && num <= den;
  }
  const num = parseFloat(cleaned);
  return !isNaN(num) && num >= 0 && num <= 10;
};

// ─── SAVE (UPSERT) ────────────────────────────────────────────────────────────

export const saveMasterAcademic = async (req, res) => {
  try {
    console.log("\n📥 ── saveMasterAcademic ──────────────────────────");
    console.log("   req.userId      :", req.userId);
    console.log("   req.user        :", JSON.stringify(req.user));
    console.log("   academics count :", req.body?.academics?.length);

    const rawId  = getRawUserId(req);
    const userId = resolveUserId(rawId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: `Unauthorized: could not resolve ObjectId from token. Raw value: "${rawId}"`,
      });
    }

    const { academics } = req.body;

    // ── 1. Must be a non-empty array ──────────────────────────
    if (!Array.isArray(academics) || academics.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one academic entry is required.",
      });
    }

    // ── 2. Bachelor's check done HERE in controller (not schema) ──
    // Reason: Mongoose array-level validators don't fire on findOneAndUpdate
    // upserts reliably, so we enforce this rule before touching the DB.
    const hasBachelor = academics.some((e) =>
      QUALIFYING_DEGREES.includes(e.degree)
    );
    if (!hasBachelor) {
      return res.status(400).json({
        success: false,
        message: "At least one Bachelor's Degree is required.",
        errorCode: "NO_BACHELOR_DEGREE",
      });
    }

    // ── 3. Per-entry field validation ─────────────────────────
    for (let i = 0; i < academics.length; i++) {
      const entry = academics[i];

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
          message: `Entry #${i + 1}: End date must be after start date.`,
        });
      }

      if (!validateGpa(entry.gpa)) {
        return res.status(400).json({
          success: false,
          message: `Entry #${i + 1}: Invalid GPA. Use number ≤ 10 (e.g. 8.5), fraction (e.g. 8.5/10 or 3.5/4.0), or percentage (e.g. 85%).`,
        });
      }
    }

    // ── 4. Strip any client-side id fields ────────────────────
    const cleanAcademics = academics.map(({ _id, id, ...rest }) => rest);

    console.log("💾 Upserting — userId:", userId.toString(), "| entries:", cleanAcademics.length);
    console.log("   Data:", JSON.stringify(cleanAcademics));

    // ── 5. Upsert ─────────────────────────────────────────────
    // FIX: runValidators removed — Mongoose subdocument validators on
    // findOneAndUpdate upserts are unreliable and caused silent save failures.
    // All validation is already done above in the controller.
    const saved = await MasterAcademic.findOneAndUpdate(
      { userId },
      { $set: { academics: cleanAcademics } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("✅ Saved — doc._id:", saved._id.toString());

    return res.status(200).json({
      success: true,
      message: "Academic data saved successfully.",
      data: saved,
    });
  } catch (error) {
    console.error("❌ SAVE ERROR:", error.message);
    console.error(error.stack);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(". "),
        errorCode: "VALIDATION_ERROR",
      });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET ──────────────────────────────────────────────────────────────────────

export const getMasterAcademicByUser = async (req, res) => {
  try {
    console.log("\n📥 ── getMasterAcademicByUser ─────────────────────");

    const rawId  = getRawUserId(req);
    const userId = resolveUserId(rawId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: `Unauthorized: could not resolve ObjectId. Raw value: "${rawId}"`,
      });
    }

    const data = await MasterAcademic.findOne({ userId }).lean();

    if (!data) {
      console.log("ℹ️  No record for userId:", userId.toString());
      return res.status(404).json({
        success: false,
        message: "No academic record found.",
      });
    }

    console.log("✅ Found — academics count:", data.academics?.length);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("❌ FETCH ERROR:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const deleteMasterAcademic = async (req, res) => {
  try {
    const rawId  = getRawUserId(req);
    const userId = resolveUserId(rawId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const deleted = await MasterAcademic.findOneAndDelete({ userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    return res.status(200).json({ success: true, message: "Deleted successfully." });
  } catch (error) {
    console.error("❌ DELETE ERROR:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};