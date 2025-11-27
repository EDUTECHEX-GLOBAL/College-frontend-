import mongoose from 'mongoose';

const firstAcademicSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  collegeId: {
    type: String,
    required: true
  },
  schoolDepartment: {
    type: String,
    enum: [
      'College of Liberal Arts & Science',
      'School of Architecture & Design',
      'School of Business',
      'School of Education & Human Sciences',
      'School of Engineering',
      'School of Journalism & Mass Communication',
      ''
    ],
    default: ''
  },
  major: {
    type: String,
    default: ''
  },
  subplan: {
    type: String,
    default: ''
  },
  preProfessional: {
    type: String,
    enum: [
      'Pre-Athletic Training',
      'Pre-Dentistry',
      'Pre-Law',
      'Pre-Dr. Medicine/Osteopathic',
      'Pre-Optometry',
      'Pre-Physical Therapy',
      'Pre-Physician Assistant',
      'Pre-Veterinary Medicine',
      ''
    ],
    default: ''
  },
  honorsProgram: {
    type: String,
    enum: ['yes', 'no', ''],
    default: ''
  },
  algebraGrade: {
    type: String,
    enum: ['yes', 'no', ''],
    default: ''
  },
  calculusGrade: {
    type: String,
    enum: ['yes', 'no', ''],
    default: ''
  },
  visualArtGrade: {
    type: String,
    enum: ['yes', 'no', ''],
    default: ''
  },
  selfFellowship: {
    type: String,
    enum: ['yes', 'no', ''],
    default: ''
  },
  progress: {
    type: Number,
    default: 0
  },
  lastSaved: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one academic application per student per college
firstAcademicSchema.index({ studentId: 1, collegeId: 1 }, { unique: true });

// Calculate progress before saving
firstAcademicSchema.pre('save', function(next) {
  let completedFields = 0;
  let totalFields = 4; // ✅ FIX: Changed from const to let
  
  // Required fields
  if (this.schoolDepartment && this.schoolDepartment !== '') completedFields++;
  if (this.major && this.major !== '') completedFields++;
  if (this.preProfessional && this.preProfessional !== '') completedFields++;
  if (this.honorsProgram && this.honorsProgram !== '') completedFields++;
  
  // Additional conditional fields for Engineering
  if (this.schoolDepartment === 'School of Engineering') {
    totalFields += 2; // algebraGrade and calculusGrade
    if (this.algebraGrade && this.algebraGrade !== '') completedFields++;
    if (this.calculusGrade && this.calculusGrade !== '') completedFields++;
  }
  
  // Additional conditional field for Architecture
  if (this.schoolDepartment === 'School of Architecture & Design' && 
      this.major === 'Architecture (M.Arch) 5-year') {
    totalFields += 1; // visualArtGrade
    if (this.visualArtGrade && this.visualArtGrade !== '') completedFields++;
  }
  
  // Additional conditional field for Engineering selfFellowship
  if (this.schoolDepartment === 'School of Engineering') {
    totalFields += 1; // selfFellowship
    if (this.selfFellowship && this.selfFellowship !== '') completedFields++;
  }
  
  this.progress = Math.round((completedFields / totalFields) * 100);
  this.lastSaved = new Date();
  next();
});
const FirstAcademic = mongoose.model('FirstAcademic', firstAcademicSchema);

export default FirstAcademic;