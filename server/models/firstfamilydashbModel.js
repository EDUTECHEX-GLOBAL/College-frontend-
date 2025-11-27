import mongoose from "mongoose";

const familySchema = new mongoose.Schema(
  {
    // Reference to the student account
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    // =============================
    // 🏠 Household Information
    // =============================
    household: {
      parentsMaritalStatus: {
        type: String,
        enum: ["", "married", "separated", "divorced", "widowed", "never_married", "civil_union"],
        default: "",
      },
      permanentHomeWith: {
        type: String,
        enum: ["", "both_parents", "parent1", "parent2", "other_relatives", "guardian", "on_my_own"],
        default: "",
      },
      hasChildren: {
        type: String,
        enum: ["", "yes", "no"],
        default: "",
      },
      childrenCount: {
        type: Number,
        default: 0,
      },
    },

    // =============================
    // 👨‍👩‍👧‍👦 Parent 1 Information
    // =============================
    parent1: {
      parentType: {
        type: String,
        enum: ["", "mother", "father", "limited_info"],
        default: "",
      },
      isLiving: {
        type: String,
        enum: ["", "yes", "no"],
        default: "",
      },
      prefix: {
        type: String,
        enum: ["", "mr", "ms", "mrs", "dr"],
        default: "",
      },
      firstName: {
        type: String,
        trim: true,
      },
      middleInitial: {
        type: String,
        trim: true,
        maxlength: 1,
      },
      lastName: {
        type: String,
        trim: true,
      },
      formerLastName: {
        type: String,
        trim: true,
      },
      suffix: {
        type: String,
        enum: ["", "jr", "sr", "ii", "iii"],
        default: "",
      },
      occupation: {
        type: String,
        enum: [
          "",
          "architect",
          "doctor",
          "engineer",
          "teacher",
          "business_owner",
          "retired",
          "deceased",
          "other",
        ],
        default: "",
      },
      educationLevel: {
        type: String,
        enum: [
          "",
          "high_school",
          "some_college",
          "associates",
          "bachelors",
          "masters",
          "doctorate",
          "professional",
        ],
        default: "",
      },
    },

    // =============================
    // 👨‍👩‍👧‍👦 Parent 2 Information
    // =============================
    parent2: {
      parentType: {
        type: String,
        enum: ["", "mother", "father", "limited_info", "no_other_parent"],
        default: "",
      },
      isLiving: {
        type: String,
        enum: ["", "yes", "no"],
        default: "",
      },
      prefix: {
        type: String,
        enum: ["", "mr", "ms", "mrs", "dr"],
        default: "",
      },
      firstName: {
        type: String,
        trim: true,
      },
      middleInitial: {
        type: String,
        trim: true,
        maxlength: 1,
      },
      lastName: {
        type: String,
        trim: true,
      },
      formerLastName: {
        type: String,
        trim: true,
      },
      suffix: {
        type: String,
        enum: ["", "jr", "sr", "ii", "iii"],
        default: "",
      },
      occupation: {
        type: String,
        enum: [
          "",
          "architect",
          "doctor",
          "engineer",
          "teacher",
          "business_owner",
          "retired",
          "deceased",
          "other",
        ],
        default: "",
      },
      educationLevel: {
        type: String,
        enum: [
          "",
          "high_school",
          "some_college",
          "associates",
          "bachelors",
          "masters",
          "doctorate",
          "professional",
        ],
        default: "",
      },
    },

    // =============================
    // 👨‍👧‍👦 Sibling Information
    // =============================
    siblings: {
      siblingsCount: {
        type: Number,
        default: 0,
      },
      siblingsList: [
        {
          firstName: {
            type: String,
            trim: true,
          },
          lastName: {
            type: String,
            trim: true,
          },
          age: {
            type: Number,
            min: 0,
            max: 100,
          },
        },
      ],
    },

    // =============================
    // 📊 Completion Status
    // =============================
    completionStatus: {
      household: { type: Boolean, default: false },
      parent1: { type: Boolean, default: false },
      parent2: { type: Boolean, default: false },
      sibling: { type: Boolean, default: false },
    },

    // =============================
    // 🎯 Overall Family Progress
    // =============================
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// =============================
// 🔍 Index for efficient queries
// =============================
familySchema.index({ studentId: 1 });

// =============================
// 🎯 Calculate Progress Middleware
// =============================
familySchema.pre("save", function (next) {
  const completionFields = Object.values(this.completionStatus);
  const completedCount = completionFields.filter(Boolean).length;
  const totalSections = completionFields.length;

  this.overallProgress = Math.round((completedCount / totalSections) * 100);
  next();
});

// =============================
// 🧾 Static Methods
// =============================
familySchema.statics.findByStudentId = function (studentId) {
  return this.findOne({ studentId });
};

familySchema.statics.getFamilyProgress = async function (studentId) {
  const familyData = await this.findOne({ studentId });
  return familyData ? familyData.overallProgress : 0;
};

// Changed from "Family" to "firstfamilydashb"
const firstfamilydashb = mongoose.model("firstfamilydashb", familySchema);
export default firstfamilydashb;