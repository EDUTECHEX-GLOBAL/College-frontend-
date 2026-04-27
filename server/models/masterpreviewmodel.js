// server/models/masterpreviewmodel.js

import mongoose from "mongoose";

/* ======================================================
   MASTER APPLICATION MODEL
   
   Single model that stores ALL sections of a master's
   application under one document per user.
   
   Replaces the need for 6 separate models:
   MasterPersonal, MasterContact, MasterCourse,
   MasterAcademic, MasterTest, MasterDocument
====================================================== */

// ── Academic entry sub-schema ──
const academicEntrySchema = new mongoose.Schema(
  {
    degree:       { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    university:   { type: String, trim: true },
    country:      { type: String, trim: true },
    startDate:    { type: String, trim: true },
    endDate:      { type: String, trim: true },
    gpa:          { type: String, trim: true },
  },
  { _id: false }
);

// ── Test attempt sub-schema ──
const testAttemptSchema = new mongoose.Schema(
  {
    testDate:        { type: String, trim: true },
    total:           { type: String, trim: true },
    math:            { type: String, trim: true },
    ebrw:            { type: String, trim: true },
    percentile:      { type: String, trim: true },
    composite:       { type: String, trim: true },
    english:         { type: String, trim: true },
    reading:         { type: String, trim: true },
    science:         { type: String, trim: true },
    writing:         { type: String, trim: true },
    subject:         { type: String, trim: true },
    score:           { type: String, trim: true },
    level:           { type: String, trim: true },
    grade:           { type: String, trim: true },
    overall:         { type: String, trim: true },
    listening:       { type: String, trim: true },
    speaking:        { type: String, trim: true },
    literacy:        { type: String, trim: true },
    comprehension:   { type: String, trim: true },
    conversation:    { type: String, trim: true },
    production:      { type: String, trim: true },
    verbal:          { type: String, trim: true },
    quant:           { type: String, trim: true },
    analyticalWrite: { type: String, trim: true },
    dataInsights:    { type: String, trim: true },
  },
  { _id: false }
);

// ── Document file sub-schema ──
const docFileSchema = new mongoose.Schema(
  {
    fileName:     { type: String, trim: true },
    fileKey:      { type: String, trim: true },
    fileUrl:      { type: String, trim: true },
    originalName: { type: String, trim: true },
    uploadedAt:   { type: String, trim: true },
    size:         { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Main schema ──
const masterPreviewSchema = new mongoose.Schema(
  {
    // ── Link to Account ──
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      unique: true,   // one application per user
      index: true,
    },

    // ── Application status ──
    applicationStatus: {
      type: String,
      enum: ["draft", "submitted", "under_review", "accepted", "rejected"],
      default: "draft",
    },
    submittedAt:   { type: Date,    default: null },
    agreedToTerms: { type: Boolean, default: false },

    // ══════════════════════════════════════════
    // STEP 1 – Personal Information
    // ══════════════════════════════════════════
    personal: {
      fullName:       { type: String, trim: true, default: "" },
      dateOfBirth:    { type: Date,   default: null },
      gender:         { type: String, trim: true, default: "" },
      nationality:    { type: String, trim: true, default: "" },
      passportNumber: { type: String, trim: true, default: "" },
      maritalStatus:  { type: String, trim: true, default: "" },
    },

    // ══════════════════════════════════════════
    // STEP 2 – Contact Details
    // ══════════════════════════════════════════
    contact: {
      emailAddress:   { type: String, trim: true, default: "" },
      mobileNumber:   { type: String, trim: true, default: "" },
      alternatePhone: { type: String, trim: true, default: "" },
      addressLine1:   { type: String, trim: true, default: "" },
      addressLine2:   { type: String, trim: true, default: "" },
      city:           { type: String, trim: true, default: "" },
      state:          { type: String, trim: true, default: "" },
      postalCode:     { type: String, trim: true, default: "" },
      country:        { type: String, trim: true, default: "" },
    },

    // ══════════════════════════════════════════
    // STEP 3 – Course Selection
    // ══════════════════════════════════════════
    course: {
      preferredCourse: { type: String, trim: true, default: "" },
      specialization:  { type: String, trim: true, default: "" },
      intake:          { type: String, trim: true, default: "" },
      modeOfStudy:     { type: String, trim: true, default: "" },
      universityName:  { type: String, trim: true, default: "" },
      universityId:    { type: String, trim: true, default: "" },
      duration:        { type: String, trim: true, default: "" },
      level:           { type: String, trim: true, default: "" },
      majorArea:       { type: String, trim: true, default: "" },
    },

    // ══════════════════════════════════════════
    // STEP 4 – Academic History
    // ══════════════════════════════════════════
    academics: [academicEntrySchema],

    // ══════════════════════════════════════════
    // STEP 5 – Test Scores
    // ══════════════════════════════════════════
    tests: {
      sat:        [testAttemptSchema],
      act:        [testAttemptSchema],
      satSubject: [testAttemptSchema],
      ap:         [testAttemptSchema],
      ib:         [testAttemptSchema],
      cambridge:  [testAttemptSchema],
      toefl:      [testAttemptSchema],
      ielts:      [testAttemptSchema],
      pte:        [testAttemptSchema],
      duolingo:   [testAttemptSchema],
      gre:        [testAttemptSchema],
      gmat:       [testAttemptSchema],
      // future planned dates
      sat_futureDates:        [{ type: String }],
      act_futureDates:        [{ type: String }],
      satSubject_futureDates: [{ type: String }],
      ap_futureDates:         [{ type: String }],
      ib_futureDates:         [{ type: String }],
      cambridge_futureDates:  [{ type: String }],
      toefl_futureDates:      [{ type: String }],
      ielts_futureDates:      [{ type: String }],
      pte_futureDates:        [{ type: String }],
      duolingo_futureDates:   [{ type: String }],
      gre_futureDates:        [{ type: String }],
      gmat_futureDates:       [{ type: String }],
    },

    // ══════════════════════════════════════════
    // STEP 6 – Uploaded Documents
    // ══════════════════════════════════════════
    documents: {
      passport:                docFileSchema,
      photo:                   docFileSchema,
      cert10th:                docFileSchema,
      cert12th:                docFileSchema,
      bachelorTranscript:      docFileSchema,
      bachelorDegree:          docFileSchema,
      provisionalCertificate:  docFileSchema,
      consolidatedMarksheet:   docFileSchema,
      resumeCv:                docFileSchema,
      statementOfPurpose:      docFileSchema,
      lettersOfRecommendation: docFileSchema,
      englishCertificate:      docFileSchema,
      testScores:              docFileSchema,
      workExperience:          docFileSchema,
    },
  },
  { timestamps: true }
);

export default mongoose.model("MasterPreview", masterPreviewSchema);