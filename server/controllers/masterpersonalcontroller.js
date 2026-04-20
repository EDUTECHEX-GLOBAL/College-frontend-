import MasterPersonal from "../models/masterpersonalmodel.js";

export const createMasterPersonal = async (req, res) => {
  try {
    console.log("🔥 CREATE API HIT");

    const { _id, ...cleanData } = req.body;

    if (!cleanData.passportNumber) {
      return res.status(400).json({
        success: false,
        message: "Passport number is required",
      });
    }

    // ✅ ATOMIC UPSERT (NO DUPLICATES EVER)
    const saved = await MasterPersonal.findOneAndUpdate(
      { passportNumber: cleanData.passportNumber }, // unique key
      { $set: cleanData },
      {
        new: true,
        upsert: true,       // create if not exists
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Saved successfully",
      data: saved,
    });

  } catch (error) {
    console.error("❌ CREATE ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ GET ALL
export const getAllMasterPersonal = async (req, res) => {
  try {
    const data = await MasterPersonal.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("❌ Fetch Error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ GET BY ID
export const getMasterPersonalById = async (req, res) => {
  try {
    const data = await MasterPersonal.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("❌ Fetch by ID Error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ UPDATE (STRICT SAFE)
export const updateMasterPersonal = async (req, res) => {
  try {
    // ❌ REMOVE _id from update
    const { _id, ...cleanData } = req.body;

    const updated = await MasterPersonal.findByIdAndUpdate(
      req.params.id,
      cleanData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updated,
    });

  } catch (error) {
    console.error("❌ UPDATE ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ DELETE
export const deleteMasterPersonal = async (req, res) => {
  try {
    const deleted = await MasterPersonal.findByIdAndDelete(req.params.id);

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
    console.error("❌ Delete Error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};