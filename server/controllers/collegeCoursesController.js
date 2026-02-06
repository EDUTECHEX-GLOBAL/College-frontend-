// controllers/collegeCoursesController.js

import colleges from "../data/collegesCache.js"; // or wherever merged data lives

export const getCollegeCourses = (req, res) => {
  try {
    const { collegeId } = req.params;

    const college = colleges.find(
      (c) => c.collegeId === collegeId
    );

    if (!college) {
      return res.status(404).json({
        success: false,
        message: "College not found",
      });
    }

    // 🔥 THIS IS THE KEY LINE
    const courses = college.GUS_DATA?.major_areas || [];

    res.json({
      success: true,
      collegeName: college.INSTNM,
      courses,
    });
  } catch (err) {
    console.error("❌ Course fetch error:", err);
    res.status(500).json({ success: false });
  }
};
