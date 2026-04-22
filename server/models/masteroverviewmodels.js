import mongoose from "mongoose";

const masterOverviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      preferredCourse: { type: String, required: true },
      universityName: { type: String },
      level: { type: String },
      modeOfStudy: { type: String },
      duration: { type: String },
      majorArea: { type: String },
      intake: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model("MasterOverview", masterOverviewSchema);