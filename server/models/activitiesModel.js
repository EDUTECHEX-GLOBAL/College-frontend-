import mongoose from "mongoose";

const activitiesSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    hasActivities: {
      type: Boolean,
      default: null
    },
    activities: [
      {
        id: { type: Number, required: true },
        type: { type: String, trim: true },
        position: { type: String, trim: true },
        organization: { type: String, trim: true },
        description: { type: String, trim: true },
        gradeLevels: [{ type: String }],
        timing: { type: String, trim: true },
        hoursPerWeek: { type: String, trim: true },
        weeksPerYear: { type: String, trim: true },
        continueInCollege: { type: Boolean, default: null }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Create unique index for studentId
activitiesSchema.index({ studentId: 1 }, { unique: true });

const Activities = mongoose.model("Activities", activitiesSchema);
export default Activities;