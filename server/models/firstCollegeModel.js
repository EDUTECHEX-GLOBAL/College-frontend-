import mongoose from "mongoose";

const firstCollegeSchema = new mongoose.Schema(
  {
    // =============================
    // 👤 User Reference
    // =============================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },

    // =============================
    // 🏫 College Identification
    // =============================
    collegeId: {
      type: String, // UNITID from colleges.json
      required: true
    },
    
    // =============================
    // 📋 College Data (Stored for quick access)
    // =============================
    collegeData: {
      UNITID: { type: String, required: true },
      INSTNM: { type: String, required: true }, // Institution Name
      IALIAS: { type: String }, // Institution Alias
      CITY: { type: String },
      STABBR: { type: String }, // State Abbreviation
      ZIP: { type: String },
      ADDR: { type: String }, // Address
      GENTELE: { type: String }, // General Telephone
      WEBADDR: { type: String }, // Website
      ADMINURL: { type: String }, // Admissions URL
      FAIDURL: { type: String }, // Financial Aid URL
      APPLURL: { type: String }, // Application URL
      // Additional fields from your colleges.json
      CHFNM: { type: String }, // President Name
      CHFTITLE: { type: String }, // President Title
      LONGITUD: { type: Number }, // Longitude
      LATITUDE: { type: Number } // Latitude
    },

    // =============================
    // 📅 Application Timeline
    // =============================
    applicationPeriod: {
      type: String,
      enum: ["fall", "spring", "summer"],
      default: "fall"
    },
    
    applicationYear: {
      type: String, // e.g., "2026"
      default: "2026"
    },

    // =============================
    // 🗓️ Deadlines (Like Common App)
    // =============================
    deadlines: {
      fall: {
        type: String, // e.g., "Rolling Admission · July 28, 2026"
        default: ""
      },
      spring: {
        type: String,
        default: ""
      },
      summer: {
        type: String,
        default: ""
      }
    },

    // =============================
    // 📊 Application Status
    // =============================
    status: {
      type: String,
      enum: [
        "researching",     // Just added to list
        "preparing",       // Working on application
        "applied",         // Application submitted
        "accepted",        // Accepted offer
        "rejected",        // Application rejected
        "waitlisted",      // Waitlisted
        "committed"        // Committed to attend
      ],
      default: "researching"
    },

    // =============================
    // 📝 Application Details
    // =============================
    applicationStatus: {
      commonAppSubmitted: { type: Boolean, default: false },
      supplementsSubmitted: { type: Boolean, default: false },
      recommendationsSubmitted: { type: Boolean, default: false },
      testScoresSent: { type: Boolean, default: false },
      transcriptsSent: { type: Boolean, default: false }
    },

    // =============================
    // 💰 Financial Information
    // =============================
    financialAid: {
      fafsaSubmitted: { type: Boolean, default: false },
      cssProfileSubmitted: { type: Boolean, default: false },
      scholarshipsApplied: { type: Boolean, default: false },
      aidAwarded: { type: Boolean, default: false }
    },

    // =============================
    // 🏷️ Tags & Organization
    // =============================
    tags: [{
      type: String,
      enum: ["reach", "target", "safety", "dream", "financial-safety"]
    }],

    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },

    // =============================
    // 📋 Notes & Customization
    // =============================
    notes: {
      type: String,
      default: ""
    },

    customDeadlines: {
      earlyDecision: { type: String, default: "" },
      earlyAction: { type: String, default: "" },
      regularDecision: { type: String, default: "" },
      financialAid: { type: String, default: "" },
      housing: { type: String, default: "" }
    },

    // =============================
    // 🔗 Important Links (Like Common App)
    // =============================
    importantLinks: {
      collegeWebsite: { type: String, default: "" },
      admissionsPortal: { type: String, default: "" },
      financialAidPortal: { type: String, default: "" },
      virtualTour: { type: String, default: "" },
      collegeNavigator: { type: String, default: "" }
    },

    // =============================
    // 👥 Contacts (Like Common App)
    // =============================
    contacts: {
      admissionsEmail: { type: String, default: "" },
      admissionsPhone: { type: String, default: "" },
      financialAidEmail: { type: String, default: "" },
      financialAidPhone: { type: String, default: "" }
    }

  },
  {
    timestamps: true
  }
);

// =============================
// 🎯 Indexes for Performance
// =============================
firstCollegeSchema.index({ userId: 1, collegeId: 1 }, { unique: true });
firstCollegeSchema.index({ userId: 1, status: 1 });
firstCollegeSchema.index({ userId: 1, priority: 1 });
firstCollegeSchema.index({ "collegeData.INSTNM": "text" });

// =============================
// 📊 Virtuals & Methods
// =============================
firstCollegeSchema.virtual('displayName').get(function() {
  return this.collegeData?.INSTNM || 'Unknown College';
});

firstCollegeSchema.virtual('location').get(function() {
  const data = this.collegeData;
  if (!data) return '';
  return `${data.CITY || ''}, ${data.STABBR || ''}${data.ZIP ? ` ${data.ZIP}` : ''}`.trim();
});

// Method to check if application is complete
firstCollegeSchema.methods.isApplicationComplete = function() {
  return this.applicationStatus.commonAppSubmitted && 
         this.applicationStatus.supplementsSubmitted && 
         this.applicationStatus.recommendationsSubmitted;
};

// Method to get next deadline
firstCollegeSchema.methods.getNextDeadline = function() {
  const now = new Date();
  const deadlines = [];
  
  if (this.deadlines.fall) deadlines.push({ type: 'Fall', date: this.deadlines.fall });
  if (this.deadlines.spring) deadlines.push({ type: 'Spring', date: this.deadlines.spring });
  if (this.deadlines.summer) deadlines.push({ type: 'Summer', date: this.deadlines.summer });
  
  return deadlines.length > 0 ? deadlines[0] : null;
};

const FirstCollege = mongoose.model("FirstCollege", firstCollegeSchema);

// FIX: Use named export instead of default export
export { FirstCollege };