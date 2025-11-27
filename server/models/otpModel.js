import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    otp: { type: String, required: true }, // stored in plain text (debug mode)
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// ✅ Direct comparison in debug mode (no hashing)
otpSchema.methods.compareOTP = async function (enteredOTP) {
  return this.otp === enteredOTP.toString();
};

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
