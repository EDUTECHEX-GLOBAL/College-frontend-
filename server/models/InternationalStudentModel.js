import mongoose from "mongoose";

const internationalStudentSchema = new mongoose.Schema(
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

    // ===============================
    // EDUCATION QUESTIONS
    // ===============================
    highSchoolGraduated: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },

    attendedClassesSinceGraduation: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },

    addAnotherSchool: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },

    schoolName: {
      type: String,
      trim: true,
    },

    schoolStartDate: {
      type: Date,
    },

    schoolEndDate: {
      type: Date,
    },

    // ===============================
    // IMMIGRATION QUESTIONS
    // ===============================
    requestedImmigrationStatus: {
      type: String,
      enum: [
        "",
        "F-1 student (most common)",
        "J-1 exchange visitor",
        "F-2 dependent",
        "J-2 dependent",
        "B-2 tourist",
        "H-4 dependent",
        "L-2 dependent",
        "E-2 dependent",
        "Other",
      ],
      default: "",
    },

    currentlyInUS: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },

    currentImmigrationStatus: {
      type: String,
      enum: [
        "",
        "F-1 student (most common)",
        "J-1 exchange visitor",
        "F-2 dependent",
        "J-2 dependent",
        "B-2 tourist",
        "H-4 dependent",
        "L-2 dependent",
        "E-2 dependent",
        "Other",
      ],
      default: "",
    },

    // ===============================
    // INFORMATION SOURCE
    // ===============================
    hearAboutKU: {
      type: String,
      enum: [
        "",
        "Agent",
        "Counselor/Advisor",
        "Educational Fair",
        "Friends or Family",
        "Internet",
        "KU Admissions Rep",
        "KU alumni",
        "KU Professor",
        "KU Student",
        "KU Study Abroad",
        "Ranks",
        "Recruitment Email",
        "Social Media",
        "Sponsor",
        "Teacher/Professor",
        "US University or College Fair",
        "Other",
      ],
      default: "",
    },

    // ===============================
    // AGREEMENTS
    // ===============================
    applicationFeeAgreement: {
      type: String,
      enum: ["", "agree"],
      default: "",
    },

    certificationAgreement: {
      type: String,
      enum: ["", "agree"],
      default: "",
    },

    thirdPartyPreparation: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },

    // ===============================
    // PROGRESS TRACKING
    // ===============================
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["not-started", "in-progress", "completed"],
      default: "not-started",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===============================
// INDEX
// ===============================
internationalStudentSchema.index(
  { studentId: 1, collegeId: 1 },
  { unique: true }
);

// ===============================
// VIRTUAL FIELDS (NAME + EMAIL)
// ===============================
internationalStudentSchema.virtual("studentName").get(function () {
  return this.studentId?.name || "";
});

internationalStudentSchema.virtual("studentEmail").get(function () {
  return this.studentId?.email || "";
});

// ===============================
// PRE-SAVE HOOK
// ===============================
internationalStudentSchema.pre("save", function (next) {
  this.calculateProgress();
  next();
});

// ===============================
// PROGRESS CALCULATION
// ===============================
internationalStudentSchema.methods.calculateProgress = function () {
  let completedFields = 0;
  let totalFields = 0;

  const requiredFields = [
    "highSchoolGraduated",
    "requestedImmigrationStatus",
    "currentlyInUS",
    "hearAboutKU",
    "applicationFeeAgreement",
    "certificationAgreement",
    "thirdPartyPreparation",
  ];

  requiredFields.forEach((field) => {
    totalFields++;
    if (this[field] !== "") completedFields++;
  });

  if (this.highSchoolGraduated === "yes") {
    totalFields++;
    if (this.attendedClassesSinceGraduation !== "") completedFields++;

    if (this.attendedClassesSinceGraduation === "yes") {
      totalFields++;
      if (this.addAnotherSchool !== "") completedFields++;

      if (this.addAnotherSchool === "yes") {
        ["schoolName", "schoolStartDate", "schoolEndDate"].forEach((field) => {
          totalFields++;
          if (this[field]) completedFields++;
        });
      }
    }
  }

  if (this.currentlyInUS === "yes") {
    totalFields++;
    if (this.currentImmigrationStatus !== "") completedFields++;
  }

  this.progress =
    totalFields > 0
      ? Math.round((completedFields / totalFields) * 100)
      : 0;

  if (this.progress === 0) this.status = "not-started";
  else if (this.progress === 100) this.status = "completed";
  else this.status = "in-progress";
};

const InternationalStudent = mongoose.model(
  "InternationalStudent",
  internationalStudentSchema
);

export default InternationalStudent;
