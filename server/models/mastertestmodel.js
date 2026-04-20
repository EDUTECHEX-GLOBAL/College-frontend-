import mongoose from 'mongoose';

// ── Nested grade schema (per school grade) ────────────────────────────────────
const gradeEntrySchema = new mongoose.Schema(
  {
    gpa:    { type: String, default: '' },
    system: { type: String, enum: ['percentage', '4.0', '10.0', 'cgpa'], default: 'percentage' },
  },
  { _id: false }
);

const masterTestSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true, // one record per user
    },

    // ── Education ────────────────────────────────────────────────────────────
    educationMode: {
      type: String,
      enum: ['school', 'degree', ''],
      default: '',
    },

    // School grades (9–12)
    selectedGrades: {
      grade9:  { type: gradeEntrySchema, default: undefined },
      grade10: { type: gradeEntrySchema, default: undefined },
      grade11: { type: gradeEntrySchema, default: undefined },
      grade12: { type: gradeEntrySchema, default: undefined },
    },

    // Degree info
    selectedDegree:  { type: String, default: '' }, // e.g. 'btech'
    selectedBranch:  { type: String, default: '' }, // e.g. 'Computer Science Engineering (CSE)'
    degreeGpa:       { type: String, default: '' },
    degreeGpaSystem: { type: String, enum: ['percentage', '4.0', '10.0', 'cgpa'], default: 'percentage' },
    degreeYear:      { type: String, default: '' }, // year of completion / expected

    // ── Standardised tests ───────────────────────────────────────────────────
    ielts:    { type: Number, min: 0,   max: 9    },
    toefl:    { type: Number, min: 0,   max: 120  },
    pte:      { type: Number, min: 10,  max: 90   },
    gre:      { type: Number, min: 260, max: 340  },
    gmat:     { type: Number, min: 200, max: 800  },
    sat:      { type: Number, min: 400, max: 1600 },
    act:      { type: Number, min: 1,   max: 36   },
    duolingo: { type: Number, min: 10,  max: 160  },
  },
  { timestamps: true }
);

export default mongoose.model('MasterTest', masterTestSchema);