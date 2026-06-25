import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { FaTimes } from 'react-icons/fa';
import './Overview.css';

const DIRECT_PROGRAM_NAME = 'Direct University Application';

const getStoredJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const hasRealCourse = (course) =>
  !!(
    course &&
    (course.programId || course._id || course.programName || course.title || course.name) &&
    (course.programName || course.title || course.name) !== DIRECT_PROGRAM_NAME
  );

const isDirectUniversityFlow = (course, selectedUniversity) =>
  !!selectedUniversity &&
  !course?.programId &&
  !course?._id &&
  !course?.programName &&
  !course?.title &&
  !course?.name;

const buildDirectUniversityCourse = (selectedUniversity) => ({
  programId:      `direct-${selectedUniversity.UNITID || Date.now()}`,
  programName:    DIRECT_PROGRAM_NAME,
  universityId:   String(selectedUniversity.UNITID || 'direct'),
  universityName: selectedUniversity.INSTNM || selectedUniversity.name || 'Unknown University',
  isDirectApply:  true,
});

const normalizeCourseForBackend = (courseData, selectedUniversity) => {
  if (!courseData) return null;

  if (isDirectUniversityFlow(courseData, selectedUniversity)) {
    return buildDirectUniversityCourse(selectedUniversity);
  }

  const programName = courseData.programName || courseData.title || courseData.name;
  const programId   = courseData.programId || courseData._id || courseData.id;

  if (!programName || !programId) return null;

  return {
    ...courseData,
    programId,
    programName,
    universityId:   courseData.universityId || courseData.UNITID || selectedUniversity?.UNITID || '',
    universityName: courseData.universityName || courseData.university || selectedUniversity?.INSTNM || selectedUniversity?.name || 'Unknown University',
    universityLogo: courseData.universityLogo || '',
    campus:         courseData.campus || '',
    country:        courseData.country || selectedUniversity?.country || '',
    intakeMonth:    courseData.intakeMonth || 'September',
    intakeYear:     courseData.intakeYear || new Date().getFullYear(),
    selectedAt:     Date.now(),
  };
};

//  FIX 1: Added fallback so API_URL is never undefined


/*
   MAIN COMPONENT
 */
const Overview = ({ formData, selectedCourseData, onStartApplication, onChangeCourse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [overviewData,        setOverviewData]        = useState(null);
  const [courseDetails,       setCourseDetails]       = useState(null);
  const [isLoading,           setIsLoading]           = useState(false);
  const [error,               setError]               = useState('');
  const [expandedCategories,  setExpandedCategories]  = useState({
    personalInfo: true, addressInfo: true,
    educationInfo: true, languageInfo: true, additionalDocs: true,
  });
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedDocument,    setSelectedDocument]    = useState(null);
  const [mobileMenuOpen,      setMobileMenuOpen]      = useState(false);
  const [activeFilter,        setActiveFilter]        = useState('all');
  const [isMobile,            setIsMobile]            = useState(window.innerWidth <= 768);
  const [selectedUniversity,  setSelectedUniversity]  = useState(null);
  const [previewStatus,       setPreviewStatus]       = useState(null);
  const [applicationMissing,  setApplicationMissing]  = useState(false);
  const overviewDataRef = useRef(null);

  useEffect(() => {
    overviewDataRef.current = overviewData;
  }, [overviewData]);

  //  Load university from navigation state or localStorage
  useEffect(() => {
    if (location.state?.university) {
      setSelectedUniversity(location.state.university);
      localStorage.setItem('currentUniversity', JSON.stringify(location.state.university));
      return;
    }
    const savedUniversity = localStorage.getItem('currentUniversity');
    if (savedUniversity) {
      try { setSelectedUniversity(JSON.parse(savedUniversity)); } catch {}
    }
  }, [location.state]);

  //  Resize handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  //  Static data
  const documentRequirements = {
    personalInfo: [
      { id: 'passport',  name: 'Passport Copy',        required: true,  format: 'PDF/JPEG', maxSize: '5MB', description: 'Clear copy of your valid passport' },
      { id: 'photo',     name: 'Passport-sized Photo', required: true,  format: 'JPEG/PNG', maxSize: '5MB', description: 'Recent passport-sized photograph' },
    ],
    addressInfo: [
      { id: 'proofOfAddress', name: 'Proof of Address', required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'Utility bill or bank statement (last 3 months)' },
    ],
    educationInfo: [
      { id: 'transcripts',           name: 'Transcripts/Marksheets',                 required: true,  format: 'PDF/JPEG', maxSize: '5MB', description: 'Academic transcripts from all institutions' },
      { id: 'bachelorCertificate',   name: 'Bachelor Certificate',                   required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'If you have completed a Bachelor degree' },
    ],
    languageInfo: [
      { id: 'englishCertificate', name: 'English Language Certificate', required: true,  format: 'PDF/JPEG', maxSize: '5MB', description: 'IELTS, TOEFL, or equivalent' },
      { id: 'germanCertificate',  name: 'German Language Certificate',  required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'Goethe-Zertifikat, TestDaF, or equivalent' },
    ],
    additionalDocs: [
      { id: 'cv',             name: 'Curriculum Vitae',               required: true,  format: 'PDF/JPEG', maxSize: '5MB', description: 'Signed and dated CV' },
      { id: 'portfolio',      name: 'Portfolio',                      required: true,  format: 'PDF/JPEG', maxSize: '5MB', description: 'Portfolio if required by program' },
      { id: 'noc',            name: 'No Objection Certificate',       required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'If applicable' },
      { id: 'deRegistration', name: 'De-registration Certificate',    required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'If previously enrolled' },
      { id: 'additional',     name: 'Additional Supporting Documents', required: false, format: 'PDF/JPEG', maxSize: '5MB', description: 'Any other relevant documents' },
    ],
  };

  const applicationSections = useMemo(() => [
    { id: 'studyProgramme',        name: 'Study Programme',        route: '/firstyear/dashboard/application/programme',              description: 'Select your desired programme' },
    { id: 'applicantDetails',      name: 'Applicant Details',      route: '/firstyear/dashboard/application/personal',               description: 'Personal information and contact details' },
    { id: 'address',               name: 'Address',                route: '/firstyear/dashboard/application/address',                description: 'Current residential address' },
    { id: 'specialNeeds',          name: 'Special Needs',          route: '/firstyear/dashboard/application/specialneeds',           description: 'Students with special needs information' },
    { id: 'higherEducation',       name: 'Education',              route: '/firstyear/dashboard/application/firsteducation',         description: 'Previous education details' },
    { id: 'testScores',            name: 'Test Scores',            route: '/firstyear/dashboard/application/scores',                 description: 'Standardized test score details' },
    { id: 'applicationDocuments',  name: 'Documents',              route: '/firstyear/dashboard/application/documents',              description: 'Upload required documents' },
    { id: 'reviewSubmit',          name: 'Review & Submit',        route: '/firstyear/dashboard/application/preview',                description: 'Review and submit your application' },
  ], []);

  const getAuthToken = () => localStorage.getItem('token');

  //
  //  FIX 2: saveCourseToBackend now calls the CORRECT route
  //    POST /api/overview    createOverview controller
  //    Required fields: programId, programName, universityName
  //
 const saveCourseToBackend = useCallback(async (courseData) => {
  try {
    const payload = normalizeCourseForBackend(courseData, selectedUniversity);
    if (!payload) return null;

    //  Use upsert route  never creates duplicates
    const currentApplicationId = localStorage.getItem('currentApplicationId');
    const existingCourse = overviewDataRef.current?.selectedCourse;
    const sameCourse =
      existingCourse?.programId === payload.programId &&
      existingCourse?.universityId === payload.universityId;
    const emptyApplication = !existingCourse?.programId;
    if (currentApplicationId && (sameCourse || emptyApplication)) {
      payload.applicationId = currentApplicationId;
    }

    const { data } = await axiosInstance.post('/api/overview/upsert-course', payload);
    const savedApplicationId = data?.applicationId || data?.overview?.applicationId;
    if (savedApplicationId) {
      localStorage.setItem('currentApplicationId', savedApplicationId);
    }
    if (data?.overview) {
      setOverviewData(data.overview);
    }

    console.log(' Course upserted:', payload.universityName, '', payload.programName);
  } catch (err) {
    console.error(' Failed to upsert course:', err?.response?.data || err.message);
  }
}, [selectedUniversity]);;

  //
  //  FIX 3: fetchOverviewData  selectedUniversity case now
  //    SAVES to backend before returning so admin sees the name
  //
  const fetchOverviewData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const currentApplicationId = localStorage.getItem('currentApplicationId');
      const response = await axiosInstance.get('/api/overview', {
        params: currentApplicationId ? { applicationId: currentApplicationId } : {},
      });

      if (response.data.success && response.data.overview) {
        setOverviewData(response.data.overview);

        try {
          const previewResponse = await axiosInstance.get('/api/application/preview', {
            params: currentApplicationId ? { applicationId: currentApplicationId } : {},
          });

          if (previewResponse.data?.success && previewResponse.data?.preview) {
            setPreviewStatus({
              completionStatus: previewResponse.data.preview.completionStatus || {},
              applicationStatus: previewResponse.data.preview.applicationStatus || response.data.overview.applicationStatus,
              agreedToTerms: previewResponse.data.preview.agreedToTerms || false,
            });
            setApplicationMissing(false);
          }
        } catch (previewErr) {
          if (previewErr?.response?.status === 404) {
            console.warn('Application preview is not available yet. Applicant Details have not been created.');
            setApplicationMissing(true);
            setPreviewStatus(null);
          } else {
            console.warn('Unable to load preview completion status:', previewErr?.response?.data || previewErr.message);
            setApplicationMissing(false);
            setPreviewStatus(null);
          }
        }

        const backendCourse = response.data.overview.selectedCourse;
        const savedCourse = getStoredJson('currentSelectedCourse');

        if (hasRealCourse(selectedCourseData)) {
          setCourseDetails(selectedCourseData);
          await saveCourseToBackend(selectedCourseData);
          return;
        }

        if (hasRealCourse(savedCourse)) {
          setCourseDetails(savedCourse);
          await saveCourseToBackend(savedCourse);
          return;
        }

        if (backendCourse) {
          setCourseDetails(backendCourse);
          if (response.data.overview.applicationId) {
            localStorage.setItem('currentApplicationId', response.data.overview.applicationId);
          }
          return;
        }

        if (selectedUniversity) {
          const universityDetails = buildDirectUniversityCourse(selectedUniversity);
          setCourseDetails(universityDetails);
          await saveCourseToBackend(universityDetails);
          return;
        }

        const saved = localStorage.getItem('currentSelectedCourse');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCourseDetails(parsed);
          await saveCourseToBackend(parsed);
          } catch (err) {
            console.error('Error parsing saved course:', err);
          }
        }
      }
    } catch (err) {
      console.error(' fetchOverviewData error:', err);
      setError('Failed to load overview data');
      if (hasRealCourse(selectedCourseData)) {
        setCourseDetails(selectedCourseData);
        return;
      }
      const savedCourse = getStoredJson('currentSelectedCourse');
      if (hasRealCourse(savedCourse)) {
        setCourseDetails(savedCourse);
        return;
      }

      //  Error fallbacks (same priority, no backend save)
      if (selectedUniversity) {
        setCourseDetails({
          programId:      `direct-${selectedUniversity.UNITID || Date.now()}`,
          programName:    'Direct University Application',
          universityId:   String(selectedUniversity.UNITID   || 'direct'),
          universityName: selectedUniversity.INSTNM           || 'Unknown University',
        });
        return;
      }
      if (selectedCourseData) {
        setCourseDetails(selectedCourseData);
        return;
      }
      const saved = localStorage.getItem('currentSelectedCourse');
      if (saved) {
        try { setCourseDetails(JSON.parse(saved)); } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseData, selectedUniversity, saveCourseToBackend]);

  useEffect(() => { fetchOverviewData(); }, [fetchOverviewData]);

  // Computed state from backend preview completion when available
  const isApplicationSubmitted =
    overviewData?.applicationStatus === 'submitted' ||
    previewStatus?.applicationStatus === 'submitted';

  const getCompletedSections = useCallback(() => {
    if (isApplicationSubmitted) {
      return Object.fromEntries(applicationSections.map(section => [section.id, true]));
    }

    const completionStatus = previewStatus?.completionStatus || {};
    const hasBackendCompletion = Object.keys(completionStatus).length > 0;

    if (hasBackendCompletion) {
      return {
        studyProgramme:        !!courseDetails,
        applicantDetails:      !!completionStatus.personalDone,
        address:               !!completionStatus.addressDone,
        specialNeeds:          !!completionStatus.specialNeedDone,
        higherEducation:       !!completionStatus.educationDone,
        testScores:            true,
        applicationDocuments:  !!completionStatus.documentsDone,
        reviewSubmit:          false,
      };
    }

    return {
      studyProgramme:        !!courseDetails,
      applicantDetails:      !!(formData?.firstName && formData?.lastName && formData?.email && formData?.dateOfBirth && (formData?.citizenship || formData?.nationality)),
      address:               !!((formData?.streetAndHouseNumber || formData?.street) && formData?.city && formData?.country && (formData?.postcode || formData?.postCode) && formData?.stateProvince),
      specialNeeds:          formData?.hasSpecialNeeds !== undefined,
      higherEducation:       formData?.wasEnrolled !== undefined || formData?.hasHigherEducation !== undefined,
      testScores:            !!(formData?.scores && Object.values(formData.scores).some(Boolean)),
      applicationDocuments:  !!(formData?.documents && Object.keys(formData.documents).length > 0),
      reviewSubmit:          false,
    };
  }, [formData, courseDetails, previewStatus, isApplicationSubmitted, applicationSections]);

  const calculateProgress = useCallback(() => {
    if (isApplicationSubmitted) {
      return {
        percentage: 100,
        completed: applicationSections.length,
        total: applicationSections.length,
        remaining: 0,
      };
    }

    const completed      = getCompletedSections();
    const total          = applicationSections.length;
    const completedCount = Object.values(completed).filter(Boolean).length;
    return {
      percentage: Math.round((completedCount / total) * 100),
      completed: completedCount, total, remaining: total - completedCount,
    };
  }, [getCompletedSections, isApplicationSubmitted, applicationSections]);

  //  Handlers
  const handleSectionClick      = (route) => { navigate(route); if (isMobile) setMobileMenuOpen(false); };
  const handleStartApplication  = () => { onStartApplication ? onStartApplication() : navigate('/firstyear/dashboard/application/programme'); };
  const handleChangeCourse      = () => {
    if (onChangeCourse) { onChangeCourse(); }
    else if (window.confirm('Do you want to select a different course?')) navigate('/firstyear/dashboard/college-search');
  };
  const handleContinueApplication = () => {
    if (isApplicationSubmitted) {
      navigate('/firstyear/dashboard/application/preview');
      return;
    }

    const completed = getCompletedSections();
    const next      = applicationSections.find(s => !completed[s.id]);
    navigate(next ? next.route : '/firstyear/dashboard/application/preview');
  };

  const toggleCategory = (cat) => setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  const handleDocumentPreview = (docId) => {
    if (formData?.documents?.[docId]) {
      const allDocs  = Object.values(documentRequirements).flat();
      const docMeta  = allDocs.find(d => d.id === docId);
      setSelectedDocument({
        id:   docId,
        name: docMeta?.name || docId,
        url:  formData.documents[docId].url || URL.createObjectURL(formData.documents[docId]),
      });
      setShowDocumentPreview(true);
    }
  };
  const closeDocumentPreview = () => { setShowDocumentPreview(false); setSelectedDocument(null); };

  const getDocumentStatus = (sectionId) => {
    if (!formData?.documents) return { uploaded: 0, total: 0, documents: [] };
    const docs     = documentRequirements[sectionId] || [];
    let   uploaded = 0;
    const list     = docs.map(doc => {
      if (formData.documents[doc.id]) { uploaded++; return { ...doc, uploaded: true, file: formData.documents[doc.id] }; }
      return { ...doc, uploaded: false };
    });
    return { uploaded, total: docs.length, documents: list };
  };

  const formatFileSize = (bytes) => {
    if (!bytes)              return '';
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFilteredSections = () => {
    const completed = getCompletedSections();
    if (activeFilter === 'pending')   return applicationSections.filter(s => !completed[s.id]);
    if (activeFilter === 'completed') return applicationSections.filter(s =>  completed[s.id]);
    return applicationSections;
  };

  /*  Loading  */
  if (isLoading && !courseDetails) return (
    <div className="overview-container">
      <div className="overview-loading-state">
        <div className="overview-loading-spinner" />
        <p>Loading your application overview...</p>
      </div>
    </div>
  );

  /*  Error  */
  if (error) return (
    <div className="overview-container">
      <div className="overview-error-state">
        <div className="overview-error-icon">!</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button className="overview-retry-btn" onClick={fetchOverviewData}>Try Again</button>
      </div>
    </div>
  );

  /*  No course  */
  if (!courseDetails && !selectedUniversity) return (
    <div className="overview-container">
      <div className="overview-no-course-selected">
        <div className="overview-no-course-icon"></div>
        <h2>No Course Selected</h2>
        <p>Please select a course to start your application</p>
        <button className="overview-select-course-btn" onClick={() => navigate('/firstyear/dashboard/college-search')}>
          Browse Courses
        </button>
      </div>
    </div>
  );

  const progress          = calculateProgress();
  const completedSections = getCompletedSections();
  const filteredSections  = getFilteredSections();

  /*  Document category block  */
  const DocCategory = ({ id, title }) => {
    const status = getDocumentStatus(id);
    return (
      <div className="overview-document-category">
        <div className="overview-category-header" onClick={() => toggleCategory(id)}>
          <h4 className="overview-category-title">{title} ({status.uploaded}/{status.total})</h4>
          <span className="overview-category-toggle">{expandedCategories[id] ? '-' : '+'}</span>
        </div>
        {expandedCategories[id] && (
          <div className="overview-category-content">
            {status.documents.map((doc, i) => (
              <div key={i} className={`overview-document-item ${doc.uploaded ? 'uploaded' : ''}`}>
                <div className="overview-document-info">
                  <div className="overview-document-name-row">
                    <span className="overview-document-name">{doc.name}</span>
                    <span className={`overview-document-badge ${doc.required ? 'required' : 'optional'}`}>
                      {doc.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <div className="overview-document-meta">
                    <span className="overview-document-format">{doc.format}</span>
                    <span className="overview-document-size">{doc.maxSize}</span>
                  </div>
                  {doc.description && <div className="overview-document-description">{doc.description}</div>}
                  {doc.uploaded && (
                    <div className="overview-document-uploaded-info">
                      <span className="overview-uploaded-name">{doc.file?.name}</span>
                      <span className="overview-uploaded-size">{formatFileSize(doc.file?.size)}</span>
                      <button className="overview-preview-btn" onClick={() => handleDocumentPreview(doc.id)}>Preview</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /*
     RENDER
   */
  return (
    <div className="overview-container">

      {/* Mobile header */}
      {isMobile && (
        <div className="overview-mobile-header">
          <button className="overview-mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span>Menu</span>
          </button>
          <div className="overview-mobile-progress">{progress.percentage}%</div>
        </div>
      )}

      {/* Overview Header */}
      <div className={`overview-header ${isMobile && !mobileMenuOpen ? 'hidden-mobile' : ''}`}>
        <div className="overview-header-left">
          <div className="overview-application-id">
            <span className="overview-id-label">Application ID</span>
            <span className="overview-id-value">{overviewData?.applicationId || 'UEG0507062'}</span>
          </div>
        </div>
        <div className="overview-header-right">
          <div className="overview-status-wrapper">
            <span className={`overview-status-badge ${progress.percentage === 100 ? 'completed' : 'in-progress'}`}>
              {isApplicationSubmitted ? 'Submitted' : progress.percentage === 100 ? 'Completed' : 'In Progress'}
            </span>
          </div>
          <div className="overview-stats-wrapper">
            <div className="overview-stat-item">
              <span className="overview-stat-label">Completed</span>
              <span className="overview-stat-value">{progress.completed}/{progress.total}</span>
            </div>
            <div className="overview-stat-item">
              <span className="overview-stat-label">Remaining</span>
              <span className="overview-stat-value">{progress.remaining}</span>
            </div>
          </div>
        </div>
      </div>

      {applicationMissing && (
        <div className="overview-documents-note" style={{ marginTop: 0, marginBottom: 18 }}>
          Complete Applicant Details first to unlock full preview and submission status.
        </div>
      )}

      {/* Grid */}
      <div className="overview-grid">

        {/* Left  Sections */}
        <div className={`overview-sections-column ${isMobile && !mobileMenuOpen ? 'hidden-mobile' : ''}`}>
          <div className="overview-sections-header">
            <h2 className="overview-sections-title">Application Sections</h2>
            <div className="overview-sections-filter">
              <select className="overview-filter-select" value={activeFilter} onChange={e => setActiveFilter(e.target.value)}>
                <option value="all">All Sections</option>
                <option value="pending">Pending Only</option>
                <option value="completed">Completed Only</option>
              </select>
            </div>
          </div>

          <div className="overview-sections-list">
            {filteredSections.map(section => {
              const isCompleted = completedSections[section.id];
              const progressValue = isCompleted ? 100 : (() => {
                switch (section.id) {
                  case 'studyProgramme':        return courseDetails ? 100 : 20;
                  case 'applicantDetails':      return formData?.firstName ? 40 : 10;
                  case 'address':               return formData?.city ? 50 : 10;
                  case 'specialNeeds':          return formData?.hasSpecialNeeds !== undefined ? 80 : 10;
                  case 'higherEducation':       return formData?.hasHigherEducation ? 70 : 10;
                  case 'testScores':            return formData?.scores && Object.values(formData.scores).some(Boolean) ? 70 : 10;
                  case 'applicationDocuments':  return formData?.documents ? 50 : 10;
                  default:                      return 15;
                }
              })();

              return (
                <div
                  key={section.id}
                  className={`overview-section-item ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleSectionClick(section.route)}
                >
                  <div className="overview-section-content">
                    <div className="overview-section-name">{section.name}</div>
                    <div className="overview-section-description">{section.description}</div>
                    {!isCompleted && (
                      <div className="overview-section-progress">
                        <div className="overview-progress-bar-small">
                          <div className="overview-progress-fill-small" style={{ width: `${progressValue}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="overview-section-status">
                    {isCompleted ? (
                      <span className="overview-status-badge completed">Completed</span>
                    ) : (
                      <span className="overview-status-badge pending">{progressValue}% In Progress</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress summary */}
          <div className="overview-progress-summary">
            <div className="overview-summary-item">
              <span className="overview-summary-label">Sections Completed</span>
              <span className="overview-summary-value">{progress.completed}/{progress.total}</span>
            </div>
            <div className="overview-progress-bar-container">
              <div className="overview-progress-fill" style={{ width: `${progress.percentage}%` }} />
            </div>
          </div>

          {/* Mobile action buttons */}
          {isMobile && (
            <div className="overview-mobile-action-buttons">
              {progress.percentage === 0 ? (
                <button className="overview-start-application-btn overview-mobile-btn" onClick={handleStartApplication}>
                  Start Application
                </button>
              ) : (
                <>
                  <button className="overview-continue-application-btn overview-mobile-btn" onClick={handleContinueApplication}>
                    {isApplicationSubmitted ? 'View Submitted Application' : `Continue (${progress.percentage}%)`}
                  </button>
                  {progress.percentage === 100 && !isApplicationSubmitted && (
                    <button className="overview-submit-application-btn overview-mobile-btn" onClick={() => navigate('/firstyear/dashboard/application/preview')}>
                      Submit
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right  Details */}
        <div className={`overview-details-column ${isMobile && !mobileMenuOpen ? 'hidden-mobile' : ''}`}>

          {/* Course Card */}
          <div className="overview-course-card">
            <div className="overview-card-header">
              <h3 className="overview-card-title">Selected Programme</h3>
              <button className="overview-change-course-link" onClick={handleChangeCourse}>Change Course</button>
            </div>
            <div className="overview-course-info">
              <div className="overview-program-header">
                <h4 className="overview-program-name">
                  {courseDetails?.programName || 'Direct University Application'}
                </h4>
                <div className="overview-university-badge">
                  {courseDetails?.universityName || selectedUniversity?.INSTNM || 'Selected University'}
                </div>
              </div>
              <div className="overview-program-details-grid">
                {[
                  ['Programme type', courseDetails?.programType    || 'Undergraduate'],
                  ['Language',       courseDetails?.language       || 'English'],
                  ['Campus',         courseDetails?.campus         || 'Berlin'],
                  ['Duration',       courseDetails?.duration       || '3 years'],
                  ['Study start',    `${courseDetails?.intakeMonth || 'September'} ${courseDetails?.intakeYear || '2024'}`],
                  ['Application fee',courseDetails?.applicationFee || 'EUR 75'],
                ].map(([label, value]) => (
                  <div key={label} className="overview-detail-item">
                    <span className="overview-detail-label">{label}</span>
                    <span className="overview-detail-value">{value}</span>
                  </div>
                ))}
              </div>
              {courseDetails?.requirements && (
                <div className="overview-program-requirements">
                  <h5 className="overview-requirements-title">Programme Requirements</h5>
                  <ul className="overview-requirements-list">
                    {courseDetails.requirements.map((req, i) => <li key={i}>{req}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Documents Card */}
          <div className="overview-documents-card">
            <div className="overview-card-header">
              <h3 className="overview-card-title">Required Documents</h3>
              <button className="overview-upload-more-btn" onClick={() => navigate('/firstyear/dashboard/application/documents')}>
                Upload More
              </button>
            </div>
            <div className="overview-documents-list">
              <DocCategory id="personalInfo"   title="Personal Information" />
              <DocCategory id="educationInfo"  title="Education" />
              <DocCategory id="languageInfo"   title="Language Certificates" />
              <DocCategory id="additionalDocs" title="Additional Documents" />
            </div>
            <div className="overview-documents-note">
              <strong>Important Note</strong>
              {' '}All documents not in English or German must be professionally translated.
              Certified translations must be submitted along with a copy of the original document.
            </div>
          </div>

          {/* Desktop Action Buttons */}
          {!isMobile && (
            <div className="overview-action-buttons">
              {progress.percentage === 0 ? (
                <button className="overview-start-application-btn" onClick={handleStartApplication}>
                  Start Application
                </button>
              ) : (
                <>
                  <button className="overview-continue-application-btn" onClick={handleContinueApplication}>
                    {isApplicationSubmitted ? 'View Submitted Application' : `Continue Application (${progress.percentage}%)`}
                  </button>
                  {progress.percentage === 100 && !isApplicationSubmitted && (
                    <button className="overview-submit-application-btn" onClick={() => navigate('/firstyear/dashboard/application/preview')}>
                      Review and Submit
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tips Card */}
          <div className="overview-tips-card">
            <h3 className="overview-card-title">Application Tips</h3>
            <ul className="overview-tips-list">
              {[
                'Ensure all documents are clear and legible',
                'Check document formats (PDF/JPEG only)',
                'Maximum file size per document is 5MB',
                'All required fields must be completed',
                'Review your application before submission',
              ].map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>

        </div>
      </div>

      {/* Document Preview Modal */}
      {showDocumentPreview && selectedDocument && (
        <div className="overview-modal-overlay" onClick={closeDocumentPreview}>
          <div className="overview-modal-content" onClick={e => e.stopPropagation()}>
            <div className="overview-modal-header">
              <h3>{selectedDocument.name}</h3>
              <button className="overview-close-btn" onClick={closeDocumentPreview} aria-label="Close"><FaTimes size={16} aria-hidden="true" /></button>
            </div>
            <div className="overview-modal-body">
              {selectedDocument.url && (
                <iframe src={selectedDocument.url} title={selectedDocument.name} className="overview-document-preview" />
              )}
            </div>
            <div className="overview-modal-footer">
              <button className="overview-download-btn" onClick={() => window.open(selectedDocument.url, '_blank')}>
                Download
              </button>
              <button className="overview-close-btn" onClick={closeDocumentPreview} aria-label="Close"><FaTimes size={16} aria-hidden="true" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
