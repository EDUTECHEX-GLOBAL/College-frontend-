import mongoose from "mongoose";

const residencySchema = new mongoose.Schema(
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
    
    // Main Questions
    qualifyInStateTuition: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    kansasResident: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    livedInKansasSinceBirth: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    everLivedInKansas: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    
    // Date Fields
    kansasResidenceStartDate: {
      type: Date,
    },
    kansasResidenceEndDate: {
      type: Date,
    },
    
    // Progress Tracking
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Status
    status: {
      type: String,
      enum: ["not-started", "in-progress", "completed"],
      default: "not-started",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one residency record per student per college
residencySchema.index({ studentId: 1, collegeId: 1 }, { unique: true });

// Calculate progress before saving
residencySchema.pre("save", function (next) {
  this.calculateProgress();
  next();
});

// Progress calculation method
residencySchema.methods.calculateProgress = function () {
  let completedFields = 0;
  let totalFields = 0;

  // Main qualification question (always required)
  totalFields++;
  if (this.qualifyInStateTuition !== "") {
    completedFields++;
  }

  // Conditional fields based on answers
  if (this.qualifyInStateTuition === "yes") {
    totalFields++; // kansasResident field
    if (this.kansasResident !== "") {
      completedFields++;
    }

    if (this.kansasResident === "yes") {
      totalFields++; // livedInKansasSinceBirth field
      if (this.livedInKansasSinceBirth !== "") {
        completedFields++;
      }

      if (this.livedInKansasSinceBirth === "no") {
        totalFields++; // date fields count as one field
        if (this.kansasResidenceStartDate && this.kansasResidenceEndDate) {
          completedFields++;
        }
      }
    } else if (this.kansasResident === "no") {
      totalFields++; // everLivedInKansas field
      if (this.everLivedInKansas !== "") {
        completedFields++;
      }

      if (this.everLivedInKansas === "yes") {
        totalFields++; // date fields count as one field
        if (this.kansasResidenceStartDate && this.kansasResidenceEndDate) {
          completedFields++;
        }
      }
    }
  }

  // Calculate percentage
  this.progress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  
  // Update status based on progress
  if (this.progress === 0) {
    this.status = "not-started";
  } else if (this.progress === 100) {
    this.status = "completed";
  } else {
    this.status = "in-progress";
  }
};

const FirstResidency = mongoose.model("FirstResidency", residencySchema);
export default FirstResidency;