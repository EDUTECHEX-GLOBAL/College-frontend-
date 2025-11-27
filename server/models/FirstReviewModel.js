import mongoose from "mongoose";

const firstReviewSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    collegeId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'in-review', 'accepted', 'rejected'],
      default: 'draft'
    },
    submittedAt: Date,
    
    // Overall application progress
    overallProgress: {
      type: Number,
      default: 0
    },
    
    // ✅ ADD: Individual section progress tracking
    sectionProgress: {
      general: { type: Number, default: 0 },
      academics: { type: Number, default: 0 },
      highSchoolCurriculum: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      contacts: { type: Number, default: 0 },
      family: { type: Number, default: 0 },
      residency: { type: Number, default: 0 },
      international: { type: Number, default: 0 }
    },
    
    // Review-specific data
    lastReviewed: Date,
    reviewNotes: String
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
firstReviewSchema.index({ studentId: 1, collegeId: 1 }, { unique: true });

const FirstReview = mongoose.model('FirstReview', firstReviewSchema);
export default FirstReview;