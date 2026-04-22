// server/controllers/masterpreviewcontroller.js

import mongoose from "mongoose";

import MasterPersonal from "../models/masterpersonalmodel.js";
import MasterContact from "../models/mastercontactmodel.js";
import MasterCourse from "../models/mastercoursemodel.js";
import MasterAcademic from "../models/masteracademicmodel.js";
import MasterTest from "../models/mastertestmodel.js";
import MasterDocument from "../models/masterdocumentmodel.js";

/**
 * ✅ GET MASTER PREVIEW DATA (ALL-IN-ONE)
 * This API aggregates all modules into one response for frontend preview
 */
export const getMasterPreview = async (req, res) => {
  try {
    const userId = req.userId;

    // 🔒 Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ⚡ Parallel fetching for performance
    const [
      personal,
      contact,
      course,
      academic,
      tests,
      documents,
    ] = await Promise.all([
      MasterPersonal.findOne({ userId }).lean(),
      MasterContact.findOne({ userId }).lean(),
      MasterCourse.findOne({ userId }).lean(),
      MasterAcademic.findOne({ userId }).lean(),
      MasterTest.findOne({ userId }).lean(),
      MasterDocument.findOne({ userId }).lean(),
    ]);

    // 🧠 Normalize data to match frontend structure
    const responseData = {
      personal: personal || {},
      contact: contact || {},
      course: course || {},
      academic: academic?.academics || [],
      tests: tests || {},
      documents: formatDocuments(documents),
      declaration: false, // 🔁 you can store this later if needed
    };

    return res.status(200).json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("❌ MASTER PREVIEW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching preview data",
    });
  }
};


/**
 * 🧾 FORMAT DOCUMENTS FOR FRONTEND
 * Converts backend structure → frontend expected structure
 */
const formatDocuments = (documents) => {
  if (!documents) return {};

  return {
    passportCopy: documents.passport?.fileName || "",
    academicTranscripts: documents.bachelorTranscript?.fileName || "",
    resumeCv: documents.resumeCv?.fileName || "",
    lettersOfRecommendation: documents.lettersOfRecommendation?.fileName || "",
    englishCertificate: documents.englishCertificate?.fileName || "",
  };
};