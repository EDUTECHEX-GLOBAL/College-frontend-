import mongoose from 'mongoose';

// ─── Reusable sub-schemas ─────────────────────────────────────────────────

const satAttemptSchema = new mongoose.Schema({
  testDate:    { type: String },               // YYYY-MM
  total:       { type: Number, min: 400, max: 1600 },
  math:        { type: Number, min: 200, max: 800  },
  ebrw:        { type: Number, min: 200, max: 800  }, // Evidence-Based Reading & Writing
  percentile:  { type: Number, min: 1,   max: 99   },
}, { _id: false });

const actAttemptSchema = new mongoose.Schema({
  testDate:    { type: String },
  composite:   { type: Number, min: 1,  max: 36 },
  english:     { type: Number, min: 1,  max: 36 },
  math:        { type: Number, min: 1,  max: 36 },
  reading:     { type: Number, min: 1,  max: 36 },
  science:     { type: Number, min: 1,  max: 36 },
  writing:     { type: Number, min: 2,  max: 12 }, // optional
  percentile:  { type: Number, min: 1,  max: 99 }, // optional
}, { _id: false });

const satSubjectAttemptSchema = new mongoose.Schema({
  subject:     { type: String },
  score:       { type: Number, min: 200, max: 800 },
  testDate:    { type: String },
}, { _id: false });

const apAttemptSchema = new mongoose.Schema({
  subject:     { type: String },
  score:       { type: Number, min: 1, max: 5 },
  testDate:    { type: String },
}, { _id: false });

const ibAttemptSchema = new mongoose.Schema({
  subject:     { type: String },
  level:       { type: String, enum: ['SL', 'HL'] },
  score:       { type: Number, min: 1, max: 7 },
  year:        { type: Number, min: 2000, max: 2035 },
}, { _id: false });

const cambridgeAttemptSchema = new mongoose.Schema({
  subject:     { type: String },
  level:       { type: String, enum: ['AS', 'A', 'O'] },
  grade:       { type: String, enum: ['A*', 'A', 'B', 'C', 'D', 'E', 'U'] },
  testDate:    { type: String },
}, { _id: false });

const toeflAttemptSchema = new mongoose.Schema({
  testDate:    { type: String },
  reading:     { type: Number, min: 0, max: 30  },
  listening:   { type: Number, min: 0, max: 30  },
  speaking:    { type: Number, min: 0, max: 30  },
  writing:     { type: Number, min: 0, max: 30  },
  total:       { type: Number, min: 0, max: 120 },
}, { _id: false });

const ieltsAttemptSchema = new mongoose.Schema({
  testDate:    { type: String },
  listening:   { type: Number, min: 0, max: 9 },
  reading:     { type: Number, min: 0, max: 9 },
  writing:     { type: Number, min: 0, max: 9 },
  speaking:    { type: Number, min: 0, max: 9 },
  overall:     { type: Number, min: 0, max: 9 },
}, { _id: false });

const pteAttemptSchema = new mongoose.Schema({
  testDate:      { type: String },
  listening:     { type: Number, min: 10, max: 90 },
  reading:       { type: Number, min: 10, max: 90 },
  speaking:      { type: Number, min: 10, max: 90 },
  writing:       { type: Number, min: 10, max: 90 },
  overall:       { type: Number, min: 10, max: 90 },
  grammar:       { type: Number, min: 10, max: 90 }, // optional
  vocabulary:    { type: Number, min: 10, max: 90 }, // optional
  oralFluency:   { type: Number, min: 10, max: 90 }, // optional
  pronunciation: { type: Number, min: 10, max: 90 }, // optional
  spelling:      { type: Number, min: 10, max: 90 }, // optional
}, { _id: false });

const duolingoAttemptSchema = new mongoose.Schema({
  testDate:      { type: String },
  overall:       { type: Number, min: 10, max: 160 },
  literacy:      { type: Number, min: 10, max: 160 },
  comprehension: { type: Number, min: 10, max: 160 },
  conversation:  { type: Number, min: 10, max: 160 },
  production:    { type: Number, min: 10, max: 160 },
}, { _id: false });

const greAttemptSchema = new mongoose.Schema({
  testDate:         { type: String },
  verbal:           { type: Number, min: 130, max: 170 },
  verbalPct:        { type: Number, min: 1,   max: 99  }, // optional
  quant:            { type: Number, min: 130, max: 170 },
  quantPct:         { type: Number, min: 1,   max: 99  }, // optional
  analyticalWrite:  { type: Number, min: 0,   max: 6   },
  total:            { type: Number, min: 260, max: 340 },
}, { _id: false });

const gmatAttemptSchema = new mongoose.Schema({
  testDate:     { type: String },
  total:        { type: Number, min: 205, max: 805 },
  verbal:       { type: Number, min: 60,  max: 90  },
  quant:        { type: Number, min: 60,  max: 90  },
  dataInsights: { type: Number, min: 60,  max: 90  },
  awa:          { type: Number, min: 0,   max: 6   }, // optional — legacy GMAT only
}, { _id: false });

// ─── Main Schema ──────────────────────────────────────────────────────────

const masterTestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // ── Undergraduate Admission ──
    sat:        { type: [satAttemptSchema],        default: undefined },
    act:        { type: [actAttemptSchema],        default: undefined },

    // ── Subject Tests ──
    satSubject: { type: [satSubjectAttemptSchema], default: undefined },
    ap:         { type: [apAttemptSchema],         default: undefined },
    ib:         { type: [ibAttemptSchema],         default: undefined },
    cambridge:  { type: [cambridgeAttemptSchema],  default: undefined },

    // ── English Proficiency ──
    toefl:      { type: [toeflAttemptSchema],      default: undefined },
    ielts:      { type: [ieltsAttemptSchema],      default: undefined },
    pte:        { type: [pteAttemptSchema],        default: undefined },
    duolingo:   { type: [duolingoAttemptSchema],   default: undefined },

    // ── Graduate Admission ──
    gre:        { type: [greAttemptSchema],        default: undefined },
    gmat:       { type: [gmatAttemptSchema],       default: undefined },

    // ── Future test dates per test ──
    sat_futureDates:        { type: [String], default: undefined },
    act_futureDates:        { type: [String], default: undefined },
    satSubject_futureDates: { type: [String], default: undefined },
    ap_futureDates:         { type: [String], default: undefined },
  },
  { timestamps: true }
);

export default mongoose.model('MasterTest', masterTestSchema);