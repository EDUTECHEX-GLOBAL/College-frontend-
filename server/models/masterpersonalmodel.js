import mongoose from "mongoose";

const masterPersonalSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 2,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
      required: true,
    },
    nationality: {
      type: String,
      required: true,
      trim: true,
    },
    passportNumber: {
      type: String,
      required: true,
      minlength: 6,
      unique: true, // 🔥 THIS FIXES DUPLICATES
    },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed", "Separated"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("MasterPersonal", masterPersonalSchema);