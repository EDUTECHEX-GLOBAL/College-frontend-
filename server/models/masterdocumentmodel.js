// server/models/masterdocumentmodel.js
import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  fileName: String,
  fileUrl: String,
  fileKey: String,
  originalName: String,
  uploadedAt: { type: Date, default: Date.now },
});

const MasterDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Personal
    passport: FileSchema,
    photo: FileSchema,

    // School
    cert10th: FileSchema,
    cert12th: FileSchema,

    // Bachelor
    bachelorTranscript: FileSchema,
    bachelorDegree: FileSchema,
    provisionalCertificate: FileSchema,
    consolidatedMarksheet: FileSchema,

    // Professional
    resumeCv: FileSchema,
    statementOfPurpose: FileSchema,
    lettersOfRecommendation: FileSchema,

    // Optional
    englishCertificate: FileSchema,
    testScores: FileSchema,
    workExperience: FileSchema,
  },
  { timestamps: true }
);

export default mongoose.model("MasterDocument", MasterDocumentSchema);