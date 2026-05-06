import { FirstCollege } from "../models/firstCollegeModel.js";
import mongoose from "mongoose";

// ✅ HELPER: resolve userId safely from both middleware styles
const resolveUserId = (req) => req.userId || null;

// =============================
// 🎯 Get User's College List
// =============================
export const getUserColleges = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const userColleges = await FirstCollege.find({ userId: String(userId) })
      .sort({ priority: 1, "collegeData.INSTNM": 1 })
      .lean();

    const formattedColleges = userColleges.map(college => ({
      _id:              college._id,
      collegeId:        college.collegeId,
      name:             college.collegeData.INSTNM,
      alias:            college.collegeData.IALIAS,
      city:             college.collegeData.CITY,
      state:            college.collegeData.STABBR,
      status:           college.status,
      priority:         college.priority,
      tags:             college.tags,
      deadlines:        college.deadlines,
      applicationStatus:college.applicationStatus,
      addedDate:        college.createdAt,
      selectedCourses:  college.selectedCourses || [], // ✅ include courses
    }));

    res.json({ success: true, count: formattedColleges.length, colleges: formattedColleges });

  } catch (error) {
    console.error("❌ Get user colleges error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch college list" });
  }
};

// =============================
// ➕ Add College to User's List
// =============================
export const addCollege = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { collegeId, collegeData, selectedCourses = [] } = req.body;

    console.log("🔄 Adding college for user:", userId, "collegeId:", collegeId);

    if (!collegeId || !collegeData) {
      return res.status(400).json({ success: false, message: "College ID and data are required" });
    }

    // ✅ Resolve name from ALL possible field names (admin/bachelors/masters)
    const collegeName =
      collegeData.INSTNM         ||
      collegeData.universityName  ||
      collegeData.name            ||
      'Unknown University';

    const currentYear = new Date().getFullYear();
    const nextYear    = currentYear + 1;

    // ✅ Check duplicate — if exists, UPDATE courses instead of rejecting
    const existingCollege = await FirstCollege.findOne({
      userId:    String(userId),
      collegeId: String(collegeId)
    });

    if (existingCollege) {
      existingCollege.selectedCourses = selectedCourses;
      existingCollege.collegeData.INSTNM = collegeName; // keep name updated
      await existingCollege.save();

      return res.status(200).json({
        success: true,
        message: "College updated in your list",
        college: {
          _id:            existingCollege._id,
          name:           collegeName,
          city:           existingCollege.collegeData.CITY,
          state:          existingCollege.collegeData.STABBR,
          status:         existingCollege.status,
          selectedCourses: existingCollege.selectedCourses,
        }
      });
    }

    // ✅ Create new entry
    const newCollege = new FirstCollege({
      userId:    String(userId),
      collegeId: String(collegeId),
      collegeData: {
        UNITID:   String(collegeId),
        INSTNM:   collegeName,
        IALIAS:   collegeData.IALIAS   || '',
        CITY:     collegeData.CITY     || collegeData.city    || '',
        STABBR:   collegeData.STABBR   || collegeData.state   || '',
        ZIP:      collegeData.ZIP      || collegeData.zipCode || '',
        ADDR:     collegeData.ADDR     || collegeData.address || '',
        GENTELE:  collegeData.GENTELE  || '',
        WEBADDR:  collegeData.WEBADDR  || collegeData.website || '',
        ADMINURL: collegeData.ADMINURL || '',
        FAIDURL:  collegeData.FAIDURL  || '',
        APPLURL:  collegeData.APPLURL  || '',
        CHFNM:    collegeData.CHFNM    || '',
        CHFTITLE: collegeData.CHFTITLE || '',
        LONGITUD: collegeData.LONGITUD || null,
        LATITUDE: collegeData.LATITUDE || null,
      },
      selectedCourses: selectedCourses, // ✅ save courses on add
      deadlines: {
        fall:   `Rolling Admission · July 28, ${nextYear}`,
        spring: `Rolling Admission · January 13, ${nextYear}`,
        summer: `Rolling Admission · May 26, ${nextYear}`
      },
      applicationYear: nextYear.toString(),
      importantLinks: {
        collegeWebsite:     collegeData.WEBADDR  || collegeData.website || '',
        admissionsPortal:   collegeData.ADMINURL || '',
        financialAidPortal: collegeData.FAIDURL  || '',
        virtualTour:        '',
        collegeNavigator:   ''
      },
      contacts: {
        admissionsEmail:   '',
        admissionsPhone:   collegeData.GENTELE || '',
        financialAidEmail: '',
        financialAidPhone: ''
      }
    });

    await newCollege.save();
    console.log("✅ College saved successfully:", collegeName);

    res.status(201).json({
      success: true,
      message: "College added to your list",
      college: {
        _id:            newCollege._id,
        name:           collegeName,
        city:           newCollege.collegeData.CITY,
        state:          newCollege.collegeData.STABBR,
        status:         newCollege.status,
        selectedCourses: newCollege.selectedCourses,
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
    const userId    = resolveUserId(req);
    const { collegeId } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const deletedCollege = await FirstCollege.findOneAndDelete({
      userId:    String(userId),
      collegeId: String(collegeId)
    });

    if (!deletedCollege) {
      return res.status(404).json({ success: false, message: "College not found in your list" });
    }

    res.json({
      success: true,
      message: "College removed from your list",
      college: { name: deletedCollege.collegeData.INSTNM }
    });

  } catch (error) {
    console.error("❌ Remove college error:", error);
    res.status(500).json({ success: false, message: "Failed to remove college from list" });
  }
};

// =============================
// 📄 Get College Details
// =============================
export const getCollegeDetails = async (req, res) => {
  try {
    const userId        = resolveUserId(req);
    const { collegeId } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const college = await FirstCollege.findOne({
      userId:    String(userId),
      collegeId: String(collegeId)
    });

    if (!college) {
      return res.status(404).json({ success: false, message: "College not found in your list" });
    }

    res.json({
      success: true,
      college: {
        _id:       college._id,
        collegeId: college.collegeId,
        basicInfo: {
          name:           college.collegeData.INSTNM,
          alias:          college.collegeData.IALIAS,
          address:        `${college.collegeData.ADDR}, ${college.collegeData.CITY}, ${college.collegeData.STABBR} ${college.collegeData.ZIP}`,
          phone:          college.collegeData.GENTELE,
          website:        college.collegeData.WEBADDR,
          president:      college.collegeData.CHFNM,
          presidentTitle: college.collegeData.CHFTITLE
        },
        selectedCourses:  college.selectedCourses || [], // ✅
        deadlines:        college.deadlines,
        applicationInfo: {
          status:           college.status,
          applicationYear:  college.applicationYear,
          applicationPeriod:college.applicationPeriod,
          applicationStatus:college.applicationStatus
        },
        financialAid:    college.financialAid,
        importantLinks:  college.importantLinks,
        contacts:        college.contacts,
        customDeadlines: college.customDeadlines,
        notes:           college.notes,
        tags:            college.tags,
        priority:        college.priority
      }
    });

  } catch (error) {
    console.error("❌ Get college details error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch college details" });
  }
};

// =============================
// ✏️ Update College Information
// =============================
export const updateCollege = async (req, res) => {
  try {
    const userId        = resolveUserId(req);
    const { collegeId } = req.params;
    const updateData    = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const allowedFields = [
      'status', 'priority', 'tags', 'notes', 'deadlines',
      'applicationStatus', 'financialAid', 'customDeadlines',
      'importantLinks', 'contacts', 'applicationPeriod',
      'applicationYear', 'selectedCourses' // ✅ allow course updates
    ];

    const filteredUpdate = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) filteredUpdate[key] = updateData[key];
    });

    const updatedCollege = await FirstCollege.findOneAndUpdate(
      { userId: String(userId), collegeId: String(collegeId) },
      { $set: filteredUpdate },
      { new: true, runValidators: true }
    );

    if (!updatedCollege) {
      return res.status(404).json({ success: false, message: "College not found in your list" });
    }

    res.json({
      success: true,
      message: "College updated successfully",
      college: {
        _id:            updatedCollege._id,
        name:           updatedCollege.collegeData.INSTNM,
        status:         updatedCollege.status,
        selectedCourses: updatedCollege.selectedCourses,
      }
    });

  } catch (error) {
    console.error("❌ Update college error:", error);
    res.status(500).json({ success: false, message: "Failed to update college information" });
  }
};

// =============================
// 📚 Update College Courses   ✅ NEW
// =============================
export const updateCollegeCourses = async (req, res) => {
  try {
    const userId            = resolveUserId(req);
    const { collegeId }     = req.params;
    const { selectedCourses = [], collegeData } = req.body;

    if (!userId)    return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!collegeId) return res.status(400).json({ success: false, message: "collegeId required" });

    console.log("📚 Updating courses for:", { userId, collegeId, count: selectedCourses.length });

    const updatePayload = { selectedCourses };
    if (collegeData) {
      // Also update name in case it changed
      updatePayload['collegeData.INSTNM'] =
        collegeData.INSTNM || collegeData.universityName || collegeData.name || '';
    }

    const college = await FirstCollege.findOneAndUpdate(
      { userId: String(userId), collegeId: String(collegeId) },
      { $set: updatePayload },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Courses updated successfully",
      college: {
        collegeId:       college.collegeId,
        selectedCourses: college.selectedCourses,
      }
    });

  } catch (error) {
    console.error("❌ Update courses error:", error);
    res.status(500).json({ success: false, message: "Failed to update courses" });
  }
};

// =============================
// 📊 Get College Stats
// =============================
export const getCollegeStats = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // ✅ FIXED: use String match, not ObjectId (since userId is now String)
    const stats = await FirstCollege.aggregate([
      { $match: { userId: String(userId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const totalColleges = await FirstCollege.countDocuments({ userId: String(userId) });

    const statusCounts = {
      researching: 0, preparing: 0, applied: 0,
      accepted: 0, rejected: 0, waitlisted: 0, committed: 0
    };

    stats.forEach(stat => { statusCounts[stat._id] = stat.count; });

    res.json({
      success: true,
      stats: {
        total: totalColleges,
        byStatus: statusCounts,
        completionRate: totalColleges > 0
          ? (((statusCounts.applied + statusCounts.accepted + statusCounts.committed) / totalColleges) * 100).toFixed(1)
          : 0
      }
    });

  } catch (error) {
    console.error("❌ Get college stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch college statistics" });
  }
};