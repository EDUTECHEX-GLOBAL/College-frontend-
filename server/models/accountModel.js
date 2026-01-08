import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const accountSchema = new mongoose.Schema(
  {
    // =============================
    // 🧾 Basic Account Info
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
    // 👤 Enhanced Personal Info
    // =============================
    middleName: { type: String, trim: true },
    suffix: { type: String, trim: true },

    // =============================
    // ☎️ Contact Details
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
    // 🌈 Demographics
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
    // 🌐 Language
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
    // 🗺️ Geography & Citizenship
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
    // 💰 Fee Waiver
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
    // 📊 Profile Completion
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
    // 🧭 Application Progress
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
  },
  {
    timestamps: true,
  }
);

// =============================
// 🔒 Password Hash Middleware
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
// 🔑 Compare Password
// =============================
accountSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// =============================
// 🧾 Public Profile
// =============================
accountSchema.methods.getPublicProfile = function () {
  const accountObj = this.toObject();
  delete accountObj.password;
  return accountObj;
};

const Account = mongoose.model("Account", accountSchema);
export default Account;
