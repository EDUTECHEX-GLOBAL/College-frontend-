import mongoose from 'mongoose';

const applicationLanguageSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        index: true
    },
    // Entrance Qualification Fields
    eqheDate: {
        type: Date
    },
    eqheCity: {
        type: String,
        trim: true
    },
    eqheCountry: {
        type: String,
        required: true,
        trim: true
    },
    eqheOriginalTitle: {
        type: String,
        required: true,
        trim: true
    },
    hasAnotherEQHE: {
        type: Boolean,
        default: false
    },
    // Additional EQHE Fields
    anotherEqheDate: {
        type: Date
    },
    anotherEqheCity: {
        type: String,
        trim: true
    },
    anotherEqheCountry: {
        type: String,
        trim: true
    },
    anotherEqheOriginalTitle: {
        type: String,
        trim: true
    },
    // File Upload Fields
    eqheCertificate: {
        type: String // Stores file path or filename
    },
    eqheCertificateFileName: {
        type: String
    },
    eqheCertificateFileType: {
        type: String
    },
    eqheCertificateFileSize: {
        type: Number
    },
    anotherEqheCertificate: {
        type: String
    },
    anotherEqheCertificateFileName: {
        type: String
    },
    // Metadata
    applicationId: {
        type: String,
        unique: true,
        sparse: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lastUpdatedBy: {
        type: String
    },
    lastUpdatedAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate completion percentage before saving
applicationLanguageSchema.pre('save', function(next) {
    const requiredFields = ['eqheCountry', 'eqheOriginalTitle'];
    const optionalFields = ['eqheDate', 'eqheCity'];
    const anotherEqheFields = ['anotherEqheDate', 'anotherEqheCity', 'anotherEqheCountry', 'anotherEqheOriginalTitle'];
    
    let filledFields = 0;
    let totalFields = requiredFields.length + optionalFields.length;
    
    // Check required fields
    requiredFields.forEach(field => {
        if (this[field] && this[field] !== '') {
            filledFields++;
        }
    });
    
    // Check optional fields
    optionalFields.forEach(field => {
        if (this[field] && this[field] !== '') {
            filledFields++;
        }
    });
    
    // If hasAnotherEQHE is true, include those fields in calculation
    if (this.hasAnotherEQHE) {
        totalFields += anotherEqheFields.length;
        anotherEqheFields.forEach(field => {
            if (this[field] && this[field] !== '') {
                filledFields++;
            }
        });
    }
    
    this.completionPercentage = Math.round((filledFields / totalFields) * 100);
    this.isCompleted = this.completionPercentage === 100;
    
    next();
});

// Update lastUpdatedAt before saving
applicationLanguageSchema.pre('save', function(next) {
    this.lastUpdatedAt = new Date();
    next();
});

// Generate applicationId if not present
applicationLanguageSchema.pre('save', async function(next) {
    if (!this.applicationId) {
        const count = await mongoose.model('ApplicationLanguage').countDocuments();
        this.applicationId = `EQHE-${(count + 1).toString().padStart(6, '0')}`;
    }
    next();
});

// Index for faster queries
applicationLanguageSchema.index({ studentId: 1, createdAt: -1 });
applicationLanguageSchema.index({ applicationId: 1 });

const ApplicationLanguage = mongoose.model('ApplicationLanguage', applicationLanguageSchema);

export default ApplicationLanguage;