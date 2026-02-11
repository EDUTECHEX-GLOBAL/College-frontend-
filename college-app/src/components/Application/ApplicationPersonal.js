import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ApplicationPersonal.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const ApplicationPersonal = ({ formData, onInputChange, onFileUpload, basePath }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Local state for file previews
    const [passportPreview, setPassportPreview] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    // Load personal data from backend on component mount
    useEffect(() => {
        const loadPersonalData = async () => {
            try {
                setIsLoading(true);
                const token = getAuthToken();
                
                if (!token) {
                    console.log('No auth token found, using local data only');
                    setIsLoading(false);
                    return;
                }
                
                const response = await axios.get(`${API_URL}/api/application/personal`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.data.success && response.data.personalInfo) {
                    const backendData = response.data.personalInfo;
                    
                    // Update formData with backend data
                    Object.keys(backendData).forEach(key => {
                        if (backendData[key] !== null && backendData[key] !== undefined) {
                            onInputChange(key, backendData[key]);
                        }
                    });
                    
                    console.log('✅ Personal data loaded from backend:', backendData);
                }
            } catch (error) {
                console.error('❌ Error loading personal data:', error);
                
                // Don't show error if it's just no data (404)
                if (error.response?.status !== 404) {
                    setError('Failed to load personal data from server');
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadPersonalData();
    }, []);

    // Calculate completion percentage
    const calculateCompletion = () => {
        const fields = [
            'firstName', 'lastName', 'dob', 'gender', 'nationality',
            'countryOfResidence', 'email', 'mobile', 'passportFileName', 'photographFileName'
        ];

        const completedFields = fields.filter(field => {
            const value = formData[field];
            return value && value.toString().trim() !== '';
        }).length;

        return Math.round((completedFields / fields.length) * 100);
    };

    // Handle file change with backend upload
   const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const token = getAuthToken();
        if (!token) {
            alert("Please login again.");
            return;
        }

        const uploadUrl =
            field === "passport"
                ? `${API_URL}/api/application/personal/upload/passport`
                : `${API_URL}/api/application/personal/upload/photograph`;

        const uploadData = new FormData();
        uploadData.append("file", file);

        console.log("Uploading to:", uploadUrl);

        const response = await axios.post(uploadUrl, uploadData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        });

        if (response.data.success) {
            console.log("Upload success:", response.data);

            onFileUpload(field, file);
           onInputChange(`${field}FileName`, response.data.fileName);
onInputChange(`${field}FileUrl`, response.data.fileUrl);


            alert(
                field === "passport"
                    ? "Passport uploaded successfully!"
                    : "Photograph uploaded successfully!"
            );
        }
    } catch (error) {
        console.error("Upload error:", error.response?.data || error.message);

        alert(
            error.response?.data?.message ||
            "Upload failed. Check server console."
        );

        e.target.value = "";
    }
};


    // Remove file from backend
    const handleRemoveFile = async (field) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await axios.delete(
                `${API_URL}/api/application/personal/files/${field}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                console.log(`✅ ${field} removed successfully`);
                
                // Update local state
                onFileUpload(field, null);
                onInputChange(`${field}FileName`, '');
                
                // Clear preview
                if (field === 'photograph') {
                    setPhotoPreview(null);
                    const photoInput = document.getElementById('photoUpload');
                    if (photoInput) photoInput.value = '';
                }
                if (field === 'passport') {
                    setPassportPreview(null);
                    const passportInput = document.getElementById('passportUpload');
                    if (passportInput) passportInput.value = '';
                }
            }
        } catch (error) {
            console.error(`❌ Error removing ${field}:`, error);
            alert(`Failed to remove ${field}. Please try again.`);
        }
    };

    // Load file previews on component mount
    useEffect(() => {
        if (!formData.passportFileName) {
            setPassportPreview(null);
            const passportInput = document.getElementById('passportUpload');
            if (passportInput) {
                passportInput.value = '';
            }
        }

        if (!formData.photographFileName) {
            setPhotoPreview(null);
            const photoInput = document.getElementById('photoUpload');
            if (photoInput) {
                photoInput.value = '';
            }
        }
    }, [formData.passportFileName, formData.photographFileName]);

    // Validate form
    const validateForm = () => {
        const requiredFields = [
            'firstName', 'lastName', 'dob', 'gender',
            'nationality', 'countryOfResidence', 'email', 'mobile'
        ];

        const missingFields = requiredFields.filter(field => {
            const value = formData[field];
            return !value || value.toString().trim() === '';
        });

        const missingFiles = [];

        if (!formData.passportFileName) missingFiles.push('Passport');
        if (!formData.photographFileName) missingFiles.push('Passport-size photograph');

        console.log('🔍 Form validation:', {
            missingFields,
            missingFiles,
            gender: formData.gender,
            nationality: formData.nationality
        });

        return {
            isValid: missingFields.length === 0 && missingFiles.length === 0,
            missingFields,
            missingFiles
        };
    };

    // Save data to backend before continuing
    const handleContinue = async () => {
        console.log('🚀 Continue button clicked');

        // Prevent multiple clicks
        if (isSubmitting) {
            console.log('⏳ Already submitting, please wait...');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const validation = validateForm();

            if (!validation.isValid) {
                console.log('❌ Form validation failed:', validation);

                let errorMessage = 'Please complete all required fields:\n\n';

                if (validation.missingFields.length > 0) {
                    errorMessage += 'Missing Information:\n';
                    validation.missingFields.forEach(field => {
                        const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        errorMessage += `• ${fieldName}\n`;
                    });
                }

                if (validation.missingFiles.length > 0) {
                    errorMessage += '\nMissing Files:\n';
                    validation.missingFiles.forEach(file => {
                        errorMessage += `• ${file}\n`;
                    });
                }

                alert(errorMessage);
                setIsSubmitting(false);
                return;
            }

            // Save data to backend
            const token = getAuthToken();
            if (!token) {
                alert('Please login to save your application');
                setIsSubmitting(false);
                return;
            }

            console.log('📤 Saving personal data to backend...');
            
            // Prepare data for backend
            const saveData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                dob: formData.dob,
                gender: formData.gender,
                nationality: formData.nationality,
                countryOfResidence: formData.countryOfResidence,
                email: formData.email,
                mobile: formData.mobile,
                alternateContact: formData.alternateContact || ''
            };

            const response = await axios.post(
                `${API_URL}/api/application/personal`,
                saveData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                console.log('✅ Personal data saved to backend:', response.data);
                
                // Navigate to next page
                let targetPath;
                
                if (location.pathname.includes('/personal')) {
                    targetPath = location.pathname.replace('/personal', '/address');
                    console.log('➡️ Navigating to:', targetPath);
                } else {
                    targetPath = '/firstyear/dashboard/application/address';
                    console.log('➡️ Using direct path:', targetPath);
                }
                
                navigate(targetPath);
                
            } else {
                setError('Failed to save data. Please try again.');
                alert('Failed to save your information. Please try again.');
            }

        } catch (error) {
            console.error('❌ Error in handleContinue:', error);
            
            if (error.response) {
                // Server responded with error
                if (error.response.status === 400) {
                    const errorData = error.response.data;
                    if (errorData.errors) {
                        const errorMessage = errorData.errors.join('\n• ');
                        alert(`Validation Error:\n• ${errorMessage}`);
                    } else if (errorData.message) {
                        alert(`Error: ${errorData.message}`);
                    }
                } else if (error.response.status === 401) {
                    alert('Session expired. Please login again.');
                    // Optional: Redirect to login
                    // navigate('/login');
                } else {
                    alert('Server error. Please try again later.');
                }
            } else if (error.request) {
                // No response from server
                alert('No response from server. Check your internet connection.');
            } else {
                // Something else happened
                alert('An error occurred. Please try again.');
            }
            
            setError('Failed to save application');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        console.log('🔙 Handling back navigation');
        
        let backPath;
        
        if (location.pathname.includes('/personal')) {
            backPath = location.pathname.replace('/personal', '');
        } else {
            backPath = '/firstyear/dashboard/application';
        }
        
        console.log('🔙 Navigating back to:', backPath);
        navigate(backPath);
    };

    const completionPercentage = calculateCompletion();

    // Show loading state
    if (isLoading) {
        return (
            <div className="form-section">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading your personal information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="form-section">
            {/* Error message */}
            {error && (
                <div className="error-banner">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="error-close-btn">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            <div className="section-header">
                <div className="section-number">1</div>
                <div>
                    <h2 className="section-title">Personal Information</h2>
                    <p className="section-subtitle">Please provide your personal details accurately</p>

                    <div className="step-progress">
                        <div className="progress-bar-mini">
                            <div
                                className="progress-fill"
                                style={{ width: `${completionPercentage}%` }}
                            ></div>
                        </div>
                        <span className="progress-text">{completionPercentage}% complete</span>
                    </div>
                </div>
            </div>

            <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p className="info-text">All fields marked with * are mandatory. Ensure information matches your passport.</p>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleContinue();
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleContinue();
                    }
                }}
            >
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label required" htmlFor="firstName">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            className="form-input"
                            value={formData.firstName || ''}
                            onChange={(e) => onInputChange('firstName', e.target.value)}
                            placeholder="Enter your first name"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required" htmlFor="lastName">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            className="form-input"
                            value={formData.lastName || ''}
                            onChange={(e) => onInputChange('lastName', e.target.value)}
                            placeholder="Enter your last name"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required" htmlFor="dob">Date of Birth</label>
                        <input
                            type="date"
                            id="dob"
                            className="form-input"
                            value={formData.dob || ''}
                            onChange={(e) => onInputChange('dob', e.target.value)}
                            required
                            disabled={isSubmitting}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required" htmlFor="gender">Gender</label>
                        <select
                            id="gender"
                            className="form-select"
                            value={formData.gender || ''}
                            onChange={(e) => onInputChange('gender', e.target.value)}
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                        {formData.gender && (
                            <small className="field-hint">Selected: {formData.gender}</small>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label required" htmlFor="nationality">Nationality</label>
                        <input
                            type="text"
                            id="nationality"
                            className="form-input"
                            value={formData.nationality || ''}
                            onChange={(e) => onInputChange('nationality', e.target.value)}
                            placeholder="Your nationality"
                            required
                            disabled={isSubmitting}
                        />
                        {formData.nationality && (
                            <small className="field-hint">Nationality: {formData.nationality}</small>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label required" htmlFor="countryOfResidence">Country of Residence</label>
                        <select
                            id="countryOfResidence"
                            className="form-select"
                            value={formData.countryOfResidence || ''}
                            onChange={(e) => onInputChange('countryOfResidence', e.target.value)}
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">Select Country</option>
                            <option value="USA">United States</option>
                            <option value="UK">United Kingdom</option>
                            <option value="Canada">Canada</option>
                            <option value="Australia">Australia</option>
                            <option value="India">India</option>
                            <option value="Germany">Germany</option>
                            <option value="France">France</option>
                            <option value="Other">Other</option>
                        </select>
                        {formData.countryOfResidence && (
                            <small className="field-hint">Selected: {formData.countryOfResidence}</small>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label required" htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            value={formData.email || ''}
                            onChange={(e) => onInputChange('email', e.target.value)}
                            placeholder="example@domain.com"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required" htmlFor="mobile">Mobile Number</label>
                        <input
                            type="tel"
                            id="mobile"
                            className="form-input"
                            value={formData.mobile || ''}
                            onChange={(e) => onInputChange('mobile', e.target.value)}
                            placeholder="+91 9876543210"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="alternateContact">Alternate Contact (Optional)</label>
                        <input
                            type="tel"
                            id="alternateContact"
                            className="form-input"
                            value={formData.alternateContact || ''}
                            onChange={(e) => onInputChange('alternateContact', e.target.value)}
                            placeholder="Alternate phone number"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* Updated File Upload Section with Backend Integration */}
                <div className="form-grid">
                    {/* Passport Upload Section */}
                    <div className="form-group">
                        <label className="form-label required">Passport Upload</label>
                        <div className="upload-area-compact">
                            <div className="upload-header">
                                <div className="upload-info">
                                    <p className="upload-title">Upload a clear scanned copy of your passport</p>
                                    <p className="upload-subtitle">PDF, JPG, or PNG (Max: 2MB)</p>
                                </div>
                                <input
                                    type="file"
                                    id="passportUpload"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange(e, 'passport')}
                                    className="file-input"
                                    style={{ display: 'none' }}
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    className="compact-upload-btn"
                                    onClick={() => document.getElementById('passportUpload').click()}
                                    disabled={isSubmitting}
                                >
                                    <i className="fas fa-cloud-upload-alt"></i>
                                    {formData.passportFileName ? 'Change File' : 'Upload'}
                                </button>
                            </div>
                            
                            {formData.passportFileName && (
                                <div className="uploaded-file-info">
                                    <div className="file-icon-name">
                                        <i className="fas fa-file-alt file-icon"></i>
                                        <div className="file-details">
                                            <span className="file-name">{formData.passportFileName}</span>
                                            <span className="file-size">
                                                {passportPreview ? 
                                                    'Image uploaded' : 
                                                    'Document uploaded'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="remove-file-btn"
                                        onClick={() => handleRemoveFile('passport')}
                                        disabled={isSubmitting}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Photo Upload Section */}
                    <div className="form-group">
                        <label className="form-label required">Passport Size Photograph</label>
                        <div className="upload-area-compact">
                            <div className="upload-header">
                                <div className="upload-info">
                                    <p className="upload-title">Upload recent passport-size photograph</p>
                                    <p className="upload-subtitle">White background, JPG or PNG (Max: 1MB)</p>
                                </div>
                                <input
                                    type="file"
                                    id="photoUpload"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange(e, 'photograph')}
                                    className="file-input"
                                    style={{ display: 'none' }}
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    className="compact-upload-btn"
                                    onClick={() => document.getElementById('photoUpload').click()}
                                    disabled={isSubmitting}
                                >
                                    <i className="fas fa-cloud-upload-alt"></i>
                                    {formData.photographFileName ? 'Change Photo' : 'Upload'}
                                </button>
                            </div>
                            
                            {formData.photographFileName && (
                                <div className="uploaded-file-info">
                                    <div className="file-icon-name">
                                        <i className="fas fa-image file-icon"></i>
                                        <div className="file-details">
                                            <span className="file-name">{formData.photographFileName}</span>
                                            <span className="file-size">
                                                {photoPreview ? 
                                                    'Image uploaded' : 
                                                    'Document uploaded'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="remove-file-btn"
                                        onClick={() => handleRemoveFile('photograph')}
                                        disabled={isSubmitting}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation footer */}
                <div className="form-footer">
                    <div className="footer-buttons">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleBack}
                            disabled={isSubmitting}
                        >
                            <i className="fas fa-arrow-left"></i> Back to Application Home
                        </button>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Saving & Processing...
                                </>
                            ) : (
                                <>
                                    Continue to Address & ID <i className="fas fa-arrow-right"></i>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="form-status">
                        <div className="status-item">
                            <i className="fas fa-save"></i>
                            <span>Auto-saved: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="status-item">
                            <i className="fas fa-check-circle"></i>
                            <span>Progress: {completionPercentage}%</span>
                        </div>
                        <div className="status-item">
                            <i className="fas fa-database"></i>
                            <span>Backend: {formData.firstName ? 'Connected' : 'Not saved'}</span>
                        </div>
                    </div>
                </div>
            </form>

            {/* Add CSS for error banner and loading state */}
            <style>{`
                .error-banner {
                    background-color: #fee;
                    border-left: 4px solid #f44336;
                    color: #d32f2f;
                    padding: 12px 16px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 4px;
                }
                
                .error-banner i {
                    margin-right: 10px;
                }
                
                .error-close-btn {
                    background: none;
                    border: none;
                    color: #d32f2f;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 4px 8px;
                }
                
                .error-close-btn:hover {
                    background-color: rgba(211, 47, 47, 0.1);
                    border-radius: 50%;
                }
                
                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    text-align: center;
                }
                
                .loading-spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ApplicationPersonal;