import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import './Application.css';
import ApplicationPersonal from './ApplicationPersonal';
import ApplicationAddress from './ApplicationAddress';
import ApplicationLanguage from './ApplicationLanguage'; // This now contains Entrance Qualification
import ApplicationEducation from './ApplicationFirstEducation';
import ApplicationDocuments from './ApplicationDocuments';
import ApplicationPreview from './ApplicationPreview';
import Overview from './Overview'; // Import the Overview component

const Application = () => {
    const { step } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Initialize currentStep from URL or default to 0 (Overview)
    const [currentStep, setCurrentStep] = useState(() => {
        // Parse step from URL path
        const path = location.pathname;
        const basePath = '/firstyear/dashboard/application';
        
        // Check if we're at the base path (Overview)
        if (path === basePath || path === `${basePath}/` || !path.includes('/application/')) {
            return 0; // Overview
        }
        
        if (path.includes('/personal')) return 1;
        if (path.includes('/address')) return 2;
        if (path.includes('/language')) return 3; // Entrance Qualification
        if (path.includes('/firsteducation')) return 4;
        if (path.includes('/documents')) return 5;
        if (path.includes('/preview')) return 6;
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
        
        // Entrance Qualification (formerly Language)
        eqheDate: '',
        eqheCity: '',
        eqheCountry: '',
        eqheOriginalTitle: '',
        hasAnotherEQHE: false,
        anotherEqheDate: '',
        anotherEqheCity: '',
        anotherEqheCountry: '',
        anotherEqheOriginalTitle: '',
        eqheCertificate: null,
        
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
        { id: 3, title: 'Entrance Qualification', path: 'language', component: ApplicationLanguage }, // Using language route
        { id: 4, title: 'Education', path: 'firsteducation', component: ApplicationEducation },
        { id: 5, title: 'Documents', path: 'documents', component: ApplicationDocuments },
        { id: 6, title: 'Preview', path: 'preview', component: ApplicationPreview }
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
            case 3: // Entrance Qualification
                return formData.eqheCountry && formData.eqheOriginalTitle;
            case 4: // Education
                return formData.qualificationLevel && formData.institutionName;
            case 5: // Documents
                return (
                    formData.sop &&
                    formData.lor1 &&
                    formData.lor2
                );
            case 6: // Preview
                return formData.agreedToTerms;
            default:
                return false;
        }
    }, [formData]);

    // Save form data to localStorage
    const saveToLocalStorage = useCallback(() => {
        // Remove File objects before saving
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
            eqheCertificate,
            resume,
            experienceLetters,
            ...safeFormData
        } = formData;

        // Save only serializable data
        localStorage.setItem(
            'gusApplicationData',
            JSON.stringify(safeFormData)
        );

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

    // Update current step when URL changes
    useEffect(() => {
        const path = location.pathname;
        const basePath = '/firstyear/dashboard/application';
        
        // Check if we're at the base path (Overview)
        if (path === basePath || path === `${basePath}/` || !path.includes('/application/')) {
            setCurrentStep(0); // Overview
        } else if (path.includes('/personal')) {
            setCurrentStep(1);
        } else if (path.includes('/address')) {
            setCurrentStep(2);
        } else if (path.includes('/language')) {
            setCurrentStep(3); // Entrance Qualification
        } else if (path.includes('/firsteducation')) {
            setCurrentStep(4);
        } else if (path.includes('/documents')) {
            setCurrentStep(5);
        } else if (path.includes('/preview')) {
            setCurrentStep(6);
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
        
        if (path.includes('/personal')) return ApplicationPersonal;
        if (path.includes('/address')) return ApplicationAddress;
        if (path.includes('/language')) return ApplicationLanguage; // Entrance Qualification
        if (path.includes('/firsteducation')) return ApplicationEducation;
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
                        <CurrentComponent 
                            formData={formData}
                            onInputChange={handleInputChange}
                            onFileUpload={handleFileUpload}
                            onNext={handleNext}
                            onPrev={handlePrev}
                        />
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
                                <p>Review your information and complete your application</p>
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
                        onStartApplication={handleStartApplication}
                    />
                </div>
            )}
        </div>
    );
};

export default Application;