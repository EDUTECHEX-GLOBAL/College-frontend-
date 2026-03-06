import ApplicationSpecialNeed from "../models/ApplicationSpecialNeed.js";

/**
 * GET Special Needs (JWT-based)
 * URL: GET /api/application/special-needs
 */
export const getSpecialNeedsByStudent = async (req, res) => {
  try {
    const studentId = req.userId;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Student ID missing"
      });
    }

    const data = await ApplicationSpecialNeed.findOne({ studentId });

    return res.status(200).json({
      success: true,
      data: data || {
        hasSpecialNeeds: "no",
        specialNeedsDescription: "",
        specialNeeds: [],
        requiredArrangements: [],
        otherNeedsDescription: ""
      }
    });

  } catch (error) {
    console.error("Get Special Needs Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};

/**
 * SAVE / UPDATE Special Needs (JWT-based)
 * URL: POST /api/application/special-needs
 */
export const saveSpecialNeeds = async (req, res) => {
  try {
    const studentId = req.userId;
    const { 
      hasSpecialNeeds, 
      specialNeedsDescription,
      specialNeeds,
      requiredArrangements,
      otherNeedsDescription 
    } = req.body;

    console.log("📥 Saving special needs for student:", studentId);
    console.log("Request body:", req.body);

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Student ID missing"
      });
    }

    // Validate required field
    if (!hasSpecialNeeds || !["yes", "no"].includes(hasSpecialNeeds)) {
      return res.status(400).json({
        success: false,
        message: "Invalid value for hasSpecialNeeds. Must be 'yes' or 'no'"
      });
    }

    // Prepare update data
    const updateData = {
      studentId,
      hasSpecialNeeds,
      specialNeedsDescription: hasSpecialNeeds === "yes" 
        ? specialNeedsDescription?.trim() || "" 
        : "",
      specialNeeds: hasSpecialNeeds === "yes" 
        ? (Array.isArray(specialNeeds) ? specialNeeds : []) 
        : [],
      requiredArrangements: hasSpecialNeeds === "yes" 
        ? (Array.isArray(requiredArrangements) ? requiredArrangements : []) 
        : [],
      otherNeedsDescription: hasSpecialNeeds === "yes" && specialNeeds?.includes("other")
        ? otherNeedsDescription?.trim() || ""
        : ""
    };

    console.log("📦 Update data:", updateData);

    // Use findOneAndUpdate with upsert
    const saved = await ApplicationSpecialNeed.findOneAndUpdate(
      { studentId },
      updateData,
      { 
        new: true, 
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    console.log("✅ Saved successfully:", saved);

    return res.status(200).json({
      success: true,
      message: "Special needs information saved successfully",
      data: saved
    });

  } catch (error) {
    console.error("❌ Save Special Needs Error:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Record already exists. Please update instead."
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "Server error while saving special needs",
      error: error.message 
    });
  }
};

/**
 * DELETE Special Needs (Optional - for cleanup)
 * URL: DELETE /api/application/special-needs
 */
export const deleteSpecialNeeds = async (req, res) => {
  try {
    const studentId = req.userId;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Student ID missing"
      });
    }

    const deleted = await ApplicationSpecialNeed.findOneAndDelete({ studentId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "No record found to delete"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Special needs information deleted successfully"
    });

  } catch (error) {
    console.error("Delete Special Needs Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};

/**
 * VERIFY Special Needs (For admin/staff)
 * URL: PATCH /api/application/special-needs/:studentId/verify
 */
export const verifySpecialNeeds = async (req, res) => {
  try {
    const { studentId } = req.params;
    const adminId = req.userId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Admin ID missing"
      });
    }

    const { status, comments } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'"
      });
    }

    const updated = await ApplicationSpecialNeed.findOneAndUpdate(
      { studentId },
      {
        status,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        verificationComments: comments || ""
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "No record found for this student"
      });
    }

    return res.status(200).json({
      success: true,
      message: `Special needs ${status}`,
      data: updated
    });

  } catch (error) {
    console.error("Verify Special Needs Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};
/* =====================================================
   ADMIN / PROCESS-ADMIN — GET ALL SPECIAL NEEDS
===================================================== */
export const getAllSpecialNeeds = async (req, res) => {
  try {
    const { page = 1, limit = 20, hasSpecialNeeds, status } = req.query;

    const query = {};
    if (hasSpecialNeeds !== undefined) query.hasSpecialNeeds = hasSpecialNeeds;
    if (status !== undefined) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const data = await ApplicationSpecialNeed.find(query)
      .populate("studentId", "email firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ApplicationSpecialNeed.countDocuments(query);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("❌ Get All Special Needs Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};