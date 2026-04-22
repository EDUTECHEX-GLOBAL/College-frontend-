import MasterAcademic from "../models/masteracademicmodel.js";

// ✅ Degrees that qualify for master's application
const QUALIFYING_DEGREES = ["Bachelor's Degree"];

/**
 * CREATE or UPDATE (UPSERT)
 */
export const saveMasterAcademic = async (req, res) => {
  try {
    const { userId, academics } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!Array.isArray(academics) || academics.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one academic entry is required",
      });
    }

    // ✅ Check at least one Bachelor's Degree exists
    const hasBachelor = academics.some((entry) =>
      QUALIFYING_DEGREES.includes(entry.degree)
    );

    if (!hasBachelor) {
      return res.status(400).json({
        success: false,
        message:
          "At least one Bachelor's Degree is required to apply for a master's program.",
        errorCode: "NO_BACHELOR_DEGREE", // frontend can use this to show specific UI
      });
    }

    // ✅ Validate each entry has required fields
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

      // ✅ Validate date order
      if (new Date(entry.startDate) > new Date(entry.endDate)) {
        return res.status(400).json({
          success: false,
          message: `Entry #${i + 1}: End date must be after start date`,
        });
      }

      // ✅ Validate GPA if provided
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

    // ✅ Strip internal frontend IDs before saving
    const cleanAcademics = academics.map(({ _id, id, ...rest }) => rest);

    const saved = await MasterAcademic.findOneAndUpdate(
      { userId },
      { $set: { academics: cleanAcademics } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Academic data saved successfully",
      data: saved,
    });

  } catch (error) {
    console.error("❌ SAVE ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET BY USER
 */
export const getMasterAcademicByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await MasterAcademic.findOne({ userId });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No academic data found",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("❌ FETCH ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE
 */
export const deleteMasterAcademic = async (req, res) => {
  try {
    const { userId } = req.params;

    const deleted = await MasterAcademic.findOneAndDelete({ userId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (error) {
    console.error("❌ DELETE ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};