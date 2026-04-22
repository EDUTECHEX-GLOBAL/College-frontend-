import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './master.css';

import MasterPersonal    from './masterpersonal';
import MasterContact     from './mastercontact';
import MasterCourse      from './mastercourse';
import MasterAcademic    from './masteracademic';
import MasterTests       from './mastertests';
import MasterDocuments   from './masterdocuments';
import MasterPreview     from './masterpreview';
import MasterOverview    from './masterOverview';

const STEPS = [
    { id: 0, title: 'Overview',             path: 'overview' },
    { id: 1, title: 'Personal Information', path: 'personal' },
    { id: 2, title: 'Contact Details',      path: 'contact' },
    { id: 3, title: 'Course Selection',     path: 'course' },
    { id: 4, title: 'Academic History',     path: 'academic' },
    { id: 5, title: 'Test Scores',          path: 'tests' },
    { id: 6, title: 'Documents',            path: 'documents' },
    { id: 7, title: 'Preview & Submit',     path: 'preview' }
];

const stepFromPath = (pathname) => {
    if (pathname.includes('/overview'))    return 0;
    if (pathname.includes('/personal'))    return 1;
    if (pathname.includes('/contact'))     return 2;
    if (pathname.includes('/course'))      return 3;
    if (pathname.includes('/academic'))    return 4;
    if (pathname.includes('/tests'))       return 5;
    if (pathname.includes('/documents'))   return 6;
    if (pathname.includes('/preview'))     return 7;
    return -1;
};

// ─── API base — matches every child component ─────────────────────────────────
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// ─── Build course slice from raw courseData ───────────────────────────────────
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

// ─── Resolve incoming course from state or localStorage ──────────────────────
const resolveIncomingCourse = (locationState) => {
    if (locationState?.fromCoursesPage && locationState?.courseData) {
        return locationState.courseData;
    }
    try {
        const stored = localStorage.getItem('selectedMasterCourseForApplication');
        if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
};

// ─── Helper: get userId from localStorage ────────────────────────────────────
const getUserId = () => {
    try {
        const userDataStr = localStorage.getItem('userData');
        if (!userDataStr || userDataStr === 'undefined') return null;
        const parsed = JSON.parse(userDataStr);
        return parsed._id || parsed.realStudentId || null;
    } catch (e) {
        return null;
    }
};

// ─── Main Master Component ────────────────────────────────────────────────────
const Master = ({ onUpdate }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isTransfer = location.pathname.includes('/transfer/');
    const BASE_PATH = isTransfer
        ? '/transfer/dashboard/master-application'
        : '/firstyear/dashboard/master-application';
    const DASHBOARD_PATH = isTransfer ? '/transfer/dashboard' : '/firstyear/dashboard';

    const [studentId, setStudentId] = useState('');
    const [dbLoaded, setDbLoaded]   = useState(false);

    // ─── Build initial formData synchronously from localStorage ──────────────
    const buildInitialFormData = () => {
        let saved = {};
        try {
            const raw = localStorage.getItem('masterApplicationData');
            if (raw) saved = JSON.parse(raw) || {};
        } catch (e) {}

        const incomingCourse = resolveIncomingCourse(location.state);
        const course = buildCourseSlice(incomingCourse, saved.course || {});

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

    // ─── Persist incoming course to localStorage once on mount ───────────────
    useEffect(() => {
        const incomingCourse = resolveIncomingCourse(location.state);
        if (incomingCourse) {
            localStorage.setItem('selectedMasterCourseForApplication', JSON.stringify(incomingCourse));
            localStorage.setItem('masterCourseConfirmed', 'true');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Student ID ───────────────────────────────────────────────────────────
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

    // ─── FETCH ALL SECTIONS FROM DB ON MOUNT ─────────────────────────────────
    //
    //  Personal  → GET /api/master-personal          Bearer token
    //              { success, data: [personalDoc] }
    //
    //  Contact   → GET /api/master-contact            Bearer token
    //              { success, data: [contactDoc] }
    //
    //  Course    → GET /api/master-course             Bearer token
    //              { success, data: [courseDoc] }
    //
    //  Academic  → GET /api/master-academic/:userId   Bearer token
    //              { success, data: { academics: [...] } }
    //
    //  Tests     → GET /api/master-test               Bearer token
    //              { success, data: { act:[..], gre:[..], ... } }
    //
    //  Documents → GET /api/master-documents          Bearer token
    //              { success, documents: { passport:{...}, ... } }
    //
    useEffect(() => {
        const token  = localStorage.getItem('token');
        const userId = getUserId();

        if (!token) {
            setDbLoaded(true);
            return;
        }

        const fetchAllSections = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };

                // Fire all requests in parallel
                const [
                    personalRes,
                    contactRes,
                    courseRes,
                    academicRes,
                    testsRes,
                    documentsRes,
                ] = await Promise.all([
                    fetch(`${API_BASE}/api/master-personal`,            { headers }),
                    fetch(`${API_BASE}/api/master-contact`,             { headers }),
                    fetch(`${API_BASE}/api/master-course`,              { headers }),
                    fetch(`${API_BASE}/api/master-academic/${userId}`,  { headers }),
                    fetch(`${API_BASE}/api/master-test`,                { headers }),
                    fetch(`${API_BASE}/api/master-documents`,           { headers }),
                ]);

                const [
                    personalJson,
                    contactJson,
                    courseJson,
                    academicJson,
                    testsJson,
                    documentsJson,
                ] = await Promise.all([
                    personalRes.ok   ? personalRes.json()   : null,
                    contactRes.ok    ? contactRes.json()    : null,
                    courseRes.ok     ? courseRes.json()     : null,
                    academicRes.ok   ? academicRes.json()   : null,
                    testsRes.ok      ? testsRes.json()      : null,
                    documentsRes.ok  ? documentsRes.json()  : null,
                ]);

                console.log('✅ Master DB fetch results:', {
                    personalJson, contactJson, courseJson,
                    academicJson, testsJson, documentsJson,
                });

                setFormData(prev => {
                    const next = { ...prev };

                    // ── 1. Personal ──────────────────────────────────────────
                    // { success: true, data: [ { fullName, dateOfBirth, ... } ] }
                    const personalDoc = personalJson?.success && personalJson.data?.length > 0
                        ? personalJson.data[0]
                        : null;

                    if (personalDoc) {
                        next.personal = {
                            _id:            personalDoc._id            || '',
                            fullName:       personalDoc.fullName       || '',
                            // dateOfBirth comes as ISO string or { $date } from MongoDB
                            dateOfBirth:    personalDoc.dateOfBirth
                                                ? new Date(personalDoc.dateOfBirth).toISOString().split('T')[0]
                                                : '',
                            gender:         personalDoc.gender         || '',
                            nationality:    personalDoc.nationality    || '',
                            passportNumber: personalDoc.passportNumber || '',
                            maritalStatus:  personalDoc.maritalStatus  || '',
                        };
                    }

                    // ── 2. Contact ───────────────────────────────────────────
                    // { success: true, data: [contactDoc] } or { success, data: contactDoc }
                    let contactDoc = null;
                    if (contactJson?.success) {
                        if (Array.isArray(contactJson.data) && contactJson.data.length > 0) {
                            contactDoc = contactJson.data[0];
                        } else if (contactJson.data && !Array.isArray(contactJson.data)) {
                            contactDoc = contactJson.data;
                        }
                    }

                    if (contactDoc && (contactDoc.emailAddress || contactDoc.mobileNumber)) {
                        next.contact = {
                            _id:            contactDoc._id            || '',
                            emailAddress:   contactDoc.emailAddress   || '',
                            mobileNumber:   contactDoc.mobileNumber   || '',
                            alternatePhone: contactDoc.alternatePhone || '',
                            addressLine1:   contactDoc.addressLine1   || '',
                            addressLine2:   contactDoc.addressLine2   || '',
                            city:           contactDoc.city           || '',
                            state:          contactDoc.state          || '',
                            postalCode:     contactDoc.postalCode     || '',
                            country:        contactDoc.country        || '',
                        };
                    }

                    // ── 3. Course ────────────────────────────────────────────
                    // { success: true, data: [courseDoc] } or { success, data: courseDoc }
                    let courseDoc = null;
                    if (courseJson?.success) {
                        if (Array.isArray(courseJson.data) && courseJson.data.length > 0) {
                            courseDoc = courseJson.data[0];
                        } else if (courseJson.data && !Array.isArray(courseJson.data)) {
                            courseDoc = courseJson.data;
                        }
                    }

                    if (courseDoc && courseDoc.preferredCourse) {
                        next.course = {
                            ...prev.course,   // keep locally-selected course fields first
                            _id:             courseDoc._id             || '',
                            preferredCourse: courseDoc.preferredCourse || prev.course?.preferredCourse || '',
                            specialization:  courseDoc.specialization  || prev.course?.specialization  || '',
                            intake:          courseDoc.intake          || prev.course?.intake          || '',
                            modeOfStudy:     courseDoc.modeOfStudy     || prev.course?.modeOfStudy     || '',
                        };
                    }

                    // ── 4. Academic ──────────────────────────────────────────
                    // masteracademic.jsx uses: GET /api/master-academic/:userId
                    // Response: { success: true, data: { academics: [...] } }
                    let academicDoc = null;
                    if (academicJson?.success) {
                        if (Array.isArray(academicJson.data) && academicJson.data.length > 0) {
                            academicDoc = academicJson.data[0];
                        } else if (academicJson.data && !Array.isArray(academicJson.data)) {
                            academicDoc = academicJson.data;
                        }
                    }

                    if (
                        academicDoc &&
                        Array.isArray(academicDoc.academics) &&
                        academicDoc.academics.length > 0
                    ) {
                        next.academic = {
                            _id:      academicDoc._id || '',
                            academics: academicDoc.academics,
                            _isValid:  true,
                        };
                    }

                    // ── 5. Tests ─────────────────────────────────────────────
                    // mastertests.jsx uses: GET /api/master-test
                    // Response: { success: true, data: { act:[...], gre:[...], ... } }
                    let testsDoc = null;
                    if (testsJson?.success) {
                        if (Array.isArray(testsJson.data) && testsJson.data.length > 0) {
                            testsDoc = testsJson.data[0];
                        } else if (testsJson.data && !Array.isArray(testsJson.data)) {
                            testsDoc = testsJson.data;
                        }
                    }

                    if (testsDoc) {
                        // Strip MongoDB metadata fields; keep only test arrays
                        // eslint-disable-next-line no-unused-vars
                        const { _id, userId: _uid, createdAt, updatedAt, __v, ...testScores } = testsDoc;
                        if (Object.keys(testScores).length > 0) {
                            next.tests = {
                                ...prev.tests,
                                ...testScores,
                                _id: _id || '',
                            };
                        }
                    }

                    // ── 6. Documents ─────────────────────────────────────────
                    // masterdocuments.jsx uses: GET /api/master-documents
                    // Response: { success: true, documents: { passport:{fileName,...}, ... } }
                    if (documentsJson?.success && documentsJson.documents) {
                        const raw = documentsJson.documents;
                        const mappedDocs = {};

                        const docFields = [
                            'passport', 'photo', 'cert10th', 'cert12th',
                            'bachelorTranscript', 'bachelorDegree', 'provisionalCertificate',
                            'consolidatedMarksheet', 'resumeCv', 'statementOfPurpose',
                            'lettersOfRecommendation', 'englishCertificate',
                            'testScores', 'workExperience',
                        ];

                        docFields.forEach(field => {
                            if (raw[field]?.fileName) {
                                mappedDocs[field] = {
                                    fileName:     raw[field].fileName,
                                    fileKey:      raw[field].fileKey      || '',
                                    fileUrl:      raw[field].fileUrl      || '',
                                    originalName: raw[field].originalName || raw[field].fileName,
                                    uploadedAt:   raw[field].uploadedAt   || '',
                                    size:         0,
                                };
                            }
                        });

                        if (Object.keys(mappedDocs).length > 0) {
                            next.documents = mappedDocs;
                        }
                    }

                    return next;
                });

            } catch (err) {
                console.error('❌ Master DB fetch error:', err);
            } finally {
                setDbLoaded(true);
            }
        };

        fetchAllSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // runs once on mount

    // ─── Redirect bare /master-application → /master-application/overview ────
    useEffect(() => {
        const step = stepFromPath(location.pathname);
        if (step === -1) {
            navigate(`${BASE_PATH}/overview`, { replace: true });
        }
    }, [location.pathname, BASE_PATH, navigate]);

    // ─── Sync currentStep with URL ────────────────────────────────────────────
    const [currentStep, setCurrentStep] = useState(() => {
        const s = stepFromPath(location.pathname);
        return s === -1 ? 0 : s;
    });

    useEffect(() => {
        const s = stepFromPath(location.pathname);
        if (s !== -1) setCurrentStep(s);
    }, [location.pathname]);

    // ─── isStepCompleted ──────────────────────────────────────────────────────
    const isStepCompleted = useCallback((stepId) => {
        switch (stepId) {
            case 0: return true;

            case 1: {
                const p = formData.personal;
                return !!(
                    p.fullName && p.dateOfBirth && p.gender &&
                    p.nationality && p.passportNumber && p.maritalStatus
                );
            }

            case 2: {
                const c = formData.contact;
                return !!(
                    c.emailAddress && c.mobileNumber && c.addressLine1 &&
                    c.city && c.state && c.country && c.postalCode
                );
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
                    if (entries.length === 0) return false;
                    return entries.every(entry =>
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

    // ─── Progress ─────────────────────────────────────────────────────────────
    const calculateProgress = useCallback(() => {
        let completedCount = 0;
        for (let i = 0; i <= 7; i++) {
            if (isStepCompleted(i)) completedCount++;
        }
        return Math.round((completedCount / 8) * 100);
    }, [isStepCompleted]);

    // ─── Save to localStorage ─────────────────────────────────────────────────
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

    // ─── Navigation ───────────────────────────────────────────────────────────
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

    // ─── Per-section update handlers ──────────────────────────────────────────
    const updatePersonal    = useCallback((data) => setFormData(prev => ({ ...prev, personal:  data })), []);
    const updateContact     = useCallback((data) => setFormData(prev => ({ ...prev, contact:   data })), []);
    const updateCourse      = useCallback((data) => setFormData(prev => ({ ...prev, course:    data })), []);
    const updateAcademic    = useCallback((data) => setFormData(prev => ({ ...prev, academic:  data })), []);
    const updateTests       = useCallback((data) => setFormData(prev => ({ ...prev, tests:     data })), []);
    const updateDocuments   = useCallback((data) => setFormData(prev => ({ ...prev, documents: data })), []);
    const updateDeclaration = useCallback((updatedData) => {
        setFormData(prev => ({ ...prev, declaration: updatedData.declaration }));
    }, []);

    // ─── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(() => {
        for (let i = 0; i <= 6; i++) {
            if (!isStepCompleted(i)) {
                const stepName = STEPS[i]?.title || `Step ${i + 1}`;
                alert(`Please complete all required sections before submitting.\n\nIncomplete section: ${stepName}`);
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
            studentId
        };

        const existing = JSON.parse(localStorage.getItem('masterApplicationSubmissions') || '[]');
        localStorage.setItem('masterApplicationSubmissions', JSON.stringify([...existing, submissionData]));

        localStorage.removeItem('masterCourseConfirmed');
        localStorage.removeItem('selectedMasterCourseForApplication');
        localStorage.removeItem('selectedCourseForApplication');

        alert('Master Application submitted successfully!');
        window.dispatchEvent(new CustomEvent('masterApplicationUpdated'));
        if (onUpdate) onUpdate();
        navigate(DASHBOARD_PATH);
    }, [formData, isStepCompleted, navigate, saveToLocalStorage, studentId, onUpdate, DASHBOARD_PATH]);

    // ─── Render step ──────────────────────────────────────────────────────────
    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0:
                return <MasterOverview data={formData} onNext={handleNext} />;
            case 1:
                return <MasterPersonal data={formData.personal} updateData={updatePersonal} />;
            case 2:
                return <MasterContact data={formData.contact} updateData={updateContact} />;
            case 3:
                return <MasterCourse data={formData.course} updateData={updateCourse} />;
            case 4:
                return <MasterAcademic data={formData.academic} updateData={updateAcademic} />;
            case 5:
                return <MasterTests data={formData.tests} updateData={updateTests} />;
            case 6:
                return <MasterDocuments data={formData.documents} updateData={updateDocuments} />;
            case 7:
                // Wait for DB fetch before rendering Preview to avoid flash of empty data
                if (!dbLoaded) {
                    return (
                        <div style={{
                            padding: '60px 20px',
                            textAlign: 'center',
                            color: '#64748b',
                            fontSize: '15px',
                        }}>
                            Loading your application data…
                        </div>
                    );
                }
                return (
                    <MasterPreview
                        data={formData}
                        updateData={updateDeclaration}
                        onEdit={navigateToStep}
                    />
                );
            default:
                return <MasterOverview data={formData} onNext={handleNext} />;
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
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

                {/* Navigation */}
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
                        ✓ Auto-saved
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Master;