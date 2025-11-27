import HighSchoolCurriculum from "../models/highSchoolCurriculumModel.js";

// Calculate progress based on completed fields
const calculateProgress = (highSchoolCurriculum) => {
  const totalFields = 6; // worldLanguageYears, honorsCourses, collegeCreditCourses, apCourses, ibCourses, ibDiploma
  let completedFields = 0;

  if (highSchoolCurriculum.worldLanguageYears && highSchoolCurriculum.worldLanguageYears !== "") completedFields++;
  if (highSchoolCurriculum.honorsCourses && highSchoolCurriculum.honorsCourses !== "") completedFields++;
  if (highSchoolCurriculum.collegeCreditCourses && highSchoolCurriculum.collegeCreditCourses !== "") completedFields++;
  if (highSchoolCurriculum.apCourses && highSchoolCurriculum.apCourses !== "") completedFields++;
  if (highSchoolCurriculum.ibCourses && highSchoolCurriculum.ibCourses !== "") completedFields++;
  if (highSchoolCurriculum.ibDiploma && highSchoolCurriculum.ibDiploma !== "") completedFields++;

  return Math.round((completedFields / totalFields) * 100);
};

// Get High School Curriculum for a specific college
export const getHighSchoolCurriculum = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;


    let highSchoolCurriculum = await HighSchoolCurriculum.findOne({
      studentId,
      collegeId,
    });

    // If not found, create a default one
    if (!highSchoolCurriculum) {
      highSchoolCurriculum = await HighSchoolCurriculum.create({
        studentId,
        collegeId,
        progress: 0,
      });
    }

    res.status(200).json({
      success: true,
      highSchoolCurriculum,
    });
  } catch (error) {
    console.error("❌ Error fetching high school curriculum:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching high school curriculum",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Save High School Curriculum
export const saveHighSchoolCurriculum = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;
    const updateData = req.body;

    console.log("💾 Saving high school curriculum for college:", collegeId, "data:", updateData);

    // Find existing record or create new one
    let highSchoolCurriculum = await HighSchoolCurriculum.findOne({
      studentId,
      collegeId,
    });

    if (highSchoolCurriculum) {
      // Update existing
      highSchoolCurriculum = await HighSchoolCurriculum.findOneAndUpdate(
        { studentId, collegeId },
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    } else {
      // Create new
      highSchoolCurriculum = await HighSchoolCurriculum.create({
        studentId,
        collegeId,
        ...updateData,
      });
    }

    // Calculate progress
    const progress = calculateProgress(highSchoolCurriculum);
    highSchoolCurriculum.progress = progress;
    await highSchoolCurriculum.save();

    res.status(200).json({
      success: true,
      message: "High school curriculum saved successfully",
      highSchoolCurriculum,
    });
  } catch (error) {
    console.error("❌ Error saving high school curriculum:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error: Please check your input data",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error while saving high school curriculum",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Clear specific field
export const clearHighSchoolCurriculumField = async (req, res) => {
  try {
    const { collegeId, field } = req.params;
    const studentId = req.user.userId;

    console.log("🗑️ Clearing field:", field, "for college:", collegeId);

    const validFields = [
      "worldLanguageYears",
      "honorsCourses", 
      "collegeCreditCourses",
      "apCourses",
      "ibCourses",
      "ibDiploma"
    ];

    if (!validFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field name",
      });
    }

    let highSchoolCurriculum = await HighSchoolCurriculum.findOne({
      studentId,
      collegeId,
    });

    if (!highSchoolCurriculum) {
      return res.status(404).json({
        success: false,
        message: "High school curriculum not found",
      });
    }

    // Clear the specific field
    highSchoolCurriculum[field] = "";
    
    // Recalculate progress
    const progress = calculateProgress(highSchoolCurriculum);
    highSchoolCurriculum.progress = progress;
    
    await highSchoolCurriculum.save();

    res.status(200).json({
      success: true,
      message: `Field ${field} cleared successfully`,
      highSchoolCurriculum,
    });
  } catch (error) {
    console.error("❌ Error clearing high school curriculum field:", error);
    res.status(500).json({
      success: false,
      message: "Server error while clearing field",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all high school curricula for a student (for progress tracking)
export const getAllHighSchoolCurricula = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const highSchoolCurricula = await HighSchoolCurriculum.find({
      studentId,
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      highSchoolCurricula,
      count: highSchoolCurricula.length,
    });
  } catch (error) {
    console.error("❌ Error fetching all high school curricula:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching high school curricula",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};