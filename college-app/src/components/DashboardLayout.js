// src/components/DashboardLayout.js - FULLY UPDATED WITH MOBILE SUPPORT
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardLayout = ({ userData, children, activeMainSection, onSectionChange, userColleges = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [expandedSections, setExpandedSections] = useState({
    testing: false,
    colleges: false,
    writing: false,
    activities: false,
    courses: false,
    application: false,
    expandedColleges: {}
  });
  const [forceUpdate, setForceUpdate] = useState(0);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Calculate completed sections for "My Common Application" in sidebar
  const calculateCommonAppProgress = () => {
    if (!userData) return '0/8';
    
    const sections = [
      userData.applicationProgress?.application || 0,
      userData.profileProgress || 0,
      userData.applicationProgress?.family || 0,
      userData.applicationProgress?.education || 0,
      userData.applicationProgress?.testing || 0,
      userData.applicationProgress?.activities || 0,
      userData.applicationProgress?.writing || 0
    ];
    
    const completed = sections.filter(progress => progress >= 100).length;
    const total = sections.length;
    
    return `${completed}/${total}`;
  };

  // Calculate overall progress percentage
  const calculateOverallProgress = () => {
    if (!userData) return 0;
    
    const sections = [
      userData.applicationProgress?.application || 0,
      userData.profileProgress || 0,
      userData.applicationProgress?.family || 0,
      userData.applicationProgress?.education || 0,
      userData.applicationProgress?.testing || 0,
      userData.applicationProgress?.activities || 0,
      userData.applicationProgress?.writing || 0
    ];
    
    const totalProgress = sections.reduce((sum, progress) => sum + progress, 0);
    return Math.round(totalProgress / sections.length);
  };

  // Auto-expand sections when on their pages
  useEffect(() => {
    const path = location.pathname;
    
    if (path.includes('/testing')) {
      setExpandedSections(prev => ({ ...prev, testing: true }));
    }
    if (path.includes('/colleges') && !path.includes('/college-search')) {
      setExpandedSections(prev => ({ ...prev, colleges: true }));
    }
    if (path.includes('/writing')) {
      setExpandedSections(prev => ({ ...prev, writing: true }));
    }
    if (path.includes('/activities')) {
      setExpandedSections(prev => ({ ...prev, activities: true }));
    }
    if (path.includes('/courses')) {
      setExpandedSections(prev => ({ ...prev, courses: true }));
    }
    if (path.includes('/application')) {
      setExpandedSections(prev => ({ ...prev, application: true }));
    }
  }, [location.pathname]);

  // Auto-expand specific college when on its pages
  useEffect(() => {
    if (location.pathname.includes('/colleges/')) {
      const pathParts = location.pathname.split('/');
      const collegeIdIndex = pathParts.findIndex(part => part === 'colleges') + 1;
      if (collegeIdIndex < pathParts.length && pathParts[collegeIdIndex]) {
        const collegeId = pathParts[collegeIdIndex];
        if (collegeId && collegeId !== 'colleges') {
          setExpandedSections(prev => ({
            ...prev,
            expandedColleges: {
              ...prev.expandedColleges,
              [collegeId]: true
            }
          }));
        }
      }
    }
  }, [location.pathname]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => setForceUpdate(prev => prev + 1);
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const handleTestingDataUpdate = () => setForceUpdate(prev => prev + 1);
    window.addEventListener('testingDataUpdated', handleTestingDataUpdate);
    return () => window.removeEventListener('testingDataUpdated', handleTestingDataUpdate);
  }, []);

  useEffect(() => {
    const handleCollegeFormUpdate = () => setForceUpdate(prev => prev + 1);
    window.addEventListener('collegeFormUpdated', handleCollegeFormUpdate);
    return () => window.removeEventListener('collegeFormUpdated', handleCollegeFormUpdate);
  }, []);

  useEffect(() => {
    const handleApplicationUpdate = () => setForceUpdate(prev => prev + 1);
    window.addEventListener('applicationUpdated', handleApplicationUpdate);
    return () => window.removeEventListener('applicationUpdated', handleApplicationUpdate);
  }, []);

  const getStudentId = () => {
    if (!userData) return 'CAID Loading...';
    const possibleIds = [
      userData.studentId,
      userData.caId,
      userData.CAID,
      userData.studentID,
      userData._id
    ];
    const foundId = possibleIds.find(id => id && id !== '');
    if (foundId) {
      if (foundId.length === 24) {
        return `CAID-${foundId.substring(0, 8).toUpperCase()}`;
      }
      return foundId;
    }
    return 'CAID Loading...';
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('gusApplicationData');
    localStorage.removeItem('selectedCourseForApplication');
    localStorage.removeItem('currentSelectedCourse');
    navigate('/');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCollege = (collegeId) => {
    setExpandedSections(prev => ({
      ...prev,
      expandedColleges: {
        ...prev.expandedColleges,
        [collegeId]: !prev.expandedColleges[collegeId]
      }
    }));
  };

  const getSelectedTests = () => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        const tests = parsedData.testingData?.testsToReport || [];
        return tests;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
    if (userData?.testingData?.testsToReport) {
      return userData.testingData.testsToReport;
    }
    return [];
  };

  const getApplicationProgress = () => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        return parsedData.applicationProgress?.application || 0;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
    return userData?.applicationProgress?.application || 0;
  };

  const calculateApplicationStepProgress = (step) => {
    const gusAppData = JSON.parse(localStorage.getItem('gusApplicationData') || '{}');
    const isFieldFilled = (fieldValue) => {
      if (fieldValue === null || fieldValue === undefined || fieldValue === false) return false;
      if (typeof fieldValue === 'string') return fieldValue.trim() !== '';
      if (typeof fieldValue === 'number') return true;
      if (Array.isArray(fieldValue)) return fieldValue.length > 0;
      if (typeof fieldValue === 'object') {
        if (fieldValue.grade9 || fieldValue.grade10 || fieldValue.grade11 || fieldValue.grade12 ||
            fieldValue.satTotal || fieldValue.act || fieldValue.toefl || fieldValue.ielts) {
          return true;
        }
        return Object.keys(fieldValue).length > 0;
      }
      return !!fieldValue;
    };

    switch(step) {
      case 'personal':
        const personalFields = ['firstName', 'lastName', 'gender', 'dob', 'nationality',
                                'countryOfResidence', 'email', 'mobile'];
        const personalFilled = personalFields.filter(field => isFieldFilled(gusAppData[field])).length;
        return (personalFilled / personalFields.length) * 100;
      case 'address':
        const addressFields = ['currentAddress', 'city', 'country', 'state', 'postalCode'];
        const addressFilled = addressFields.filter(field => isFieldFilled(gusAppData[field])).length;
        return (addressFilled / addressFields.length) * 100;
      case 'entrance-qualification':
        const eqheFields = ['eqheDate', 'eqheCity', 'eqheCountry', 'eqheOriginalTitle', 'hasAnotherEQHE'];
        const eqheFilled = eqheFields.filter(field => isFieldFilled(gusAppData[field])).length;
        return (eqheFilled / eqheFields.length) * 100;
      case 'special-needs':
        if (gusAppData.hasSpecialNeeds === 'no') return 100;
        if (gusAppData.hasSpecialNeeds === 'yes' && isFieldFilled(gusAppData.specialNeedsDescription)) return 100;
        return 0;
      case 'education':
        const educationFields = ['qualificationLevel', 'institutionName', 'boardUniversity',
                                'countryOfStudy', 'startYear', 'endYear'];
        const educationFilled = educationFields.filter(field => isFieldFilled(gusAppData[field])).length;
        return (educationFilled / educationFields.length) * 100;
      case 'test-scores':
        const scores = gusAppData.scores || {};
        const hasAnyScore = scores.grade9 || scores.grade10 || scores.grade11 || scores.grade12 ||
                           scores.satTotal || scores.act || scores.toefl || scores.ielts;
        return hasAnyScore ? 100 : 0;
      case 'documents':
        const documentFields = ['passport', 'transcripts', 'degreeCertificate', 'sop', 'lor1', 'lor2', 'eqheCertificate'];
        const documentFilled = documentFields.filter(field => {
          const fieldName = field + 'FileName';
          return isFieldFilled(gusAppData[field]) || isFieldFilled(gusAppData[fieldName]);
        }).length;
        return (documentFilled / documentFields.length) * 100;
      case 'preview':
        return gusAppData.agreedToTerms ? 100 : 0;
      default:
        return 0;
    }
  };

  const getCurrentApplicationStep = () => {
    const path = location.pathname;
    if (path.includes('/application/personal')) return 'personal';
    if (path.includes('/application/address')) return 'address';
    if (path.includes('/application/language')) return 'entrance-qualification';
    if (path.includes('/application/specialneeds')) return 'special-needs';
    if (path.includes('/application/firsteducation') || path.includes('/application/education')) return 'education';
    if (path.includes('/application/scores')) return 'test-scores';
    if (path.includes('/application/documents')) return 'documents';
    if (path.includes('/application/preview')) return 'preview';
    if (path.includes('/application/overview')) return 'overview';
    return '';
  };

  const studentType = location.pathname.includes('/transfer/') ? 'transfer' : 'firstyear';
  const basePath = `/${studentType}/dashboard`;

  const testTypes = [
    { id: 'act-tests', name: 'ACT Tests', route: `${basePath}/testing/act-tests` },
    { id: 'sat-tests', name: 'SAT Tests', route: `${basePath}/testing/sat-tests` },
    { id: 'sat-subject-tests', name: 'SAT Subject Tests', route: `${basePath}/testing/sat-subject-tests` },
    { id: 'ap-subject-tests', name: 'AP Tests', route: `${basePath}/testing/ap-subject-tests` },
    { id: 'ib-subject-tests', name: 'IB Tests', route: `${basePath}/testing/ib-subject-tests` },
    { id: 'cambridge', name: 'Cambridge Tests', route: `${basePath}/testing/cambridge` },
    { id: 'toefl-ibt', name: 'TOEFL iBT', route: `${basePath}/testing/toefl-ibt` },
    { id: 'pte-academic-tests', name: 'PTE Academic', route: `${basePath}/testing/pte-academic-tests` },
    { id: 'ielts', name: 'IELTS', route: `${basePath}/testing/ielts` },
    { id: 'duolingo-english-test', name: 'Duolingo English Test', route: `${basePath}/testing/duolingo-english-test` }
  ];

  const selectedTests = getSelectedTests();
  const selectedTestTypes = selectedTests.length > 0
    ? testTypes.filter(test => selectedTests.includes(test.id))
    : [];

  const applicationProgress = getApplicationProgress();
  const currentAppStep = getCurrentApplicationStep();

  // CollegeSidebarItem Component
  const CollegeSidebarItem = ({ college, isExpanded, onToggle, onNavigate }) => {
    const [showInternational, setShowInternational] = useState(false);

    useEffect(() => {
      const shouldShowInternational = localStorage.getItem(`college_${college.collegeId}_show_international`) === 'true';
      setShowInternational(shouldShowInternational);
    }, [college.collegeId]);

    useEffect(() => {
      const handleCollegeFormUpdate = (event) => {
        if (event.detail.collegeId === college.collegeId) {
          setShowInternational(event.detail.showInternational);
        }
      };
      window.addEventListener('collegeFormUpdated', handleCollegeFormUpdate);
      return () => window.removeEventListener('collegeFormUpdated', handleCollegeFormUpdate);
    }, [college.collegeId]);

    const applicationSubsections = [
      { id: 'documents', name: 'Documents' },
      { id: 'general', name: 'General' },
      { id: 'academics', name: 'Academics' },
      { id: 'high-school', name: 'High School Curriculum' },
      { id: 'activities', name: 'Activities' },
      { id: 'contacts', name: 'Contacts' },
      { id: 'family', name: 'Family' },
      { id: 'residency', name: 'Residency' },
      ...(showInternational ? [{ id: 'international', name: 'International Student Information' }] : []),
    ];

    const isCollegeActive = location.pathname.includes(`/colleges/${college.collegeId}`);

    return (
      <li className="nav-college-item">
        <div
          className={`nav-college-header ${isCollegeActive ? 'active' : ''}`}
          onClick={onToggle}
        >
          <span className="nav-text">{college.name}</span>
          <span className="expand-icon">{isExpanded ? '▼' : '►'}</span>
        </div>

        {isExpanded && (
          <ul className="nav-college-submenu">
            <li className="nav-college-subitem">
              <div className="nav-college-subheader">
                <span className="nav-text">APPLICATION</span>
              </div>
              <ul className="nav-application-submenu">
                {applicationSubsections.map((subsection) => {
                  const isSubsectionActive = location.pathname === `${basePath}/colleges/${college.collegeId}/${subsection.id}`;
                  return (
                    <li key={subsection.id} className={`nav-application-subitem ${isSubsectionActive ? 'active' : ''}`}>
                      <div
                        className={`nav-content ${isSubsectionActive ? 'active' : ''}`}
                        onClick={() => onNavigate(`college-${college.collegeId}-${subsection.id}`)}
                      >
                        <span className="nav-text">{subsection.name}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
            <li className={`nav-college-subitem ${location.pathname === `${basePath}/colleges/${college.collegeId}/review` ? 'active' : ''}`}>
              <div
                className={`nav-content ${location.pathname === `${basePath}/colleges/${college.collegeId}/review` ? 'active' : ''}`}
                onClick={() => onNavigate(`college-${college.collegeId}-review`)}
              >
                <span className="nav-text">Review and submit application</span>
              </div>
            </li>
          </ul>
        )}
      </li>
    );
  };

  const handleCollegeSubsectionNavigate = (sectionId) => {
    const parts = sectionId.split('-');
    const collegeId = parts[1];
    const subsection = parts.slice(2).join('-');
    navigate(`${basePath}/colleges/${collegeId}/${subsection}`);
  };

  const getSidebarContent = () => {
    if (activeMainSection === 'profile') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Profile</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/personal') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('personal')}>
                <span className="nav-text">Personal Information</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/contact') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('contact')}>
                <span className="nav-text">Contact Details</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/address') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('address')}>
                <span className="nav-text">Address</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/demographics') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('demographics')}>
                <span className="nav-text">Demographics</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/language') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('language')}>
                <span className="nav-text">Language</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/geography') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('geography')}>
                <span className="nav-text">Geography & Nationality</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'family') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Family</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/household') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/family/household`)}>
                <span className="nav-text">Household</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/parent1') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/family/parent1`)}>
                <span className="nav-text">Parent 1</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/parent2') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/family/parent2`)}>
                <span className="nav-text">Parent 2</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/sibling') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/family/sibling`)}>
                <span className="nav-text">Sibling</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'education') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Education</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/current-school') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/current-school`)}>
                <span className="nav-text">Current or Most Recent Secondary/High School</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/other-schools') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/other-schools`)}>
                <span className="nav-text">Other Secondary/High Schools</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/colleges') && !location.pathname.includes('/dashboard/colleges') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/colleges`)}>
                <span className="nav-text">Colleges & Universities</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/grades') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/grades`)}>
                <span className="nav-text">Grades</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/current-courses') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/current-courses`)}>
                <span className="nav-text">Current or Most Recent Year Courses</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/honors') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/honors`)}>
                <span className="nav-text">Honors</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/community-organizations') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/community-organizations`)}>
                <span className="nav-text">Community-Based Organizations</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/future-plans') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/future-plans`)}>
                <span className="nav-text">Future Plans</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/documents') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/documents`)}>
                <span className="nav-text">Documents Upload</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'writing') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Writing</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/personal-essay') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/writing/personal-essay`)}>
                <span className="nav-text">Personal Essay</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/additional-information') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/writing/additional-information`)}>
                <span className="nav-text">Additional Information</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'activities') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Activities</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/activities/activities') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/activities/activities`)}>
                <span className="nav-text">Activities</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/responsibilities') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/activities/responsibilities`)}>
                <span className="nav-text">Responsibilities and circumstances</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'testing') {
      const sectionDisplayNames = {
        'tests-taken': 'Tests Taken',
        'act-tests': 'ACT Tests',
        'sat-tests': 'SAT Tests',
        'sat-subject-tests': 'SAT Subject Tests',
        'ap-subject-tests': 'AP Tests',
        'ib-subject-tests': 'IB Tests',
        'cambridge': 'Cambridge Tests',
        'toefl-ibt': 'TOEFL iBT',
        'pte-academic-tests': 'PTE Academic',
        'ielts': 'IELTS',
        'duolingo-english-test': 'Duolingo English Test'
      };

      const sectionsToShow = [
        'tests-taken',
        ...selectedTests.filter(test => test !== 'tests-taken')
      ];

      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Testing</h4>
          <ul className="nav-menu">
            {sectionsToShow.map((section) => (
              <li
                key={section}
                className={`nav-item ${location.pathname.includes(`/${section}`) ? 'active' : ''}`}
              >
                <div
                  className="nav-content"
                  onClick={() => navigate(`${basePath}/testing/${section}`)}
                >
                  <span className="nav-text">{sectionDisplayNames[section] || section}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'courses') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Courses</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/courses') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/college-search`)}>
                <span className="nav-hint">← Go to College Search</span>
              </div>
            </li>
            <li className="nav-item">
              <div className="nav-content" onClick={() => {
                navigate(`${basePath}/college-search`);
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('filterGUSUniversities'));
                }, 100);
              }}>
                <span className="nav-text">GUS Portal Universities</span>
              </div>
            </li>
            <li className="nav-item">
              <div className="nav-content" onClick={() => {
                const savedPrograms = JSON.parse(localStorage.getItem('savedPrograms') || '[]');
                if (savedPrograms.length > 0) {
                  alert(`You have ${savedPrograms.length} saved programs`);
                } else {
                  alert('No saved programs yet. Browse universities to save programs.');
                  navigate(`${basePath}/college-search`);
                }
              }}>
                <span className="nav-text">Saved Programs</span>
                <span className="nav-count">
                  {(() => {
                    const savedPrograms = JSON.parse(localStorage.getItem('savedPrograms') || '[]');
                    return savedPrograms.length > 0 ? savedPrograms.length : '';
                  })()}
                </span>
              </div>
            </li>
            <li className="nav-item">
              <div className="nav-content" onClick={() => {
                alert('Course Application Timeline:\n\n1. Browse universities in College Search\n2. Click on any GUS university\n3. View available programs and courses\n4. Select a program to apply\n5. Add to My Colleges');
              }}>
                <span className="nav-text">Application Timeline</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'application') {
      const applicationSteps = [
        { id: 'overview', name: 'Application Overview', route: `${basePath}/application/overview` },
        { id: 'personal', name: 'Personal Information', route: `${basePath}/application/personal` },
        { id: 'address', name: 'Address', route: `${basePath}/application/address` },
        { id: 'entrance-qualification', name: 'Entrance Qualification', route: `${basePath}/application/language` },
        { id: 'special-needs', name: 'Special Needs', route: `${basePath}/application/specialneeds` },
        { id: 'education', name: 'Education', route: `${basePath}/application/firsteducation` },
        { id: 'test-scores', name: 'Test Scores', route: `${basePath}/application/scores` },
        { id: 'documents', name: 'Documents', route: `${basePath}/application/documents` },
        { id: 'preview', name: 'Preview & Submit', route: `${basePath}/application/preview` }
      ];

      return (
        <div className="nav-section">
          <h4 className="nav-section-title">University Application</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/application/overview') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/application/overview`)}>
                <span className="nav-text">Application Overview</span>
              </div>
            </li>

            {applicationSteps.slice(1).map((step) => {
              const stepProgress = calculateApplicationStepProgress(step.id);
              const isActive = location.pathname === step.route ||
                             (step.id === 'entrance-qualification' && location.pathname.includes('/application/language')) ||
                             (step.id === 'special-needs' && location.pathname.includes('/application/specialneeds')) ||
                             (step.id === 'test-scores' && location.pathname.includes('/application/scores'));
              return (
                <li key={step.id} className={`nav-item ${isActive ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(step.route)}>
                    <span className="nav-text">{step.name}</span>
                    <div className="nav-progress">{Math.round(stepProgress)}%</div>
                  </div>
                </li>
              );
            })}

            <li className="nav-item">
              <div className="nav-content" onClick={() => {
                alert('GUS University Application Portal\n\nComplete your application in 8 steps:\n\n1. Personal Information\n2. Address\n3. Entrance Qualification\n4. Special Needs\n5. Education\n6. Test Scores\n7. Documents\n8. Preview & Submit');
              }}>
                <span className="nav-text">Application Guide</span>
              </div>
            </li>

            <li className="nav-item">
              <div className="nav-content" onClick={() => {
                const appData = localStorage.getItem('gusApplicationData');
                if (appData) {
                  try {
                    const parsedData = JSON.parse(appData);
                    const steps = applicationSteps.slice(1);
                    const completedSteps = steps.filter(step => {
                      const stepProgress = calculateApplicationStepProgress(step.id);
                      return stepProgress >= 100;
                    }).length;
                    alert(`Application Progress: ${completedSteps}/8 steps completed\nOverall Progress: ${applicationProgress}%`);
                  } catch (e) {
                    alert('No application data saved yet.');
                  }
                } else {
                  alert('No application data saved yet.');
                }
              }}>
                <span className="nav-text">Application Status</span>
                <div className="nav-progress">{applicationProgress}%</div>
              </div>
            </li>

            <li className="nav-item">
              <div className="nav-content" onClick={() => {
                const gusAppData = JSON.parse(localStorage.getItem('gusApplicationData') || '{}');
                const documents = [
                  { name: 'Passport/ID', key: 'passport', uploaded: !!gusAppData.passportFileName || !!gusAppData.passport },
                  { name: 'Photograph', key: 'photo', uploaded: !!gusAppData.photographFileName || !!gusAppData.photograph },
                  { name: 'Academic Transcripts', key: 'transcripts', uploaded: !!gusAppData.transcriptsFileName || !!gusAppData.transcripts },
                  { name: 'Degree Certificate', key: 'degreeCertificate', uploaded: !!gusAppData.degreeCertificateFileName || !!gusAppData.degreeCertificate },
                  { name: 'EQHE Certificate', key: 'eqheCertificate', uploaded: !!gusAppData.eqheCertificateFileName || !!gusAppData.eqheCertificate },
                  { name: 'Statement of Purpose', key: 'sop', uploaded: !!gusAppData.sopFileName || !!gusAppData.sop },
                  { name: 'Letters of Recommendation', key: 'lor', uploaded: !!(gusAppData.lor1FileName || gusAppData.lor2FileName || gusAppData.lor1 || gusAppData.lor2) }
                ];
                const uploadedCount = documents.filter(doc => doc.uploaded).length;
                const checklist = documents.map(doc => `${doc.uploaded ? '✓' : '○'} ${doc.name}`).join('\n');
                alert(`Document Checklist (${uploadedCount}/7 uploaded):\n\n${checklist}`);
              }}>
                <span className="nav-text">Document Checklist</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    // Default dashboard sidebar
    return (
      <div className="nav-section">
        <h4 className="nav-section-title">Dashboard</h4>
        <ul className="nav-menu">
          <li className={`nav-item ${activeMainSection === 'dashboard' ? 'active' : ''}`}>
            <div className="nav-content" onClick={() => onSectionChange('dashboard')}>
              <span className="nav-text">My Dashboard</span>
              <div className="nav-progress">{calculateOverallProgress()}%</div>
            </div>
          </li>

          {/* Expandable Application Section */}
          <li className="nav-section-expandable">
            <div
              className={`nav-header ${expandedSections.application ? 'expanded' : ''}`}
              onClick={() => toggleSection('application')}
            >
              <span className="nav-text">University Application</span>
              <div className="nav-header-right">
                <span className="nav-progress-small">{applicationProgress}%</span>
                <span className="expand-icon">{expandedSections.application ? '▼' : '►'}</span>
              </div>
            </div>
            {expandedSections.application && (
              <ul className="nav-submenu">
                <li className={`nav-subitem ${location.pathname === `${basePath}/application/overview` ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/application/overview`)}>
                    <span className="nav-text">Application Overview</span>
                  </div>
                </li>
                <li className={`nav-subitem ${location.pathname.includes('/application/personal') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/application/personal`)}>
                    <span className="nav-text">• Personal Information</span>
                    <div className="nav-progress-tiny">{Math.round(calculateApplicationStepProgress('personal'))}%</div>
                  </div>
                </li>
                <li className={`nav-subitem ${location.pathname.includes('/application/address') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/application/address`)}>
                    <span className="nav-text">• Address</span>
                    <div className="nav-progress-tiny">{Math.round(calculateApplicationStepProgress('address'))}%</div>
                  </div>
                </li>
                <li className={`nav-subitem ${location.pathname.includes('/application/language') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/application/language`)}>
                    <span className="nav-text">• Entrance Qualification</span>
                    <div className="nav-progress-tiny">{Math.round(calculateApplicationStepProgress('entrance-qualification'))}%</div>
                  </div>
                </li>
                <li className={`nav-subitem ${location.pathname.includes('/application/specialneeds') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/application/specialneeds`)}>
                    <span className="nav-text">• Special Needs</span>
                    <div className="nav-progress-tiny">{Math.round(calculateApplicationStepProgress('special-needs'))}%</div>
                  </div>
                </li>
                <li className={`nav-subitem ${location.pathname.includes('/application/firsteducation') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/application/firsteducation`)}>
                    <span className="nav-text">• Education</span>
                    <div className="nav-progress-tiny">{Math.round(calculateApplicationStepProgress('education'))}%</div>
                  </div>
                </li>
                <li className={`nav-subitem ${location.pathname.includes('/application/scores') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/application/scores`)}>
                    <span className="nav-text">• Test Scores</span>
                    <div className="nav-progress-tiny">{Math.round(calculateApplicationStepProgress('test-scores'))}%</div>
                  </div>
                </li>
                <li className={`nav-subitem ${location.pathname.includes('/application/documents') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/application/documents`)}>
                    <span className="nav-text">• Documents</span>
                    <div className="nav-progress-tiny">{Math.round(calculateApplicationStepProgress('documents'))}%</div>
                  </div>
                </li>
                <li className="nav-subitem">
                  <div className="nav-content" onClick={() => {
                    alert('GUS University Application Portal\n\nComplete your application in 8 steps:\n\n1. Personal Information\n2. Address\n3. Entrance Qualification\n4. Special Needs\n5. Education\n6. Test Scores\n7. Documents\n8. Preview & Submit');
                  }}>
                    <span className="nav-text">Application Guide</span>
                  </div>
                </li>
                <li className="nav-subitem">
                  <div className="nav-content" onClick={() => {
                    const appData = localStorage.getItem('gusApplicationData');
                    if (appData) {
                      try {
                        const steps = ['personal', 'address', 'entrance-qualification', 'special-needs', 'education', 'test-scores', 'documents', 'preview'];
                        const completedSteps = steps.filter(step => {
                          const stepProgress = calculateApplicationStepProgress(step);
                          return stepProgress >= 100;
                        }).length;
                        alert(`Application Progress: ${completedSteps}/8 steps completed\nOverall Progress: ${applicationProgress}%`);
                      } catch (e) {
                        alert('No application data saved yet.');
                      }
                    } else {
                      alert('No application data saved yet.');
                    }
                  }}>
                    <span className="nav-text">Application Status</span>
                    <div className="nav-progress-small">{applicationProgress}%</div>
                  </div>
                </li>
                <li className="nav-subitem">
                  <div className="nav-content" onClick={() => {
                    const gusAppData = JSON.parse(localStorage.getItem('gusApplicationData') || '{}');
                    const requiredDocs = [
                      { name: 'Passport/ID', key: 'passport' },
                      { name: 'Academic Transcripts', key: 'transcripts' },
                      { name: 'EQHE Certificate', key: 'eqheCertificate' },
                      { name: 'Statement of Purpose', key: 'sop' },
                      { name: 'Letters of Recommendation', key: 'lor' }
                    ];
                    const uploadedDocs = requiredDocs.filter(doc =>
                      gusAppData[doc.key] || gusAppData[doc.key + 'FileName']
                    ).length;
                    alert(`Document Checklist: ${uploadedDocs}/5 required documents uploaded\n\nRequired:\n- Passport/ID\n- Academic Transcripts\n- EQHE Certificate\n- Statement of Purpose\n- Letters of Recommendation`);
                  }}>
                    <span className="nav-text">Document Checklist</span>
                  </div>
                </li>
              </ul>
            )}
          </li>

          <li className={`nav-item ${activeMainSection === 'profile' ? 'active' : ''}`}>
            <div className="nav-content" onClick={() => onSectionChange('profile')}>
              <span className="nav-text">Profile</span>
              <div className="nav-progress">
                {userData?.profileProgress >= 100 ? 'Review' : userData?.profileProgress > 0 ? `${userData.profileProgress}%` : 'Start'}
              </div>
            </div>
          </li>

          <li className={`nav-item ${activeMainSection === 'family' ? 'active' : ''}`}>
            <div className="nav-content" onClick={() => onSectionChange('family')}>
              <span className="nav-text">Family</span>
              <div className="nav-progress">
                {userData?.applicationProgress?.family >= 100 ? 'Review' : userData?.applicationProgress?.family > 0 ? `${userData.applicationProgress.family}%` : 'Start'}
              </div>
            </div>
          </li>

          {/* Expandable My Colleges Section */}
          <li className="nav-section-expandable">
            <div
              className={`nav-header ${expandedSections.colleges ? 'expanded' : ''}`}
              onClick={() => toggleSection('colleges')}
            >
              <span className="nav-text">My Colleges</span>
              <div className="nav-header-right">
                <span className="expand-icon">{expandedSections.colleges ? '▼' : '►'}</span>
              </div>
            </div>
            {expandedSections.colleges && (
              <ul className="nav-submenu">
                <li className={`nav-subitem ${location.pathname === `${basePath}/colleges` ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => onSectionChange('colleges')}>
                    <span className="nav-text">Overview</span>
                  </div>
                </li>
                {userColleges.length > 0 ? (
                  userColleges.map((college) => (
                    <CollegeSidebarItem
                      key={college.collegeId}
                      college={college}
                      isExpanded={expandedSections.expandedColleges[college.collegeId]}
                      onToggle={() => toggleCollege(college.collegeId)}
                      onNavigate={handleCollegeSubsectionNavigate}
                    />
                  ))
                ) : (
                  <li className="nav-subitem">
                    <div className="nav-content">
                      <span className="nav-text" style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        No colleges added
                      </span>
                    </div>
                  </li>
                )}
              </ul>
            )}
          </li>

          {/* Expandable Courses Section */}
          <li className="nav-section-expandable">
            <div
              className={`nav-header ${expandedSections.courses ? 'expanded' : ''}`}
              onClick={() => toggleSection('courses')}
            >
              <span className="nav-text">Courses & Programs</span>
              <div className="nav-header-right">
                <span className="expand-icon">{expandedSections.courses ? '▼' : '►'}</span>
              </div>
            </div>
            {expandedSections.courses && (
              <ul className="nav-submenu">
                <li className={`nav-subitem ${location.pathname.includes('/college-search') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => onSectionChange('courses')}>
                    <span className="nav-hint-small">Access via College Search</span>
                  </div>
                </li>
                <li className="nav-subitem">
                  <div className="nav-content" onClick={() => {
                    onSectionChange('courses');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('filterGUSUniversities'));
                    }, 100);
                  }}>
                    <span className="nav-text">GUS Portal Universities</span>
                  </div>
                </li>
                <li className="nav-subitem">
                  <div className="nav-content" onClick={() => {
                    const savedPrograms = JSON.parse(localStorage.getItem('savedPrograms') || '[]');
                    if (savedPrograms.length > 0) {
                      alert(`You have ${savedPrograms.length} saved program(s):\n\n${savedPrograms.map(p => `• ${p.program.title} at ${p.university}`).join('\n')}`);
                    } else {
                      alert('No saved programs yet. Browse universities to save programs.');
                      onSectionChange('courses');
                    }
                  }}>
                    <span className="nav-text">Saved Programs</span>
                    <span className="nav-count-small">
                      {(() => {
                        const savedPrograms = JSON.parse(localStorage.getItem('savedPrograms') || '[]');
                        return savedPrograms.length > 0 ? savedPrograms.length : '';
                      })()}
                    </span>
                  </div>
                </li>
                <li className="nav-subitem">
                  <div className="nav-content" onClick={() => {
                    alert('How to use Courses:\n\n1. Go to College Search\n2. Click on any GUS university (non-Kansas)\n3. View all available programs\n4. Filter by major area or study mode\n5. Select programs to save or apply');
                  }}>
                    <span className="nav-text">How to Use</span>
                  </div>
                </li>
              </ul>
            )}
          </li>

          <li className={`nav-item ${activeMainSection === 'education' ? 'active' : ''}`}>
            <div className="nav-content" onClick={() => onSectionChange('education')}>
              <span className="nav-text">Education</span>
              <div className="nav-progress">
                {userData?.applicationProgress?.education >= 100 ? 'Review' : userData?.applicationProgress?.education > 0 ? `${userData.applicationProgress.education}%` : 'Start'}
              </div>
            </div>
          </li>

          {/* Expandable Testing Section */}
          <li className="nav-section-expandable">
            <div
              className={`nav-header ${expandedSections.testing ? 'expanded' : ''}`}
              onClick={() => toggleSection('testing')}
            >
              <span className="nav-text">Testing</span>
              <div className="nav-header-right">
                <span className="expand-icon">{expandedSections.testing ? '▼' : '►'}</span>
              </div>
            </div>
            {expandedSections.testing && (
              <ul className="nav-submenu">
                <li className={`nav-subitem ${location.pathname.includes('/tests-taken') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/testing/tests-taken`)}>
                    <span className="nav-text">Tests Taken</span>
                  </div>
                </li>
                {selectedTestTypes.length > 0 ? (
                  selectedTestTypes.map((test) => (
                    <li key={test.id} className={`nav-subitem ${location.pathname.includes(test.id) ? 'active' : ''}`}>
                      <div className="nav-content" onClick={() => navigate(test.route)}>
                        <span className="nav-text">{test.name}</span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="nav-subitem">
                    <div className="nav-content">
                      <span className="nav-text" style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        No tests selected
                      </span>
                    </div>
                  </li>
                )}
              </ul>
            )}
          </li>

          {/* Expandable Activities Section */}
          <li className="nav-section-expandable">
            <div
              className={`nav-header ${expandedSections.activities ? 'expanded' : ''}`}
              onClick={() => toggleSection('activities')}
            >
              <span className="nav-text">Activities</span>
              <div className="nav-header-right">
                <span className="expand-icon">{expandedSections.activities ? '▼' : '►'}</span>
              </div>
            </div>
            {expandedSections.activities && (
              <ul className="nav-submenu">
                <li className={`nav-subitem ${location.pathname === `${basePath}/activities` ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/activities`)}>
                    <span className="nav-text">Activities</span>
                  </div>
                </li>
                <li className={`nav-subitem ${location.pathname.includes('/responsibilities') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/activities/responsibilities`)}>
                    <span className="nav-text">Responsibilities</span>
                  </div>
                </li>
              </ul>
            )}
          </li>

          {/* Expandable Writing Section */}
          <li className="nav-section-expandable">
            <div
              className={`nav-header ${expandedSections.writing ? 'expanded' : ''}`}
              onClick={() => toggleSection('writing')}
            >
              <span className="nav-text">Writing</span>
              <div className="nav-header-right">
                <span className="expand-icon">{expandedSections.writing ? '▼' : '►'}</span>
              </div>
            </div>
            {expandedSections.writing && (
              <ul className="nav-submenu">
                <li className={`nav-subitem ${location.pathname.includes('/personal-essay') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/writing/personal-essay`)}>
                    <span className="nav-text">Personal Essay</span>
                  </div>
                </li>
                <li className={`nav-subitem ${location.pathname.includes('/additional-information') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate(`${basePath}/writing/additional-information`)}>
                    <span className="nav-text">Additional Information</span>
                  </div>
                </li>
              </ul>
            )}
          </li>

          <li className={`nav-item ${location.pathname.includes('/college-search') ? 'active' : ''}`}>
            <div className="nav-content" onClick={() => navigate(`${basePath}/college-search`)}>
              <span className="nav-text">College Search</span>
            </div>
          </li>

          <li className="nav-item">
            <div className="nav-content">
              <span className="nav-text">Direct Admissions</span>
            </div>
          </li>
          <li className="nav-item">
            <div className="nav-content">
              <span className="nav-text">Financial Aid</span>
            </div>
          </li>
          <li className="nav-item">
            <div className="nav-content">
              <span className="nav-text">Settings</span>
            </div>
          </li>
        </ul>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* ─── Mobile Top Bar ─── */}
      <div className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <span className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <h2 className="mobile-brand-logo">College App</h2>
        <div className="mobile-avatar">
          {userData?.firstName && userData?.lastName
            ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
            : 'AA'
          }
        </div>
      </div>

      {/* ─── Overlay (mobile) ─── */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── Sidebar ─── */}
      <div className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Close button (mobile only) */}
        <button
          className="sidebar-close-btn"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        >
          ✕
        </button>

        <div className="sidebar-header">
          <div className="brand-section">
            <h2 className="brand-logo">College App</h2>
          </div>

          <div className="user-profile-card">
            <div className="user-avatar">
              {userData?.firstName && userData?.lastName
                ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
                : 'AA'
              }
            </div>
            <div className="user-info">
              <h3 className="user-name">
                {userData?.firstName && userData?.lastName
                  ? `${userData.firstName} ${userData.lastName}`
                  : 'Loading...'
                }
              </h3>
              <p className="user-email">{userData?.email || 'Loading...'}</p>
              <p className="user-id">{getStudentId()}</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-navigation">
          {getSidebarContent()}

          <div className="nav-footer">
            <li className="nav-item sign-out" onClick={handleSignOut}>
              <div className="nav-content">
                <span className="nav-text">Sign Out</span>
              </div>
            </li>
          </div>
        </nav>
      </div>

      {/* ─── Main Content ─── */}
      <div className="dashboard-main">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;