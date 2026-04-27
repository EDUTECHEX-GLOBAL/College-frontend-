import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './master.css';

import MasterPersonal  from './masterpersonal';
import MasterContact   from './mastercontact';
import MasterCourse    from './mastercourse';
import MasterAcademic  from './masteracademic';
import MasterTests     from './mastertests';
import MasterDocuments from './masterdocuments';
import MasterPreview   from './masterpreview';
import MasterOverview  from './masterOverview';

const STEPS = [
    { id: 0, title: 'Overview',             path: 'overview' },
    { id: 1, title: 'Personal Information', path: 'personal' },
    { id: 2, title: 'Contact Details',      path: 'contact' },
    { id: 3, title: 'Course Selection',     path: 'course' },
    { id: 4, title: 'Academic History',     path: 'academic' },
    { id: 5, title: 'Test Scores',          path: 'tests' },
    { id: 6, title: 'Documents',            path: 'documents' },
    { id: 7, title: 'Preview & Submit',     path: 'preview' },
];

const stepFromPath = (pathname) => {
    if (pathname.includes('/overview'))  return 0;
    if (pathname.includes('/personal'))  return 1;
    if (pathname.includes('/contact'))   return 2;
    if (pathname.includes('/course'))    return 3;
    if (pathname.includes('/academic'))  return 4;
    if (pathname.includes('/tests'))     return 5;
    if (pathname.includes('/documents')) return 6;
    if (pathname.includes('/preview'))   return 7;
    return -1;
};

const resolveIncomingCourse = (locationState) => {
    if (locationState?.fromCoursesPage && locationState?.courseData) {
        return locationState.courseData;
    }
    if (locationState?.courseData) {
        return locationState.courseData;
    }
    try {
        const stored = localStorage.getItem('selectedMasterCourseForApplication');
        if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
};

const buildCourseSlice = (courseData, existingCourse = {}) => {
    if (!courseData) return existingCourse;
    const details = courseData.programDetails || {};
    return {
        ...existingCourse,
        preferredCourse: courseData.programName    || existingCourse.preferredCourse || '',
        universityName:  courseData.universityName || existingCourse.universityName  || '',
        universityId:    courseData.universityId   || existingCourse.universityId    || '',
        modeOfStudy:     details.studyMode         || existingCourse.modeOfStudy     || '',
        duration:        details.duration          || existingCourse.duration        || '',
        level:           details.level             || existingCourse.level           || '',
        majorArea:       details.majorArea         || existingCourse.majorArea       || '',
        intake:          existingCourse.intake     || '',
    };
};

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const Master = ({ onUpdate }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isTransfer     = location.pathname.includes('/transfer/');
    const BASE_PATH      = isTransfer
        ? '/transfer/dashboard/master-application'
        : '/firstyear/dashboard/master-application';
    const DASHBOARD_PATH = isTransfer ? '/transfer/dashboard' : '/firstyear/dashboard';

    const [studentId, setStudentId] = useState('');

    const buildInitialFormData = () => {
        let saved = {};
        try {
            const raw = localStorage.getItem('masterApplicationData');
            if (raw) saved = JSON.parse(raw) || {};
        } catch (e) {}

        const incomingCourse = resolveIncomingCourse(location.state);
        const course = incomingCourse
            ? buildCourseSlice(incomingCourse, saved.course || {})
            : (saved.course || {});

        return {
            personal:    saved.personal    || {},
            contact:     saved.contact     || {},
            course,
            academic:    saved.academic    || {},
            tests:       saved.tests       || {},
            documents:   saved.documents   || {},
            declaration: saved.declaration || false,
        };
    };

    const [formData, setFormData] = useState(buildInitialFormData);

    // ── Persist incoming course to localStorage once ──────────────────────────
    useEffect(() => {
        const incomingCourse = resolveIncomingCourse(location.state);
        if (incomingCourse) {
            localStorage.setItem('selectedMasterCourseForApplication', JSON.stringify(incomingCourse));
            localStorage.setItem('masterCourseConfirmed', 'true');
            localStorage.removeItem('selectedCourseForApplication');
            localStorage.removeItem('currentSelectedCourse');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Student ID ────────────────────────────────────────────────────────────
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

    // ── NOTE: Individual section fetches removed ──────────────────────────────
    // MasterPreview already fetches all data from /api/master-preview
    // Each step component (MasterCourse, MasterContact, etc.) fetches its own data
    // No need to fetch everything here in master.js

    // ── Redirect bare path → overview ─────────────────────────────────────────
    useEffect(() => {
        const step = stepFromPath(location.pathname);
        if (step === -1) navigate(`${BASE_PATH}/overview`, { replace: true });
    }, [location.pathname, BASE_PATH, navigate]);

    // ── Sync currentStep with URL ─────────────────────────────────────────────
    const [currentStep, setCurrentStep] = useState(() => {
        const s = stepFromPath(location.pathname);
        return s === -1 ? 0 : s;
    });

    useEffect(() => {
        const s = stepFromPath(location.pathname);
        if (s !== -1) setCurrentStep(s);
    }, [location.pathname]);

    // ── isStepCompleted ───────────────────────────────────────────────────────
    const isStepCompleted = useCallback((stepId) => {
        switch (stepId) {
            case 0: return true;
            case 1: {
                const p = formData.personal;
                return !!(p.fullName && p.dateOfBirth && p.gender &&
                          p.nationality && p.passportNumber && p.maritalStatus);
            }
            case 2: {
                const c = formData.contact;
                return !!(c.emailAddress && c.mobileNumber && c.addressLine1 &&
                          c.city && c.state && c.country && c.postalCode);
            }
            case 3: {
                const c = formData.course;
                return !!(c.preferredCourse && c.intake && c.modeOfStudy);
            }
            case 4: {
                const academic = formData.academic;
                if (academic && typeof academic === 'object' && !Array.isArray(academic)) {
                    return academic._isValid === true;
                }
                if (Array.isArray(academic) && academic.length > 0) {
                    const entries = academic.filter(e => e.degree);
                    return entries.length > 0 && entries.every(entry =>
                        entry.degree && entry.university && entry.country &&
                        entry.fieldOfStudy && entry.startDate && entry.endDate
                    );
                }
                return false;
            }
            case 5: return true;
            case 6: return true;
            case 7: return !!formData.declaration;
            default: return false;
        }
    }, [formData]);

    const calculateProgress = useCallback(() => {
        let count = 0;
        for (let i = 0; i <= 7; i++) { if (isStepCompleted(i)) count++; }
        return Math.round((count / 8) * 100);
    }, [isStepCompleted]);

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
                        masterApplication: progress,
                    },
                }));
                window.dispatchEvent(new CustomEvent('masterApplicationUpdated'));
                if (onUpdate) onUpdate();
            } catch (err) {
                console.error('Error updating user data:', err);
            }
        }
    }, [formData, calculateProgress, onUpdate]);

    const navigateToStep = useCallback((stepId) => {
        const stepData = STEPS.find(s => s.id === stepId);
        if (stepData) navigate(`${BASE_PATH}/${stepData.path}`);
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

    const updatePersonal    = useCallback((data) => setFormData(prev => {
        if (deepEqual(prev.personal, data)) return prev;
        return { ...prev, personal: data };
    }), []);

    const updateContact     = useCallback((data) => setFormData(prev => {
        if (deepEqual(prev.contact, data)) return prev;
        return { ...prev, contact: data };
    }), []);

    const updateCourse      = useCallback((data) => setFormData(prev => {
        if (deepEqual(prev.course, data)) return prev;
        return { ...prev, course: data };
    }), []);

    const updateAcademic    = useCallback((data) => setFormData(prev => {
        if (deepEqual(prev.academic, data)) return prev;
        return { ...prev, academic: data };
    }), []);

    const updateTests       = useCallback((data) => setFormData(prev => {
        if (deepEqual(prev.tests, data)) return prev;
        return { ...prev, tests: data };
    }), []);

    const updateDocuments   = useCallback((data) => setFormData(prev => {
        if (deepEqual(prev.documents, data)) return prev;
        return { ...prev, documents: data };
    }), []);

    const updateDeclaration = useCallback((updatedData) => setFormData(prev => {
        if (prev.declaration === updatedData.declaration) return prev;
        return { ...prev, declaration: updatedData.declaration };
    }), []);

    const handleSubmit = useCallback(() => {
        for (let i = 0; i <= 6; i++) {
            if (!isStepCompleted(i)) {
                alert(`Please complete all required sections before submitting.\n\nIncomplete section: ${STEPS[i]?.title || `Step ${i + 1}`}`);
                return;
            }
        }
        saveToLocalStorage();

        const academic = formData.academic;
        const academicEntries = Array.isArray(academic)
            ? academic.filter(e => e.degree)
            : (academic?.academics || []);

        const submissionData = {
            ...formData,
            academic:      academicEntries,
            submittedAt:   new Date().toISOString(),
            applicationId: `MASTER-APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status:        'Submitted',
            studentId,
        };

        const existing = JSON.parse(localStorage.getItem('masterApplicationSubmissions') || '[]');
        localStorage.setItem('masterApplicationSubmissions', JSON.stringify([...existing, submissionData]));
        localStorage.removeItem('masterCourseConfirmed');
        localStorage.removeItem('selectedMasterCourseForApplication');
        localStorage.removeItem('selectedCourseForApplication');
        localStorage.removeItem('currentSelectedCourse');

        alert('Master Application submitted successfully!');
        window.dispatchEvent(new CustomEvent('masterApplicationUpdated'));
        if (onUpdate) onUpdate();
        navigate(DASHBOARD_PATH);
    }, [formData, isStepCompleted, navigate, saveToLocalStorage, studentId, onUpdate, DASHBOARD_PATH]);

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0: return <MasterOverview data={formData} onNext={handleNext} />;
            case 1: return <MasterPersonal  data={formData.personal}   updateData={updatePersonal}  />;
            case 2: return <MasterContact   data={formData.contact}    updateData={updateContact}   />;
            case 3: return <MasterCourse    data={formData.course}     updateData={updateCourse}    />;
            case 4: return <MasterAcademic  data={formData.academic}   updateData={updateAcademic}  />;
            case 5: return <MasterTests     data={formData.tests}      updateData={updateTests}     />;
            case 6: return <MasterDocuments data={formData.documents}  updateData={updateDocuments} />;
            case 7: return (
                <MasterPreview
                    data={formData}
                    updateData={updateDeclaration}
                    onEdit={navigateToStep}
                />
            );
            default: return <MasterOverview data={formData} onNext={handleNext} />;
        }
    };

    return (
        <div className="master-app-container">
            <div className="master-form-card">

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

                <div className="master-progress-container">
                    <div className="master-progress-steps">
                        {STEPS.map((stepItem, index) => (
                            <div key={stepItem.id} className="master-step-wrapper">
                                <div className="master-progress-step">
                                    <div
                                        className={`master-step-circle ${currentStep >= stepItem.id ? 'active' : ''} ${isStepCompleted(stepItem.id) ? 'completed' : ''}`}
                                        onClick={() => {
                                            if (isStepCompleted(stepItem.id) || stepItem.id <= currentStep + 1)
                                                navigateToStep(stepItem.id);
                                        }}
                                        style={{
                                            cursor: isStepCompleted(stepItem.id) || stepItem.id <= currentStep + 1
                                                ? 'pointer' : 'not-allowed'
                                        }}
                                        title={isStepCompleted(stepItem.id) ? 'Completed ✓' : stepItem.title}
                                    >
                                        {isStepCompleted(stepItem.id) ? '✓' : stepItem.id + 1}
                                    </div>
                                    <div className="master-step-title">{stepItem.title}</div>
                                </div>
                                {index < STEPS.length - 1 && <div className="master-step-connector"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="master-form-content">
                    {renderCurrentStep()}
                </div>

                <div className="master-form-navigation">
                    {currentStep > 0 && (
                        <button className="master-nav-btn master-prev-btn" onClick={handlePrev}>
                            Previous
                        </button>
                    )}

                    {currentStep < STEPS.length - 1 && currentStep !== 7 && (
                        <button className="master-nav-btn master-next-btn" onClick={handleNext}>
                            Next
                        </button>
                    )}

                    <div className="master-step-indicator">
                        Step {currentStep + 1} of {STEPS.length}
                    </div>
                    <div className="master-save-indicator">✓ Auto-saved</div>
                </div>

            </div>
        </div>
    );
};

export default Master;