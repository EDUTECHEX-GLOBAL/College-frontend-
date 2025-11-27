// models/activitiestestModel.js
import mongoose from "mongoose";

const activitiesSchema = new mongoose.Schema(
  {
    // Reference to the student
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransferStudent",
      required: true,
    },

    // ---------- Activities List ----------
    activities: {
      hasActivities: {
        type: String,
        enum: ['', 'yes', 'no'],
        default: '',
      },
      activitiesList: [
        {
          activityType: {
            type: String,
            default: '',
          },
          positionLeadership: {
            type: String,
            default: '',
            maxlength: 50,
          },
          organizationName: {
            type: String,
            default: '',
            maxlength: 100,
          },
          description: {
            type: String,
            default: '',
            maxlength: 150,
          },
          participationGradeLevels: {
            type: [String],
            default: [],
          },
          timingOfParticipation: {
            type: [String],
            default: [],
          },
          hoursPerWeek: {
            type: String,
            default: '',
          },
          weeksPerYear: {
            type: String,
            default: '',
          },
          intendToContinue: {
            type: String,
            enum: ['', 'yes', 'no'],
            default: '',
          },
        },
      ],
    },

    // ---------- Responsibilities and Circumstances ----------
    responsibilities: {
      selectedResponsibilities: {
        type: [String],
        default: [],
      },
      selectedCircumstances: {
        type: [String],
        default: [],
      },
    },

    // ---------- Activities Completion Tracking ----------
    activitiesCompletion: {
      activities: {
        type: Boolean,
        default: false,
      },
      responsibilities: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    collection: "activities_records",
    strict: false,
  }
);

// Index for faster queries
activitiesSchema.index({ studentId: 1 }, { unique: true });

const Activities = mongoose.model("Activities", activitiesSchema);
export default Activities;
