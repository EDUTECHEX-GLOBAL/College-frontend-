// models/familyModel.js
import mongoose from "mongoose";

const familySchema = new mongoose.Schema(
  {
    // Reference to the student
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransferStudent",
      required: true,
    },

    // ---------- Household Information ----------
    household: {
      parentsMaritalStatus: {
        type: String,
        enum: [null, '', 'married', 'divorced', 'separated', 'widowed', 'never-married', 'unmarried-living-together'],
        default: null,
      },
      permanentHome: {
        type: String,
        enum: [null, '', 'both-parents', 'parent1', 'parent2', 'legal-guardian', 'other-relative', 'foster-care', 'other'],
        default: null,
      },
      hasChildren: {
        type: String,
        enum: [null, '', 'yes', 'no'],
        default: null,
      },
      numberOfChildren: {
        type: Number,
        default: 0,
        min: 0,
        max: 20,
      },
    },

    // ---------- Parent 1 Information ----------
    parent1: {
      isDeceased: {
        type: Boolean,
        default: false,
      },
      prefix: String,
      firstName: String,
      middleName: String,
      lastName: String,
      suffix: String,
      relationshipToYou: {
        type: String,
        enum: ['', 'mother', 'father', 'stepmother', 'stepfather', 'legal-guardian', 'grandparent', 'other'],
        default: '',
      },
      email: String,
      phoneCountryCode: {
        type: String,
        default: '+1',
      },
      phoneNumber: String,
      address: {
        sameAsStudent: {
          type: Boolean,
          default: false,
        },
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
      occupation: String,
      employer: String,
      jobTitle: String,
      highestEducationLevel: {
        type: String,
        enum: ['', 'no-high-school', 'high-school', 'some-college', 'associate', 'bachelor', 'master', 'doctorate'],
        default: '',
      },
      collegeAttended: String,
      collegeCEEBCode: String,
      degreeEarned: String,
      graduationYear: String,
    },

    // ---------- Parent 2 Information ----------
    parent2: {
      hasParent2: {
        type: String,
        enum: [null, '', 'yes', 'no'],
        default: null,
      },
      isDeceased: {
        type: Boolean,
        default: false,
      },
      prefix: String,
      firstName: String,
      middleName: String,
      lastName: String,
      suffix: String,
      relationshipToYou: {
        type: String,
        enum: ['', 'mother', 'father', 'stepmother', 'stepfather', 'legal-guardian', 'grandparent', 'other'],
        default: '',
      },
      email: String,
      phoneCountryCode: {
        type: String,
        default: '+1',
      },
      phoneNumber: String,
      address: {
        sameAsStudent: {
          type: Boolean,
          default: false,
        },
        sameAsParent1: {
          type: Boolean,
          default: false,
        },
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
      occupation: String,
      employer: String,
      jobTitle: String,
      highestEducationLevel: {
        type: String,
        enum: ['', 'no-high-school', 'high-school', 'some-college', 'associate', 'bachelor', 'master', 'doctorate'],
        default: '',
      },
      collegeAttended: String,
      collegeCEEBCode: String,
      degreeEarned: String,
      graduationYear: String,
    },

    // ---------- Siblings Information ----------
    siblings: {
      hasSiblings: {
        type: String,
        enum: [null, '', 'yes', 'no'],
        default: null,
      },
      numberOfSiblings: {
        type: Number,
        default: 0,
        min: 0,
        max: 20,
      },
      siblingsList: [
        {
          firstName: String,
          lastName: String,
          relationship: {
            type: String,
            enum: ['', 'brother', 'sister', 'stepbrother', 'stepsister', 'half-brother', 'half-sister'],
            default: '',
          },
          age: String,
          collegeAttended: String,
          degreeEarned: String,
        },
      ],
    },

    // ---------- Family Completion Tracking ----------
    familyCompletion: {
      household: {
        type: Boolean,
        default: false,
      },
      parent1: {
        type: Boolean,
        default: false,
      },
      parent2: {
        type: Boolean,
        default: false,
      },
      sibling: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    collection: "family_records",
    strict: false,
  }
);

// Index for faster queries
familySchema.index({ studentId: 1 }, { unique: true });

const Family = mongoose.model("Family", familySchema);
export default Family;
