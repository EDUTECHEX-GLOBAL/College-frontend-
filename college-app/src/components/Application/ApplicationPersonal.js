import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ApplicationPersonal.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const ApplicationPersonal = ({ formData, onInputChange, onFileUpload, basePath }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Local state for file previews and UI
    const [passportPreview, setPassportPreview] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // EU Citizenship and visa state
    const [isEUCitizen, setIsEUCitizen] = useState(null);
    const [selectedDocumentType, setSelectedDocumentType] = useState('');
    const [needVisa, setNeedVisa] = useState('');
    const [referFriend, setReferFriend] = useState('');
    const [title, setTitle] = useState('');

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

                    // Set local state from backend data
                    if (backendData.isEUCitizen !== undefined) setIsEUCitizen(backendData.isEUCitizen);
                    if (backendData.documentType) setSelectedDocumentType(backendData.documentType);
                    if (backendData.needVisa) setNeedVisa(backendData.needVisa);
                    if (backendData.referFriend) setReferFriend(backendData.referFriend);
                    if (backendData.title) setTitle(backendData.title);
                    
                    // Set previews if images exist
                    if (backendData.passportFileUrl) {
                        setPassportPreview(backendData.passportFileUrl);
                    }
                    if (backendData.photographFileUrl) {
                        setPhotoPreview(backendData.photographFileUrl);
                    }
                    
                    console.log('✅ Personal data loaded from backend:', backendData);
                }
            } catch (error) {
                console.error('❌ Error loading personal data:', error);
                
                if (error.response?.status !== 404) {
                    setError('Failed to load personal data from server');
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadPersonalData();
    }, []);

    // Calculate completion percentage based on all GUS fields
    const calculateCompletion = () => {
        const fields = [
            'firstName', 'lastName', 'email', 'dateOfBirth', 
            'placeOfBirth', 'countryOfBirth', 'citizenship',
            'passportNumber', 'passportIssueDate', 'passportExpiryDate',
            'issuingCountry', 'mobile', 'correspondenceLanguage'
        ];

        // Add visa field if not EU citizen
        if (isEUCitizen === false) {
            fields.push('needVisa');
        }

        // Check for file uploads using both fileName and originalName
        let fileFieldsCount = 0;
        if (formData.passportFileName || formData.passportOriginalName) fileFieldsCount++;
        if (formData.photographFileName || formData.photographOriginalName) fileFieldsCount++;
        
        const totalFields = fields.length + 2; // Add 2 for file uploads
        const completedTextFields = fields.filter(field => {
            const value = formData[field];
            return value && value.toString().trim() !== '';
        }).length;

        return Math.round(((completedTextFields + fileFieldsCount) / totalFields) * 100);
    };

    // Handle file change with backend upload
    const handleFileChange = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Validate file type
        const allowedTypes = field === 'passport' 
            ? ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
            : ['image/jpeg', 'image/jpg', 'image/png'];
        
        if (!allowedTypes.includes(file.type)) {
            alert(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
            return;
        }

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (field === 'photograph') {
                    setPhotoPreview(reader.result);
                } else {
                    setPassportPreview(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }

        try {
            const token = getAuthToken();
            if (!token) {
                alert("Please login again.");
                return;
            }

            const uploadUrl = field === "passport"
                ? `${API_URL}/api/application/personal/upload/passport`
                : `${API_URL}/api/application/personal/upload/photograph`;

            const uploadData = new FormData();
            uploadData.append("file", file);

            console.log(`Uploading ${field} to:`, uploadUrl);

            const response = await axios.post(uploadUrl, uploadData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                // Update all file-related fields
                onFileUpload(field, file);
                onInputChange(`${field}FileName`, response.data.fileName);
                onInputChange(`${field}FileUrl`, response.data.fileUrl);
                onInputChange(`${field}OriginalName`, file.name);
                onInputChange(`${field}FileSize`, file.size);
                onInputChange(`${field}FileType`, file.type.split('/')[1]);
                onInputChange(`${field}UploadedAt`, new Date().toISOString());

                alert(field === "passport" 
                    ? "Passport uploaded successfully!" 
                    : "Photograph uploaded successfully!");
            }
        } catch (error) {
            console.error("Upload error:", error.response?.data || error.message);
            
            // Clear preview on error
            if (field === 'photograph') setPhotoPreview(null);
            if (field === 'passport') setPassportPreview(null);

            alert(error.response?.data?.message || "Upload failed. Please try again.");
            e.target.value = "";
        }
    };

    // Check if file exists (checks both fileName and originalName)
    const hasFile = (field) => {
        return formData[`${field}FileName`] || formData[`${field}OriginalName`];
    };

    // Get file name for display
    const getFileName = (field) => {
        return formData[`${field}OriginalName`] || formData[`${field}FileName`] || 'Uploaded file';
    };

    // Remove file from backend
    const handleRemoveFile = async (field) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            // If we have a fileName, try to delete from backend
            if (formData[`${field}FileName`]) {
                try {
                    const response = await axios.delete(
                        `${API_URL}/api/application/personal/files/${field}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );

                    if (response.data.success) {
                        console.log(`✅ ${field} removed from backend`);
                    }
                } catch (apiError) {
                    console.log(`API error removing ${field}, but continuing with local cleanup`);
                }
            }
            
            // Update local state - clear all file-related fields
            onFileUpload(field, null);
            onInputChange(`${field}FileName`, '');
            onInputChange(`${field}FileUrl`, '');
            onInputChange(`${field}OriginalName`, '');
            onInputChange(`${field}FileSize`, 0);
            onInputChange(`${field}FileType`, '');
            onInputChange(`${field}UploadedAt`, null);
            
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

            alert(`${field === 'passport' ? 'Passport' : 'Photograph'} removed successfully!`);
            
        } catch (error) {
            console.error(`Error removing ${field}:`, error);
            alert(`Failed to remove ${field}. Please try again.`);
        }
    };

    // Validate form based on GUS requirements
    const validateForm = () => {
        const requiredFields = [
            'firstName', 'lastName', 'email', 'dateOfBirth', 
            'placeOfBirth', 'countryOfBirth', 'citizenship',
            'passportNumber', 'passportIssueDate', 'passportExpiryDate',
            'issuingCountry', 'mobile', 'correspondenceLanguage'
        ];

        const missingFields = requiredFields.filter(field => {
            const value = formData[field];
            return !value || value.toString().trim() === '';
        });

        // Add visa requirement if not EU citizen
        if (isEUCitizen === false && (!needVisa || needVisa === '')) {
            missingFields.push('visaRequirement');
        }

        const missingFiles = [];
        if (!hasFile('passport')) missingFiles.push('Passport');
        if (!hasFile('photograph')) missingFiles.push('Photograph');

        return {
            isValid: missingFields.length === 0 && missingFiles.length === 0,
            missingFields,
            missingFiles
        };
    };

    // Save data to backend before continuing
    const handleContinue = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setError('');

        try {
            const validation = validateForm();

            if (!validation.isValid) {
                let errorMessage = 'Please complete all required fields:\n\n';

                if (validation.missingFields.length > 0) {
                    errorMessage += 'Missing Information:\n';
                    validation.missingFields.forEach(field => {
                        const fieldName = field
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .replace('date Of Birth', 'Date of Birth')
                            .replace('place Of Birth', 'Place of Birth')
                            .replace('country Of Birth', 'Country of Birth')
                            .replace('passport Number', 'Passport Number')
                            .replace('passport Issue Date', 'Passport Issue Date')
                            .replace('passport Expiry Date', 'Passport Expiry Date')
                            .replace('issuing Country', 'Issuing Country')
                            .replace('correspondence Language', 'Correspondence Language')
                            .replace('visaRequirement', 'Visa Requirement');
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

            const token = getAuthToken();
            if (!token) {
                alert('Please login to save your application');
                setIsSubmitting(false);
                return;
            }

            // Prepare data for backend
            const saveData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                title: title,
                email: formData.email,
                dateOfBirth: formData.dateOfBirth,
                placeOfBirth: formData.placeOfBirth,
                countryOfBirth: formData.countryOfBirth,
                citizenship: formData.citizenship,
                passportNumber: formData.passportNumber,
                passportIssueDate: formData.passportIssueDate,
                passportExpiryDate: formData.passportExpiryDate,
                issuingCountry: formData.issuingCountry,
                mobile: formData.mobile,
                landline: formData.landline || '',
                correspondenceLanguage: formData.correspondenceLanguage,
                isEUCitizen: isEUCitizen,
                documentType: selectedDocumentType,
                needVisa: needVisa,
                referFriend: referFriend
            };

            console.log('Saving personal data:', saveData);

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
                // Navigate to next page (Address)
                let targetPath;
                
                if (location.pathname.includes('/personal')) {
                    targetPath = location.pathname.replace('/personal', '/address');
                } else {
                    targetPath = '/firstyear/dashboard/application/address';
                }
                
                navigate(targetPath);
            }
        } catch (error) {
            console.error('❌ Error saving:', error);
            setError('Failed to save application');
            alert('Failed to save your information. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        let backPath;
        
        if (location.pathname.includes('/personal')) {
            backPath = location.pathname.replace('/personal', '');
        } else {
            backPath = '/firstyear/dashboard/application';
        }
        
        navigate(backPath);
    };

    const completionPercentage = calculateCompletion();

    // Show loading state
    if (isLoading) {
        return (
            <div className="application-personal">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading your personal information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="application-personal">
            {/* Header with Application ID */}
            <div className="personal-header">
                <div className="header-left">
                    <h1>BA Communication Design</h1>
                    <div className="application-id">APPLICATION ID - UEG0000104849</div>
                </div>
                <div className="progress-badge">{completionPercentage}% Completed</div>
            </div>

            {/* Navigation Steps */}
            <div className="application-steps">
                <div className="step completed">
                    <span className="step-number">✓</span>
                    <span className="step-name">Study programme</span>
                </div>
                <div className="step active">
                    <span className="step-number">2</span>
                    <span className="step-name">Applicant Details</span>
                </div>
                <div className="step">
                    <span className="step-number">3</span>
                    <span className="step-name">Address</span>
                </div>
                <div className="step">
                    <span className="step-number">4</span>
                    <span className="step-name">Entrance qualification</span>
                </div>
                <div className="step">
                    <span className="step-number">5</span>
                    <span className="step-name">Higher Education</span>
                </div>
                <div className="step">
                    <span className="step-number">6</span>
                    <span className="step-name">Documents</span>
                </div>
                <div className="step">
                    <span className="step-number">7</span>
                    <span className="step-name">Special Needs</span>
                </div>
                <div className="step">
                    <span className="step-number">8</span>
                    <span className="step-name">Declaration</span>
                </div>
                <div className="step">
                    <span className="step-number">9</span>
                    <span className="step-name">Review</span>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="error-banner">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="error-close-btn">×</button>
                </div>
            )}

            {/* Main Form */}
            <div className="personal-form-container">
                <div className="form-header">
                    <h2>Applicant Details</h2>
                    <p className="form-subtitle">
                        Please fill in all information as it appears on your passport/official documents 
                        to ensure accuracy. Do not use abbreviations or shortenings.
                    </p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
                    {/* EU Citizenship Section */}
                    <div className="form-section">
                        <h3 className="section-heading">Citizenship Status</h3>
                        
                        <div className="form-group full-width">
                            <label className="form-label required">Are you an EU Citizen?</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="euCitizen"
                                        checked={isEUCitizen === true}
                                        onChange={() => {
                                            setIsEUCitizen(true);
                                            onInputChange('isEUCitizen', true);
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    <span>Yes</span>
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="euCitizen"
                                        checked={isEUCitizen === false}
                                        onChange={() => {
                                            setIsEUCitizen(false);
                                            onInputChange('isEUCitizen', false);
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    <span>No</span>
                                </label>
                            </div>
                        </div>

                        {isEUCitizen === true && (
                            <div className="form-group full-width">
                                <label className="form-label required">Please choose a document to upload</label>
                                <select
                                    className="form-select"
                                    value={selectedDocumentType}
                                    onChange={(e) => {
                                        setSelectedDocumentType(e.target.value);
                                        onInputChange('documentType', e.target.value);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select document type</option>
                                    <option value="passport">Passport</option>
                                    <option value="id_card">National ID Card</option>
                                    <option value="residence_permit">Residence Permit</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Personal Information Section */}
                    <div className="form-section">
                        <h3 className="section-heading">Personal Information</h3>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="title">Title</label>
                                <select
                                    id="title"
                                    className="form-select"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        onInputChange('title', e.target.value);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select</option>
                                    <option value="mr">Mr.</option>
                                    <option value="mrs">Mrs.</option>
                                    <option value="ms">Ms.</option>
                                    <option value="dr">Dr.</option>
                                    <option value="prof">Prof.</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="firstName">
                                    First name (in case of first name missing, please add FNU)
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    className="form-input"
                                    value={formData.firstName || ''}
                                    onChange={(e) => onInputChange('firstName', e.target.value)}
                                    placeholder="As appears on passport"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="lastName">
                                    Surname (in case of last name missing, please add LNU)
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    className="form-input"
                                    value={formData.lastName || ''}
                                    onChange={(e) => onInputChange('lastName', e.target.value)}
                                    placeholder="As appears on passport"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="email">Email address</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    value={formData.email || ''}
                                    onChange={(e) => onInputChange('email', e.target.value)}
                                    placeholder="arvindbonda1@gmail.com"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="dateOfBirth">Date of birth</label>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    className="form-input"
                                    value={formData.dateOfBirth || ''}
                                    onChange={(e) => onInputChange('dateOfBirth', e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="placeOfBirth">Place of birth</label>
                                <input
                                    type="text"
                                    id="placeOfBirth"
                                    className="form-input"
                                    value={formData.placeOfBirth || ''}
                                    onChange={(e) => onInputChange('placeOfBirth', e.target.value)}
                                    placeholder="Enter place of birth"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="countryOfBirth">Country of birth</label>
                                <select
                                    id="countryOfBirth"
                                    className="form-select"
                                    value={formData.countryOfBirth || ''}
                                    onChange={(e) => onInputChange('countryOfBirth', e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select</option>
                                    <option value="India">India</option>
                                    <option value="USA">United States</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="Germany">Germany</option>
                                    <option value="France">France</option>
                                    <option value="Canada">Canada</option>
                                    <option value="Australia">Australia</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="citizenship">Citizenship</label>
                                <select
                                    id="citizenship"
                                    className="form-select"
                                    value={formData.citizenship || ''}
                                    onChange={(e) => onInputChange('citizenship', e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select</option>
                                    <option value="Indian">Indian</option>
                                    <option value="American">American</option>
                                    <option value="British">British</option>
                                    <option value="German">German</option>
                                    <option value="French">French</option>
                                    <option value="Canadian">Canadian</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Passport Details Section */}
                    <div className="form-section">
                        <h3 className="section-heading">Passport Details</h3>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label required" htmlFor="passportNumber">Passport Number</label>
                                <input
                                    type="text"
                                    id="passportNumber"
                                    className="form-input"
                                    value={formData.passportNumber || ''}
                                    onChange={(e) => onInputChange('passportNumber', e.target.value)}
                                    placeholder="Enter passport number"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="passportIssueDate">Passport Issue date</label>
                                <input
                                    type="date"
                                    id="passportIssueDate"
                                    className="form-input"
                                    value={formData.passportIssueDate || ''}
                                    onChange={(e) => onInputChange('passportIssueDate', e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="passportExpiryDate">Passport Expiry date</label>
                                <input
                                    type="date"
                                    id="passportExpiryDate"
                                    className="form-input"
                                    value={formData.passportExpiryDate || ''}
                                    onChange={(e) => onInputChange('passportExpiryDate', e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="issuingCountry">Issuing Country</label>
                                <select
                                    id="issuingCountry"
                                    className="form-select"
                                    value={formData.issuingCountry || ''}
                                    onChange={(e) => onInputChange('issuingCountry', e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select</option>
                                    <option value="India">India</option>
                                    <option value="USA">United States</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="Germany">Germany</option>
                                    <option value="France">France</option>
                                    <option value="Canada">Canada</option>
                                </select>
                            </div>
                        </div>

                        {/* Visa Requirement - Only for non-EU citizens */}
                        {isEUCitizen === false && (
                            <div className="form-group full-width visa-question">
                                <label className="form-label required">Do you need a visa for this course?</label>
                                <div className="radio-group">
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="needVisa"
                                            value="yes"
                                            checked={needVisa === 'yes'}
                                            onChange={(e) => {
                                                setNeedVisa(e.target.value);
                                                onInputChange('needVisa', e.target.value);
                                            }}
                                            disabled={isSubmitting}
                                        />
                                        <span>Yes</span>
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="needVisa"
                                            value="no"
                                            checked={needVisa === 'no'}
                                            onChange={(e) => {
                                                setNeedVisa(e.target.value);
                                                onInputChange('needVisa', e.target.value);
                                            }}
                                            disabled={isSubmitting}
                                        />
                                        <span>No</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contact Numbers Section */}
                    <div className="form-section">
                        <h3 className="section-heading">Contact Information</h3>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="landline">Landline/home phone number</label>
                                <div className="phone-input">
                                    <span className="country-code">+1</span>
                                    <input
                                        type="tel"
                                        id="landline"
                                        className="form-input phone-number"
                                        value={formData.landline || ''}
                                        onChange={(e) => onInputChange('landline', e.target.value)}
                                        placeholder="Type your Landline/home phone number"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="mobile">Mobile number</label>
                                <div className="phone-input">
                                    <span className="country-code">+91</span>
                                    <input
                                        type="tel"
                                        id="mobile"
                                        className="form-input phone-number"
                                        value={formData.mobile || ''}
                                        onChange={(e) => onInputChange('mobile', e.target.value)}
                                        placeholder="7207316750"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label required" htmlFor="correspondenceLanguage">Correspondence language</label>
                                <select
                                    id="correspondenceLanguage"
                                    className="form-select"
                                    value={formData.correspondenceLanguage || ''}
                                    onChange={(e) => onInputChange('correspondenceLanguage', e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select</option>
                                    <option value="english">English</option>
                                    <option value="german">German</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="form-section">
                        <h3 className="section-heading">Document Upload</h3>

                        <div className="form-grid">
                            {/* Passport Upload */}
                            <div className="form-group">
                                <label className="form-label required">Upload Passport</label>
                                <div className="upload-area">
                                    <p className="upload-instruction">Drop file to attach, or browse</p>
                                    <p className="upload-hint">jpg, jpeg, pdf and png. Please upload a file that is less than 5 MB.</p>
                                    
                                    {passportPreview ? (
                                        <div className="image-preview">
                                            <img src={passportPreview} alt="Passport preview" />
                                            <button
                                                type="button"
                                                className="remove-image-btn"
                                                onClick={() => handleRemoveFile('passport')}
                                                disabled={isSubmitting}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : hasFile('passport') ? (
                                        <div className="file-info">
                                            <i className="fas fa-file-pdf file-icon"></i>
                                            <div className="file-details">
                                                <span className="file-name">{getFileName('passport')}</span>
                                                {formData.passportFileSize && (
                                                    <span className="file-size">
                                                        {(formData.passportFileSize / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="remove-file-btn"
                                                onClick={() => handleRemoveFile('passport')}
                                                disabled={isSubmitting}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : null}
                                    
                                    <input
                                        type="file"
                                        id="passportUpload"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={(e) => handleFileChange(e, 'passport')}
                                        style={{ display: 'none' }}
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        className="upload-button"
                                        onClick={() => document.getElementById('passportUpload').click()}
                                        disabled={isSubmitting}
                                    >
                                        {hasFile('passport') ? 'Change File' : 'Browse'}
                                    </button>
                                </div>
                            </div>

                            {/* Photo Upload */}
                            <div className="form-group">
                                <label className="form-label required">Photograph</label>
                                <div className="upload-area">
                                    <p className="upload-instruction">Drop files to attach, or browse</p>
                                    <p className="upload-hint">jpg, jpeg, png. Please upload a file that is less than 5 MB.</p>
                                    
                                    {photoPreview ? (
                                        <div className="image-preview">
                                            <img src={photoPreview} alt="Photo preview" />
                                            <button
                                                type="button"
                                                className="remove-image-btn"
                                                onClick={() => handleRemoveFile('photograph')}
                                                disabled={isSubmitting}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : hasFile('photograph') ? (
                                        <div className="file-info">
                                            <i className="fas fa-image file-icon"></i>
                                            <div className="file-details">
                                                <span className="file-name">{getFileName('photograph')}</span>
                                                {formData.photographFileSize && (
                                                    <span className="file-size">
                                                        {(formData.photographFileSize / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="remove-file-btn"
                                                onClick={() => handleRemoveFile('photograph')}
                                                disabled={isSubmitting}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : null}
                                    
                                    <input
                                        type="file"
                                        id="photoUpload"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={(e) => handleFileChange(e, 'photograph')}
                                        style={{ display: 'none' }}
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        className="upload-button"
                                        onClick={() => document.getElementById('photoUpload').click()}
                                        disabled={isSubmitting}
                                    >
                                        {hasFile('photograph') ? 'Change Photo' : 'Browse'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Refer a Friend Scheme */}
                    <div className="form-section">
                        <h3 className="section-heading">Refer a Friend Scheme</h3>
                        
                        <div className="form-group full-width">
                            <label className="form-label">Are you applying for a Refer a Friend Scheme?</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="referFriend"
                                        value="no"
                                        checked={referFriend === 'no'}
                                        onChange={(e) => {
                                            setReferFriend(e.target.value);
                                            onInputChange('referFriend', e.target.value);
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    <span>No</span>
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="referFriend"
                                        value="yes"
                                        checked={referFriend === 'yes'}
                                        onChange={(e) => {
                                            setReferFriend(e.target.value);
                                            onInputChange('referFriend', e.target.value);
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    <span>Yes</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleBack}
                            disabled={isSubmitting}
                        >
                            ← Back
                        </button>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Next →'}
                        </button>
                    </div>

                    <div className="language-selector">
                        <span>English ▼</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplicationPersonal;