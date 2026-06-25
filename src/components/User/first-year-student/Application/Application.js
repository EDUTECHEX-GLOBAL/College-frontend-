import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Application.css';
import ApplicationPersonal    from './ApplicationPersonal';
import ApplicationAddress     from './ApplicationAddress';
import ApplicationSpecialNeeds from './ApplicationSpecialNeeds';
import ApplicationEducation   from './ApplicationFirstEducation';
import Score                  from './score';
import ApplicationDocuments   from './ApplicationDocuments';
import ApplicationPreview     from './ApplicationPreview';
import Overview               from './Overview';
import { FaCheck } from 'react-icons/fa';

// Application flow helper
// Safe localStorage helpers
// Application flow helper
const safeGetLocalStorage = (key) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || raw === 'undefined' || raw === 'null') return null;
        return JSON.parse(raw);
    } catch (e) {
        console.error(` Error reading localStorage["${key}"]:`, e);
        return null;
    }
};

const safeSetLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(` Error writing localStorage["${key}"]:`, e);
        return false;
    }
};

// Application flow helper
// Application flow helper
// so it is never '' on the first render.
// Application flow helper
// Application flow helper
const resolveStudentId = (propId) => {
    if (propId) return propId;
    const userData = safeGetLocalStorage('userData');
    return userData?._id || userData?.realStudentId || '';
};

// Application flow helper
// Step path helpers
// Application flow helper
const getStepFromPath = (pathname) => {
    if (!pathname.includes('/application/')) return 0;
    if (pathname.includes('/personal'))       return 1;
    if (pathname.includes('/address'))        return 2;
    if (pathname.includes('/specialneeds'))   return 3;
    if (pathname.includes('/firsteducation')) return 4;
    if (pathname.includes('/scores'))         return 5;
    if (pathname.includes('/documents'))      return 6;
    if (pathname.includes('/preview'))        return 7;
    return 0;
};

const getComponentFromPath = (pathname) => {
    if (!pathname.includes('/application/')) return Overview;
    if (pathname.includes('/personal'))       return ApplicationPersonal;
    if (pathname.includes('/address'))        return ApplicationAddress;
    if (pathname.includes('/specialneeds'))   return ApplicationSpecialNeeds;
    if (pathname.includes('/firsteducation')) return ApplicationEducation;
    if (pathname.includes('/scores'))         return Score;
    if (pathname.includes('/documents'))      return ApplicationDocuments;
    if (pathname.includes('/preview'))        return ApplicationPreview;
    return Overview;
};

const APPLICATION_BASE_PATH = '/firstyear/dashboard/application';

const getApplicationStorageKey = (studentId) =>
    studentId ? `gusApplicationData_${studentId}` : 'gusApplicationData';

const INITIAL_FORM_DATA = {
    // Personal
    firstName: '', lastName: '', email: '',
    dateOfBirth: '', placeOfBirth: '', countryOfBirth: '',
    citizenship: '', passportNumber: '',
    passportIssueDate: '', passportExpiryDate: '',
    issuingCountry: '', mobile: '', correspondenceLanguage: '',
    passport: null, photograph: null,
    passportFileName: '', passportFileKey: '', passportFileUrl: '', passportOriginalName: '',
    photographFileName: '', photographFileKey: '', photographFileUrl: '', photographOriginalName: '',
    dob: '', gender: '', nationality: '', countryOfResidence: '',
    alternateContact: '',

    // Address
    currentAddress: '', permanentAddress: '',
    city: '', state: '', country: '', postalCode: '',
    nationalId: null,

    // Special needs
    hasSpecialNeeds: 'no', specialNeedsDescription: '',

    // Education
    qualificationLevel: '', institutionName: '', boardUniversity: '',
    countryOfStudy: '', startYear: '', endYear: '',
    resultStatus: '', gradingSystem: '',
    transcripts: null, degreeCertificate: null,

    // Scores
    scores: {
        grade9: '', grade10: '', grade11: '', grade12: '',
        satTotal: '', satMath: '', satReading: '',
        act: '', toefl: '', ielts: '', ap: '',
    },

    // Documents
    sop: null, lor1: null, lor2: null,
    portfolio: null, researchProposal: null,

    // Declaration
    agreedToTerms: false,
};

// Application flow helper
// MAIN COMPONENT
// Application flow helper
const Application = ({ studentId: studentIdProp }) => {
    const navigate    = useNavigate();
    const location    = useLocation();

    // Application flow helper
    const [studentId, setStudentId] = useState(() => resolveStudentId(studentIdProp));

    // If the prop arrives later (e.g. Dashboard fetches user data async),
    // update once when it becomes a real value.
    useEffect(() => {
        if (studentIdProp && studentIdProp !== studentId) {
            setStudentId(studentIdProp);
            console.log(' studentId updated from prop:', studentIdProp);
        }
    }, [studentIdProp]); // eslint-disable-line react-hooks/exhaustive-deps

    // Application flow helper
    // Application flow helper
    // Application flow helper
    const [currentStep, setCurrentStep] = useState(() => getStepFromPath(location.pathname));

    useEffect(() => {
        setCurrentStep(getStepFromPath(location.pathname));
    }, [location.pathname]);

    // Application flow helper
    // Form data
    // Application flow helper
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    // Load only the active student's draft. Old unscoped data is ignored unless
    // it already belongs to this same student.
    useEffect(() => {
        if (!studentId) {
            setFormData(INITIAL_FORM_DATA);
            return;
        }

        const scopedSaved = safeGetLocalStorage(getApplicationStorageKey(studentId));
        const legacySaved = safeGetLocalStorage('gusApplicationData');
        const saved = scopedSaved || (legacySaved?.studentId === studentId ? legacySaved : null);

        setFormData({ ...INITIAL_FORM_DATA, ...(saved || {}) });
    }, [studentId]);

    // Application flow helper
    // Steps config
    // Application flow helper
    const steps = [
        { id: 0, title: 'Overview',               path: '',               component: Overview },
        { id: 1, title: 'Personal Information',   path: 'personal',       component: ApplicationPersonal },
        { id: 2, title: 'Address & ID',           path: 'address',        component: ApplicationAddress },
        { id: 3, title: 'Special Needs',          path: 'specialneeds',   component: ApplicationSpecialNeeds },
        { id: 4, title: 'Education',              path: 'firsteducation', component: ApplicationEducation },
        { id: 5, title: 'Test Scores',            path: 'scores',         component: Score },
        { id: 6, title: 'Documents',              path: 'documents',      component: ApplicationDocuments },
        { id: 7, title: 'Preview',                path: 'preview',        component: ApplicationPreview },
    ];

    // Application flow helper
    // Progress helpers
    // Application flow helper
    const isStepCompleted = useCallback((stepId) => {
        switch (stepId) {
            case 0: return true;
            case 1: {
                const hasPassport = !!(formData.passportFileName || formData.passportOriginalName);
                const hasPhotograph = !!(formData.photographFileName || formData.photographOriginalName);
                const hasRequiredFields = !!(
                    formData.firstName &&
                    formData.lastName &&
                    formData.email &&
                    formData.dateOfBirth &&
                    formData.placeOfBirth &&
                    formData.countryOfBirth &&
                    formData.citizenship &&
                    formData.passportNumber &&
                    formData.passportIssueDate &&
                    formData.passportExpiryDate &&
                    formData.issuingCountry &&
                    formData.mobile &&
                    formData.correspondenceLanguage
                );
                return hasRequiredFields && hasPassport && hasPhotograph;
            }
            case 2: return !!(
                (formData.currentAddress || formData.streetAndHouseNumber) &&
                formData.city &&
                formData.country &&
                (formData.state || formData.stateProvince) &&
                (formData.postalCode || formData.postcode)
            );
            case 3:
                if (formData.hasSpecialNeeds === 'no') return true;
                return !!(formData.hasSpecialNeeds === 'yes' && formData.specialNeedsDescription?.trim());
            case 4: return !!(formData.qualificationLevel && formData.institutionName);
            case 5: {
                const s = formData.scores || {};
                return !!(s.grade9 || s.grade10 || s.grade11 || s.grade12 ||
                    s.satTotal || s.act || s.toefl || s.ielts);
            }
            case 6: return !!(formData.sop && formData.lor1 && formData.lor2);
            case 7: return !!formData.agreedToTerms;
            default: return false;
        }
    }, [formData]);

    const calculateProgress = useCallback(() => {
        const completed = steps.filter((_, i) => {
            if (i < currentStep) return true;
            if (i + 1 === currentStep) return isStepCompleted(currentStep);
            return false;
        }).length;
        return Math.round((completed / steps.length) * 100);
    }, [currentStep, steps.length, isStepCompleted]);

    // Application flow helper
    // Save to localStorage (strips File/Blob fields)
    // Application flow helper
    const saveToLocalStorage = useCallback(() => {
        const {
            sop, lor1, lor2, portfolio, researchProposal,
            passport, photograph, nationalId,
            transcripts, degreeCertificate,
            testScorecard, moiLetter,
            resume, experienceLetters,
            ...safeData
        } = formData;

        const scopedData = { ...safeData, studentId };
        safeSetLocalStorage(getApplicationStorageKey(studentId), scopedData);
        safeSetLocalStorage('gusApplicationData', scopedData);

        const userData = safeGetLocalStorage('userData');
        if (userData) {
            safeSetLocalStorage('userData', {
                ...userData,
                applicationProgress: {
                    ...(userData.applicationProgress || {}),
                    application: calculateProgress(),
                },
            });
            window.dispatchEvent(new Event('applicationUpdated'));
        }
    }, [formData, calculateProgress, studentId]);

    // Application flow helper
    // Navigation
    // Application flow helper
    const navigateToStep = useCallback((stepId) => {
        const stepData = steps.find(s => s.id === stepId);
        if (!stepData) return;
        if (stepId === 0) {
            navigate(APPLICATION_BASE_PATH);
        } else {
            navigate(`${APPLICATION_BASE_PATH}/${stepData.path}`);
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
            saveToLocalStorage();
            navigateToStep(currentStep + 1);
        }
    }, [currentStep, steps.length, navigateToStep, saveToLocalStorage]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) navigateToStep(currentStep - 1);
    }, [currentStep, navigateToStep]);

    const handleStepClick = useCallback((stepId) => {
        if (stepId >= 0 && stepId < steps.length) navigateToStep(stepId);
    }, [navigateToStep, steps.length]);

    const handleStartApplication = useCallback(() => navigateToStep(1), [navigateToStep]);

    // Application flow helper
    // Form handlers
    // Application flow helper
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleFileUpload = useCallback((field, file) => {
        setFormData(prev => ({ ...prev, [field]: file }));
    }, []);

    const handleScoreChange = useCallback((scores) => {
        setFormData(prev => ({ ...prev, scores }));
    }, []);

    // Application flow helper
    // Render
    // Application flow helper
    const CurrentComponent = getComponentFromPath(location.pathname);

    // Application flow helper
    const stepProps = {
        formData,
        onInputChange: handleInputChange,
        onFileUpload:  handleFileUpload,
        onNext:        handleNext,
        onPrev:        handlePrev,
        studentId,          // always the resolved real MongoDB _id
    };

    return (
        <div className="application-container">
            {currentStep !== 0 ? (
                <>
                    {/* Header */}
                    <div className="application-header">
                        <div className="header-top-row">
                            <div className="header-left">
                                <h1>Bachelor Application Portal</h1>
                            </div>
                            <div className="header-right">
                                <button className="dashboard-btn" onClick={navigateToDashboard}>
                                    <i className="fas fa-arrow-left"></i> Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Step progress bar */}
                    <div className="progress-bar">
                        {steps.slice(1).map((stepItem, index) => (
                            <div key={stepItem.id} className="progress-step">
                                <div
                                    className={`step-circle ${currentStep >= stepItem.id ? 'active' : ''} ${isStepCompleted(stepItem.id) ? 'completed' : ''}`}
                                    onClick={() => handleStepClick(stepItem.id)}
                                    style={{ cursor: 'pointer' }}
                                    title={`${stepItem.title}${isStepCompleted(stepItem.id) ? ' ' : ''}`}
                                >
                                    {isStepCompleted(stepItem.id) ? <FaCheck aria-hidden="true" /> : stepItem.id}
                                </div>
                                <div className="step-title">{stepItem.title}</div>

                            </div>
                        ))}
                    </div>

                    {/* Form content */}
                    <div className="form-content">
                        {currentStep === 5 ? (
                            // Score has a different prop shape
                            <Score
                                scores={formData.scores}
                                onScoreChange={handleScoreChange}
                                studentId={studentId}
                            />
                        ) : (
                            <CurrentComponent {...stepProps} />
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="form-navigation">
                        {currentStep > 0 && (
                            <button className="nav-btn prev-btn" onClick={handlePrev}>
                                <i className="fas fa-arrow-left"></i> Previous
                            </button>
                        )}

                        <div className="step-indicator">Step {currentStep} of {steps.length - 1}</div>
                        <div className="save-indicator"><i className="fas fa-save"></i> Auto-saved</div>
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
                /* Overview */
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
