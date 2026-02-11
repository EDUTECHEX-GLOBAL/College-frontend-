import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import './Application.css';
import ApplicationPersonal from './ApplicationPersonal';
import ApplicationAddress from './ApplicationAddress';
import ApplicationEducation from './ApplicationFirstEducation';
import ApplicationLanguage from './ApplicationLanguage';
import ApplicationWork from './ApplicationWork';
import ApplicationCourse from './ApplicationFirstCourse';
import ApplicationDocuments from './ApplicationDocuments';
import ApplicationPreview from './ApplicationPreview';
import Overview from './Overview'; // Import the Overview component

const Application = () => {
    const { step } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if coming from Courses page with selected course
    const [hasSelectedCourse, setHasSelectedCourse] = useState(false);
    const [selectedCourseData, setSelectedCourseData] = useState(null);
    
    // Initialize currentStep from URL or default to 0 (Overview)
    const [currentStep, setCurrentStep] = useState(() => {
        // Parse step from URL path
        const path = location.pathname;
        const basePath = '/firstyear/dashboard/application';
        
        // Check if we're at the base path (Overview)
        if (path === basePath || path === `${basePath}/` || !path.includes('/application/')) {
            return 0; // Overview
        }
        
        if (path.includes('/firstcourses') || path.includes('/courses')) return 6;
        if (path.includes('/firsteducation')) return 3;
        if (path.includes('/personal')) return 1;
        if (path.includes('/address')) return 2;
        if (path.includes('/language')) return 4;
        if (path.includes('/work')) return 5;
        if (path.includes('/documents')) return 7;
        if (path.includes('/preview')) return 8;
        return 0; // Default to Overview
    });
    
    const [formData, setFormData] = useState({
        // Personal Information
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        nationality: '',
        countryOfResidence: '',
        email: '',
        mobile: '',
        alternateContact: '',
        passport: null,
        photograph: null,
        
        // Address & Identification
        currentAddress: '',
        permanentAddress: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        nationalId: null,
        
        // Educational Background
        qualificationLevel: '',
        institutionName: '',
        boardUniversity: '',
        countryOfStudy: '',
        startYear: '',
        endYear: '',
        resultStatus: '',
        gradingSystem: '',
        transcripts: null,
        degreeCertificate: null,
        
        // English Language Proficiency
        englishTestType: '',
        testScore: '',
        testDate: '',
        testScorecard: null,
        moiLetter: null,
        
        // Work Experience
        isEmployed: '',
        organizationName: '',
        jobTitle: '',
        workDuration: '',
        responsibilities: '',
        resume: null,
        experienceLetters: null,
        
        // Course Selection
        selectedCountry: '',
        selectedUniversity: '',
        campus: '',
        programLevel: '',
        courseName: '',
        intakeMonth: '',
        intakeYear: '',
        studyMode: '',
        secondPreference: '',
        thirdPreference: '',
        // Array for multiple selected programs
        selectedPrograms: [],
        
        // Supporting Documents
        sop: null,
        lor1: null,
        lor2: null,
        portfolio: null,
        researchProposal: null,
        
        // Declaration
        agreedToTerms: false
    });

    const steps = [
        { id: 0, title: 'Overview', path: '', component: Overview },
        { id: 1, title: 'Personal Information', path: 'personal', component: ApplicationPersonal },
        { id: 2, title: 'Address & ID', path: 'address', component: ApplicationAddress },
        { id: 3, title: 'Education', path: 'firsteducation', component: ApplicationEducation },
        { id: 4, title: 'Language', path: 'language', component: ApplicationLanguage },
        { id: 5, title: 'Work Experience', path: 'work', component: ApplicationWork },
        { id: 6, title: 'Course Selection', path: 'firstcourses', component: ApplicationCourse },
        { id: 7, title: 'Documents', path: 'documents', component: ApplicationDocuments },
        { id: 8, title: 'Preview', path: 'preview', component: ApplicationPreview }
    ];

    // Helper function to calculate progress percentage
    const calculateProgress = useCallback(() => {
        // Calculate based on filled steps
        const completedSteps = steps.filter((stepItem, index) => {
            if (index < currentStep) return true;
            
            // Check if current step is completed
            if (index + 1 === currentStep) {
                return isStepCompleted(currentStep);
            }
            
            return false;
        }).length;
        
        return Math.round((completedSteps / steps.length) * 100);
    }, [currentStep, steps.length]);

    // Check if a step is completed
    const isStepCompleted = useCallback((stepId) => {
        switch (stepId) {
            case 0: // Overview
                return true; // Always considered completed for navigation
            case 1: // Personal Information
                return formData.firstName && formData.lastName && formData.dob && formData.email;
            case 2: // Address & ID
                return formData.currentAddress && formData.city && formData.country;
            case 3: // Education
                return formData.qualificationLevel && formData.institutionName;
            case 4: // Language
                return formData.englishTestType && formData.testScore;
            case 5: // Work Experience
                return true; // Optional step
            case 6: // Course Selection
                return formData.selectedPrograms && formData.selectedPrograms.length > 0;
            case 7: // Documents
    return (
        formData.sop &&
        formData.lor1 &&
        formData.lor2
    );

            case 8: // Preview
                return formData.agreedToTerms;
            default:
                return false;
        }
    }, [formData]);

    // Save form data to localStorage
   const saveToLocalStorage = useCallback(() => {
    // ❌ Remove File objects before saving
    const {
        sop,
        lor1,
        lor2,
        portfolio,
        researchProposal,
        passport,
        photograph,
        nationalId,
        transcripts,
        degreeCertificate,
        testScorecard,
        moiLetter,
        resume,
        experienceLetters,
        ...safeFormData
    } = formData;

    // ✅ Save only serializable data
    localStorage.setItem(
        'gusApplicationData',
        JSON.stringify(safeFormData)
    );

    // Save selected course separately
    if (safeFormData.selectedPrograms?.length > 0) {
        localStorage.setItem(
            'currentSelectedCourse',
            JSON.stringify(safeFormData.selectedPrograms[0])
        );
    }

    // Update user progress
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
        try {
            const userData = JSON.parse(userDataStr);
            const applicationProgress = calculateProgress();

            localStorage.setItem(
                'userData',
                JSON.stringify({
                    ...userData,
                    applicationProgress: {
                        ...userData.applicationProgress,
                        application: applicationProgress
                    }
                })
            );

            window.dispatchEvent(new Event('applicationUpdated'));
        } catch (err) {
            console.error('Error updating user data:', err);
        }
    }
}, [formData, calculateProgress]);


    // Check if coming from Courses page on initial mount
    useEffect(() => {
        // Check if there's a selected course from Courses page
        const selectedCourseData = localStorage.getItem('selectedCourseForApplication');
        
        // Check location state first
        if (location.state?.fromCoursesPage) {
            console.log('🎯 Coming from Courses page via location state');
            
            if (selectedCourseData) {
                try {
                    const courseData = JSON.parse(selectedCourseData);
                    console.log('📋 Loaded course data:', courseData);
                    
                    // Store course data for later use
                    setSelectedCourseData(courseData);
                    
                    // Update form data with course information
                    setFormData(prev => ({
                        ...prev,
                        selectedCountry: courseData.country || '',
                        selectedUniversity: courseData.universityName || '',
                        campus: courseData.campus || '',
                        programLevel: courseData.programDetails?.level || '',
                        courseName: courseData.programName || '',
                        intakeMonth: courseData.intakeMonth || '',
                        intakeYear: courseData.intakeYear || '',
                        studyMode: courseData.programDetails?.studyMode || '',
                        selectedPrograms: [courseData]
                    }));
                    
                    setHasSelectedCourse(true);
                    
                    // Set current step to 6 if not already there
                    const path = location.pathname;
                    if (!path.includes('/firstcourses') && !path.includes('/courses')) {
                        // Navigate to course selection step
                        const pathParts = window.location.pathname.split('/');
                        const basePath = pathParts.slice(0, -1).join('/');
                        navigate(`${basePath}/firstcourses`, { 
                            replace: true,
                            state: { fromCoursesPage: true }
                        });
                    }
                    
                    // Show welcome message
                    setTimeout(() => {
                        alert(`🎓 Welcome to the University Application!\n\nYour selected course "${courseData.programName}" has been pre-filled.\n\nPlease complete the remaining steps to submit your application.`);
                    }, 500);
                    
                    // Clear the selected course data from localStorage
                    localStorage.removeItem('selectedCourseForApplication');
                } catch (error) {
                    console.error('Error parsing course data:', error);
                }
            }
        } else if (selectedCourseData) {
            // Check if we have saved course data even without location state
            try {
                const courseData = JSON.parse(selectedCourseData);
                if (courseData.programName) {
                    console.log('📋 Found saved course data:', courseData.programName);
                    setSelectedCourseData(courseData);
                    setHasSelectedCourse(true);
                    
                    // Update form data
                    setFormData(prev => ({
                        ...prev,
                        selectedCountry: courseData.country || '',
                        selectedUniversity: courseData.universityName || '',
                        campus: courseData.campus || '',
                        programLevel: courseData.programDetails?.level || '',
                        courseName: courseData.programName || '',
                        intakeMonth: courseData.intakeMonth || '',
                        intakeYear: courseData.intakeYear || '',
                        studyMode: courseData.programDetails?.studyMode || '',
                        selectedPrograms: [courseData]
                    }));
                }
            } catch (error) {
                console.error('Error parsing saved course data:', error);
            }
        }
        
        // Check for existing selected course in current application
        const currentSelectedCourse = localStorage.getItem('currentSelectedCourse');
        if (currentSelectedCourse && !selectedCourseData) {
            try {
                const courseData = JSON.parse(currentSelectedCourse);
                if (courseData.programName) {
                    setSelectedCourseData(courseData);
                    setHasSelectedCourse(true);
                }
            } catch (error) {
                console.error('Error parsing current selected course:', error);
            }
        }
    }, [location.state, navigate, location.pathname]);

    // Update current step when URL changes
    useEffect(() => {
        const path = location.pathname;
        const basePath = '/firstyear/dashboard/application';
        
        // Check if we're at the base path (Overview)
        if (path === basePath || path === `${basePath}/` || !path.includes('/application/')) {
            setCurrentStep(0); // Overview
        } else if (path.includes('/firstcourses') || path.includes('/courses')) {
            setCurrentStep(6);
        } else if (path.includes('/firsteducation')) {
            setCurrentStep(3);
        } else if (path.includes('/personal')) {
            setCurrentStep(1);
        } else if (path.includes('/address')) {
            setCurrentStep(2);
        } else if (path.includes('/language')) {
            setCurrentStep(4);
        } else if (path.includes('/work')) {
            setCurrentStep(5);
        } else if (path.includes('/documents')) {
            setCurrentStep(7);
        } else if (path.includes('/preview')) {
            setCurrentStep(8);
        }
    }, [location.pathname]);

    // Load saved data from localStorage on component mount
  useEffect(() => {
  const savedData = localStorage.getItem('gusApplicationData');

  if (!savedData) return;

  try {
    const parsedData = JSON.parse(savedData);

    setFormData(prev => ({
      ...prev,
      ...parsedData
    }));

    if (parsedData.selectedPrograms?.length) {
      setHasSelectedCourse(true);
      setSelectedCourseData(parsedData.selectedPrograms[0]);
    }
  } catch (e) {
    console.error('Error loading saved data', e);
  }
}, []);



    // Function to navigate directly to a specific step
    const navigateToStep = useCallback((stepId) => {
        const stepData = steps.find(s => s.id === stepId);
        if (stepData) {
            const pathParts = window.location.pathname.split('/');
            const basePath = pathParts.slice(0, -1).join('/');
            
            if (stepId === 0) {
                // Navigate to Overview (base path)
                navigate(basePath || '/firstyear/dashboard/application');
            } else {
                navigate(`${basePath}/${stepData.path}`);
            }
        }
    }, [navigate, steps]);

    // Function to navigate directly to Course Selection
    const navigateToCourseSelection = useCallback(() => {
        navigateToStep(6);
    }, [navigateToStep]);

    // Function to navigate back to dashboard
    const navigateToDashboard = useCallback(() => {
        if (window.confirm('Are you sure you want to go back to dashboard? Your progress will be saved.')) {
            saveToLocalStorage();
            navigate('/firstyear/dashboard');
        }
    }, [navigate, saveToLocalStorage]);

    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            const newStep = currentStep + 1;
            navigateToStep(newStep);
            
            // Save data to localStorage for progress tracking
            saveToLocalStorage();
        }
    }, [currentStep, steps.length, navigateToStep, saveToLocalStorage]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) {
            const newStep = currentStep - 1;
            navigateToStep(newStep);
        }
    }, [currentStep, navigateToStep]);

    const handleInputChange = useCallback((field, value) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
}, []);


    const handleFileUpload = useCallback((field, file) => {
    setFormData(prev => ({
        ...prev,
        [field]: file
    }));
}, []);


    // Function to handle course selection from Courses page
    const handleCourseSelection = useCallback((courseData) => {
        console.log('🎯 Course selected for application:', courseData);
        
        // Update form data
      setFormData(prev => ({
  ...prev,
  selectedCountry: prev.selectedCountry || courseData.country || '',
  selectedUniversity: prev.selectedUniversity || courseData.universityName || '',
  campus: prev.campus || courseData.campus || '',
  programLevel: prev.programLevel || courseData.programDetails?.level || '',
  courseName: prev.courseName || courseData.programName || '',
  intakeMonth: prev.intakeMonth || courseData.intakeMonth || '',
  intakeYear: prev.intakeYear || courseData.intakeYear || '',
  studyMode: prev.studyMode || courseData.programDetails?.studyMode || '',
  selectedPrograms: prev.selectedPrograms.length
    ? prev.selectedPrograms
    : [courseData]
}));

        
        setSelectedCourseData(courseData);
        setHasSelectedCourse(true);
        
        // Save to localStorage
        localStorage.setItem('selectedCourseForApplication', JSON.stringify(courseData));
        saveToLocalStorage();
        
        // Navigate to Course Selection step
        navigateToCourseSelection();
        
        // Show confirmation
        setTimeout(() => {
            alert(`🎓 Course "${courseData.programName}" has been added to your application!`);
        }, 300);
    }, [navigateToCourseSelection, saveToLocalStorage]);

    // Function to change the selected course
    const handleChangeCourse = useCallback(() => {
        if (window.confirm('Do you want to change your selected course? You will be redirected to the course search page.')) {
            // Clear current course selection
            setHasSelectedCourse(false);
            setSelectedCourseData(null);
            setFormData(prev => ({
                ...prev,
                selectedCountry: '',
                selectedUniversity: '',
                campus: '',
                programLevel: '',
                courseName: '',
                intakeMonth: '',
                intakeYear: '',
                studyMode: '',
                selectedPrograms: []
            }));
            
            // Clear from localStorage
            localStorage.removeItem('currentSelectedCourse');
            
            // Navigate to college search
            navigate('/firstyear/dashboard/college-search');
        }
    }, [navigate]);

    // Function to start application from Overview
    const handleStartApplication = useCallback(() => {
        navigateToStep(1); // Navigate to Personal Information
    }, [navigateToStep]);

    const handleSubmit = useCallback(() => {
        console.log('Form submitted:', formData);
        
        // Validate all required steps are completed
        const allCompleted = steps.slice(1).every((stepItem, index) => isStepCompleted(index + 1));
        
        if (!allCompleted) {
            alert('Please complete all required steps before submitting.');
            return;
        }
        
        // Save final data
        saveToLocalStorage();
        
        // Create a timestamp for submission
        const submissionData = {
            ...formData,
            submittedAt: new Date().toISOString(),
            applicationId: `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'Submitted'
        };
        
        // Save to submissions
        const existingSubmissions = JSON.parse(localStorage.getItem('gusApplicationSubmissions') || '[]');
        localStorage.setItem('gusApplicationSubmissions', JSON.stringify([...existingSubmissions, submissionData]));
        
        // Clear selected course data after submission
        localStorage.removeItem('selectedCourseForApplication');
        localStorage.removeItem('currentSelectedCourse');
        
        alert('Application submitted successfully! You will receive a confirmation email shortly.');
        
        // Redirect to dashboard
        navigate('/firstyear/dashboard');
    }, [formData, isStepCompleted, navigate, saveToLocalStorage, steps]);

    // Handle direct step navigation
    const handleStepClick = useCallback((stepId) => {
        if (stepId >= 0 && stepId <= steps.length - 1) {
            navigateToStep(stepId);
        }
    }, [navigateToStep, steps.length]);

    // Get current component based on route
    const getCurrentComponent = () => {
        const path = location.pathname;
        const basePath = '/firstyear/dashboard/application';
        
        // Check if we're at the base path (Overview)
        if (path === basePath || path === `${basePath}/` || !path.includes('/application/')) {
            return Overview;
        }
        
        if (path.includes('/firstcourses')) return ApplicationCourse;
        if (path.includes('/firsteducation')) return ApplicationEducation;
        if (path.includes('/personal')) return ApplicationPersonal;
        if (path.includes('/address')) return ApplicationAddress;
        if (path.includes('/language')) return ApplicationLanguage;
        if (path.includes('/work')) return ApplicationWork;
        if (path.includes('/documents')) return ApplicationDocuments;
        if (path.includes('/preview')) return ApplicationPreview;
        return Overview; // Default to Overview
    };

    const CurrentComponent = getCurrentComponent();

    return (
        <div className="application-container">
            {/* Only show application header and progress bar if not on Overview */}
            {currentStep !== 0 ? (
                <>
                    <div className="application-header">
                        <div className="header-top-row">
                            <div className="header-left">
                                <h1>GUS University Application Portal</h1>
                                <p>Complete your application in {steps.length - 1} steps</p>
                            </div>
                            <div className="header-right">
                                <button 
                                    className="dashboard-btn"
                                    onClick={navigateToDashboard}
                                    title="Back to Dashboard"
                                >
                                    <i className="fas fa-arrow-left"></i> Back to Dashboard
                                </button>
                            </div>
                        </div>
                        
                        {/* Show selected course info if available - Like Kansas University example */}
                        {hasSelectedCourse && selectedCourseData && (
                            <div className="selected-course-banner">
                                <div className="banner-content">
                                    <div className="banner-university-info">
                                        <span className="banner-icon">🎓</span>
                                        <div className="banner-text">
                                            <div className="university-name">{selectedCourseData.universityName}</div>
                                            <div className="course-details">
                                                <strong>Selected Course:</strong> {selectedCourseData.programName}
                                                {selectedCourseData.programDetails?.level && 
                                                    ` (${selectedCourseData.programDetails.level})`}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="banner-actions">
                                        <button 
                                            className="banner-edit-btn"
                                            onClick={handleChangeCourse}
                                        >
                                            <i className="fas fa-edit"></i> Change Course
                                        </button>
                                        <div className="banner-status">
                                            <span className="status-indicator active"></span>
                                            Application in Progress
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Quick navigation to Course Selection if no course selected */}
                        {!hasSelectedCourse && currentStep !== 6 && (
                            <div className="course-selection-prompt">
                                <div className="prompt-content">
                                    <span className="prompt-icon">⚠️</span>
                                    <div className="prompt-text">
                                        <strong>No course selected.</strong> Please select a course to start your application.
                                    </div>
                                    <button 
                                        className="go-to-courses-btn"
                                        onClick={navigateToCourseSelection}
                                    >
                                        <span className="btn-icon">🎓</span>
                                        Select a Course
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="progress-bar">
                        {steps.slice(1).map((stepItem, index) => (
                            <div key={stepItem.id} className="progress-step">
                                <div 
                                    className={`step-circle ${currentStep >= stepItem.id ? 'active' : ''} ${isStepCompleted(stepItem.id) ? 'completed' : ''}`}
                                    onClick={() => handleStepClick(stepItem.id)}
                                    style={{ cursor: 'pointer' }}
                                    title={`Go to ${stepItem.title} ${isStepCompleted(stepItem.id) ? '✓' : ''}`}
                                >
                                    {isStepCompleted(stepItem.id) ? '✓' : stepItem.id}
                                </div>
                                <div className="step-title">{stepItem.title}</div>
                                {index < steps.length - 2 && <div className="step-connector"></div>}
                            </div>
                        ))}
                    </div>

                    <div className="form-content">
                        {/* Render the current component based on route */}
                        {currentStep === 6 ? (
                            <ApplicationCourse 
                                formData={formData}
                                onInputChange={handleInputChange}
                                onFileUpload={handleFileUpload}
                                onNext={handleNext}
                                onPrev={handlePrev}
                                hasSelectedCourse={hasSelectedCourse}
                                selectedCourseData={selectedCourseData}
                                onCourseSelect={handleCourseSelection}
                                onChangeCourse={handleChangeCourse}
                            />
                        ) : (
                            <CurrentComponent 
                                formData={formData}
                                onInputChange={handleInputChange}
                                onFileUpload={handleFileUpload}
                                onNext={handleNext}
                                onPrev={handlePrev}
                                selectedCourseData={selectedCourseData}
                                hasSelectedCourse={hasSelectedCourse}
                            />
                        )}
                    </div>

                    <div className="form-navigation">
                        {currentStep > 0 && (
                            <button className="nav-btn prev-btn" onClick={handlePrev}>
                                <i className="fas fa-arrow-left"></i> Previous
                            </button>
                        )}
                        
                        {currentStep < steps.length - 1 ? (
                            <button className="nav-btn next-btn" onClick={handleNext}>
                                Next <i className="fas fa-arrow-right"></i>
                            </button>
                        ) : currentStep === steps.length - 1 ? (
                            <button className="nav-btn submit-btn" onClick={handleSubmit}>
                                <i className="fas fa-paper-plane"></i> Submit Application
                            </button>
                        ) : null}
                        
                        <div className="step-indicator">
                            Step {currentStep} of {steps.length - 1}
                        </div>
                        
                        {/* Save indicator */}
                        <div className="save-indicator">
                            <i className="fas fa-save"></i> Auto-saved
                        </div>
                        
                        {/* Quick navigation to Course Selection button */}
                        {currentStep !== 6 && currentStep !== 0 && (
                            <button 
                                className="quick-course-btn"
                                onClick={navigateToCourseSelection}
                                title="Go directly to Course Selection"
                            >
                                <i className="fas fa-graduation-cap"></i> Course Selection
                            </button>
                        )}
                        
                        {/* Show course info in navigation if available */}
                        {hasSelectedCourse && selectedCourseData && currentStep !== 0 && (
                            <div className="navigation-course-info">
                                <small>
                                    <i className="fas fa-university"></i> {selectedCourseData.universityName}
                                </small>
                            </div>
                        )}
                        
                        {/* Quick navigation back to Overview */}
                        {currentStep !== 0 && (
                            <button 
                                className="overview-btn"
                                onClick={() => navigateToStep(0)}
                                title="Go back to Overview"
                            >
                                <i className="fas fa-home"></i> Overview
                            </button>
                        )}
                        
                        {/* Back to Dashboard button in navigation */}
                        <button 
                            className="dashboard-btn-nav"
                            onClick={navigateToDashboard}
                            title="Back to Dashboard"
                        >
                            <i className="fas fa-tachometer-alt"></i> Dashboard
                        </button>
                    </div>
                </>
            ) : (
                // Render Overview component with Back to Dashboard button
                <div className="overview-wrapper">
                    <div className="overview-header-section">
                        <div className="overview-header-top">
                            <div>
                                <h1>Application Overview</h1>
                                <p>Review your selected course and complete your application</p>
                            </div>
                            <button 
                                className="dashboard-btn"
                                onClick={navigateToDashboard}
                                title="Back to Dashboard"
                            >
                                <i className="fas fa-arrow-left"></i> Back to Dashboard
                            </button>
                        </div>
                    </div>
                    <CurrentComponent 
                        formData={formData}
                        selectedCourseData={selectedCourseData}
                        onStartApplication={handleStartApplication}
                        onChangeCourse={handleChangeCourse}
                    />
                </div>
            )}
        </div>
    );
};

export default Application;