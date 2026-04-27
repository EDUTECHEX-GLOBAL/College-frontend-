// server/models/masterpersonalmodel.js

import mongoose from "mongoose";

const masterPersonalSchema = new mongoose.Schema(
  {
    // ── userId links this document to the logged-in user ──
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Account",
      required: true,
      index:    true,
    },

    fullName: {
      type:      String,
      required:  [true, "Full name is required"],
      trim:      true,
      minlength: 2,
    },
    dateOfBirth: {
      type:     Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type:     String,
      enum:     ["Male", "Female", "Other", "Prefer not to say"],
      required: true,
    },
    nationality: {
      type:     String,
      required: true,
      trim:     true,
    },
    passportNumber: {
      type:      String,
      required:  true,
      minlength: 6,
      // ── REMOVED unique:true ──
      // unique:true caused conflicts when multiple users share
      // a passport number, and breaks upsert when scoped by userId.
      // Uniqueness is now enforced by the compound index below.
    },
    maritalStatus: {
      type:     String,
      enum:     ["Single", "Married", "Divorced", "Widowed", "Separated"],
      required: true,
    },

    // ── Application lifecycle fields ──
    applicationStatus: {
      type:    String,
      enum:    ["draft", "submitted", "under_review", "accepted", "rejected"],
      default: "draft",
    },
    submittedAt:   { type: Date,    default: null },
    agreedToTerms: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Compound index: one passport number per user ──
// This replaces the single-field unique:true on passportNumber.
masterPersonalSchema.index({ userId: 1, passportNumber: 1 }, { unique: true });

export default mongoose.model("MasterPersonal", masterPersonalSchema);