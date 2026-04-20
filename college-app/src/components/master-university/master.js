import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './master.css';

import MasterPersonal    from './masterpersonal';
import MasterContact     from './mastercontact';
import MasterCourse      from './mastercourse';
import MasterAcademic    from './masteracademic';
import MasterTests       from './mastertests';
import MasterDocuments   from './masterdocuments';
import MasterDeclaration from './masterdecl';
import MasterPreview     from './masterpreview';

// ✅ Moved outside component — stable constant, never recreates
const STEPS = [
    { id: 0, title: 'Personal Information', path: 'personal' },
    { id: 1, title: 'Contact Details',      path: 'contact' },
    { id: 2, title: 'Course Selection',     path: 'course' },
    { id: 3, title: 'Academic History',     path: 'academic' },
    { id: 4, title: 'Test Scores',          path: 'tests' },
    { id: 5, title: 'Documents',            path: 'documents' },
    { id: 6, title: 'Declaration',          path: 'declaration' },
    { id: 7, title: 'Preview & Submit',     path: 'preview' }
];

// ✅ Helper — derives step index from pathname
const stepFromPath = (pathname) => {
    if (pathname.includes('/personal'))    return 0;
    if (pathname.includes('/contact'))     return 1;
    if (pathname.includes('/course'))      return 2;
    if (pathname.includes('/academic'))    return 3;
    if (pathname.includes('/tests'))       return 4;
    if (pathname.includes('/documents'))   return 5;
    if (pathname.includes('/declaration')) return 6;
    if (pathname.includes('/preview'))     return 7;
    return -1; // -1 means we're at the base /master-application route with no step
};

const Master = ({ onUpdate }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // ─── Dynamic base path (supports both firstyear & transfer) ──
    const isTransfer = location.pathname.includes('/transfer/');
    const BASE_PATH = isTransfer
        ? '/transfer/dashboard/master-application'
        : '/firstyear/dashboard/master-application';
    const DASHBOARD_PATH = isTransfer ? '/transfer/dashboard' : '/firstyear/dashboard';

    // ─── Student ID ───────────────────────────────────────────────
    const [studentId, setStudentId] = useState('');

    useEffect(() => {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr && userDataStr !== 'undefined') {
            try {
                const parsed = JSON.parse(userDataStr);
                const realId = parsed._id || parsed.realStudentId;
                if (realId) setStudentId(realId);
            } catch (e) {
                console.error('Error parsing userData:', e);
            }
        }
    }, []);

    // ─── Auto-redirect to first step if on base /master-application ──
    useEffect(() => {
        const step = stepFromPath(location.pathname);
        if (step === -1) {
            // No sub-path — redirect to first step
            navigate(`${BASE_PATH}/personal`, { replace: true });
        }
    }, [location.pathname, BASE_PATH, navigate]);

    // ─── Current step — initialised from URL ──────────────────────
    const [currentStep, setCurrentStep] = useState(() => {
        const s = stepFromPath(location.pathname);
        return s === -1 ? 0 : s;
    });

    // ─── Form data ────────────────────────────────────────────────
    const [formData, setFormData] = useState({
        personal:    {},
        contact:     {},
        course:      {},
        academic:    [],
        tests:       {},
        documents:   {},
        declaration: false
    });

    // ─── Load saved data on mount ─────────────────────────────────
    useEffect(() => {
        const savedData = localStorage.getItem('masterApplicationData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }, []);

    // ─── Sync step with URL changes ───────────────────────────────
    useEffect(() => {
        const s = stepFromPath(location.pathname);
        if (s !== -1) setCurrentStep(s);
    }, [location.pathname]);

    // ─── Progress helpers ─────────────────────────────────────────
    const isStepCompleted = useCallback((stepId) => {
        switch (stepId) {
            case 0: {
                const p = formData.personal;
                return !!(p.fullName && p.dateOfBirth && p.gender && p.nationality && p.passportNumber && p.maritalStatus);
            }
            case 1: {
                const c = formData.contact;
                return !!(c.emailAddress && c.mobileNumber && c.addressLine1 && c.city && c.state && c.country && c.postalCode);
            }
            case 2: {
                const c = formData.course;
                return !!(c.preferredCourse && c.intake && c.modeOfStudy);
            }
            case 3: {
                const academic = formData.academic;
                if (!academic || academic.length === 0) return false;
                return academic.every(entry =>
                    entry.degree && entry.university && entry.country &&
                    entry.fieldOfStudy && entry.startDate && entry.endDate
                );
            }
            case 4: return true;
            case 5: return true;
            case 6: return !!formData.declaration;
            case 7: {
                for (let i = 0; i <= 6; i++) {
                    if (!isStepCompleted(i)) return false;
                }
                return true;
            }
            default: return false;
        }
    }, [formData]);

    const calculateProgress = useCallback(() => {
        let completedCount = 0;
        for (let i = 0; i <= 7; i++) {
            if (isStepCompleted(i)) completedCount++;
        }
        return Math.round((completedCount / 8) * 100);
    }, [isStepCompleted]);

    // ─── localStorage helpers ─────────────────────────────────────
    const saveToLocalStorage = useCallback(() => {
        localStorage.setItem('masterApplicationData', JSON.stringify(formData));

        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                const progress = calculateProgress();
                localStorage.setItem('userData', JSON.stringify({
                    ...userData,
                    applicationProgress: {
                        ...userData.applicationProgress,
                        masterApplication: progress
                    }
                }));
                window.dispatchEvent(new CustomEvent('masterApplicationUpdated'));
                if (onUpdate) onUpdate();
            } catch (err) {
                console.error('Error updating user data:', err);
            }
        }
    }, [formData, calculateProgress, onUpdate]);

    // ─── Navigation helpers ───────────────────────────────────────
    const navigateToStep = useCallback((stepId) => {
        const stepData = STEPS.find(s => s.id === stepId);
        if (!stepData) return;
        navigate(`${BASE_PATH}/${stepData.path}`);
    }, [navigate, BASE_PATH]);

    const navigateToDashboard = useCallback(() => {
        if (window.confirm('Are you sure you want to go back to dashboard? Your progress will be saved.')) {
            saveToLocalStorage();
            navigate(DASHBOARD_PATH);
        }
    }, [navigate, saveToLocalStorage, DASHBOARD_PATH]);

    const handleNext = useCallback(() => {
        if (currentStep < STEPS.length - 1) {
            saveToLocalStorage();
            navigateToStep(currentStep + 1);
        }
    }, [currentStep, navigateToStep, saveToLocalStorage]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) navigateToStep(currentStep - 1);
    }, [currentStep, navigateToStep]);

    // ─── Per-section update handlers ─────────────────────────────
    const updatePersonal    = useCallback((data) => setFormData(prev => ({ ...prev, personal:    data })), []);
    const updateContact     = useCallback((data) => setFormData(prev => ({ ...prev, contact:     data })), []);
    const updateCourse      = useCallback((data) => setFormData(prev => ({ ...prev, course:      data })), []);
    const updateAcademic    = useCallback((data) => setFormData(prev => ({ ...prev, academic:    data })), []);
    const updateTests       = useCallback((data) => setFormData(prev => ({ ...prev, tests:       data })), []);
    const updateDocuments   = useCallback((data) => setFormData(prev => ({ ...prev, documents:   data })), []);
    const updateDeclaration = useCallback((data) => setFormData(prev => ({ ...prev, declaration: data })), []);

    // ─── Submission ───────────────────────────────────────────────
    const handleSubmit = useCallback(() => {
        for (let i = 0; i <= 6; i++) {
            if (!isStepCompleted(i)) {
                alert('Please complete all required sections before submitting.');
                return;
            }
        }

        saveToLocalStorage();

        const submissionData = {
            ...formData,
            submittedAt:   new Date().toISOString(),
            applicationId: `MASTER-APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status:        'Submitted',
            studentId
        };

        const existing = JSON.parse(localStorage.getItem('masterApplicationSubmissions') || '[]');
        localStorage.setItem('masterApplicationSubmissions', JSON.stringify([...existing, submissionData]));

        alert('Master Application submitted successfully!');
        window.dispatchEvent(new CustomEvent('masterApplicationUpdated'));
        if (onUpdate) onUpdate();
        navigate(DASHBOARD_PATH);
    }, [formData, isStepCompleted, navigate, saveToLocalStorage, studentId, onUpdate, DASHBOARD_PATH]);

    // ─── Renders the correct step component ──────────────────────
    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0: return <MasterPersonal    data={formData.personal}     updateData={updatePersonal} />;
            case 1: return <MasterContact     data={formData.contact}      updateData={updateContact} />;
            case 2: return <MasterCourse      data={formData.course}       updateData={updateCourse} />;
            case 3: return <MasterAcademic    data={formData.academic}     updateData={updateAcademic} />;
            case 4: return <MasterTests       data={formData.tests}        updateData={updateTests} />;
            case 5: return <MasterDocuments   data={formData.documents}    updateData={updateDocuments} />;
            case 6: return <MasterDeclaration data={formData.declaration}  updateData={updateDeclaration} />;
            case 7: return <MasterPreview     data={formData} />;
            default: return <MasterPersonal   data={formData.personal}     updateData={updatePersonal} />;
        }
    };

    // ─── Render ───────────────────────────────────────────────────
    return (
        <div className="master-app-container">
            <div className="master-form-card">

                {/* Header */}
                <div className="master-header">
                    <div className="master-header-top-row">
                        <div className="master-header-left">
                            <h1 className="master-title">Master University Application</h1>
                            <p className="master-subtitle">Complete your registration form</p>
                        </div>
                        <div className="master-header-right">
                            <button className="master-dashboard-btn" onClick={navigateToDashboard}>
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>

                {/* Step Progress Bar */}
                <div className="master-progress-container">
                    <div className="master-progress-steps">
                        {STEPS.map((stepItem, index) => (
                            <div key={stepItem.id} className="master-step-wrapper">
                                <div className="master-progress-step">
                                    <div
                                        className={`master-step-circle ${currentStep >= stepItem.id ? 'active' : ''} ${isStepCompleted(stepItem.id) ? 'completed' : ''}`}
                                        onClick={() => {
                                            if (isStepCompleted(stepItem.id) || stepItem.id <= currentStep + 1) {
                                                navigateToStep(stepItem.id);
                                            }
                                        }}
                                        style={{
                                            cursor: isStepCompleted(stepItem.id) || stepItem.id <= currentStep + 1
                                                ? 'pointer'
                                                : 'not-allowed'
                                        }}
                                        title={isStepCompleted(stepItem.id) ? 'Completed ✓' : stepItem.title}
                                    >
                                        {isStepCompleted(stepItem.id) ? '✓' : stepItem.id + 1}
                                    </div>
                                    <div className="master-step-title">{stepItem.title}</div>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className="master-step-connector"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Content */}
                <div className="master-form-content">
                    {renderCurrentStep()}
                </div>

                {/* Navigation Buttons */}
                <div className="master-form-navigation">
                    {currentStep > 0 && (
                        <button className="master-nav-btn master-prev-btn" onClick={handlePrev}>
                            Previous
                        </button>
                    )}

                    {currentStep < STEPS.length - 1 ? (
                        <button className="master-nav-btn master-next-btn" onClick={handleNext}>
                            Next
                        </button>
                    ) : (
                        <button className="master-nav-btn master-submit-btn" onClick={handleSubmit}>
                            Submit Application
                        </button>
                    )}

                    <div className="master-step-indicator">
                        Step {currentStep + 1} of {STEPS.length}
                    </div>

                    <div className="master-save-indicator">
                        Auto-saved
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Master;