import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Overview.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const Overview = ({ formData, selectedCourseData, onStartApplication, onChangeCourse }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [overviewData, setOverviewData] = useState(null);
    const [courseDetails, setCourseDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Document requirements for each section (based on GUS portal)
    const documentRequirements = {
        personalInfo: [
            { name: 'Passport Copy', required: true, format: 'PDF/JPEG', maxSize: '5MB' },
            { name: 'Passport-sized Photo', required: true, format: 'JPEG/PNG', maxSize: '5MB' }
        ],
        addressInfo: [
            { name: 'Proof of Address', required: false, format: 'PDF/JPEG', maxSize: '5MB' }
        ],
        educationInfo: [
            { name: 'Higher Education Entrance Qualification', required: true, format: 'PDF/JPEG', maxSize: '5MB' },
            { name: 'Transcripts/Marksheets', required: true, format: 'PDF/JPEG', maxSize: '5MB' },
            { name: 'Bachelor Certificate (if applicable)', required: false, format: 'PDF/JPEG', maxSize: '5MB' }
        ],
        languageInfo: [
            { name: 'English Language Certificate', required: true, format: 'PDF/JPEG', maxSize: '5MB' },
            { name: 'German Language Certificate', required: false, format: 'PDF/JPEG', maxSize: '5MB' }
        ],
        additionalDocs: [
            { name: 'Curriculum Vitae (Signed & Dated)', required: true, format: 'PDF/JPEG', maxSize: '5MB' },
            { name: 'Portfolio', required: true, format: 'PDF/JPEG', maxSize: '5MB' },
            { name: 'No Objection Certificate', required: false, format: 'PDF/JPEG', maxSize: '5MB' },
            { name: 'De-registration Certificate', required: false, format: 'PDF/JPEG', maxSize: '5MB' },
            { name: 'Additional Supporting Documents', required: false, format: 'PDF/JPEG', maxSize: '5MB' }
        ]
    };

    // Application sections based on GUS portal
    const applicationSections = [
        { id: 'studyProgramme', name: 'Study Programme', icon: '🎓', route: '/firstyear/dashboard/application/programme' },
        { id: 'applicantDetails', name: 'Applicant Details', icon: '👤', route: '/firstyear/dashboard/application/personal' },
        { id: 'address', name: 'Address', icon: '📍', route: '/firstyear/dashboard/application/address' },
        { id: 'entranceQualification', name: 'Entrance qualification of higher education', icon: '📚', route: '/firstyear/dashboard/application/entrance-qualification' },
        { id: 'higherEducation', name: 'Higher Education', icon: '🏛️', route: '/firstyear/dashboard/application/firsteducation' },
        { id: 'applicationDocuments', name: 'Application Documents', icon: '📄', route: '/firstyear/dashboard/application/documents' },
        { id: 'specialNeeds', name: 'Students With Special Needs', icon: '🤝', route: '/firstyear/dashboard/application/special-needs' },
        { id: 'declaration', name: 'Declaration and Data Protection', icon: '✓', route: '/firstyear/dashboard/application/declaration' },
        { id: 'reviewSubmit', name: 'Review & Submit', icon: '🔍', route: '/firstyear/dashboard/application/review' }
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

    // Update section completion in backend
    const updateSectionCompletion = async (sectionId, isCompleted) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            
            await axios.put(`${API_URL}/api/overview/section`, {
                sectionId,
                isCompleted
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('❌ Error updating section completion:', error);
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
            applicantDetails: !!(formData?.firstName && formData?.lastName && formData?.email && formData?.dateOfBirth),
            address: !!(formData?.street && formData?.city && formData?.country && formData?.postcode),
            entranceQualification: !!(formData?.eqheDate && formData?.eqheCountry),
            higherEducation: formData?.hasHigherEducation !== undefined,
            applicationDocuments: !!(formData?.documents?.passport && formData?.documents?.photo),
            specialNeeds: formData?.hasSpecialNeeds !== undefined,
            declaration: formData?.privacyConsent === true,
            reviewSubmit: false
        };
        
        return completed;
    }, [formData, courseDetails]);

    // Calculate progress percentage
    const calculateProgress = useCallback(() => {
        const completed = getCompletedSections();
        const totalSections = applicationSections.length;
        const completedCount = Object.values(completed).filter(Boolean).length;
        return Math.round((completedCount / totalSections) * 100);
    }, [getCompletedSections]);

    // Handle navigation to section
    const handleSectionClick = (route) => {
        navigate(route);
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

    // Get document status for a section
    const getDocumentStatus = (sectionId) => {
        if (!formData?.documents) return { uploaded: 0, total: 0 };
        
        const docs = documentRequirements[sectionId] || [];
        let uploaded = 0;
        
        docs.forEach(doc => {
            if (formData.documents[doc.name.toLowerCase().replace(/\s+/g, '')]) {
                uploaded++;
            }
        });
        
        return { uploaded, total: docs.length };
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

    const currentProgress = calculateProgress();
    const completedSections = getCompletedSections();

    return (
        <div className="overview-container">
            {/* Header with Application ID */}
            <div className="overview-header">
                <div className="application-id">
                    APPLICATION ID - {overviewData?.applicationId || 'UEG0000104849'}
                </div>
                <div className="progress-badge">
                    {currentProgress}% Completed
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="overview-grid">
                {/* Left Column - Application Sections */}
                <div className="sections-column">
                    <h2 className="sections-title">Application Sections</h2>
                    
                    <div className="sections-list">
                        {applicationSections.map((section, index) => {
                            const isCompleted = completedSections[section.id];
                            const docStatus = getDocumentStatus(section.id);
                            
                            return (
                                <div 
                                    key={section.id}
                                    className={`section-item ${isCompleted ? 'completed' : ''} ${section.id === 'studyProgramme' ? 'active' : ''}`}
                                    onClick={() => handleSectionClick(section.route)}
                                >
                                    <div className="section-icon">{section.icon}</div>
                                    <div className="section-content">
                                        <div className="section-name">{section.name}</div>
                                        {docStatus.total > 0 && (
                                            <div className="document-status">
                                                <span className="doc-count">{docStatus.uploaded}/{docStatus.total}</span> documents uploaded
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
                            <span className="summary-value">
                                {Object.values(completedSections).filter(Boolean).length}/{applicationSections.length}
                            </span>
                        </div>
                        <div className="progress-bar-container">
                            <div 
                                className="progress-fill"
                                style={{ width: `${currentProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Course Details & Documents */}
                <div className="details-column">
                    {/* Selected Course Card */}
                    <div className="course-card">
                        <h3 className="card-title">
                            <span className="card-icon">🎓</span>
                            Selected Programme
                        </h3>
                        
                        <div className="course-info">
                            <div className="program-name">{courseDetails.programName}</div>
                            <div className="university-name">{courseDetails.universityName}</div>
                            
                            <div className="program-details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Programme type:</span>
                                    <span className="detail-value">Undergraduate</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Language:</span>
                                    <span className="detail-value">English</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Location:</span>
                                    <span className="detail-value">{courseDetails.campus || 'Berlin'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Duration:</span>
                                    <span className="detail-value">{courseDetails.programDetails?.duration || '3 years'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Study start date:</span>
                                    <span className="detail-value">{courseDetails.intakeMonth || 'September'} {courseDetails.intakeYear || '2024'}</span>
                                </div>
                            </div>
                            
                            <button 
                                className="change-course-link"
                                onClick={handleChangeCourse}
                            >
                                Change Course
                            </button>
                        </div>
                    </div>

                    {/* Required Documents Card */}
                    <div className="documents-card">
                        <h3 className="card-title">
                            <span className="card-icon">📋</span>
                            Required Documents
                        </h3>
                        
                        <div className="documents-list">
                            {/* Personal Info Documents */}
                            <div className="document-category">
                                <h4 className="category-title">Personal Information</h4>
                                {documentRequirements.personalInfo.map((doc, index) => (
                                    <div key={index} className="document-item">
                                        <div className="doc-info">
                                            <span className="doc-name">{doc.name}</span>
                                            <span className="doc-format">{doc.format}, max {doc.maxSize}</span>
                                        </div>
                                        <span className={`doc-required ${doc.required ? 'required' : 'optional'}`}>
                                            {doc.required ? 'Required' : 'Optional'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Education Documents */}
                            <div className="document-category">
                                <h4 className="category-title">Education</h4>
                                {documentRequirements.educationInfo.map((doc, index) => (
                                    <div key={index} className="document-item">
                                        <div className="doc-info">
                                            <span className="doc-name">{doc.name}</span>
                                            <span className="doc-format">{doc.format}, max {doc.maxSize}</span>
                                        </div>
                                        <span className={`doc-required ${doc.required ? 'required' : 'optional'}`}>
                                            {doc.required ? 'Required' : 'Optional'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Language Documents */}
                            <div className="document-category">
                                <h4 className="category-title">Language Certificates</h4>
                                {documentRequirements.languageInfo.map((doc, index) => (
                                    <div key={index} className="document-item">
                                        <div className="doc-info">
                                            <span className="doc-name">{doc.name}</span>
                                            <span className="doc-format">{doc.format}, max {doc.maxSize}</span>
                                        </div>
                                        <span className={`doc-required ${doc.required ? 'required' : 'optional'}`}>
                                            {doc.required ? 'Required' : 'Optional'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Additional Documents */}
                            <div className="document-category">
                                <h4 className="category-title">Additional Documents</h4>
                                {documentRequirements.additionalDocs.map((doc, index) => (
                                    <div key={index} className="document-item">
                                        <div className="doc-info">
                                            <span className="doc-name">{doc.name}</span>
                                            <span className="doc-format">{doc.format}, max {doc.maxSize}</span>
                                        </div>
                                        <span className={`doc-required ${doc.required ? 'required' : 'optional'}`}>
                                            {doc.required ? 'Required' : 'Optional'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="documents-note">
                            <strong>Note:</strong> All documents not in English or German must be professionally translated. 
                            Certified translations must be submitted along with a copy of the original document.
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        {currentProgress === 0 ? (
                            <button 
                                className="start-application-btn"
                                onClick={handleStartApplication}
                            >
                                Start Application
                            </button>
                        ) : (
                            <button 
                                className="continue-application-btn"
                                onClick={handleContinueApplication}
                            >
                                Continue Application ({currentProgress}%)
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;