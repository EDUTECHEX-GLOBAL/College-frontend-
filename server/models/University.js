// models/University.js
import mongoose from "mongoose";

/* ================================
   Program Schema (for GUS_DATA.programs_data)
================================ */
const programSchema = new mongoose.Schema(
  {
    id: { type: String },
    title: { type: String },
    locations: [{ type: String }],
    studyMode: { type: String },
    level: { type: String },
    actions: [{ type: String }],
  },
  { _id: false }
);

/* ================================
   Specific Program Schema (for major_areas.specific_programs)
================================ */
const specificProgramSchema = new mongoose.Schema(
  {
    program_name: { type: String, required: true },
  },
  { _id: false }
);

/* ================================
   Major Area Schema
================================ */
const majorAreaSchema = new mongoose.Schema(
  {
    major_area: { type: String, required: true },
    specific_programs: [specificProgramSchema],
  },
  { _id: false }
);

/* ================================
   GUS Data Schema - ADD THIS
================================ */
const gusDataSchema = new mongoose.Schema(
  {
    country: { type: String, default: "USA" },
    level: { type: String },
    major_areas: [majorAreaSchema],
    programs_data: [programSchema],
  },
  { _id: false }
);

/* ================================
   University Schema
================================ */
const universitySchema = new mongoose.Schema(
  {
    /* ---------- UNIQUE IDENTIFIER ---------- */
    UNITID: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    /* ---------- BASIC INFO ---------- */
    INSTNM: {
      type: String,
      required: true,
      trim: true,
    },

    IALIAS: {
      type: String,
      default: "",
    },

    /* ---------- ADDITIONAL FIELDS FROM YOUR DATA ---------- */
    ADDR: { type: String, default: "" },
    CITY: { type: String, default: "" },
    STABBR: { type: String, default: "" },
    ZIP: { type: String, default: "" },
    FIPS: { type: Number },
    OBEREG: { type: Number },
    CHFNM: { type: String, default: "" },
    CHFTITLE: { type: String, default: "" },
    GENTELE: { type: String, default: "" },
    WEBADDR: { type: String, default: "" },
    ADMINURL: { type: String, default: "" },
    FAIDURL: { type: String, default: "" },
    APPLURL: { type: String, default: "" },
    SECTOR: { type: Number },
    ICLEVEL: { type: Number },
    CONTROL: { type: Number },
    HLOFFER: { type: Number },
    UGOFFER: { type: Number },
    GROFFER: { type: Number },
    DEGGRANT: { type: Number },
    HBCU: { type: Number },
    LOCALE: { type: Number },
    OPENPUBL: { type: Number },
    CYACTIVE: { type: Number },
    POSTSEC: { type: Number },
    INSTCAT: { type: Number },
    LANDGRNT: { type: Number },
    INSTSIZE: { type: Number },
    LONGITUD: { type: Number },
    LATITUDE: { type: Number },

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

    /* ---------- LOCATION ---------- */
    location: {
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "USA" },
      zip: { type: String, default: "" },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },

    /* ---------- CONTACT ---------- */
    contact: {
      phone: { type: String, default: "" },
      website: { type: String, default: "" },
      adminUrl: { type: String, default: "" },
      faidUrl: { type: String, default: "" },
      applUrl: { type: String, default: "" },
    },

    /* ---------- METADATA ---------- */
    metadata: {
      chancellor: { type: String, default: "" },
      chancellorTitle: { type: String, default: "" },
      opeid: { type: Number },
      sector: { type: Number },
      iclevel: { type: Number },
      control: { type: Number },

      programs: {
        type: [programSchema],
        default: [],
      },

      majorAreas: {
        type: [
          {
            major_area: String,
            specific_programs: [
              {
                program_name: String,
              },
            ],
          },
        ],
        default: [],
      },
    },

    /* ---------- GUS DATA - ADD THIS SECTION ---------- */
    GUS_DATA: {
      type: gusDataSchema,
      default: {},
    },

    /* ---------- STATS ---------- */
    stats: {
      totalPrograms: {
        type: Number,
        default: 0,
      },
      totalCampuses: {
        type: Number,
        default: 1,
      },
    },
  },
  {
    timestamps: true,
    collection: "universities",
  }
);

/* ================================
   Pre-save Hook - Update program counts from GUS_DATA
================================ */
universitySchema.pre("save", function (next) {
  // Count programs from GUS_DATA.programs_data
  if (this.GUS_DATA?.programs_data?.length) {
    this.stats.totalPrograms = this.GUS_DATA.programs_data.length;
  } 
  // Fallback to metadata.programs
  else if (this.metadata?.programs?.length) {
    this.stats.totalPrograms = this.metadata.programs.length;
  } else {
    this.stats.totalPrograms = 0;
  }
  next();
});

/* ================================
   Instance Methods - Get Programs
================================ */
universitySchema.methods.getAllPrograms = function() {
  const programs = [];
  
  // Get programs from GUS_DATA.programs_data
  if (this.GUS_DATA?.programs_data?.length) {
    this.GUS_DATA.programs_data.forEach(prog => {
      programs.push({
        id: prog.id,
        title: prog.title,
        locations: prog.locations || [`${this.CITY || ''}, ${this.STABBR || ''}`.trim(', ')],
        studyMode: prog.studyMode || 'On Campus',
        level: prog.level || this.GUS_DATA?.level || 'Undergraduate',
        actions: prog.actions || [],
      });
    });
  }
  
  // Also get programs from major_areas
  if (this.GUS_DATA?.major_areas?.length) {
    this.GUS_DATA.major_areas.forEach(area => {
      if (area.specific_programs) {
        area.specific_programs.forEach(prog => {
          // Check if this program is already added (avoid duplicates)
          const exists = programs.some(p => 
            p.title?.toLowerCase().includes(prog.program_name.toLowerCase())
          );
          
          if (!exists) {
            programs.push({
              id: `area-${area.major_area}-${prog.program_name.replace(/\s+/g, '-')}`,
              title: prog.program_name,
              locations: [`${this.CITY || ''}, ${this.STABBR || ''}`.trim(', ')],
              studyMode: 'On Campus',
              level: this.GUS_DATA?.level || 'Undergraduate',
              majorArea: area.major_area,
            });
          }
        });
      }
    });
  }
  
  return programs;
};

universitySchema.methods.getProgramsByLevel = function(level) {
  const allPrograms = this.getAllPrograms();
  return allPrograms.filter(p => p.level === level);
};

universitySchema.methods.searchPrograms = function(query) {
  const allPrograms = this.getAllPrograms();
  const searchTerm = query.toLowerCase();
  return allPrograms.filter(p => 
    p.title?.toLowerCase().includes(searchTerm) ||
    p.majorArea?.toLowerCase().includes(searchTerm)
  );
};

/* ================================
   Virtuals
================================ */
universitySchema.virtual('programCount').get(function() {
  if (this.GUS_DATA?.programs_data?.length) {
    return this.GUS_DATA.programs_data.length;
  }
  if (this.metadata?.programs?.length) {
    return this.metadata.programs.length;
  }
  return 0;
});

universitySchema.virtual('majorAreaCount').get(function() {
  if (this.GUS_DATA?.major_areas?.length) {
    return this.GUS_DATA.major_areas.length;
  }
  return 0;
});

universitySchema.set('toJSON', { virtuals: true });
universitySchema.set('toObject', { virtuals: true });

/* ================================
   Model Export
================================ */
const University = mongoose.model("University", universitySchema);
export default University;