import mongoose from "mongoose";

const VALID_DEGREES = [
  "Bachelor's Degree",
  "Master's Degree",
  "PhD/Doctorate",
  "Diploma",
  "Associate Degree",
  "High School",
];

const academicEntrySchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      required: true,
      trim: true,
      enum: {
        values: VALID_DEGREES,
        message: "Invalid degree type: {VALUE}",
      },
    },
    university: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    fieldOfStudy: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    gpa: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const masterAcademicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    academics: {
      type: [academicEntrySchema],
      validate: {
        // ✅ Enforce at least one Bachelor's Degree
        validator: function (entries) {
          return entries.some((e) => e.degree === "Bachelor's Degree");
        },
        message: "At least one Bachelor's Degree is required to apply for a master's program.",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("MasterAcademic", masterAcademicSchema);