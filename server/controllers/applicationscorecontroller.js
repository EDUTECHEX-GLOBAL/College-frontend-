import ApplicationScore from "../models/ApplicationScore.js";

const GRADE_KEYS = ["grade9", "grade10", "grade11", "grade12"];

const DATE_FIELDS = [
  "satDate",
  "psatDate",
  "actDate",
  "toeflDate",
  "ieltsDate",
  "apDate",
  "pteDate",
  "duolingoDate",
];

/* =====================================================
   CONVERT DATE STRINGS → Date OBJECTS
===================================================== */
const convertDateFields = (data) => {
  DATE_FIELDS.forEach((field) => {
    if (data[field]) {
      const parsed = new Date(data[field]);
      data[field] = isNaN(parsed) ? undefined : parsed;
    }
  });
  return data;
};

/* =====================================================
   TRANSFORM FRONTEND GRADE PAYLOAD → DB FORMAT

   Frontend sends:
   {
     gradeSubjects: { grade9: ["Mathematics", "Science"], ... },
     subjectMarks:  { grade9: { Mathematics: "98", Science: "89" }, ... }
   }

   DB stores:
   {
     grade9: { subjects: [{ subject: "Mathematics", marks: "98" }, ...] },
     ...
   }
===================================================== */
const buildGradePayload = (gradeSubjects = {}, subjectMarks = {}) => {
  const result = {};

  GRADE_KEYS.forEach((grade) => {
    const subjectList = gradeSubjects[grade] || [];
    const marksMap = subjectMarks[grade] || {};

    result[grade] = {
      subjects: subjectList.map((subject) => ({
        subject,
        marks: marksMap[subject] ?? "",
      })),
    };
  });

  return result;
};

/* =====================================================
   TRANSFORM DB FORMAT → FRONTEND FORMAT

   Converts stored grade data back to the two objects
   the frontend expects (gradeSubjects + subjectMarks).
===================================================== */
const parseGradePayload = (scoreDoc) => {
  const gradeSubjects = {};
  const subjectMarks = {};

  GRADE_KEYS.forEach((grade) => {
    const subjects = scoreDoc[grade]?.subjects || [];
    gradeSubjects[grade] = subjects.map((s) => s.subject);
    subjectMarks[grade] = {};
    subjects.forEach((s) => {
      subjectMarks[grade][s.subject] = s.marks;
    });
  });

  return { gradeSubjects, subjectMarks };
};

/* =====================================================
   SAVE OR UPDATE SCORE
===================================================== */
export const saveApplicationScore = async (req, res) => {
  try {
    const studentId = req.userId;

    if (!studentId) {
      return res
        .status(400)
        .json({ success: false, message: "Student ID missing in token" });
    }

    // Destructure grade fields from the rest of the body
    const { gradeSubjects, subjectMarks, ...rest } = req.body;

    // Convert test date strings to Date objects
    const testData = convertDateFields({ ...rest });

    // Build structured grade objects for DB
    const gradeData = buildGradePayload(gradeSubjects, subjectMarks);

    const updatedScore = await ApplicationScore.findOneAndUpdate(
      { studentId },
      { ...testData, ...gradeData, studentId },
      { new: true, upsert: true, runValidators: true }
    );

    // Return data in the shape the frontend expects
    const { gradeSubjects: gs, subjectMarks: sm } =
      parseGradePayload(updatedScore);

    res.status(200).json({
      success: true,
      message: "Scores saved successfully",
      data: {
        ...updatedScore.toObject(),
        gradeSubjects: gs,
        subjectMarks: sm,
      },
    });
  } catch (error) {
    console.error("❌ Save Score Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   GET SCORE
===================================================== */
export const getApplicationScore = async (req, res) => {
  try {
    const studentId = req.userId;

    if (!studentId) {
      return res
        .status(400)
        .json({ success: false, message: "Student ID missing in token" });
    }

    const score = await ApplicationScore.findOne({ studentId });

    if (!score) {
      return res.status(200).json({});
    }

    // Flatten grade data into frontend-friendly shape
    const { gradeSubjects, subjectMarks } = parseGradePayload(score);

    res.status(200).json({
      ...score.toObject(),
      gradeSubjects,
      subjectMarks,
    });
  } catch (error) {
    console.error("❌ Get Score Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   DELETE SCORE
===================================================== */
export const deleteApplicationScore = async (req, res) => {
  try {
    const studentId = req.userId;

    if (!studentId) {
      return res
        .status(400)
        .json({ success: false, message: "Student ID missing in token" });
    }

    await ApplicationScore.findOneAndDelete({ studentId });

    res
      .status(200)
      .json({ success: true, message: "Score deleted successfully" });
  } catch (error) {
    console.error("❌ Delete Score Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};