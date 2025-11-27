// server/controllers/accountController.js
import Account from "../models/accountModel.js";
import Otp from "../models/otpModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

// Helper to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate JWT Token
const generateToken = (userId, email, studentType) => {
  return jwt.sign(
    { userId, email, studentType },
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
    { expiresIn: "7d" }
  );
};

// Enhanced Profile Validation Helper (Fixed)
const validateProfileSection = (section, data) => {
  switch (section) {
    case 'personal':
      return !!(data.firstName && data.lastName && data.birthDate);
    
    case 'contact':
      return !!(data.phone && data.preferredPhoneType);
    
    case 'address':
      return !!(data.addressLine1 && data.city && data.state && data.zipCode && data.country);
    
    case 'demographics':
      return !!(data.legalSex && data.legalSex !== '' && data.hispanicOrLatino && data.hispanicOrLatino !== '');
    
    case 'language':
      return !!(data.languagesProficient && 
                data.languages && 
                data.languages.length > 0 && 
                data.languages[0].language &&
                data.languages[0].language.trim() !== '');
    
    case 'geography':
      return !!(data.citizenshipStatus && data.citizenshipStatus !== '');
    
    case 'feewaiver':
      return true; // Fee waiver is optional
    
    default:
      return false;
  }
};

// Calculate overall profile progress
const calculateProfileProgress = (profileCompletion) => {
  if (!profileCompletion) return 0;
  
  const completionFields = Object.values(profileCompletion);
  const completedCount = completionFields.filter(Boolean).length;
  const totalSections = completionFields.length;
  
  return Math.round((completedCount / totalSections) * 100);
};

// ================================
// 🟢 Register (First Year Student)
// ================================
export const createFirstYearAccount = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      agreeToTerms,
      studentType,
      ...otherData
    } = req.body;

    console.log("📥 Registration attempt for email:", email);

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields (email, password, firstName, lastName)",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (!agreeToTerms) {
      return res.status(400).json({ success: false, message: "You must agree to the terms of use" });
    }

    const existingUser = await Account.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    // Create unverified account
    const newAccount = await Account.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      agreeToTerms,
      studentType: studentType || "first-year",
      isVerified: false,
      ...otherData,
    });

    // Generate OTP valid for 10 minutes
    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({
      email: email.toLowerCase(),
      otp: otpCode,
      expiresAt: otpExpiry,
    });

    // Send OTP email
    const htmlContent = `
      <h2>College App Verification Code</h2>
      <p>Hi ${firstName},</p>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 3px;">${otpCode}</h1>
      <p>This code will expire in <b>10 minutes</b>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail(email, "College App - Verify Your Email", htmlContent);

    console.log(`📧 Email sent successfully to: ${email}`);
    console.log(`🟩 Generated OTP for ${email}: ${otpCode}`);

    const accountResponse = newAccount.toObject();
    delete accountResponse.password;

    res.status(201).json({
      success: true,
      message: "Account created successfully. Please check your email for the OTP.",
      requireOtpVerification: true, // ✅ signal OTP step
      account: accountResponse,
    });
  } catch (error) {
    console.error("❌ Error creating account:", error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    res.status(500).json({
      success: false,
      message: "Server error while creating account",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 🔐 Verify OTP
// ================================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("📩 OTP Verification Request:", req.body);

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const otpRecord = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not found or expired" });
    }

    const now = new Date();
    if (otpRecord.expiresAt.getTime() <= now.getTime()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    const isMatch = await otpRecord.compareOTP(otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Mark verified
    await Account.updateOne({ email: normalizedEmail }, { isVerified: true });
    await Otp.deleteOne({ _id: otpRecord._id });

    console.log("✅ OTP verified successfully for", normalizedEmail);
    res.status(200).json({
      success: true,
      message: "Account verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};

// ================================
// 🔑 Login
// ================================
export const loginAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for email:", email);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const account = await Account.findOne({ email: email.toLowerCase() });
    if (!account) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!account.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email before logging in." });
    }

    const token = generateToken(account._id, account.email, account.studentType);
    const accountResponse = account.toObject();
    delete accountResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      account: accountResponse,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 🔍 Verify Token (JWT validation)
// ================================
export const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-in-production"
    );

    res.status(200).json({
      success: true,
      message: "Token verified successfully",
      user: decoded,
    });
  } catch (error) {
    console.error("❌ Token verification error:", error);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// ================================
// 👤 Get Profile
// ================================
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.body.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID missing in request" });
    }

    const account = await Account.findById(userId).select("-password");
    if (!account) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, account });
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Server error fetching profile" });
  }
};

// ================================
// ✏️ Update Profile (Fixed - Enhanced Progress Tracking)
// ================================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updatedData = { ...req.body };
    
    // Remove password from update data for security
    delete updatedData.password;
    
    // CLEAN UP: Convert empty strings to undefined for enum fields
    const enumFields = [
      'gender', 'legalSex', 'pronouns', 'armedForcesStatus', 
      'hispanicOrLatino', 'citizenshipStatus', 'preferredPhoneType',
      'alternatePhoneType'
    ];

    enumFields.forEach(field => {
      if (updatedData[field] === '') {
        updatedData[field] = undefined;
      }
    });

    // CLEAN UP: Remove empty strings from array fields
    if (updatedData.ethnicity && Array.isArray(updatedData.ethnicity)) {
      updatedData.ethnicity = updatedData.ethnicity.filter(item => item !== '');
    }
    if (updatedData.feeWaiverCriteria && Array.isArray(updatedData.feeWaiverCriteria)) {
      updatedData.feeWaiverCriteria = updatedData.feeWaiverCriteria.filter(item => item !== '');
    }

    // CLEAN UP: Remove empty language entries
    if (updatedData.languages && Array.isArray(updatedData.languages)) {
      updatedData.languages = updatedData.languages.filter(lang => 
        lang.language && lang.language.trim() !== ''
      );
    }

    // Auto-calculate profile completion based on ALL sections
    const completionStatus = {
      personalInfo: validateProfileSection('personal', updatedData),
      contactDetails: validateProfileSection('contact', updatedData),
      address: validateProfileSection('address', updatedData),
      demographics: validateProfileSection('demographics', updatedData),
      language: validateProfileSection('language', updatedData),
      geography: validateProfileSection('geography', updatedData),
      feeWaiver: validateProfileSection('feewaiver', updatedData)
    };

    // Update completion status
    updatedData.profileCompletion = completionStatus;

    // Calculate overall profile progress
    const profileProgress = calculateProfileProgress(completionStatus);
    
    // Update application progress
    updatedData.applicationProgress = {
      ...updatedData.applicationProgress,
      profile: profileProgress
    };

    console.log('📊 Profile completion calculated:', {
      completionStatus,
      profileProgress,
      completedCount: Object.values(completionStatus).filter(Boolean).length,
      totalSections: Object.values(completionStatus).length
    });

    const updatedAccount = await Account.findByIdAndUpdate(
      userId,
      updatedData,
      { 
        new: true, 
        runValidators: true,
        setDefaultsOnInsert: true 
      }
    ).select("-password");

    if (!updatedAccount) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      account: updatedAccount,
      progress: {
        profile: profileProgress
      },
      profileProgress: profileProgress
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    
    // More specific error handling for validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Validation error: Please check your input data",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error updating profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ================================
// 🔍 Get Detailed Profile (Enhanced)
// ================================
export const getDetailedProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const account = await Account.findById(userId).select("-password");
    if (!account) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Calculate overall profile completion
    const profileProgress = calculateProfileProgress(account.profileCompletion);

    res.status(200).json({
      success: true,
      account,
      profileProgress,
      applicationProgress: account.applicationProgress
    });
  } catch (error) {
    console.error("❌ Error fetching detailed profile:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching profile" 
    });
  }
};