import mongoose from "mongoose";

const academicEntrySchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      required: true,
      trim: true,
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
      type: String, // month format (YYYY-MM)
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
  { _id: false } // ❗ important (avoid nested _id duplication)
);

const masterAcademicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true, // ✅ one record per user
    },
    academics: [academicEntrySchema], // array of entries
  },
  { timestamps: true }
);

export default mongoose.model("MasterAcademic", masterAcademicSchema);