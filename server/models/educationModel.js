// server/models/educationModel.js
import mongoose from "mongoose";

// ── sub-schemas ────────────────────────────────────────────────────────────────

const schoolAddressSchema = new mongoose.Schema({
  street:  { type: String, default: "" },
  city:    { type: String, default: "" },
  state:   { type: String, default: "" },
  zipCode: { type: String, default: "" },
  country: { type: String, default: "" },
}, { _id: false });

// OtherSchoolsSection expects: schoolName, schoolCEEBCode, dateOfEntry,
//   dateOfExit, isBoardingSchool, graduated, graduationDate, schoolAddress
const otherSchoolSchema = new mongoose.Schema({
  schoolName:       { type: String, default: "" },
  schoolCEEBCode:   { type: String, default: "" },
  dateOfEntry:      { type: String, default: "" },
  dateOfExit:       { type: String, default: "" },
  isBoardingSchool: { type: String, default: "" },
  graduated:        { type: String, default: "" },
  graduationDate:   { type: String, default: "" },
  schoolAddress:    { type: schoolAddressSchema, default: () => ({}) },
}, { _id: false });

// CollegesSection expects: collegeName, collegeType, datesAttended.{from,to},
//   creditsEarned, degreeEarned, major
const collegeSchema = new mongoose.Schema({
  collegeName:   { type: String, default: "" },
  collegeType:   { type: String, default: "" },
  datesAttended: {
    from: { type: String, default: "" },
    to:   { type: String, default: "" },
  },
  creditsEarned: { type: String, default: "" },
  degreeEarned:  { type: String, default: "" },
  major:         { type: String, default: "" },
}, { _id: false });

// CurrentCoursesSection expects: courseName, courseLevel, credits, grade, term
const courseSchema = new mongoose.Schema({
  courseName:  { type: String, default: "" },
  courseLevel: { type: String, default: "" },
  credits:     { type: String, default: "" },
  grade:       { type: String, default: "" },
  term:        { type: String, default: "" },
}, { _id: false });

// HonorsSection expects: honorName, honorLevel, yearReceived, description
const honorSchema = new mongoose.Schema({
  honorName:    { type: String, default: "" },
  honorLevel:   { type: String, default: "" },
  yearReceived: { type: String, default: "" },
  description:  { type: String, default: "" },
}, { _id: false });

// CommunityOrganizationsSection expects: organizationName, assistanceType,
//   duration, contactPerson
const organizationSchema = new mongoose.Schema({
  organizationName: { type: String, default: "" },
  assistanceType:   { type: String, default: "" },
  duration:         { type: String, default: "" },
  contactPerson:    { type: String, default: "" },
}, { _id: false });

const documentFileSchema = new mongoose.Schema({
  filename:     String,
  originalname: String,
  mimetype:     String,
  size:         Number,
  url:          String,
  uploadedAt:   { type: Date, default: Date.now },
}, { _id: false });

// ── main schema ───────────────────────────────────────────────────────────────

const educationSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Account",
    required: true,
    index:    true,
  },

  // ── CurrentSchoolSection ─────────────────────────────────────────────────
  currentSchool: {
    schoolName:       { type: String, default: "" },
    schoolCEEBCode:   { type: String, default: "" },
    dateOfEntry:      { type: String, default: "" },
    isBoardingSchool: { type: String, default: "" },
    liveOnCampus:     { type: String, default: "" },
    willGraduate:     { type: String, default: "" },
    graduationDate:   { type: String, default: "" },
    schoolAddress:    { type: schoolAddressSchema, default: () => ({}) },
  },

  // ── OtherSchoolsSection ──────────────────────────────────────────────────
  otherSchools: {
    numberOfSchools: { type: Number, default: 0 },
    schools:         { type: [otherSchoolSchema], default: [] },
  },

  // ── CollegesSection ──────────────────────────────────────────────────────
  colleges: {
    numberOfColleges: { type: Number, default: 0 },
    collegesList:     { type: [collegeSchema], default: [] },
  },

  // ── GradesSection ────────────────────────────────────────────────────────
  grades: {
    graduatingClassSize: { type: String, default: "" },
    classRankReporting:  { type: String, default: "" },
    classRank:           { type: String, default: "" },
    gpaScale:            { type: String, default: "" },
    cumulativeGPA:       { type: String, default: "" },
    gpaWeighting:        { type: String, default: "" },
    gpaMaxScale:         { type: String, default: "" },
  },

  // ── CurrentCoursesSection ────────────────────────────────────────────────
  currentCourses: {
    numberOfCourses:  { type: Number, default: 0 },
    schedulingSystem: { type: String, default: "" },
    courses:          { type: [courseSchema], default: [] },
  },

  // ── HonorsSection ────────────────────────────────────────────────────────
  honors: {
    reportHonors: { type: String, default: "" },
    honorsList:   { type: [honorSchema], default: [] },
  },

  // ── CommunityOrganizationsSection ────────────────────────────────────────
  communityOrganizations: {
    numberOfOrganizations: { type: Number, default: 0 },
    organizations:         { type: [organizationSchema], default: [] },
  },

  // ── FuturePlansSection ───────────────────────────────────────────────────
  futurePlans: {
    studentType:         { type: String, default: "" },
    highestDegree:       { type: String, default: "" },
    careerInterest:      { type: String, default: "" },
    additionalInterests: { type: [String],  default: [] },
  },

  // ── Documents ────────────────────────────────────────────────────────────
  documents: {
    passport:            { type: documentFileSchema },
    tenthMarksheet:      { type: documentFileSchema },
    twelfthMarksheet:    { type: documentFileSchema },
    additionalDocuments: { type: [documentFileSchema], default: [] },
  },

  // ── Completion tracking ──────────────────────────────────────────────────
  educationCompletion: {
    currentSchool:          { type: Boolean, default: false },
    otherSchools:           { type: Boolean, default: false },
    colleges:               { type: Boolean, default: false },
    grades:                 { type: Boolean, default: false },
    currentCourses:         { type: Boolean, default: false },
    honors:                 { type: Boolean, default: false },
    communityOrganizations: { type: Boolean, default: false },
    futurePlans:            { type: Boolean, default: false },
    documents:              { type: Boolean, default: false },
  },

  overallProgress: { type: Number, default: 0 },
}, { timestamps: true });

const Education = mongoose.model("Education", educationSchema);
export default Education;