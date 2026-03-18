// src/models/userprofilemodel.js
import mongoose from 'mongoose';

const selectedCourseSchema = new mongoose.Schema({
  id:           { type: String, required: true },
  title:        { type: String, required: true },
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

  // ✅ Both flags stored — isKansas covers Kansas universities,
  //    isDirectApply covers any university with no programs
  isKansas:     { type: Boolean, default: false },
  isDirectApply:{ type: Boolean, default: false },

  selectedCourses: {
    type: [selectedCourseSchema],
    validate: {
      validator: function(courses) { return courses.length <= 2; },
      message: 'Maximum 2 courses can be selected per university',
    },
    default: [],
  },
  fullData: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const basicInfoSchema = new mongoose.Schema({
  fullName:    { type: String, required: true, trim: true },
  email:       { type: String, required: true, trim: true, lowercase: true },
  mobile:      { type: String, required: true, trim: true },
  dob:         { type: String, required: true },
  gender:      { type: String, required: true, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  nationality: { type: String, required: true, trim: true },
  residence:   { type: String, required: true, trim: true },
}, { _id: false });

const educationSchema = new mongoose.Schema({
  qualification: { type: String, required: true, enum: ['12th', 'Bachelor', 'Master'] },
  institution:   { type: String, required: true, trim: true },
  field:         { type: String, required: true, trim: true },
  year:          { type: String, required: true, trim: true },
  cgpa:          { type: String, required: true, trim: true },
}, { _id: false });

const userProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  profileImage: { type: String, default: null },
  basicInfo:    { type: basicInfoSchema,  required: true },
  education:    { type: educationSchema,  required: true },
  eligibleProgram: { type: String, required: true, enum: ['Bachelor', 'Master', 'PhD'] },
  selectedUniversities: { type: [selectedUniversitySchema], default: [] },
  selectedCourses: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  profileCompleted: { type: Boolean, default: true },
  completedAt:      { type: Date, default: Date.now },
  lastUpdated:      { type: Date, default: Date.now },
}, { timestamps: true });

// Update lastUpdated on every save
userProfileSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// ✅ FIXED: validate universities — exempt both isKansas AND isDirectApply from course requirement
userProfileSchema.pre('save', function(next) {
  const unis = this.selectedUniversities || [];

  if (unis.length < 3 || unis.length > 5) {
    return next(new Error(`Please select between 3 and 5 universities (currently ${unis.length})`));
  }

  for (const uni of unis) {
    // A university is "direct apply" if either flag is true — no courses required
    const isDirect = uni.isKansas === true || uni.isDirectApply === true;

    if (!isDirect && (!uni.selectedCourses || uni.selectedCourses.length === 0)) {
      return next(new Error(`Please select at least one course for ${uni.name}`));
    }
    if (uni.selectedCourses && uni.selectedCourses.length > 2) {
      return next(new Error(`Maximum 2 courses can be selected for ${uni.name}`));
    }
  }

  next();
});

userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ 'basicInfo.email': 1 });
userProfileSchema.index({ eligibleProgram: 1 });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
export default UserProfile;