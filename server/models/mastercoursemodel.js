import mongoose from 'mongoose';

const masterCourseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // ✅ one record per user
    },

    preferredCourse: {
      type: String,
      required: true,
      trim: true
    },

    specialization: {
      type: String,
      default: ''
    },

    intake: {
      type: String,
      required: true,
      enum: ['Fall', 'Spring', 'Summer']
    },

    modeOfStudy: {
      type: String,
      required: true,
      enum: ['Full-time', 'Part-time', 'Online', 'Hybrid']
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('MasterCourse', masterCourseSchema);