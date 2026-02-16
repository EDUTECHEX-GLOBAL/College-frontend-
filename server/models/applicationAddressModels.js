import mongoose from "mongoose";

const { Schema, model } = mongoose;

/* =====================================================
   APPLICATION ADDRESS SCHEMA
   GUS Portal compatible structure
===================================================== */
const applicationAddressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Permanent home address (GUS format)
    careOf: {
      type: String,
      default: "",
      trim: true,
    },

    streetAndHouseNumber: {
      type: String,
      required: [true, "Street and house number is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "India",
    },

    stateProvince: {
      type: String,
      required: [true, "State/Province is required"],
      trim: true,
    },

    postcode: {
      type: String,
      required: [true, "Postcode is required"],
      trim: true,
    },

    // Correspondence address fields
    hasDifferentCorrespondenceAddress: {
      type: Boolean,
      default: false,
    },

    correspondenceCareOf: {
      type: String,
      default: "",
      trim: true,
    },

    correspondenceStreetAndHouseNumber: {
      type: String,
      default: "",
      trim: true,
    },

    correspondenceCity: {
      type: String,
      default: "",
      trim: true,
    },

    correspondenceCountry: {
      type: String,
      default: "India",
      trim: true,
    },

    correspondenceStateProvince: {
      type: String,
      default: "",
      trim: true,
    },

    correspondencePostcode: {
      type: String,
      default: "",
      trim: true,
    },

    // Keep backward compatibility fields (optional)
    currentAddress: {
      type: String,
      trim: true,
    },

    permanentAddress: {
      type: String,
      trim: true,
    },

    // National ID file details
    nationalIdFileName: {
      type: String,
      default: "",
      trim: true,
    },

    nationalIdFileUrl: {
      type: String,
      default: "",
      trim: true,
    },

    nationalIdOriginalName: {
      type: String,
      default: "",
    },

    nationalIdFileSize: {
      type: Number,
      default: 0,
    },

    nationalIdFileType: {
      type: String,
      enum: ["pdf", "jpg", "jpeg", "png", ""],
      default: "",
    },

    nationalIdUploadedAt: {
      type: Date,
      default: null,
    },

    // Completion and verification status
    isCompleted: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* =====================================================
   VIRTUALS
===================================================== */

// Full permanent address
applicationAddressSchema.virtual("fullPermanentAddress").get(function () {
  let address = this.streetAndHouseNumber;
  if (this.careOf) {
    address = `c/o ${this.careOf}, ${address}`;
  }
  return `${address}, ${this.city}, ${this.stateProvince}, ${this.country} - ${this.postcode}`;
});

// Full correspondence address
applicationAddressSchema.virtual("fullCorrespondenceAddress").get(function () {
  if (!this.hasDifferentCorrespondenceAddress) return null;
  
  let address = this.correspondenceStreetAndHouseNumber;
  if (this.correspondenceCareOf) {
    address = `c/o ${this.correspondenceCareOf}, ${address}`;
  }
  return `${address}, ${this.correspondenceCity}, ${this.correspondenceStateProvince}, ${this.correspondenceCountry} - ${this.correspondencePostcode}`;
});

// Check if national ID is uploaded
applicationAddressSchema.virtual("hasNationalId").get(function () {
  return !!this.nationalIdFileName;
});

// Check if address is complete
applicationAddressSchema.virtual("isAddressComplete").get(function () {
  // Check permanent address
  const permanentComplete = !!(
    this.streetAndHouseNumber &&
    this.city &&
    this.country &&
    this.stateProvince &&
    this.postcode
  );

  // Check correspondence address if different
  if (this.hasDifferentCorrespondenceAddress) {
    const correspondenceComplete = !!(
      this.correspondenceStreetAndHouseNumber &&
      this.correspondenceCity &&
      this.correspondenceCountry &&
      this.correspondenceStateProvince &&
      this.correspondencePostcode
    );
    return permanentComplete && correspondenceComplete;
  }

  return permanentComplete;
});

/* =====================================================
   MIDDLEWARE
===================================================== */

applicationAddressSchema.pre("save", function (next) {
  this.lastUpdated = new Date();

  // Auto-generate combined addresses from individual fields
  if (this.streetAndHouseNumber && this.city && this.stateProvince && this.country && this.postcode) {
    let address = this.streetAndHouseNumber;
    if (this.careOf) {
      address = `c/o ${this.careOf}, ${address}`;
    }
    this.currentAddress = `${address}, ${this.city}, ${this.stateProvince}, ${this.country} - ${this.postcode}`;
    this.permanentAddress = this.currentAddress;
  }

  // Check if address is complete and set completion status
  if (this.isAddressComplete && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }

  if (!this.isNew) {
    this.version += 1;
  }

  next();
});

applicationAddressSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastUpdated: new Date() });
  next();
});

/* =====================================================
   INDEXES
===================================================== */

applicationAddressSchema.index({ userId: 1 });
applicationAddressSchema.index({ country: 1 });
applicationAddressSchema.index({ isCompleted: 1 });
applicationAddressSchema.index({ isVerified: 1 });

/* =====================================================
   STATIC METHODS
===================================================== */

applicationAddressSchema.statics.findByUserId = function (userId) {
  return this.findOne({ userId });
};

applicationAddressSchema.statics.findIncomplete = function () {
  return this.find({ isCompleted: false });
};

applicationAddressSchema.statics.findPendingVerification = function () {
  return this.find({ isVerified: false, isCompleted: true });
};

/* =====================================================
   INSTANCE METHODS
===================================================== */

applicationAddressSchema.methods.markAsCompleted = function () {
  if (this.isAddressComplete) {
    this.isCompleted = true;
    this.completedAt = new Date();
    return this.save();
  }
  return Promise.reject(new Error("Address information is incomplete"));
};

applicationAddressSchema.methods.verify = function (adminId) {
  this.isVerified = true;
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  return this.save();
};

const ApplicationAddress = model("ApplicationAddress", applicationAddressSchema);

export default ApplicationAddress;