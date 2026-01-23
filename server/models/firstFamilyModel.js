import mongoose from "mongoose";

const parentAddressSchema = new mongoose.Schema({
  street1: { type: String, default: "" },
  street2: { type: String, default: "" },
  street3: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  country: { type: String, default: "" },
  zip: { type: String, default: "" }
});

const firstFamilySchema = new mongoose.Schema(
  {
    // ✅ FIXED: Changed from userId to studentId
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    
    // Reference to the college
    collegeId: {
      type: String,
      required: true,
    },

    // Parent/Guardian Address Selection
    parentGuardianAddress: {
      type: String,
      enum: ["", "parent1", "parent2", "legal-guardian"],
      default: "",
    },

    // Parent 1 Address
    parent1Address: {
      type: parentAddressSchema,
      default: () => ({})
    },

    // Parent 2 Address
    parent2Address: {
      type: parentAddressSchema,
      default: () => ({})
    },

    // Parent 2 Address Toggle
    showParent2Address: {
      type: Boolean,
      default: false,
    },

    // KU Graduates
    kuGraduates: [{
      type: String,
      enum: [
        "Grandparent/Step-Grandparent",
        "Great-Grandparent/Step-Great-Grandparent", 
        "Parent/Step-Parent",
        "Sibling/Step-Sibling"
      ]
    }],

    // KU Employee Dependent
    kuEmployeeDependent: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },

    kuEmployeeName: {
      type: String,
      default: "",
    },

    kuEmployeeLocation: {
      type: String,
      enum: ["", "KU Med Center - Kansas City", "KU Lawrence Campus", "KU Edwards Campus", "Other KU Location"],
      default: "",
    },

    // Military Dependent
    militaryDependent: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },

    militaryStatus: {
      type: String,
      enum: ["", "Active Duty", "Veteran", "Reserve", "National Guard", "Retired"],
      default: "",
    },

    vaBenefitsIntent: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },

    // Progress Tracking
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Last updated timestamp
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
   timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to ensure one family record per student per college
firstFamilySchema.index({ studentId: 1, collegeId: 1 }, { unique: true });

// ✅ FIXED: Correct progress calculation
firstFamilySchema.pre("save", function (next) {
  let completedFields = 0;
  let totalFields = 4; // Base required fields
  

  // Base required fields
  if (this.parentGuardianAddress && this.parentGuardianAddress !== "") completedFields++;
  if (this.kuGraduates && this.kuGraduates.length > 0) completedFields++;
  if (this.kuEmployeeDependent && this.kuEmployeeDependent !== "") completedFields++;
  if (this.militaryDependent && this.militaryDependent !== "") completedFields++;

  // Conditional fields for KU Employee
  if (this.kuEmployeeDependent === 'yes') {
    totalFields += 2; // Add 2 more required fields
    if (this.kuEmployeeName && this.kuEmployeeName !== "") completedFields++;
    if (this.kuEmployeeLocation && this.kuEmployeeLocation !== "") completedFields++;
  }

  // Conditional fields for Military Dependent
  if (this.militaryDependent === 'yes') {
    totalFields += 2; // Add 2 more required fields
    if (this.militaryStatus && this.militaryStatus !== "") completedFields++;
    if (this.vaBenefitsIntent && this.vaBenefitsIntent !== "") completedFields++;
  }

  this.progress = Math.round((completedFields / totalFields) * 100);
  this.lastUpdated = new Date();
  next();
});
firstFamilySchema.virtual("student", {
  ref: "Account",
  localField: "studentId",
  foreignField: "_id",
  justOne: true,
});
const FirstFamily = mongoose.model("FirstFamily", firstFamilySchema);
export default FirstFamily;