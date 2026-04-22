import MasterOverview from "../models/masteroverviewmodels.js";

// CREATE or UPDATE (UPSERT)
export const saveOrUpdateOverview = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { course } = req.body;

    if (!course || !course.preferredCourse) {
      return res.status(400).json({
        success: false,
        message: "Preferred course is required",
      });
    }

    const overview = await MasterOverview.findOneAndUpdate(
      { userId },
      { course },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Overview saved successfully",
      data: overview,
    });
  } catch (error) {
    console.error("Save Overview Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET Overview
export const getOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    const overview = await MasterOverview.findOne({ userId });

    if (!overview) {
      return res.status(404).json({
        success: false,
        message: "No overview found",
      });
    }

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error("Get Overview Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// DELETE Overview (optional)
export const deleteOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    await MasterOverview.findOneAndDelete({ userId });

    res.status(200).json({
      success: true,
      message: "Overview deleted successfully",
    });
  } catch (error) {
    console.error("Delete Overview Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};