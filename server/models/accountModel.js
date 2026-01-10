import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const accountSchema = new mongoose.Schema(
  {
    // =============================
    // 🧾 Basic Account Info (EXISTING FIELDS - NO CHANGES)
    // =============================
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    studentType: {
      type: String,
      enum: [
        "first-year-2025-2026",
        "start-2027",
        "start-2028-beyond",
        "first-year",
        "transfer",
        "other",
      ],
      default: "first-year-2025-2026",
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    useDifferentFirstName: {
      type: String,
      default: "no",
    },
    preferredFirstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    birthDate: { type: String },
    phone: { type: String },
    countryCode: { type: String, default: "+1" },
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
    europeanUnionResident: { type: String },
    receiveComms: { type: String, default: "no" },
    agreeToTerms: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },

    // =============================
    // 👤 Enhanced Personal Info (EXISTING FIELDS - NO CHANGES)
    // =============================
    middleName: { type: String, trim: true },
    suffix: { type: String, trim: true },

    // =============================
    // ☎️ Contact Details (EXISTING FIELDS - NO CHANGES)
    // =============================
    preferredPhoneType: {
      type: String,
      enum: ["home", "mobile", "work", "other"],
      default: "mobile",
    },
    alternatePhone: { type: String },
    alternatePhoneType: {
      type: String,
      enum: ["home", "mobile", "work", "other", "none"],
      default: "none",
    },

    // =============================
    // 🌈 Demographics (EXISTING FIELDS - NO CHANGES)
    // =============================
    gender: {
      type: String,
      enum: ["", "female", "male", "nonbinary", "prefer-not-to-say", "other"],
      default: "",
    },
    additionalGender: { type: String, trim: true },
    pronouns: {
      type: String,
      enum: ["", "he-him", "she-her", "they-them", "other"],
      default: "",
    },
    additionalPronouns: { type: String, trim: true },
    armedForcesStatus: {
      type: String,
      enum: ["", "none", "currently-serving", "previously-served", "current-dependent"],
      default: "",
    },
    hispanicOrLatino: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    ethnicity: [
      {
        type: String,
        enum: [
          "american-indian-alaska-native",
          "asian",
          "black-african-american",
          "native-hawaiian-pacific-islander",
          "white",
        ],
      },
    ],

    // =============================
    // 🌐 Language (EXISTING FIELDS - NO CHANGES)
    // =============================
    languagesProficient: { type: Number, default: 1 },
    languages: [
      {
        language: { type: String, trim: true },
        proficiency: {
          firstLanguage: { type: Boolean, default: false },
          speak: { type: Boolean, default: true },
          read: { type: Boolean, default: true },
          write: { type: Boolean, default: true },
          spokenAtHome: { type: Boolean, default: false },
        },
      },
    ],

    // =============================
    // 🗺️ Geography & Citizenship (EXISTING FIELDS - NO CHANGES)
    // =============================
    birthCountry: { type: String, trim: true },
    cityOfBirth: { type: String, trim: true },
    yearsInUS: { type: Number },
    citizenshipStatus: {
      type: String,
      enum: [
        "",
        "us-citizen-national",
        "us-dual-citizen",
        "us-permanent-resident",
        "citizen-non-us-country",
        "us-resident",
      ],
      default: "",
    },

    // =============================
    // 💰 Fee Waiver (EXISTING FIELDS - NO CHANGES)
    // =============================
    feeWaiverEligible: { type: Boolean, default: false },
    feeWaiverCriteria: [
      {
        type: String,
        enum: [
          "free-reduced-lunch",
          "sat-act-fee-waiver",
          "income-eligibility",
          "public-assistance",
          "low-income-program",
          "subsidized-housing",
          "ward-or-orphan",
          "pell-grant",
          "supporting-statement",
        ],
      },
    ],
    ustriveMentor: { type: Boolean, default: false },

    // =============================
    // 📊 Profile Completion (EXISTING FIELDS - NO CHANGES)
    // =============================
    profileCompletion: {
      personalInfo: { type: Boolean, default: false },
      contactDetails: { type: Boolean, default: false },
      address: { type: Boolean, default: false },
      demographics: { type: Boolean, default: false },
      language: { type: Boolean, default: false },
      geography: { type: Boolean, default: false },
    },

    // =============================
    // 🧭 Application Progress (EXISTING FIELDS - NO CHANGES)
    // =============================
    applicationProgress: {
      profile: { type: Number, default: 0 },
      family: { type: Number, default: 0 },
      education: { type: Number, default: 0 },
      testing: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      writing: { type: Number, default: 0 },
      residency: { type: Number, default: 0 },
    },

    // =============================
    // 🛡️ NEW: ADMIN APPROVAL FIELDS (ADD THESE)
    // =============================
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive', 'suspended'],
      default: 'pending'
    },
    
    role: {
      type: String,
      enum: ['student', 'admin', 'moderator'],
      default: 'student'
    },
    
    isApprovedByAdmin: {
      type: Boolean,
      default: false
    },
    
    avatar: {
      type: String,
      default: function() {
        return this.firstName?.charAt(0).toUpperCase() || 'U';
      }
    },
    
    joinDate: {
      type: Date,
      default: Date.now
    },
    
    // =============================
    // 📝 NEW: ADMIN NOTES (ADD THIS)
    // =============================
    adminNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
  }
);

// =============================
// 🔒 Password Hash Middleware (EXISTING - NO CHANGES)
// =============================
accountSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// =============================
// 🔑 Compare Password (EXISTING - NO CHANGES)
// =============================
accountSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// =============================
// 🧾 Public Profile (EXISTING - NO CHANGES)
// =============================
accountSchema.methods.getPublicProfile = function () {
  const accountObj = this.toObject();
  delete accountObj.password;
  return accountObj;
};

// =============================
// 📊 NEW: Virtual for formatted join date
// =============================
accountSchema.virtual('formattedJoinDate').get(function() {
  if (!this.joinDate) return 'Not available';
  return this.joinDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
});

// =============================
// 🔄 NEW: Virtual for formatted last login
// =============================
accountSchema.virtual('formattedLastLogin').get(function() {
  if (!this.lastLogin) return 'Never logged in';
  
  const now = new Date();
  const diffMs = now - this.lastLogin;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  
  return this.lastLogin.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
});

const Account = mongoose.model("Account", accountSchema);
export default Account;