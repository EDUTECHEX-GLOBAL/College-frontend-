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
      return !!(
        data.addressLine1 &&
        data.city &&
        data.state &&
        data.zipCode &&
        data.country
      );

    case 'demographics':
  return true;  // ✅ Always complete - optional section


    case 'language':
      return (
        Array.isArray(data.languages) &&
        data.languages.length > 0 &&
        data.languages.every(
          l => l.language && l.language.trim() !== ''
        )
      );

    case 'geography':
      return !!data.citizenshipStatus;

    default:
      return false;
  }
};


// Calculate overall profile progress
const calculateProfileProgress = (profileCompletion) => {
  if (!profileCompletion) return 0;

  const VALID_KEYS = [
    'personalInfo',
    'contactDetails',
    'address',
    'demographics',
    'language',
    'geography'
  ];

  const completedCount = VALID_KEYS.filter(
    key => profileCompletion[key] === true
  ).length;

  return Math.round((completedCount / VALID_KEYS.length) * 100);
};


// ================================
// 🔐 FORGOT PASSWORD - First Year Students
// ================================

// 1. REQUEST OTP for password reset
export const forgotPasswordRequestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("🔄 Forgot password OTP request for:", email);

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const account = await Account.findOne({ 
      email: email.toLowerCase() 
    });

    // Don't reveal if account exists (security)
    if (!account) {
      return res.status(200).json({ 
        success: true, 
        message: "If an account exists, an OTP has been sent to your email." 
      });
    }

    // Delete old password reset OTPs only
    await Otp.deleteMany({ 
      email: email.toLowerCase(),
      purpose: "password_reset"
    });

    // Generate new OTP (10 min expiry)
    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({
      email: email.toLowerCase(),
      otp: otpCode,
      expiresAt: otpExpiry,
      purpose: "password_reset"
    });

    // Send OTP email
    const htmlContent = `
      <h2>Password Reset Code</h2>
      <p>Hi ${account.firstName || 'there'},</p>
      <p>You requested to reset your password. Your code is:</p>
      <h1 style="letter-spacing: 3px;">${otpCode}</h1>
      <p>This code expires in <b>10 minutes</b>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail(email, "College App - Reset Your Password", htmlContent);

    console.log(`✅ Password reset OTP sent to: ${email}`);
    
    res.status(200).json({ 
      success: true, 
      message: "If an account exists, an OTP has been sent to your email." 
    });

  } catch (error) {
    console.error("❌ Forgot password OTP error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error sending OTP" 
    });
  }
};

// 2. RESET PASSWORD after OTP verification
export const forgotPasswordReset = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    console.log("🔄 Password reset attempt for:", email);

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, password, and confirmPassword are required" 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Passwords do not match" 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 8 characters" 
      });
    }

    const normalizedEmail = email.toLowerCase();
    const account = await Account.findOne({ email: normalizedEmail });

    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: "Account not found" 
      });
    }

    // Generate & return JWT (auto-login)
    const token = generateToken(account._id, account.email, account.studentType);

    // Update password
    account.password = password;
    await account.save();

    // Clean up password reset OTPs
    await Otp.deleteMany({ 
      email: normalizedEmail, 
      purpose: "password_reset" 
    });

    console.log(`✅ Password reset successful for: ${email}`);

    const accountResponse = account.toObject();
    delete accountResponse.password;

    res.status(200).json({ 
      success: true, 
      message: "Password reset successful. You are now logged in.",
      token,
      account: accountResponse 
    });

  } catch (error) {
    console.error("❌ Password reset error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error resetting password" 
    });
  }
};

// ================================
// 🟢 Register (First Year Student)
// ================================
// ================================
// 🟢 Register (First Year Student) - UPDATED
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

    // Validation (EXISTING CODE - NO CHANGES)
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

    // Create unverified account with admin approval fields
    const newAccount = await Account.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      agreeToTerms,
      studentType: studentType || "first-year",
      isVerified: false,
      status: 'pending', // 🔥 Set initial status as pending
      isApprovedByAdmin: false, // 🔥 Initially not approved
      role: 'student', // 🔥 Default role as student
      ...otherData,
    });

    // Generate OTP valid for 10 minutes (EXISTING CODE - NO CHANGES)
    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({
      email: email.toLowerCase(),
      otp: otpCode,
      expiresAt: otpExpiry,
    });

    // Send OTP email (EXISTING CODE - NO CHANGES)
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
// 🔐 Verify OTP (UPDATED - handles password reset OTPs)
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

    // Handle password reset OTPs separately
    if (otpRecord.purpose === "password_reset") {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(200).json({
        success: true,
        message: "Password reset OTP verified successfully. You can now reset your password.",
        otpValid: true
      });
    }

    // Original registration verification flow
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
// ================================
// 🔑 Login (UPDATED with admin approval check)
// ================================
export const loginAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for email:", email);

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide email and password" 
      });
    }

    const account = await Account.findOne({ email: email.toLowerCase() });
    if (!account) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    if (!account.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: "Please verify your email before logging in." 
      });
    }

    // 🔥 NEW: Check if admin has approved the user
    if (!account.isApprovedByAdmin || account.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: "Your account is pending admin approval. Please wait for approval to access the dashboard.",
        requiresAdminApproval: true,
        isVerified: account.isVerified,
        isApprovedByAdmin: account.isApprovedByAdmin,
        status: account.status
      });
    }

    // Check if account is suspended
    if (account.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
        isSuspended: true,
        status: account.status
      });
    }

    // Check if account is inactive
    if (account.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support to reactivate.",
        isInactive: true,
        status: account.status
      });
    }

    // Update last login timestamp
    account.lastLogin = new Date();
    await account.save();

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
// ================================
// 🔍 Verify Token (JWT validation) - UPDATED
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

    // Fetch user to get current status
    const account = await Account.findById(decoded.userId).select('status isApprovedByAdmin role');
    
    res.status(200).json({
      success: true,
      message: "Token verified successfully",
      user: {
        ...decoded,
        status: account?.status || 'unknown',
        isApprovedByAdmin: account?.isApprovedByAdmin || false,
        role: account?.role || 'student'
      },
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
    // ================================
    // 1️⃣ AUTH CHECK
    // ================================
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ================================
    // 2️⃣ FETCH EXISTING ACCOUNT (STEP 1)
    // ================================
    const existingAccount = await Account.findById(userId);
    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ================================
    // 3️⃣ UPDATED DATA
    // ================================
    const updatedData = { ...req.body };

    // Security: never update password here
    delete updatedData.password;

    // ================================
    // 4️⃣ CLEANUP / NORMALIZATION
    // ================================
    const enumFields = [
      'gender',
      'legalSex',
      'pronouns',
      'armedForcesStatus',
      'hispanicOrLatino',
      'citizenshipStatus',
      'preferredPhoneType',
      'alternatePhoneType'
    ];

    enumFields.forEach(field => {
      if (updatedData[field] === '') {
        updatedData[field] = undefined;
      }
    });

    if (Array.isArray(updatedData.ethnicity)) {
      updatedData.ethnicity = updatedData.ethnicity.filter(e => e !== '');
    }

  

    if (Array.isArray(updatedData.languages)) {
      updatedData.languages = updatedData.languages.filter(
        lang => lang.language && lang.language.trim() !== ''
      );
    }

    // ================================
    // 5️⃣ MERGE EXISTING + UPDATED DATA (🔥 IMPORTANT)
    // ================================
    const mergedData = {
      ...existingAccount.toObject(),
      ...updatedData
    };

    // ================================
    // 6️⃣ PROFILE COMPLETION VALIDATION
    // ================================
    const completionStatus = {
      personalInfo: validateProfileSection('personal', mergedData),
      contactDetails: validateProfileSection('contact', mergedData),
      address: validateProfileSection('address', mergedData),
      demographics: validateProfileSection('demographics', mergedData),
      language: validateProfileSection('language', mergedData),
      geography: validateProfileSection('geography', mergedData)
    };


    // Update completion status
    updatedData.profileCompletion = completionStatus;

    // Calculate overall profile progress
    const profileProgress = calculateProfileProgress(completionStatus);
    
    // Update application progress
    updatedData.applicationProgress = {
  ...existingAccount.applicationProgress,
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


// ================================
// 🛡️ ADMIN: Get All Users
// ================================
export const getAllUsersForAdmin = async (req, res) => {
  try {
    const users = await Account.find()
      .select("-password -otp");

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error("❌ Admin get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

