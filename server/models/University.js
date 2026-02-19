// models/University.js
import mongoose from "mongoose";

const programSchema = new mongoose.Schema({
  id: String,
  title: String,
  locations: [String],
  studyMode: String,
  level: String,
  actions: [String]
});

const universitySchema = new mongoose.Schema(
  {
    universityCode: {
      type: String,
      unique: true,
      required: true,
    },
    universityName: {
      type: String,
      required: true,
    },
    alias: {
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
      country: String,
      zip: String,
      latitude: Number,
      longitude: Number
    },
    contact: {
      phone: String,
      website: String,
      email: String,
      adminUrl: String,
      faidUrl: String,
      applUrl: String
    },
    metadata: {
      unitId: Number,
      alias: String,
      chancellor: String,
      chancellorTitle: String,
      opeid: String,
      sector: Number,
      iclevel: Number,
      control: Number,
      programs: [programSchema],
      majorAreas: [{
        major_area: String,
        specific_programs: [{
          program_name: String
        }]
      }]
    },
    stats: {
      totalPrograms: {
        type: Number,
        default: 0
      },
      totalCampuses: {
        type: Number,
        default: 1
      }
    }
  },
  { timestamps: true }
);

// Pre-save middleware to update stats
universitySchema.pre('save', function(next) {
  if (this.metadata?.programs) {
    this.stats.totalPrograms = this.metadata.programs.length;
  }
  if (this.metadata?.majorAreas) {
    // You can add more stats here
  }
  next();
});

const University = mongoose.model("University", universitySchema);

export default University;