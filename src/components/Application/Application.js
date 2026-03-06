import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './Application.css';
import ApplicationPersonal from './ApplicationPersonal';
import ApplicationAddress from './ApplicationAddress';
import ApplicationLanguage from './ApplicationLanguage';
import ApplicationSpecialNeeds from './ApplicationSpecialNeeds';
import ApplicationEducation from './ApplicationFirstEducation';
import Score from './score'; // Import the Score component
import ApplicationDocuments from './ApplicationDocuments';
import ApplicationPreview from './ApplicationPreview';
import Overview from './Overview';

const Application = () => {
    const { step } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // ─────────────────────────────────────────────────────────────
    // ✅ FIX 1: Load real MongoDB _id from localStorage
    // This is what gets saved as studentId in the database
    // ─────────────────────────────────────────────────────────────
    const [studentId, setStudentId] = useState('');

    useEffect(() => {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr && userDataStr !== 'undefined') {
            try {
                const parsed = JSON.parse(userDataStr);
                // _id is the real MongoDB ObjectId — use this for ALL API calls
                const realId = parsed._id || parsed.realStudentId;
                if (realId) {
                    setStudentId(realId);
                    console.log('✅ Real studentId loaded:', realId);
                } else {
                    console.warn('⚠️ No _id found in userData. Available keys:', Object.keys(parsed));
                }
            } catch (e) {
                console.error('❌ Error parsing userData:', e);
            }
        } else {
            console.warn('⚠️ No userData in localStorage — is user logged in?');
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Current step — initialized from URL
    // ─────────────────────────────────────────────────────────────
    const [currentStep, setCurrentStep] = useState(() => {
        const path = location.pathname;
        const basePath = '/firstyear/dashboard/application';
        if (path === basePath || path === `${basePath}/` || !path.includes('/application/')) return 0;
        if (path.includes('/personal'))       return 1;
        if (path.includes('/address'))        return 2;
        if (path.includes('/language'))       return 3;
        if (path.includes('/specialneeds'))   return 4;
        if (path.includes('/firsteducation')) return 5;
        if (path.includes('/scores'))         return 6; // New step for scores
        if (path.includes('/documents'))      return 7;
        if (path.includes('/preview'))        return 8;
        return 0;
    });

    // ─────────────────────────────────────────────────────────────
    // Form Data
    // ─────────────────────────────────────────────────────────────
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

        // Entrance Qualification
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

        // Special Needs
        hasSpecialNeeds: 'no',
        specialNeedsDescription: '',

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

        // Test Scores
        scores: {
            grade9: '',
            grade10: '',
            grade11: '',
            grade12: '',
            satTotal: '',
            satMath: '',
            satReading: '',
            act: '',
            toefl: '',
            ielts: '',
            ap: ''
        },

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
        { id: 0, title: 'Overview',               path: '',               component: Overview },
        { id: 1, title: 'Personal Information',   path: 'personal',       component: ApplicationPersonal },
        { id: 2, title: 'Address & ID',           path: 'address',        component: ApplicationAddress },
        { id: 3, title: 'Entrance Qualification', path: 'language',       component: ApplicationLanguage },
        { id: 4, title: 'Special Needs',          path: 'specialneeds',   component: ApplicationSpecialNeeds },
        { id: 5, title: 'Education',              path: 'firsteducation', component: ApplicationEducation },
        { id: 6, title: 'Test Scores',            path: 'scores',         component: Score }, // New step
        { id: 7, title: 'Documents',              path: 'documents',      component: ApplicationDocuments },
        { id: 8, title: 'Preview',                 path: 'preview',        component: ApplicationPreview }
    ];

    // ─────────────────────────────────────────────────────────────
    // Progress calculation
    // ─────────────────────────────────────────────────────────────
    const isStepCompleted = useCallback((stepId) => {
        switch (stepId) {
            case 0: return true;
            case 1: return !!(formData.firstName && formData.lastName && formData.dob && formData.email);
            case 2: return !!(formData.currentAddress && formData.city && formData.country);
            case 3: return !!(formData.eqheCountry && formData.eqheOriginalTitle);
            case 4:
                if (formData.hasSpecialNeeds === 'no') return true;
                if (formData.hasSpecialNeeds === 'yes' && formData.specialNeedsDescription?.trim()) return true;
                return false;
            case 5: return !!(formData.qualificationLevel && formData.institutionName);
            case 6:
                // Check if at least one test score is provided
                const scores = formData.scores;
                return !!(scores.grade9 || scores.grade10 || scores.grade11 || scores.grade12 || 
                         scores.satTotal || scores.act || scores.toefl || scores.ielts);
            case 7: return !!(formData.sop && formData.lor1 && formData.lor2);
            case 8: return !!formData.agreedToTerms;
            default: return false;
        }
    }, [formData]);

    const calculateProgress = useCallback(() => {
        const completedSteps = steps.filter((stepItem, index) => {
            if (index < currentStep) return true;
            if (index + 1 === currentStep) return isStepCompleted(currentStep);
            return false;
        }).length;
        return Math.round((completedSteps / steps.length) * 100);
    }, [currentStep, steps.length, isStepCompleted]);

    // ─────────────────────────────────────────────────────────────
    // localStorage helpers
    // ─────────────────────────────────────────────────────────────
    const saveToLocalStorage = useCallback(() => {
        const {
            sop, lor1, lor2, portfolio, researchProposal,
            passport, photograph, nationalId,
            transcripts, degreeCertificate,
            testScorecard, moiLetter, eqheCertificate,
            resume, experienceLetters,
            ...safeFormData
        } = formData;

        localStorage.setItem('gusApplicationData', JSON.stringify(safeFormData));

        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                const applicationProgress = calculateProgress();
                localStorage.setItem('userData', JSON.stringify({
                    ...userData,
                    applicationProgress: {
                        ...userData.applicationProgress,
                        application: applicationProgress
                    }
                }));
                window.dispatchEvent(new Event('applicationUpdated'));
            } catch (err) {
                console.error('Error updating user data:', err);
            }
        }
    }, [formData, calculateProgress]);

    // ─────────────────────────────────────────────────────────────
    // Sync step with URL changes
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const path = location.pathname;
        const basePath = '/firstyear/dashboard/application';
        if (path === basePath || path === `${basePath}/` || !path.includes('/application/')) {
            setCurrentStep(0);
        } else if (path.includes('/personal'))       setCurrentStep(1);
        else if (path.includes('/address'))          setCurrentStep(2);
        else if (path.includes('/language'))         setCurrentStep(3);
        else if (path.includes('/specialneeds'))     setCurrentStep(4);
        else if (path.includes('/firsteducation'))   setCurrentStep(5);
        else if (path.includes('/scores'))           setCurrentStep(6); // New step
        else if (path.includes('/documents'))        setCurrentStep(7);
        else if (path.includes('/preview'))          setCurrentStep(8);
    }, [location.pathname]);

    // ─────────────────────────────────────────────────────────────
    // Load saved form data from localStorage on mount
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const savedData = localStorage.getItem('gusApplicationData');
        if (!savedData) return;
        try {
            const parsedData = JSON.parse(savedData);
            setFormData(prev => ({ ...prev, ...parsedData }));
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Navigation helpers
    // ─────────────────────────────────────────────────────────────
    const navigateToStep = useCallback((stepId) => {
        const stepData = steps.find(s => s.id === stepId);
        if (!stepData) return;
        const pathParts = window.location.pathname.split('/');
        const basePath = pathParts.slice(0, -1).join('/');
        if (stepId === 0) {
            navigate(basePath || '/firstyear/dashboard/application');
        } else {
            navigate(`${basePath}/${stepData.path}`);
        }
    }, [navigate, steps]);

    const navigateToDashboard = useCallback(() => {
        if (window.confirm('Are you sure you want to go back to dashboard? Your progress will be saved.')) {
            saveToLocalStorage();
            navigate('/firstyear/dashboard');
        }
    }, [navigate, saveToLocalStorage]);

    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            navigateToStep(currentStep + 1);
            saveToLocalStorage();
        }
    }, [currentStep, steps.length, navigateToStep, saveToLocalStorage]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) navigateToStep(currentStep - 1);
    }, [currentStep, navigateToStep]);

    // ─────────────────────────────────────────────────────────────
    // Form handlers
    // ─────────────────────────────────────────────────────────────
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleFileUpload = useCallback((field, file) => {
        setFormData(prev => ({ ...prev, [field]: file }));
    }, []);

    // New handler for score updates
    const handleScoreChange = useCallback((scores) => {
        setFormData(prev => ({ ...prev, scores }));
    }, []);

    const handleStartApplication = useCallback(() => {
        navigateToStep(1);
    }, [navigateToStep]);

    const handleStepClick = useCallback((stepId) => {
        if (stepId >= 0 && stepId <= steps.length - 1) navigateToStep(stepId);
    }, [navigateToStep, steps.length]);

    const handleSubmit = useCallback(() => {
        const allCompleted = steps.slice(1).every((_, index) => isStepCompleted(index + 1));
        if (!allCompleted) {
            alert('Please complete all required steps before submitting.');
            return;
        }
        saveToLocalStorage();
        const submissionData = {
            ...formData,
            submittedAt: new Date().toISOString(),
            applicationId: `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'Submitted'
        };
        const existing = JSON.parse(localStorage.getItem('gusApplicationSubmissions') || '[]');
        localStorage.setItem('gusApplicationSubmissions', JSON.stringify([...existing, submissionData]));
        alert('Application submitted successfully! You will receive a confirmation email shortly.');
        navigate('/firstyear/dashboard');
    }, [formData, isStepCompleted, navigate, saveToLocalStorage, steps]);

    // ─────────────────────────────────────────────────────────────
    // Determine current component from URL
    // ─────────────────────────────────────────────────────────────
    const getCurrentComponent = () => {
        const path = location.pathname;
        const basePath = '/firstyear/dashboard/application';
        if (path === basePath || path === `${basePath}/` || !path.includes('/application/')) return Overview;
        if (path.includes('/personal'))       return ApplicationPersonal;
        if (path.includes('/address'))        return ApplicationAddress;
        if (path.includes('/language'))       return ApplicationLanguage;
        if (path.includes('/specialneeds'))   return ApplicationSpecialNeeds;
        if (path.includes('/firsteducation')) return ApplicationEducation;
        if (path.includes('/scores'))         return Score; // New step
        if (path.includes('/documents'))      return ApplicationDocuments;
        if (path.includes('/preview'))        return ApplicationPreview;
        return Overview;
    };

    const CurrentComponent = getCurrentComponent();

    return (
        <div className="application-container">
            {currentStep !== 0 ? (
                <>
                    {/* ── Header ── */}
                    <div className="application-header">
                        <div className="header-top-row">
                            <div className="header-left">
                                <h1>GUS University Application Portal</h1>
                                <p>Complete your application in {steps.length - 1} steps</p>
                            </div>
                            <div className="header-right">
                                <button className="dashboard-btn" onClick={navigateToDashboard}>
                                    <i className="fas fa-arrow-left"></i> Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Step Progress Bar ── */}
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

                    {/* ── Form Content ── */}
                    <div className="form-content">
                        {currentStep === 6 ? (
                            // Special handling for Score component
                            <Score 
                                scores={formData.scores}
                                onScoreChange={handleScoreChange}
                                studentId={studentId}
                            />
                        ) : (
                            <CurrentComponent
                                formData={formData}
                                onInputChange={handleInputChange}
                                onFileUpload={handleFileUpload}
                                onNext={handleNext}
                                onPrev={handlePrev}
                                studentId={studentId}
                            />
                        )}
                    </div>

                    {/* ── Navigation ── */}
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
                        ) : (
                            <button className="nav-btn submit-btn" onClick={handleSubmit}>
                                <i className="fas fa-paper-plane"></i> Submit Application
                            </button>
                        )}

                        <div className="step-indicator">
                            Step {currentStep} of {steps.length - 1}
                        </div>

                        <div className="save-indicator">
                            <i className="fas fa-save"></i> Auto-saved
                        </div>

                        {currentStep !== 0 && (
                            <button className="overview-btn" onClick={() => navigateToStep(0)}>
                                <i className="fas fa-home"></i> Overview
                            </button>
                        )}

                        <button className="dashboard-btn-nav" onClick={navigateToDashboard}>
                            <i className="fas fa-tachometer-alt"></i> Dashboard
                        </button>
                    </div>
                </>
            ) : (
                /* ── Overview ── */
                <div className="overview-wrapper">
                    <div className="overview-header-section">
                        <div className="overview-header-top">
                            <div>
                                <h1>Application Overview</h1>
                                <p>Review your information and complete your application</p>
                            </div>
                            <button className="dashboard-btn" onClick={navigateToDashboard}>
                                <i className="fas fa-arrow-left"></i> Back to Dashboard
                            </button>
                        </div>
                    </div>
                    <CurrentComponent
                        formData={formData}
                        onStartApplication={handleStartApplication}
                        studentId={studentId}
                    />
                </div>
            )}
        </div>
    );
};

export default Application;