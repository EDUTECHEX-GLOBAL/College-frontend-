import mongoose from "mongoose";

const highSchoolCurriculumSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    collegeId: {
      type: String,
      required: true,
    },
    
    // High School Curriculum Fields
    worldLanguageYears: {
      type: String,
      enum: ["", "1-year-or-less", "2-years", "3-years", "4-plus-years"],
      default: "",
    },
    honorsCourses: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    collegeCreditCourses: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    apCourses: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    ibCourses: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    ibDiploma: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    
    // Progress Tracking
    progress: {
      type: Number,
      default: 0,
    },
    
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one record per student per college
highSchoolCurriculumSchema.index({ studentId: 1, collegeId: 1 }, { unique: true });

// ✅ ADD: Progress calculation
highSchoolCurriculumSchema.pre("save", function (next) {
  let completedFields = 0;
  const totalFields = 6; // All curriculum fields
  
  if (this.worldLanguageYears && this.worldLanguageYears !== "") completedFields++;
  if (this.honorsCourses && this.honorsCourses !== "") completedFields++;
  if (this.collegeCreditCourses && this.collegeCreditCourses !== "") completedFields++;
  if (this.apCourses && this.apCourses !== "") completedFields++;
  if (this.ibCourses && this.ibCourses !== "") completedFields++;
  if (this.ibDiploma && this.ibDiploma !== "") completedFields++;
  
  this.progress = Math.round((completedFields / totalFields) * 100);
  this.updatedAt = Date.now();
  next();
});

const HighSchoolCurriculum = mongoose.model("HighSchoolCurriculum", highSchoolCurriculumSchema);
export default HighSchoolCurriculum;