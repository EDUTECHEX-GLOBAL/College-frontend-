import { FirstCollege } from "../models/firstCollegeModel.js";
import Account from "../models/accountModel.js";
import mongoose from "mongoose";

// =============================
// 🎯 Get User's College List
// =============================
export const getUserColleges = async (req, res) => {
  try {
    const userId = req.user.userId; // CORRECT: Uses userId from JWT token

    const userColleges = await FirstCollege.find({ userId })
      .sort({ priority: 1, "collegeData.INSTNM": 1 })
      .lean();

    // Format response like Common App
    const formattedColleges = userColleges.map(college => ({
      _id: college._id,
      collegeId: college.collegeId,
      name: college.collegeData.INSTNM,
      alias: college.collegeData.IALIAS,
      city: college.collegeData.CITY,
      state: college.collegeData.STABBR,
      status: college.status,
      priority: college.priority,
      tags: college.tags,
      deadlines: college.deadlines,
      applicationStatus: college.applicationStatus,
      addedDate: college.addedDate
    }));

    res.json({
      success: true,
      count: formattedColleges.length,
      colleges: formattedColleges
    });

  } catch (error) {
    console.error("❌ Get user colleges error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch college list"
    });
  }
};

// =============================
// ➕ Add College to User's List
// =============================
export const addCollege = async (req, res) => {
  try {
    const userId = req.user.userId; // CORRECT: Uses userId from JWT token
    const { collegeId, collegeData } = req.body;

    console.log("🔄 Adding college for user:", userId);

    // Validate required fields
    if (!collegeId || !collegeData) {
      return res.status(400).json({
        success: false,
        message: "College ID and data are required"
      });
    }

    // Check if college already exists in user's list
    const existingCollege = await FirstCollege.findOne({
      userId,
      collegeId
    });

    if (existingCollege) {
      return res.status(409).json({
        success: false,
        message: "College already exists in your list"
      });
    }

    // Set default deadlines based on Common App pattern
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const defaultDeadlines = {
      fall: `Rolling Admission · July 28, ${nextYear}`,
      spring: `Rolling Admission · January 13, ${nextYear}`,
      summer: `Rolling Admission · May 26, ${nextYear}`
    };

    // Create new college entry
    const newCollege = new FirstCollege({
      userId: userId, // This is the MongoDB ObjectId as string
      collegeId,
      collegeData: {
        UNITID: collegeData.UNITID,
        INSTNM: collegeData.INSTNM,
        IALIAS: collegeData.IALIAS,
        CITY: collegeData.CITY,
        STABBR: collegeData.STABBR,
        ZIP: collegeData.ZIP,
        ADDR: collegeData.ADDR,
        GENTELE: collegeData.GENTELE,
        WEBADDR: collegeData.WEBADDR,
        ADMINURL: collegeData.ADMINURL,
        FAIDURL: collegeData.FAIDURL,
        APPLURL: collegeData.APPLURL,
        CHFNM: collegeData.CHFNM,
        CHFTITLE: collegeData.CHFTITLE,
        LONGITUD: collegeData.LONGITUD,
        LATITUDE: collegeData.LATITUDE
      },
      deadlines: defaultDeadlines,
      applicationYear: nextYear.toString(),
      importantLinks: {
        collegeWebsite: collegeData.WEBADDR || "",
        admissionsPortal: collegeData.ADMINURL || "",
        financialAidPortal: collegeData.FAIDURL || "",
        virtualTour: "",
        collegeNavigator: ""
      },
      contacts: {
        admissionsEmail: "adm@example.edu",
        admissionsPhone: collegeData.GENTELE || "",
        financialAidEmail: "",
        financialAidPhone: ""
      }
    });

    await newCollege.save();

    console.log("✅ College added successfully");

    res.status(201).json({
      success: true,
      message: "College added to your list",
      college: {
        _id: newCollege._id,
        name: newCollege.collegeData.INSTNM,
        city: newCollege.collegeData.CITY,
        state: newCollege.collegeData.STABBR,
        status: newCollege.status
      }
    });

  } catch (error) {
    console.error("❌ Add college error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add college to list",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =============================
// 🗑️ Remove College from List
// =============================
export const removeCollege = async (req, res) => {
  try {
    const userId = req.user.userId; // CORRECT: Uses userId from JWT token
    const { collegeId } = req.params;

    const deletedCollege = await FirstCollege.findOneAndDelete({
      userId,
      collegeId
    });

    if (!deletedCollege) {
      return res.status(404).json({
        success: false,
        message: "College not found in your list"
      });
    }

    res.json({
      success: true,
      message: "College removed from your list",
      college: {
        name: deletedCollege.collegeData.INSTNM
      }
    });

  } catch (error) {
    console.error("❌ Remove college error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove college from list"
    });
  }
};

// =============================
// 📄 Get College Details
// =============================
export const getCollegeDetails = async (req, res) => {
  try {
    const userId = req.user.userId; // CORRECT: Uses userId from JWT token
    const { collegeId } = req.params;

    const college = await FirstCollege.findOne({
      userId,
      collegeId
    });

    if (!college) {
      return res.status(404).json({
        success: false,
        message: "College not found in your list"
      });
    }

    // Format response like Common App details page
    const collegeDetails = {
      _id: college._id,
      collegeId: college.collegeId,
      basicInfo: {
        name: college.collegeData.INSTNM,
        alias: college.collegeData.IALIAS,
        address: `${college.collegeData.ADDR}, ${college.collegeData.CITY}, ${college.collegeData.STABBR} ${college.collegeData.ZIP}`,
        phone: college.collegeData.GENTELE,
        website: college.collegeData.WEBADDR,
        president: college.collegeData.CHFNM,
        presidentTitle: college.collegeData.CHFTITLE
      },
      deadlines: college.deadlines,
      applicationInfo: {
        status: college.status,
        applicationYear: college.applicationYear,
        applicationPeriod: college.applicationPeriod,
        applicationStatus: college.applicationStatus
      },
      financialAid: college.financialAid,
      importantLinks: college.importantLinks,
      contacts: college.contacts,
      customDeadlines: college.customDeadlines,
      notes: college.notes,
      tags: college.tags,
      priority: college.priority
    };

    res.json({
      success: true,
      college: collegeDetails
    });

  } catch (error) {
    console.error("❌ Get college details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch college details"
    });
  }
};

// =============================
// ✏️ Update College Information
// =============================
export const updateCollege = async (req, res) => {
  try {
    const userId = req.user.userId; // CORRECT: Uses userId from JWT token
    const { collegeId } = req.params;
    const updateData = req.body;

    const allowedFields = [
      'status', 'priority', 'tags', 'notes', 'deadlines', 
      'applicationStatus', 'financialAid', 'customDeadlines',
      'importantLinks', 'contacts', 'applicationPeriod', 'applicationYear'
    ];

    // Filter only allowed fields
    const filteredUpdate = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdate[key] = updateData[key];
      }
    });

    const updatedCollege = await FirstCollege.findOneAndUpdate(
      { userId, collegeId },
      { $set: filteredUpdate },
      { new: true, runValidators: true }
    );

    if (!updatedCollege) {
      return res.status(404).json({
        success: false,
        message: "College not found in your list"
      });
    }

    res.json({
      success: true,
      message: "College updated successfully",
      college: {
        _id: updatedCollege._id,
        name: updatedCollege.collegeData.INSTNM,
        status: updatedCollege.status
      }
    });

  } catch (error) {
    console.error("❌ Update college error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update college information"
    });
  }
};

// =============================
// 📊 Get College Stats
// =============================
export const getCollegeStats = async (req, res) => {
  try {
    const userId = req.user.userId; // CORRECT: Uses userId from JWT token

    const stats = await FirstCollege.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalColleges = await FirstCollege.countDocuments({ userId });
    
    const statusCounts = {
      researching: 0,
      preparing: 0,
      applied: 0,
      accepted: 0,
      rejected: 0,
      waitlisted: 0,
      committed: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    res.json({
      success: true,
      stats: {
        total: totalColleges,
        byStatus: statusCounts,
        completionRate: totalColleges > 0 ? 
          ((statusCounts.applied + statusCounts.accepted + statusCounts.committed) / totalColleges * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error("❌ Get college stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch college statistics"
    });
  }
};