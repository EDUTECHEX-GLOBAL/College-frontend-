import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Overview.css';

const API_URL = process.env.REACT_APP_API_URL;

const Overview = ({ formData, selectedCourseData, onStartApplication, onChangeCourse }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [overviewData, setOverviewData] = useState(null);
    const [courseDetails, setCourseDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({
        personalInfo: true,
        addressInfo: true,
        educationInfo: true,
        languageInfo: true,
        additionalDocs: true
    });
    const [showDocumentPreview, setShowDocumentPreview] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Check mobile view on resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setMobileMenuOpen(false);
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Document requirements for each section (based on GUS portal)
    const documentRequirements = {
        personalInfo: [
            { id: 'passport', name: 'Passport Copy', required: true, format: 'PDF/JPEG', maxSize: '5MB', description: 'Clear copy of your valid passport' },
            { id: 'photo', name: 'Passport-sized Photo', required: true, format: 'JPEG/PNG', maxSize: '5MB', description: 'Recent passport-sized photograph' }
        ],
        addressInfo: [
            { id: 'proofOfAddress', name: 'Proof of Address', required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'Utility bill or bank statement (last 3 months)' }
        ],
        educationInfo: [
            { id: 'entranceQualification', name: 'Higher Education Entrance Qualification', required: true, format: 'PDF/JPEG', maxSize: '5MB', description: 'High school diploma or equivalent' },
            { id: 'transcripts', name: 'Transcripts/Marksheets', required: true, format: 'PDF/JPEG', maxSize: '5MB', description: 'Academic transcripts from all institutions' },
            { id: 'bachelorCertificate', name: 'Bachelor Certificate', required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'If you have completed a Bachelor degree' }
        ],
        languageInfo: [
            { id: 'englishCertificate', name: 'English Language Certificate', required: true, format: 'PDF/JPEG', maxSize: '5MB', description: 'IELTS, TOEFL, or equivalent' },
            { id: 'germanCertificate', name: 'German Language Certificate', required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'Goethe-Zertifikat, TestDaF, or equivalent' }
        ],
        additionalDocs: [
            { id: 'cv', name: 'Curriculum Vitae', required: true, format: 'PDF/JPEG', maxSize: '5MB', description: 'Signed and dated CV' },
            { id: 'portfolio', name: 'Portfolio', required: true, format: 'PDF/JPEG', maxSize: '5MB', description: 'Portfolio if required by program' },
            { id: 'noc', name: 'No Objection Certificate', required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'If applicable' },
            { id: 'deRegistration', name: 'De-registration Certificate', required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'If previously enrolled' },
            { id: 'additional', name: 'Additional Supporting Documents', required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'Any other relevant documents' }
        ]
    };

    // Application sections based on GUS portal
    const applicationSections = [
        { id: 'studyProgramme', name: 'Study Programme', icon: '🎓', route: '/firstyear/dashboard/application/programme', description: 'Select your desired programme' },
        { id: 'applicantDetails', name: 'Applicant Details', icon: '👤', route: '/firstyear/dashboard/application/personal', description: 'Personal information and contact details' },
        { id: 'address', name: 'Address', icon: '📍', route: '/firstyear/dashboard/application/address', description: 'Current residential address' },
        { id: 'entranceQualification', name: 'Entrance Qualification', icon: '📚', route: '/firstyear/dashboard/application/entrance-qualification', description: 'Higher education entrance qualification' },
        { id: 'higherEducation', name: 'Higher Education', icon: '🏛️', route: '/firstyear/dashboard/application/firsteducation', description: 'Previous higher education details' },
        { id: 'applicationDocuments', name: 'Application Documents', icon: '📄', route: '/firstyear/dashboard/application/documents', description: 'Upload required documents' },
        { id: 'specialNeeds', name: 'Special Needs', icon: '🤝', route: '/firstyear/dashboard/application/special-needs', description: 'Students with special needs information' },
        { id: 'declaration', name: 'Declaration', icon: '✓', route: '/firstyear/dashboard/application/declaration', description: 'Declaration and data protection' },
        { id: 'reviewSubmit', name: 'Review & Submit', icon: '🔍', route: '/firstyear/dashboard/application/review', description: 'Review and submit your application' }
    ];

    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    // Fetch overview data from backend
    const fetchOverviewData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');
            const token = getAuthToken();
            
            if (!token) {
                console.log('No auth token found, using local data only');
                setIsLoading(false);
                return;
            }
            
            const response = await axios.get(`${API_URL}/api/overview`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success && response.data.overview) {
                setOverviewData(response.data.overview);
                
                // Set course details from backend if available
                if (response.data.overview.selectedCourse) {
                    setCourseDetails(response.data.overview.selectedCourse);
                } else if (selectedCourseData) {
                    setCourseDetails(selectedCourseData);
                    await saveCourseToBackend(selectedCourseData, token);
                } else {
                    const savedCourse = localStorage.getItem('currentSelectedCourse');
                    if (savedCourse) {
                        try {
                            const courseData = JSON.parse(savedCourse);
                            setCourseDetails(courseData);
                            await saveCourseToBackend(courseData, token);
                        } catch (error) {
                            console.error('Error loading course data:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error fetching overview data:', error);
            setError('Failed to load overview data');
            
            // Fallback to local data
            if (selectedCourseData) {
                setCourseDetails(selectedCourseData);
            } else {
                const savedCourse = localStorage.getItem('currentSelectedCourse');
                if (savedCourse) {
                    try {
                        const courseData = JSON.parse(savedCourse);
                        setCourseDetails(courseData);
                    } catch (error) {
                        console.error('Error loading course data:', error);
                    }
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [selectedCourseData]);

    // Save course to backend
    const saveCourseToBackend = async (courseData, token) => {
        try {
            await axios.post(`${API_URL}/api/overview/course`, courseData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('❌ Error saving course:', error);
        }
    };

    // Load overview data on component mount
    useEffect(() => {
        fetchOverviewData();
    }, [fetchOverviewData]);

    // Check which sections are completed based on formData
    const getCompletedSections = useCallback(() => {
        const completed = {
            studyProgramme: !!courseDetails,
            applicantDetails: !!(formData?.firstName && formData?.lastName && formData?.email && formData?.dateOfBirth && formData?.nationality),
            address: !!(formData?.street && formData?.city && formData?.country && formData?.postCode),
            entranceQualification: !!(formData?.eqheType && formData?.eqheDate && formData?.eqheCountry),
            higherEducation: formData?.hasHigherEducation !== undefined,
            applicationDocuments: !!(formData?.documents && Object.keys(formData.documents).length > 0),
            specialNeeds: formData?.hasSpecialNeeds !== undefined,
            declaration: formData?.privacyConsent === true && formData?.termsAccepted === true,
            reviewSubmit: false
        };
        
        return completed;
    }, [formData, courseDetails]);

    // Calculate progress percentage
    const calculateProgress = useCallback(() => {
        const completed = getCompletedSections();
        const totalSections = applicationSections.length;
        const completedCount = Object.values(completed).filter(Boolean).length;
        return {
            percentage: Math.round((completedCount / totalSections) * 100),
            completed: completedCount,
            total: totalSections,
            remaining: totalSections - completedCount
        };
    }, [getCompletedSections, applicationSections.length]);

    // Calculate section-specific progress
    const getSectionProgress = useCallback((sectionId) => {
        const completed = getCompletedSections();
        return completed[sectionId] ? 100 : 0;
    }, [getCompletedSections]);

    // Handle navigation to section
    const handleSectionClick = (route) => {
        navigate(route);
        if (isMobile) {
            setMobileMenuOpen(false);
        }
    };

    // Handle starting the application
    const handleStartApplication = () => {
        if (onStartApplication) {
            onStartApplication();
        } else {
            navigate('/firstyear/dashboard/application/programme');
        }
    };

    // Handle changing course
    const handleChangeCourse = () => {
        if (onChangeCourse) {
            onChangeCourse();
        } else {
            if (window.confirm('Do you want to select a different course? You will be redirected to course search.')) {
                navigate('/firstyear/dashboard/college-search');
            }
        }
    };

    // Handle continue to next incomplete section
    const handleContinueApplication = () => {
        const completed = getCompletedSections();
        const nextSection = applicationSections.find(section => !completed[section.id]);
        
        if (nextSection) {
            navigate(nextSection.route);
        } else {
            navigate('/firstyear/dashboard/application/review');
        }
    };

    // Toggle document category expansion
    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Handle document preview
    const handleDocumentPreview = (docId) => {
        if (formData?.documents && formData.documents[docId]) {
            setSelectedDocument({
                id: docId,
                name: documentRequirements.personalInfo.find(d => d.id === docId)?.name || 
                      documentRequirements.addressInfo.find(d => d.id === docId)?.name ||
                      documentRequirements.educationInfo.find(d => d.id === docId)?.name ||
                      documentRequirements.languageInfo.find(d => d.id === docId)?.name ||
                      documentRequirements.additionalDocs.find(d => d.id === docId)?.name,
                url: formData.documents[docId].url || URL.createObjectURL(formData.documents[docId])
            });
            setShowDocumentPreview(true);
        }
    };

    // Close document preview
    const closeDocumentPreview = () => {
        setShowDocumentPreview(false);
        setSelectedDocument(null);
    };

    // Get document status for a section
    const getDocumentStatus = (sectionId) => {
        if (!formData?.documents) return { uploaded: 0, total: 0, documents: [] };
        
        const docs = documentRequirements[sectionId] || [];
        let uploaded = 0;
        const uploadedDocs = [];
        
        docs.forEach(doc => {
            if (formData.documents[doc.id]) {
                uploaded++;
                uploadedDocs.push({
                    ...doc,
                    uploaded: true,
                    file: formData.documents[doc.id]
                });
            } else {
                uploadedDocs.push({
                    ...doc,
                    uploaded: false
                });
            }
        });
        
        return { uploaded, total: docs.length, documents: uploadedDocs };
    };

    // Get document icon based on file type
    const getDocumentIcon = (file) => {
        if (!file) return '📄';
        if (file.type?.includes('pdf')) return '📕';
        if (file.type?.includes('image')) return '🖼️';
        if (file.type?.includes('word')) return '📘';
        return '📄';
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Filter sections based on active filter
    const getFilteredSections = () => {
        const completed = getCompletedSections();
        
        if (activeFilter === 'pending') {
            return applicationSections.filter(section => !completed[section.id]);
        } else if (activeFilter === 'completed') {
            return applicationSections.filter(section => completed[section.id]);
        }
        return applicationSections;
    };

    if (isLoading && !courseDetails) {
        return (
            <div className="overview-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading your application overview...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="overview-container">
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Something went wrong</h3>
                    <p>{error}</p>
                    <button 
                        className="retry-btn"
                        onClick={fetchOverviewData}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!courseDetails) {
        return (
            <div className="overview-container">
                <div className="no-course-selected">
                    <div className="no-course-icon">🎓</div>
                    <h2>No Course Selected</h2>
                    <p>Please select a course to start your application</p>
                    <button 
                        className="select-course-btn"
                        onClick={() => navigate('/firstyear/dashboard/college-search')}
                    >
                        Browse Courses
                    </button>
                </div>
            </div>
        );
    }

    const progress = calculateProgress();
    const completedSections = getCompletedSections();
    const filteredSections = getFilteredSections();

    return (
        <div className="overview-container">
            {/* Mobile Header with Menu Toggle */}
            {isMobile && (
                <div className="mobile-header">
                    <button 
                        className="mobile-menu-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span className="menu-icon">☰</span>
                        <span className="menu-text">Menu</span>
                    </button>
                    <div className="mobile-progress">
                        <span className="mobile-progress-text">{progress.percentage}%</span>
                    </div>
                </div>
            )}

            {/* Header with Application ID and Stats */}
            <div className={`overview-header ${isMobile && !mobileMenuOpen ? 'hidden-mobile' : ''}`}>
                <div className="header-left">
                    <div className="application-id">
                        <span className="id-label">APPLICATION ID</span>
                        <span className="id-value">{overviewData?.applicationId || 'UEG0507062'}</span>
                    </div>
                </div>
                <div className="header-right">
                    <div className="status-wrapper">
                        <span className={`status-badge ${progress.percentage === 100 ? 'completed' : 'in-progress'}`}>
                            IN PROGRESS
                        </span>
                    </div>
                    <div className="stats-wrapper">
                        <div className="stat-item">
                            <span className="stat-label">COMPLETED</span>
                            <span className="stat-value">{progress.completed}/{progress.total}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">REMAINING</span>
                            <span className="stat-value">{progress.remaining}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="overview-grid">
                {/* Left Column - Application Sections */}
                <div className={`sections-column ${isMobile && !mobileMenuOpen ? 'hidden-mobile' : ''}`}>
                    <div className="sections-header">
                        <h2 className="sections-title">Application Sections</h2>
                        <div className="sections-filter">
                            <select 
                                className="filter-select"
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                            >
                                <option value="all">All Sections</option>
                                <option value="pending">Pending Only</option>
                                <option value="completed">Completed Only</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="sections-list">
                        {filteredSections.map((section, index) => {
                            const isCompleted = completedSections[section.id];
                            const sectionProgress = getSectionProgress(section.id);
                            
                            return (
                                <div 
                                    key={section.id}
                                    className={`section-item ${isCompleted ? 'completed' : ''} ${section.id === 'studyProgramme' ? 'active' : ''}`}
                                    onClick={() => handleSectionClick(section.route)}
                                >
                                    <div className="section-icon">{section.icon}</div>
                                    <div className="section-content">
                                        <div className="section-name">{section.name}</div>
                                        <div className="section-description">{section.description}</div>
                                        {!isCompleted && (
                                            <div className="section-progress">
                                                <div className="progress-bar-small">
                                                    <div 
                                                        className="progress-fill-small"
                                                        style={{ width: `${sectionProgress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="section-status">
                                        {isCompleted ? (
                                            <span className="status-badge completed">✓ Completed</span>
                                        ) : (
                                            <span className="status-badge pending">Pending</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress Summary */}
                    <div className="progress-summary">
                        <div className="summary-item">
                            <span className="summary-label">Sections Completed:</span>
                            <span className="summary-value">{progress.completed}/{progress.total}</span>
                        </div>
                        <div className="progress-bar-container">
                            <div 
                                className="progress-fill"
                                style={{ width: `${progress.percentage}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    {isMobile && (
                        <div className="mobile-action-buttons">
                            {progress.percentage === 0 ? (
                                <button 
                                    className="start-application-btn mobile-btn"
                                    onClick={handleStartApplication}
                                >
                                    <span className="btn-icon">🚀</span>
                                    Start Application
                                </button>
                            ) : (
                                <>
                                    <button 
                                        className="continue-application-btn mobile-btn"
                                        onClick={handleContinueApplication}
                                    >
                                        <span className="btn-icon">▶️</span>
                                        Continue ({progress.percentage}%)
                                    </button>
                                    {progress.percentage === 100 && (
                                        <button 
                                            className="submit-application-btn mobile-btn"
                                            onClick={() => navigate('/firstyear/dashboard/application/review')}
                                        >
                                            <span className="btn-icon">📤</span>
                                            Submit
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column - Course Details & Documents */}
                <div className={`details-column ${isMobile && !mobileMenuOpen ? 'hidden-mobile' : ''}`}>
                    {/* Selected Course Card */}
                    <div className="course-card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <span className="card-icon">🎓</span>
                                Selected Programme
                            </h3>
                            <button 
                                className="change-course-link"
                                onClick={handleChangeCourse}
                            >
                                Change Course
                            </button>
                        </div>
                        
                        <div className="course-info">
                            <div className="program-header">
                                <h4 className="program-name">{courseDetails.programName}</h4>
                                <div className="university-badge">{courseDetails.universityName}</div>
                            </div>
                            
                            <div className="program-details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Programme type:</span>
                                    <span className="detail-value">{courseDetails.programType || 'Undergraduate'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Language:</span>
                                    <span className="detail-value">{courseDetails.language || 'English'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Campus:</span>
                                    <span className="detail-value">{courseDetails.campus || 'Berlin'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Duration:</span>
                                    <span className="detail-value">{courseDetails.duration || '3 years'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Study start:</span>
                                    <span className="detail-value">{courseDetails.intakeMonth || 'September'} {courseDetails.intakeYear || '2024'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Application fee:</span>
                                    <span className="detail-value">{courseDetails.applicationFee || '€75'}</span>
                                </div>
                            </div>

                            {courseDetails.requirements && (
                                <div className="program-requirements">
                                    <h5 className="requirements-title">Program Requirements</h5>
                                    <ul className="requirements-list">
                                        {courseDetails.requirements.map((req, index) => (
                                            <li key={index}>{req}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Required Documents Card */}
                    <div className="documents-card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <span className="card-icon">📋</span>
                                Required Documents
                            </h3>
                            <button 
                                className="upload-more-btn"
                                onClick={() => navigate('/firstyear/dashboard/application/documents')}
                            >
                                Upload More
                            </button>
                        </div>
                        
                        <div className="documents-list">
                            {/* Personal Info Documents */}
                            <div className="document-category">
                                <div 
                                    className="category-header"
                                    onClick={() => toggleCategory('personalInfo')}
                                >
                                    <h4 className="category-title">Personal Information</h4>
                                    <span className="category-toggle">
                                        {expandedCategories.personalInfo ? '−' : '+'}
                                    </span>
                                </div>
                                {expandedCategories.personalInfo && (
                                    <div className="category-content">
                                        {getDocumentStatus('personalInfo').documents.map((doc, index) => (
                                            <div key={index} className={`document-item ${doc.uploaded ? 'uploaded' : ''}`}>
                                                <div className="document-icon">{getDocumentIcon(doc.file)}</div>
                                                <div className="document-info">
                                                    <div className="document-name-row">
                                                        <span className="document-name">{doc.name}</span>
                                                        <span className={`document-badge ${doc.required ? 'required' : 'optional'}`}>
                                                            {doc.required ? 'Required' : 'Optional'}
                                                        </span>
                                                    </div>
                                                    <div className="document-meta">
                                                        <span className="document-format">{doc.format}</span>
                                                        <span className="document-size">{doc.maxSize}</span>
                                                    </div>
                                                    {doc.description && (
                                                        <div className="document-description">{doc.description}</div>
                                                    )}
                                                    {doc.uploaded && (
                                                        <div className="document-uploaded-info">
                                                            <span className="uploaded-icon">✓</span>
                                                            <span className="uploaded-name">{doc.file?.name}</span>
                                                            <span className="uploaded-size">{formatFileSize(doc.file?.size)}</span>
                                                            <button 
                                                                className="preview-btn"
                                                                onClick={() => handleDocumentPreview(doc.id)}
                                                            >
                                                                Preview
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Education Documents */}
                            <div className="document-category">
                                <div 
                                    className="category-header"
                                    onClick={() => toggleCategory('educationInfo')}
                                >
                                    <h4 className="category-title">Education</h4>
                                    <span className="category-toggle">
                                        {expandedCategories.educationInfo ? '−' : '+'}
                                    </span>
                                </div>
                                {expandedCategories.educationInfo && (
                                    <div className="category-content">
                                        {getDocumentStatus('educationInfo').documents.map((doc, index) => (
                                            <div key={index} className={`document-item ${doc.uploaded ? 'uploaded' : ''}`}>
                                                <div className="document-icon">{getDocumentIcon(doc.file)}</div>
                                                <div className="document-info">
                                                    <div className="document-name-row">
                                                        <span className="document-name">{doc.name}</span>
                                                        <span className={`document-badge ${doc.required ? 'required' : 'optional'}`}>
                                                            {doc.required ? 'Required' : 'Optional'}
                                                        </span>
                                                    </div>
                                                    <div className="document-meta">
                                                        <span className="document-format">{doc.format}</span>
                                                        <span className="document-size">{doc.maxSize}</span>
                                                    </div>
                                                    {doc.description && (
                                                        <div className="document-description">{doc.description}</div>
                                                    )}
                                                    {doc.uploaded && (
                                                        <div className="document-uploaded-info">
                                                            <span className="uploaded-icon">✓</span>
                                                            <span className="uploaded-name">{doc.file?.name}</span>
                                                            <span className="uploaded-size">{formatFileSize(doc.file?.size)}</span>
                                                            <button 
                                                                className="preview-btn"
                                                                onClick={() => handleDocumentPreview(doc.id)}
                                                            >
                                                                Preview
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Language Documents */}
                            <div className="document-category">
                                <div 
                                    className="category-header"
                                    onClick={() => toggleCategory('languageInfo')}
                                >
                                    <h4 className="category-title">Language Certificates</h4>
                                    <span className="category-toggle">
                                        {expandedCategories.languageInfo ? '−' : '+'}
                                    </span>
                                </div>
                                {expandedCategories.languageInfo && (
                                    <div className="category-content">
                                        {getDocumentStatus('languageInfo').documents.map((doc, index) => (
                                            <div key={index} className={`document-item ${doc.uploaded ? 'uploaded' : ''}`}>
                                                <div className="document-icon">{getDocumentIcon(doc.file)}</div>
                                                <div className="document-info">
                                                    <div className="document-name-row">
                                                        <span className="document-name">{doc.name}</span>
                                                        <span className={`document-badge ${doc.required ? 'required' : 'optional'}`}>
                                                            {doc.required ? 'Required' : 'Optional'}
                                                        </span>
                                                    </div>
                                                    <div className="document-meta">
                                                        <span className="document-format">{doc.format}</span>
                                                        <span className="document-size">{doc.maxSize}</span>
                                                    </div>
                                                    {doc.description && (
                                                        <div className="document-description">{doc.description}</div>
                                                    )}
                                                    {doc.uploaded && (
                                                        <div className="document-uploaded-info">
                                                            <span className="uploaded-icon">✓</span>
                                                            <span className="uploaded-name">{doc.file?.name}</span>
                                                            <span className="uploaded-size">{formatFileSize(doc.file?.size)}</span>
                                                            <button 
                                                                className="preview-btn"
                                                                onClick={() => handleDocumentPreview(doc.id)}
                                                            >
                                                                Preview
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Additional Documents */}
                            <div className="document-category">
                                <div 
                                    className="category-header"
                                    onClick={() => toggleCategory('additionalDocs')}
                                >
                                    <h4 className="category-title">Additional Documents</h4>
                                    <span className="category-toggle">
                                        {expandedCategories.additionalDocs ? '−' : '+'}
                                    </span>
                                </div>
                                {expandedCategories.additionalDocs && (
                                    <div className="category-content">
                                        {getDocumentStatus('additionalDocs').documents.map((doc, index) => (
                                            <div key={index} className={`document-item ${doc.uploaded ? 'uploaded' : ''}`}>
                                                <div className="document-icon">{getDocumentIcon(doc.file)}</div>
                                                <div className="document-info">
                                                    <div className="document-name-row">
                                                        <span className="document-name">{doc.name}</span>
                                                        <span className={`document-badge ${doc.required ? 'required' : 'optional'}`}>
                                                            {doc.required ? 'Required' : 'Optional'}
                                                        </span>
                                                    </div>
                                                    <div className="document-meta">
                                                        <span className="document-format">{doc.format}</span>
                                                        <span className="document-size">{doc.maxSize}</span>
                                                    </div>
                                                    {doc.description && (
                                                        <div className="document-description">{doc.description}</div>
                                                    )}
                                                    {doc.uploaded && (
                                                        <div className="document-uploaded-info">
                                                            <span className="uploaded-icon">✓</span>
                                                            <span className="uploaded-name">{doc.file?.name}</span>
                                                            <span className="uploaded-size">{formatFileSize(doc.file?.size)}</span>
                                                            <button 
                                                                className="preview-btn"
                                                                onClick={() => handleDocumentPreview(doc.id)}
                                                            >
                                                                Preview
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="documents-note">
                            <strong>📌 Important Note:</strong> All documents not in English or German must be professionally translated. 
                            Certified translations must be submitted along with a copy of the original document.
                        </div>
                    </div>

                    {/* Desktop Action Buttons */}
                    {!isMobile && (
                        <div className="action-buttons">
                            {progress.percentage === 0 ? (
                                <button 
                                    className="start-application-btn"
                                    onClick={handleStartApplication}
                                >
                                    <span className="btn-icon">🚀</span>
                                    Start Application
                                </button>
                            ) : (
                                <>
                                    <button 
                                        className="continue-application-btn"
                                        onClick={handleContinueApplication}
                                    >
                                        <span className="btn-icon">▶️</span>
                                        Continue Application ({progress.percentage}%)
                                    </button>
                                    {progress.percentage === 100 && (
                                        <button 
                                            className="submit-application-btn"
                                            onClick={() => navigate('/firstyear/dashboard/application/review')}
                                        >
                                            <span className="btn-icon">📤</span>
                                            Review & Submit
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Application Tips */}
                    <div className="tips-card">
                        <h3 className="card-title">
                            <span className="card-icon">💡</span>
                            Application Tips
                        </h3>
                        <ul className="tips-list">
                            <li>✓ Ensure all documents are clear and legible</li>
                            <li>✓ Check document formats (PDF/JPEG only)</li>
                            <li>✓ Maximum file size per document is 5MB</li>
                            <li>✓ All required fields must be completed</li>
                            <li>✓ Review your application before submission</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Document Preview Modal */}
            {showDocumentPreview && selectedDocument && (
                <div className="modal-overlay" onClick={closeDocumentPreview}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedDocument.name}</h3>
                            <button className="close-btn" onClick={closeDocumentPreview}>×</button>
                        </div>
                        <div className="modal-body">
                            {selectedDocument.url && (
                                <iframe 
                                    src={selectedDocument.url}
                                    title={selectedDocument.name}
                                    className="document-preview"
                                />
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="download-btn" onClick={() => window.open(selectedDocument.url, '_blank')}>
                                Download
                            </button>
                            <button className="close-btn" onClick={closeDocumentPreview}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Overview;