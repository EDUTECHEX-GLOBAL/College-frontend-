import mongoose from "mongoose";

const firstContactsSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    collegeId: {
      type: String,
      required: true,
    },
    
    // Text Message Permission
    textMessagePermission: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    
    // Twitter/X Handle
    hasTwitter: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    twitterHandle: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty if hasTwitter is "no"
          // Twitter handle validation: 1-15 chars, alphanumeric, underscores
          return /^[A-Za-z0-9_]{1,15}$/.test(v);
        },
        message: "Twitter handle must be 1-15 characters containing only letters, numbers, and underscores"
      }
    },
    
    // Snapchat Username
    hasSnapchat: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    snapchatUsername: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty if hasSnapchat is "no"
          // Snapchat username validation: 3-15 chars, letters, numbers, periods, underscores
          return /^[A-Za-z0-9._]{3,15}$/.test(v);
        },
        message: "Snapchat username must be 3-15 characters containing only letters, numbers, periods, and underscores"
      }
    },
    
    // Instagram Username
    hasInstagram: {
      type: String,
      enum: ["", "yes", "no"],
      default: "",
    },
    instagramUsername: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty if hasInstagram is "no"
          // Instagram username validation: 1-30 chars, letters, numbers, periods, underscores
          return /^[A-Za-z0-9._]{1,30}$/.test(v);
        },
        message: "Instagram username must be 1-30 characters containing only letters, numbers, periods, and underscores"
      }
    },
    
    // Progress Tracking
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Completion Status
    isComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one contacts record per student per college
firstContactsSchema.index({ studentId: 1, collegeId: 1 }, { unique: true });

// Calculate progress before saving
firstContactsSchema.pre("save", function (next) {
  let completedQuestions = 0;
  const totalQuestions = 4; // textMessagePermission, hasTwitter, hasSnapchat, hasInstagram

  // 1. Text Message Permission
  if (this.textMessagePermission && this.textMessagePermission !== "") {
    completedQuestions++;
  }

  // 2. Twitter Question
  if (this.hasTwitter && this.hasTwitter !== "") {
    if (this.hasTwitter === "yes") {
      // Only count as completed if handle is provided
      if (this.twitterHandle && this.twitterHandle.trim() !== "") {
        completedQuestions++;
      }
    } else {
      // "no" is also a valid complete answer
      completedQuestions++;
    }
  }

  // 3. Snapchat Question
  if (this.hasSnapchat && this.hasSnapchat !== "") {
    if (this.hasSnapchat === "yes") {
      if (this.snapchatUsername && this.snapchatUsername.trim() !== "") {
        completedQuestions++;
      }
    } else {
      completedQuestions++;
    }
  }

  // 4. Instagram Question
  if (this.hasInstagram && this.hasInstagram !== "") {
    if (this.hasInstagram === "yes") {
      if (this.instagramUsername && this.instagramUsername.trim() !== "") {
        completedQuestions++;
      }
    } else {
      completedQuestions++;
    }
  }

  // Calculate final progress
  this.progress = Math.round((completedQuestions / totalQuestions) * 100);
  this.isComplete = this.progress === 100;

  console.log(`📊 Contacts Progress: ${completedQuestions}/${totalQuestions} = ${this.progress}%`);
  
  next();
});

const FirstContacts = mongoose.model("FirstContacts", firstContactsSchema);
export default FirstContacts;