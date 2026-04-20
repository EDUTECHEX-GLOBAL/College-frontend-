import mongoose from "mongoose";

const masterContactSchema = new mongoose.Schema(
  {
    emailAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true // ✅ prevents duplicate records
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    alternatePhone: {
      type: String,
    },
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    }
  },
  { timestamps: true }
);

export default mongoose.model("MasterContact", masterContactSchema);