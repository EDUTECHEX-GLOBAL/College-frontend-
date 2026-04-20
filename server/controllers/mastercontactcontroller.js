import MasterContact from "../models/mastercontactmodel.js";

// ✅ CREATE OR UPDATE (UPSERT)
export const createMasterContact = async (req, res) => {
  try {
    console.log("🔥 CONTACT SAVE API HIT");

    const { _id, ...cleanData } = req.body;

    if (!cleanData.emailAddress) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // ✅ UPSERT using email (unique key)
    const saved = await MasterContact.findOneAndUpdate(
      { emailAddress: cleanData.emailAddress },
      { $set: cleanData },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Saved successfully",
      data: saved,
    });

  } catch (error) {
    console.error("❌ CONTACT SAVE ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ GET ALL
export const getAllMasterContact = async (req, res) => {
  try {
    const data = await MasterContact.find().sort({ createdAt: -1 });

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
export const getMasterContactById = async (req, res) => {
  try {
    const data = await MasterContact.findById(req.params.id);

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

// ✅ UPDATE (SAFE)
export const updateMasterContact = async (req, res) => {
  try {
    const { _id, ...cleanData } = req.body;

    const updated = await MasterContact.findByIdAndUpdate(
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
export const deleteMasterContact = async (req, res) => {
  try {
    const deleted = await MasterContact.findByIdAndDelete(req.params.id);

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