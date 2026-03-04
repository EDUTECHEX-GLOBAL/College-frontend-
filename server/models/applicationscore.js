import mongoose from "mongoose";

/* ─────────────────────────────────────────
   Sub-schema: one subject + its mark
───────────────────────────────────────── */
const subjectMarkSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    marks: { type: String, default: "" },
  },
  { _id: false }
);

/* ─────────────────────────────────────────
   Sub-schema: one grade's full subject list
───────────────────────────────────────── */
const gradeSchema = new mongoose.Schema(
  {
    subjects: { type: [subjectMarkSchema], default: [] },
  },
  { _id: false }
);

/* ─────────────────────────────────────────
   Main Schema
───────────────────────────────────────── */
const applicationScoreSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ── Academic grades (subject-wise) ──
    grade9: { type: gradeSchema, default: () => ({ subjects: [] }) },
    grade10: { type: gradeSchema, default: () => ({ subjects: [] }) },
    grade11: { type: gradeSchema, default: () => ({ subjects: [] }) },
    grade12: { type: gradeSchema, default: () => ({ subjects: [] }) },

    // ── SAT ──
    satTotal: String,
    satMath: String,
    satReading: String,
    satDate: Date,

    // ── PSAT ──
    psatTotal: String,
    psatMath: String,
    psatReading: String,
    psatDate: Date,

    // ── ACT ──
    act: String,
    actDate: Date,

    // ── TOEFL ──
    toefl: String,
    toeflDate: Date,

    // ── IELTS ──
    ielts: String,
    ieltsDate: Date,

    // ── AP ──
    ap: String,
    apDate: Date,

    // ── PTE ──
    pte: String,
    pteDate: Date,

    // ── Duolingo ──
    duolingo: String,
    duolingoDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model("ApplicationScore", applicationScoreSchema);