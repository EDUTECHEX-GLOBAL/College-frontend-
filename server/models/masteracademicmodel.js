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
      required: [true, "Degree is required"],
      trim: true,
      enum: {
        values: VALID_DEGREES,
        message: "Invalid degree type: {VALUE}",
      },
    },
    university: {
      type: String,
      required: [true, "University name is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    fieldOfStudy: {
      type: String,
      required: [true, "Field of study is required"],
      trim: true,
    },
    startDate: {
      type: String,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: String,
      required: [true, "End date is required"],
    },
    // Free-form string: accepts "3.5", "8.5/10", "85%", or empty
    gpa: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const masterAcademicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    // FIX: Removed the schema-level Bachelor's Degree validator from here.
    // Mongoose's array-level custom validators do NOT run reliably on
    // findOneAndUpdate() upserts even with runValidators:true — this is a
    // known Mongoose limitation. The Bachelor's check is enforced in the
    // controller instead (before the DB call), which is more reliable.
    academics: {
      type: [academicEntrySchema],
      required: [true, "At least one academic entry is required"],
      validate: {
        validator: function (entries) {
          return Array.isArray(entries) && entries.length > 0;
        },
        message: "At least one academic entry is required.",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("MasterAcademic", masterAcademicSchema);