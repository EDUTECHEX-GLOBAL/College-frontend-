import ApplicationLanguage from '../models/ApplicationLanguageModel.js';
import { 
    deleteFileFromFolder, 
    getDynamicFileUrl,
    ensureDirectoryExists,
    validateFileUpload
} from '../middleware/uploadMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the eqhe-certificates directory exists
ensureDirectoryExists('eqhe-certificates');

// Configure multer for file uploads using the same pattern as your uploadMiddleware
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), 'uploads', 'eqhe-certificates');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('📂 Created eqhe-certificates directory:', uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `eqhe-${uniqueSuffix}${ext}`;
        console.log('📁 Generated filename:', filename);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    console.log('🔍 Checking file:', file.originalname, 'MIME:', file.mimetype);
    
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
        console.log('✅ File accepted:', file.originalname);
        cb(null, true);
    } else {
        const error = new Error('Only PDF files are allowed');
        console.log('❌ File rejected:', error.message);
        cb(error, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit (increased from 2MB to match your middleware)
    },
    fileFilter: fileFilter
}).single('eqheCertificate');

/**
 * Create or update entrance qualification data
 * @route POST /api/application/language/student/:studentId/eqhe
 */
export const createOrUpdateEQHE = async (req, res) => {
    try {
        const { studentId } = req.params;
        const eqheData = req.body;

        console.log('📝 Saving EQHE data for student:', studentId);
        console.log('📦 Data received:', eqheData);

        // Validate required fields
        if (!eqheData.eqheCountry) {
            return res.status(400).json({
                success: false,
                message: 'Country of EQHE is required'
            });
        }
        if (!eqheData.eqheOriginalTitle) {
            return res.status(400).json({
                success: false,
                message: 'Original title of EQHE is required'
            });
        }

        // Parse dates if they're strings
        if (eqheData.eqheDate && typeof eqheData.eqheDate === 'string') {
            eqheData.eqheDate = new Date(eqheData.eqheDate);
        }
        if (eqheData.anotherEqheDate && typeof eqheData.anotherEqheDate === 'string') {
            eqheData.anotherEqheDate = new Date(eqheData.anotherEqheDate);
        }

        // Parse boolean if it's string
        if (eqheData.hasAnotherEQHE && typeof eqheData.hasAnotherEQHE === 'string') {
            eqheData.hasAnotherEQHE = eqheData.hasAnotherEQHE === 'true';
        }

        // Find existing record or create new
        let applicationLanguage = await ApplicationLanguage.findOne({ studentId });

        if (applicationLanguage) {
            console.log('📝 Updating existing record for student:', studentId);
            // Update existing record
            Object.keys(eqheData).forEach(key => {
                if (eqheData[key] !== undefined && eqheData[key] !== null && eqheData[key] !== '') {
                    applicationLanguage[key] = eqheData[key];
                }
            });
        } else {
            console.log('📝 Creating new record for student:', studentId);
            // Create new record
            applicationLanguage = new ApplicationLanguage({
                studentId,
                ...eqheData
            });
        }

        await applicationLanguage.save();
        console.log('✅ EQHE data saved successfully for student:', studentId);

        res.status(200).json({
            success: true,
            message: 'Entrance qualification data saved successfully',
            data: applicationLanguage
        });
    } catch (error) {
        console.error('❌ Error saving entrance qualification data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save entrance qualification data',
            error: error.message
        });
    }
};

/**
 * Get entrance qualification data by student ID
 * @route GET /api/application/language/student/:studentId/eqhe
 */
export const getEQHEByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        console.log('📥 Fetching EQHE data for student:', studentId);

        const applicationLanguage = await ApplicationLanguage.findOne({ studentId });

        if (!applicationLanguage) {
            console.log('📭 No EQHE data found for student:', studentId);
            return res.status(404).json({
                success: false,
                message: 'Entrance qualification data not found'
            });
        }

        // Add file URLs to response
        const responseData = applicationLanguage.toObject();
        
        if (responseData.eqheCertificate) {
            responseData.eqheCertificateUrl = getDynamicFileUrl(
                path.basename(responseData.eqheCertificate), 
                'eqhe-certificates'
            );
        }
        
        if (responseData.anotherEqheCertificate) {
            responseData.anotherEqheCertificateUrl = getDynamicFileUrl(
                path.basename(responseData.anotherEqheCertificate), 
                'eqhe-certificates'
            );
        }

        console.log('✅ EQHE data fetched successfully for student:', studentId);

        res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('❌ Error fetching entrance qualification data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch entrance qualification data',
            error: error.message
        });
    }
};

/**
 * Upload EQHE certificate
 * @route POST /api/application/language/student/:studentId/eqhe/certificate
 */
export const uploadCertificate = async (req, res) => {
    upload(req, res, async function(err) {
        // Handle multer errors
        if (err instanceof multer.MulterError) {
            console.error('❌ Multer error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 10MB'
                });
            }
            return res.status(400).json({
                success: false,
                message: 'File upload error',
                error: err.message
            });
        } else if (err) {
            console.error('❌ Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload failed'
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        try {
            const { studentId, certificateType } = req.body;
            
            console.log('📤 Uploading certificate for student:', studentId);
            console.log('📄 File:', req.file.originalname);
            console.log('🏷️ Certificate type:', certificateType);

            if (!studentId) {
                // If file was uploaded but no studentId, delete it
                deleteFileFromFolder(req.file.filename, 'eqhe-certificates');
                return res.status(400).json({
                    success: false,
                    message: 'Student ID is required'
                });
            }

            // Find or create application language record
            let applicationLanguage = await ApplicationLanguage.findOne({ studentId });

            if (!applicationLanguage) {
                applicationLanguage = new ApplicationLanguage({ studentId });
            }

            // Determine certificate field
            const certField = certificateType === 'anotherEqheCertificate' ? 'anotherEqheCertificate' : 'eqheCertificate';
            const fileNameField = certField + 'FileName';
            const fileTypeField = certField + 'FileType';
            const fileSizeField = certField + 'FileSize';

            // Delete old certificate if exists
            if (applicationLanguage[certField]) {
                console.log('🗑️ Deleting old certificate:', applicationLanguage[certField]);
                try {
                    deleteFileFromFolder(path.basename(applicationLanguage[certField]), 'eqhe-certificates');
                } catch (deleteError) {
                    console.error('Error deleting old certificate:', deleteError);
                }
            }

            // Update certificate fields
            applicationLanguage[certField] = req.file.path;
            applicationLanguage[fileNameField] = req.file.originalname;
            applicationLanguage[fileTypeField] = req.file.mimetype;
            applicationLanguage[fileSizeField] = req.file.size;

            await applicationLanguage.save();

            console.log('✅ Certificate uploaded successfully for student:', studentId);

            res.status(200).json({
                success: true,
                message: 'Certificate uploaded successfully',
                data: {
                    filePath: req.file.path,
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    fileUrl: getDynamicFileUrl(req.file.filename, 'eqhe-certificates')
                }
            });
        } catch (error) {
            console.error('❌ Error saving certificate info:', error);
            
            // If there was an error, delete the uploaded file
            if (req.file) {
                try {
                    deleteFileFromFolder(req.file.filename, 'eqhe-certificates');
                } catch (deleteError) {
                    console.error('Error deleting file after error:', deleteError);
                }
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to save certificate information',
                error: error.message
            });
        }
    });
};

/**
 * Delete certificate
 * @route DELETE /api/application/language/student/:studentId/eqhe/certificate/:certificateType
 */
export const deleteCertificate = async (req, res) => {
    try {
        const { studentId, certificateType } = req.params;

        console.log('🗑️ Deleting certificate for student:', studentId, 'Type:', certificateType);

        const applicationLanguage = await ApplicationLanguage.findOne({ studentId });

        if (!applicationLanguage) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        const certField = certificateType === 'anotherEqheCertificate' ? 'anotherEqheCertificate' : 'eqheCertificate';
        const fileNameField = certField + 'FileName';
        const fileTypeField = certField + 'FileType';
        const fileSizeField = certField + 'FileSize';

        // Delete file from filesystem
        if (applicationLanguage[certField]) {
            try {
                deleteFileFromFolder(path.basename(applicationLanguage[certField]), 'eqhe-certificates');
                console.log('✅ File deleted from filesystem');
            } catch (fileError) {
                console.error('Error deleting file:', fileError);
            }
        }

        // Clear certificate fields
        applicationLanguage[certField] = undefined;
        applicationLanguage[fileNameField] = undefined;
        applicationLanguage[fileTypeField] = undefined;
        applicationLanguage[fileSizeField] = undefined;

        await applicationLanguage.save();

        console.log('✅ Certificate deleted successfully for student:', studentId);

        res.status(200).json({
            success: true,
            message: 'Certificate deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete certificate',
            error: error.message
        });
    }
};

/**
 * Get completion status
 * @route GET /api/application/language/student/:studentId/eqhe/status
 */
export const getCompletionStatus = async (req, res) => {
    try {
        const { studentId } = req.params;

        console.log('📊 Fetching completion status for student:', studentId);

        const applicationLanguage = await ApplicationLanguage.findOne({ studentId });

        if (!applicationLanguage) {
            return res.status(200).json({
                success: true,
                data: {
                    isCompleted: false,
                    completionPercentage: 0,
                    requiredFields: ['eqheCountry', 'eqheOriginalTitle']
                }
            });
        }

        console.log('✅ Completion status fetched for student:', studentId);

        res.status(200).json({
            success: true,
            data: {
                isCompleted: applicationLanguage.isCompleted,
                completionPercentage: applicationLanguage.completionPercentage,
                hasAnotherEQHE: applicationLanguage.hasAnotherEQHE,
                lastUpdatedAt: applicationLanguage.lastUpdatedAt
            }
        });
    } catch (error) {
        console.error('❌ Error fetching completion status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch completion status',
            error: error.message
        });
    }
};

/**
 * Delete entrance qualification data
 * @route DELETE /api/application/language/student/:studentId/eqhe
 */
export const deleteEQHE = async (req, res) => {
    try {
        const { studentId } = req.params;

        console.log('🗑️ Deleting all EQHE data for student:', studentId);

        const applicationLanguage = await ApplicationLanguage.findOne({ studentId });

        if (!applicationLanguage) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        // Delete associated files
        if (applicationLanguage.eqheCertificate) {
            try {
                deleteFileFromFolder(path.basename(applicationLanguage.eqheCertificate), 'eqhe-certificates');
                console.log('✅ EQHE certificate deleted');
            } catch (fileError) {
                console.error('Error deleting eqhe certificate:', fileError);
            }
        }

        if (applicationLanguage.anotherEqheCertificate) {
            try {
                deleteFileFromFolder(path.basename(applicationLanguage.anotherEqheCertificate), 'eqhe-certificates');
                console.log('✅ Another EQHE certificate deleted');
            } catch (fileError) {
                console.error('Error deleting another eqhe certificate:', fileError);
            }
        }

        await applicationLanguage.deleteOne();

        console.log('✅ All EQHE data deleted successfully for student:', studentId);

        res.status(200).json({
            success: true,
            message: 'Entrance qualification data deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting entrance qualification data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete entrance qualification data',
            error: error.message
        });
    }
};