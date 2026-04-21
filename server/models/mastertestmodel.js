import mongoose from 'mongoose';

const masterTestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // ✅ one record per user
    },

    ielts: { type: Number, min: 0, max: 9 },
    toefl: { type: Number, min: 0, max: 120 },
    pte: { type: Number, min: 10, max: 90 },
    gre: { type: Number, min: 260, max: 340 },
    gmat: { type: Number, min: 200, max: 800 },
    sat: { type: Number, min: 400, max: 1600 },
    act: { type: Number, min: 1, max: 36 },
    duolingo: { type: Number, min: 10, max: 160 }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('MasterTest', masterTestSchema);