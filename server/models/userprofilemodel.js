// src/models/userprofilemodel.js
import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// SUB-SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const selectedCourseSchema = new mongoose.Schema({
  id:           { type: String, required: true },
  title:        { type: String, required: true },
  name:         { type: String, default: '' },
  program_name: { type: String, default: '' },
  level:        { type: String, default: '' },
  studyMode:    { type: String, default: '' },
  duration:     { type: String, default: '' },
  locations:    [{ type: String }],
  majorArea:    { type: String, default: '' },
  description:  { type: String, default: '' },
  credits:      { type: Number, default: null },
  fees:         { type: String, default: '' },
}, { _id: false });

const selectedUniversitySchema = new mongoose.Schema({
  id:       { type: String, required: true },
  unitid:   { type: Number, default: null },
  name:     { type: String, required: true },
  location: { type: String, default: 'Location not specified' },
  city:     { type: String, default: '' },
  state:    { type: String, default: '' },
  country:  { type: String, default: 'USA' },

  // ✅ FIX: added '' to enum so empty string doesn't cause validation error
  universityType: {
    type: String,
    enum: ['Bachelor', 'Master', '', null],
    default: null,
  },

  isKansas:      { type: Boolean, default: false },
  isDirectApply: { type: Boolean, default: false },

  selectedCourses: {
    type: [selectedCourseSchema],
    validate: {
      validator: (v) => v.length <= 1,
      message: 'Only 1 course allowed per university',
    },
    default: [],
  },

  fullData: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const basicInfoSchema = new mongoose.Schema({
  fullName:    { type: String, required: true },
  email:       { type: String, required: true },
  mobile:      { type: String, required: true },
  dob:         { type: String, required: true },
  gender:      { type: String, required: true },
  nationality: { type: String, required: true },
  residence:   { type: String, required: true },
}, { _id: false });

const educationSchema = new mongoose.Schema({
  qualification: { type: String, required: true },
  institution:   { type: String, required: true },
  field:         { type: String, default: '' },   // ✅ FIX: was required:true — now optional
  cgpa:          { type: String, required: true },
}, { _id: false });

const selectedSegmentSchema = new mongoose.Schema({
  id:   { type: String, required: true },
  name: { type: String, required: true },
}, { _id: false });

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
const userProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },

  profileImage: { type: String, default: null },

  basicInfo: { type: basicInfoSchema, required: true },

  education: { type: educationSchema, required: true },

  programType: {
    type: String,
    enum: ['UG', 'PG'],
    required: true,
  },

  eligibleProgram: {
    type: String,
    enum: ['Bachelor', 'Master', 'PhD', null],
    default: null,
  },

  programStream: {
    type: String,
    enum: ['UG', 'PG', null],
    default: null,
  },

  selectedSegment: {
    type: selectedSegmentSchema,
    default: null,
  },

  interestedCourses: {
    type: [String],
    default: [],
    validate: {
      validator: (v) => v.length <= 5,
      message: 'Maximum 5 interested courses allowed',
    },
  },

  selectedUniversities: {
    type: [selectedUniversitySchema],
    validate: {
      validator: (v) => v.length <= 2,
      message: 'A maximum of 2 universities can be selected',
    },
    default: [],
  },

  profileCompleted: { type: Boolean, default: false },
  completedAt:      { type: Date,    default: null  },
  lastUpdated:      { type: Date,    default: Date.now },

}, { timestamps: true });

// ─────────────────────────────────────────────────────────────────────────────
// PRE-SAVE HOOK
// NOTE: Only runs on .save() — NOT on findOneAndUpdate()
// ─────────────────────────────────────────────────────────────────────────────
userProfileSchema.pre('save', function (next) {
  this.lastUpdated = Date.now();

  // Derive programStream from programType
  if (this.programType === 'UG') {
    this.programStream = 'UG';
  } else if (this.programType === 'PG') {
    this.programStream = 'PG';
  }

  // Auto-derive eligibleProgram from qualification
  if (this.education?.qualification) {
    const q = this.education.qualification.toLowerCase();
    if (q.includes('12th') || q.includes('high school')) {
      this.eligibleProgram = 'Bachelor';
    } else if (q.includes('bachelor')) {
      this.eligibleProgram = 'Master';
    } else if (q.includes('master')) {
      this.eligibleProgram = 'PhD';
    }
  }

  // ✅ Ensure field is never undefined/null
  if (this.education && !this.education.field) {
    this.education.field = '';
  }

  // Sanitize interestedCourses
  if (Array.isArray(this.interestedCourses)) {
    this.interestedCourses = this.interestedCourses
      .map((c) => (typeof c === 'string' ? c.trim() : ''))
      .filter(Boolean);
  }

  // Only enforce completion rules when profileCompleted = true
  if (!this.profileCompleted) return next();

  const unis = this.selectedUniversities || [];

  if (unis.length !== 2)
    return next(new Error('Select exactly 2 universities'));

  for (const uni of unis) {
    if (!uni.isKansas && !uni.isDirectApply) {
      if (!uni.selectedCourses || uni.selectedCourses.length === 0)
        return next(new Error(`Select a course for ${uni.name}`));
    }
  }

  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ 'basicInfo.email': 1 });
userProfileSchema.index({ programType: 1 });
userProfileSchema.index({ programStream: 1 });
userProfileSchema.index({ eligibleProgram: 1 });
userProfileSchema.index({ 'selectedSegment.id': 1 });
userProfileSchema.index({ profileCompleted: 1 });
userProfileSchema.index({ 'selectedUniversities.universityType': 1 });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;