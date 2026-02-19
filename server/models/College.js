// models/College.js
import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema(
  {
    collegeCode: {
      type: String,
      unique: true,
      required: true,
    },
    collegeName: {
      type: String,
      required: true,
    },
    alias: {
      type: String,
      default: ""
    },
    universityCode: {
      type: String,
      required: true,
    },
    universityName: {
      type: String,
      default: ""
    },
    educationLevels: {
      type: [String],
      default: ["Undergraduate"],
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    importedByAdmin: {
      type: Boolean,
      default: false,
    },
    location: {
      address: String,
      city: String,
      state: String,
      zip: String,
      county: String,
      latitude: Number,
      longitude: Number
    },
    contact: {
      phone: String,
      website: String,
      adminUrl: String,
      faidUrl: String,
      applUrl: String,
      vetUrl: String,
      athUrl: String,
      disaUrl: String
    },
    metadata: {
      unitId: Number,
      alias: String,
      chancellor: String,
      chancellorTitle: String,
      fips: Number,
      obereg: Number,
      ein: Number,
      ueis: String,
      opeid: Number,
      opeflag: Number,
      sector: Number,
      iclevel: Number,
      control: Number,
      hloffer: Number,
      ugoffer: Number,
      groffer: Number,
      hdegree: Number,
      deggrant: Number,
      hbcu: Number,
      hospital: Number,
      medical: Number,
      tribal: Number,
      locale: Number,
      openpubl: Number,
      act: String,
      newid: Number,
      deathyr: Number,
      closedat: String,
      cyactive: Number,
      postsec: Number,
      instcat: Number,
      carnegie: Number,
      landgrant: Number,
      instsize: Number,
      cbsa: Number,
      cbsatype: Number,
      csa: Number,
      countycd: Number,
      cngdstcd: Number
    }
  },
  { timestamps: true }
);

const College = mongoose.model("College", collegeSchema);

export default College;