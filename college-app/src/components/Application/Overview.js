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
                    // Use passed course data
                    setCourseDetails(selectedCourseData);
                    // Save to backend
                    await saveCourseToBackend(selectedCourseData, token);
                } else {
                    // Try to load from localStorage
                    const savedCourse = localStorage.getItem('currentSelectedCourse');
                    if (savedCourse) {
                        try {
                            const courseData = JSON.parse(savedCourse);
                            setCourseDetails(courseData);
                            // Save to backend
                            await saveCourseToBackend(courseData, token);
                        } catch (error) {
                            console.error('Error loading course data:', error);
                        }
                    }
                }
                
                console.log('✅ Overview data loaded:', response.data.overview);
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
            console.log('✅ Course saved to backend');
        } catch (error) {
            console.error('❌ Error saving course:', error);
        }
    };

    // Update field completion in backend
    const updateFieldCompletion = async (section, field, isCompleted) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            
            await axios.put(`${API_URL}/api/overview/field`, {
                section,
                field,
                isCompleted
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('❌ Error updating field completion:', error);
        }
    };

    // Load overview data on component mount
    useEffect(() => {
        fetchOverviewData();
    }, [fetchOverviewData]);

    // Update field completion when formData changes
    useEffect(() => {
        if (formData && overviewData) {
            // Update personal info fields
            if (formData.firstName) {
                updateFieldCompletion('personalInfo', 'firstName', true);
            }
            if (formData.lastName) {
                updateFieldCompletion('personalInfo', 'lastName', true);
            }
            if (formData.dob) {
                updateFieldCompletion('personalInfo', 'dob', true);
            }
            if (formData.email) {
                updateFieldCompletion('personalInfo', 'email', true);
            }
            
            // Update address fields
            if (formData.currentAddress) {
                updateFieldCompletion('addressInfo', 'currentAddress', true);
            }
            if (formData.city) {
                updateFieldCompletion('addressInfo', 'city', true);
            }
            if (formData.country) {
                updateFieldCompletion('addressInfo', 'country', true);
            }
            
            // Update education fields
            if (formData.qualificationLevel) {
                updateFieldCompletion('educationInfo', 'qualificationLevel', true);
            }
            if (formData.institutionName) {
                updateFieldCompletion('educationInfo', 'institutionName', true);
            }
            
            // Update language fields
            if (formData.englishTestType) {
                updateFieldCompletion('languageInfo', 'englishTestType', true);
            }
            if (formData.testScore) {
                updateFieldCompletion('languageInfo', 'testScore', true);
            }
        }
    }, [formData, overviewData]);

    // Calculate progress
    const calculateProgress = useCallback(() => {
        // Use backend progress if available
        if (overviewData?.progress?.percentage !== undefined) {
            return overviewData.progress.percentage;
        }
        
        // Fallback to local calculation
        if (!formData) return 0;
        
        let completedFields = 0;
        let totalFields = 0;

        const personalFields = ['firstName', 'lastName', 'dob', 'email'];
        totalFields += personalFields.length;
        completedFields += personalFields.filter(field => formData[field]).length;

        const addressFields = ['currentAddress', 'city', 'country'];
        totalFields += addressFields.length;
        completedFields += addressFields.filter(field => formData[field]).length;

        const educationFields = ['qualificationLevel', 'institutionName'];
        totalFields += educationFields.length;
        completedFields += educationFields.filter(field => formData[field]).length;

        const languageFields = ['englishTestType', 'testScore'];
        totalFields += languageFields.length;
        completedFields += languageFields.filter(field => formData[field]).length;

        return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    }, [formData, overviewData]);

    // Handle starting the application
    const handleStartApplication = () => {
        if (onStartApplication) {
            onStartApplication();
        } else {
            navigate('/firstyear/dashboard/application/personal');
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

    // Handle continue application
    const handleContinueApplication = () => {
        if (!formData && !overviewData) {
            navigate('/firstyear/dashboard/application/personal');
            return;
        }
        
        // Use backend steps or fallback to field checks
        if (overviewData?.steps) {
            const nextIncompleteStep = overviewData.steps.find(step => !step.completed);
            if (nextIncompleteStep && nextIncompleteStep.route) {
                navigate(nextIncompleteStep.route);
                return;
            }
        }
        
        // Fallback logic
        if (!formData) {
            navigate('/firstyear/dashboard/application/personal');
        } else if (!formData.firstName || !formData.lastName) {
            navigate('/firstyear/dashboard/application/personal');
        } else if (!formData.currentAddress || !formData.city) {
            navigate('/firstyear/dashboard/application/address');
        } else if (!formData.qualificationLevel || !formData.institutionName) {
            navigate('/firstyear/dashboard/application/firsteducation');
        } else if (!formData.englishTestType || !formData.testScore) {
            navigate('/firstyear/dashboard/application/language');
        } else {
            navigate('/firstyear/dashboard/application/firstcourses');
        }
    };

    // Check if field is completed
    const isFieldCompleted = (field) => {
        // Check backend data first
        if (overviewData?.completedFields) {
            if (overviewData.completedFields.personalInfo[field] !== undefined) {
                return overviewData.completedFields.personalInfo[field];
            }
            if (overviewData.completedFields.addressInfo[field] !== undefined) {
                return overviewData.completedFields.addressInfo[field];
            }
            if (overviewData.completedFields.educationInfo[field] !== undefined) {
                return overviewData.completedFields.educationInfo[field];
            }
            if (overviewData.completedFields.languageInfo[field] !== undefined) {
                return overviewData.completedFields.languageInfo[field];
            }
        }
        
        // Fallback to formData
        if (!formData) return false;
        const value = formData[field];
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim() !== '';
        if (typeof value === 'boolean') return true;
        if (typeof value === 'number') return true;
        return !!value;
    };

    // Refresh overview data
    const handleRefresh = () => {
        fetchOverviewData();
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
                    <div className="refresh-section">
                        <button 
                            className="refresh-btn"
                            onClick={handleRefresh}
                            disabled={isLoading}
                        >
                            <i className="fas fa-sync-alt"></i> Refresh Data
                        </button>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                </div>
            </div>
        );
    }

    const currentProgress = calculateProgress();

    return (
        <div className="overview-container">
            {/* Header Section */}
            <div className="overview-header">
                <div className="header-content">
                    <div>
                        <h1>Application Overview</h1>
                        <p>Review your selected course and complete your application</p>
                        {overviewData?.applicationStatus && (
                            <div className={`application-status status-${overviewData.applicationStatus}`}>
                                Status: <span>{overviewData.applicationStatus.replace('_', ' ').toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                    <div className="header-actions">
                        <button 
                            className="refresh-btn"
                            onClick={handleRefresh}
                            disabled={isLoading}
                            title="Refresh overview data"
                        >
                            <i className="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Selected Course Card */}
            <div className="course-card">
                <div className="course-card-header">
                    <div className="university-info">
                        <div className="university-logo">
                            {courseDetails.universityLogo ? (
                                <img src={courseDetails.universityLogo} alt={courseDetails.universityName} />
                            ) : (
                                <div className="logo-placeholder">
                                    {courseDetails.universityName?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="university-details">
                            <h2>{courseDetails.universityName}</h2>
                            <div className="university-meta">
                                <span className="location">
                                    <i className="fas fa-map-marker-alt"></i> 
                                    {courseDetails.campus || courseDetails.country || 'Multiple Campuses'}
                                </span>
                                <span className="ranking">
                                    <i className="fas fa-star"></i> 
                                    {courseDetails.ranking || 'Top Ranked'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="course-actions">
                        <button 
                            className="change-course-btn"
                            onClick={handleChangeCourse}
                            disabled={isLoading}
                        >
                            <i className="fas fa-exchange-alt"></i> Change Course
                        </button>
                    </div>
                </div>

                <div className="course-card-body">
                    <div className="course-details-section">
                        <h3>Selected Program</h3>
                        <div className="program-details">
                            <div className="program-name">
                                <strong>{courseDetails.programName}</strong>
                            </div>
                            <div className="program-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Level:</span>
                                    <span className="meta-value">{courseDetails.programDetails?.level || 'Undergraduate'}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Duration:</span>
                                    <span className="meta-value">{courseDetails.programDetails?.duration || '3-4 years'}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Study Mode:</span>
                                    <span className="meta-value">{courseDetails.programDetails?.studyMode || 'Full Time'}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Intake:</span>
                                    <span className="meta-value">
                                        {courseDetails.intakeMonth || 'September'} {courseDetails.intakeYear || '2024'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Progress Section */}
            <div className="progress-section">
                <div className="progress-header">
                    <h3>Application Progress</h3>
                    <div className="progress-info">
                        <span className="progress-percentage">{currentProgress}% Complete</span>
                        <span className="progress-source">
                            {overviewData ? '✓ Synced with server' : 'Using local data'}
                        </span>
                    </div>
                </div>
                
                <div className="progress-bar">
                    <div 
                        className="progress-fill"
                        style={{ width: `${currentProgress}%` }}
                    ></div>
                </div>
                
                <div className="progress-steps">
                    {overviewData?.steps?.slice(0, 4).map((step, index) => (
                        <div key={step.stepId} className={`progress-step ${step.completed ? 'completed' : ''}`}>
                            <div className="step-icon">
                                {step.completed ? '✓' : index + 1}
                            </div>
                            <div className="step-info">
                                <div className="step-title">{step.title}</div>
                                <div className="step-status">
                                    {step.completed ? 'Completed' : 'Pending'}
                                </div>
                            </div>
                        </div>
                    )) || (
                        <>
                            <div className={`progress-step ${isFieldCompleted('firstName') && isFieldCompleted('lastName') ? 'completed' : ''}`}>
                                <div className="step-icon">
                                    {isFieldCompleted('firstName') && isFieldCompleted('lastName') ? '✓' : '1'}
                                </div>
                                <div className="step-info">
                                    <div className="step-title">Personal Information</div>
                                    <div className="step-status">
                                        {isFieldCompleted('firstName') && isFieldCompleted('lastName') ? 'Completed' : 'Pending'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`progress-step ${isFieldCompleted('currentAddress') && isFieldCompleted('city') ? 'completed' : ''}`}>
                                <div className="step-icon">
                                    {isFieldCompleted('currentAddress') && isFieldCompleted('city') ? '✓' : '2'}
                                </div>
                                <div className="step-info">
                                    <div className="step-title">Address & ID</div>
                                    <div className="step-status">
                                        {isFieldCompleted('currentAddress') && isFieldCompleted('city') ? 'Completed' : 'Pending'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`progress-step ${isFieldCompleted('qualificationLevel') && isFieldCompleted('institutionName') ? 'completed' : ''}`}>
                                <div className="step-icon">
                                    {isFieldCompleted('qualificationLevel') && isFieldCompleted('institutionName') ? '✓' : '3'}
                                </div>
                                <div className="step-info">
                                    <div className="step-title">Education</div>
                                    <div className="step-status">
                                        {isFieldCompleted('qualificationLevel') && isFieldCompleted('institutionName') ? 'Completed' : 'Pending'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`progress-step ${isFieldCompleted('englishTestType') && isFieldCompleted('testScore') ? 'completed' : ''}`}>
                                <div className="step-icon">
                                    {isFieldCompleted('englishTestType') && isFieldCompleted('testScore') ? '✓' : '4'}
                                </div>
                                <div className="step-info">
                                    <div className="step-title">Language Proficiency</div>
                                    <div className="step-status">
                                        {isFieldCompleted('englishTestType') && isFieldCompleted('testScore') ? 'Completed' : 'Pending'}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                {currentProgress === 0 ? (
                    <button 
                        className="start-application-btn primary"
                        onClick={handleStartApplication}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner"></span> Loading...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-play-circle"></i> Start Application
                            </>
                        )}
                    </button>
                ) : (
                    <button 
                        className="continue-application-btn primary"
                        onClick={handleContinueApplication}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner"></span> Loading...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-arrow-right"></i> Continue Application ({currentProgress}%)
                            </>
                        )}
                    </button>
                )}
                
                <button 
                    className="preview-application-btn secondary"
                    onClick={() => navigate('/firstyear/dashboard/application/preview')}
                    disabled={isLoading}
                >
                    <i className="fas fa-eye"></i> Preview Application
                </button>
                
                <button 
                    className="download-summary-btn secondary"
                    onClick={() => alert('Download feature coming soon!')}
                    disabled={isLoading}
                >
                    <i className="fas fa-download"></i> Download Summary
                </button>
            </div>

            {/* Additional Information */}
            <div className="additional-info">
                <div className="info-card">
                    <div className="info-icon">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="info-content">
                        <h4>Application Deadline</h4>
                        <p>{courseDetails.deadline || '31 August 2024'}</p>
                    </div>
                </div>
                
                <div className="info-card">
                    <div className="info-icon">
                        <i className="fas fa-file-alt"></i>
                    </div>
                    <div className="info-content">
                        <h4>Required Documents</h4>
                        <p>Transcripts, Passport, English Test, SOP, LORs</p>
                    </div>
                </div>
                
                <div className="info-card">
                    <div className="info-icon">
                        <i className="fas fa-question-circle"></i>
                    </div>
                    <div className="info-content">
                        <h4>Need Help?</h4>
                        <p>Contact our admission counselors</p>
                        <button 
                            className="help-btn"
                            onClick={() => alert('Support contact: admissions@gus.edu')}
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;