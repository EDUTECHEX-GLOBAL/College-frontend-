import MasterAcademic from "../models/masteracademicmodel.js";

/**
 * ✅ CREATE or UPDATE (UPSERT)
 * One record per user (no duplicates ever)
 */
export const saveMasterAcademic = async (req, res) => {
  try {
    console.log("🔥 SAVE ACADEMIC API HIT");

    const { userId, academics } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!Array.isArray(academics)) {
      return res.status(400).json({
        success: false,
        message: "academics must be an array",
      });
    }

    // ❌ Remove any unwanted _id inside entries
    const cleanAcademics = academics.map(({ _id, id, ...rest }) => rest);

    // ✅ ATOMIC UPSERT
    const saved = await MasterAcademic.findOneAndUpdate(
      { userId },
      { $set: { academics: cleanAcademics } },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
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
 * ✅ GET BY USER
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
 * ✅ DELETE
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