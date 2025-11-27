// server/models/educationModel.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  courseName: String,
  courseLevel: String,
  credits: String,
  grade: String,
  term: String
}, { _id: false });

const honorSchema = new mongoose.Schema({
  honorName: String,
  honorLevel: String,
  yearReceived: String,
  description: String
}, { _id: false });

const organizationSchema = new mongoose.Schema({
  organizationName: String,
  assistanceType: String,
  duration: String,
  contactPerson: String
}, { _id: false });

const documentFileSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  url: String, // local path or S3 url
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const educationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
    index: true
  },

  // Sections
  currentSchool: {
    schoolName: { type: String, default: "" },
    schoolCEEBCode: { type: String, default: "" },
    dateOfEntry: { type: String, default: "" },
    isBoardingSchool: { type: String, default: "" },
    liveOnCampus: { type: String, default: "" },
    willGraduate: { type: String, default: "" },
    graduationDate: { type: String, default: "" },
    schoolAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" }
    }
  },

  otherSchools: {
    numberOfSchools: { type: Number, default: 0 },
    schools: [{ 
      name: String,
      ceeb: String,
      from: String,
      to: String
    }]
  },

  colleges: {
    numberOfColleges: { type: Number, default: 0 },
    collegesList: [{ name: String, id: String }]
  },

  grades: {
    graduatingClassSize: { type: String, default: "" },
    classRankReporting: { type: String, default: "" },
    classRank: { type: String, default: "" },
    gpaScale: { type: String, default: "" },
    cumulativeGPA: { type: String, default: "" },
    gpaWeighting: { type: String, default: "" },
    gpaMaxScale: { type: String, default: "" }
  },

  currentCourses: {
    numberOfCourses: { type: Number, default: 0 },
    schedulingSystem: { type: String, default: "" },
    courses: [ courseSchema ]
  },

  honors: {
    reportHonors: { type: String, default: "" },
    honorsList: [ honorSchema ]
  },

  communityOrganizations: {
    numberOfOrganizations: { type: Number, default: 0 },
    organizations: [ organizationSchema ]
  },

  futurePlans: {
    studentType: { type: String, default: "" },
    highestDegree: { type: String, default: "" },
    careerInterest: { type: String, default: "" },
    additionalInterests: [String]
  },

  documents: {
    passport: documentFileSchema,
    tenthMarksheet: documentFileSchema,
    twelfthMarksheet: documentFileSchema,
    additionalDocuments: [ documentFileSchema ]
  },

  // Completion tracking for each education sub-section
  educationCompletion: {
    currentSchool: { type: Boolean, default: false },
    otherSchools: { type: Boolean, default: false },
    colleges: { type: Boolean, default: false },
    grades: { type: Boolean, default: false },
    currentCourses: { type: Boolean, default: false },
    honors: { type: Boolean, default: false },
    communityOrganizations: { type: Boolean, default: false },
    futurePlans: { type: Boolean, default: false },
    documents: { type: Boolean, default: false }
  },

  overallProgress: { type: Number, default: 0 }
}, { timestamps: true });

const Education = mongoose.model("Education", educationSchema);
export default Education;
