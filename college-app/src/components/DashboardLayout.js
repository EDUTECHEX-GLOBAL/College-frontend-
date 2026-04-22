// src/components/DashboardLayout.js - NO SVG, NO ICONS, NO EMOJIS - Pure CSS styling
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/Edutech-logo.svg';

const DashboardLayout = ({ 
  userData, 
  children, 
  activeMainSection, 
  onSectionChange, 
  userColleges = [],
  sidebarCollapsed = false,
  onToggleSidebar
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    testing: false,
    colleges: false,
    writing: false,
    activities: false,
    courses: false,
    application: false,
    masterApplication: false,
    expandedColleges: {}
  });
  const [forceUpdate, setForceUpdate] = useState(0);
  const [masterAppProgress, setMasterAppProgress] = useState(0);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const calculateOverallProgress = () => {
    if (!userData) return 0;
    const sections = [
      userData.applicationProgress?.application || 0,
      userData.applicationProgress?.masterApplication || 0,
      userData.profileProgress || 0,
      userData.applicationProgress?.family || 0,
      userData.applicationProgress?.education || 0,
      userData.applicationProgress?.testing || 0,
      userData.applicationProgress?.activities || 0,
      userData.applicationProgress?.writing || 0
    ];
    return Math.round(sections.reduce((sum, p) => sum + p, 0) / sections.length);
  };
const calculateMasterApplicationProgress = () => {
  const masterAppData = localStorage.getItem('masterApplicationData');
  if (!masterAppData) return 0;

  try {
    const masterData = JSON.parse(masterAppData);

    const isFilled = (obj) => {
      if (!obj || typeof obj !== 'object') return false;
      return Object.keys(obj).some(key => key !== '_isValid' && obj[key]);
    };

    let totalSections = 0;
    let completedSections = 0;

    const sections = ['overview', 'personal', 'contact', 'course', 'academic', 'tests', 'documents'];

    sections.forEach(section => {
      totalSections++;

      // ✅ OVERVIEW
      if (section === 'overview') {
        const hasAnyData = ['personal', 'contact', 'course', 'academic']
          .some(sec => isFilled(masterData[sec]));

        if (hasAnyData) completedSections++;
        return;
      }

      // ✅ OPTIONAL
      if (section === 'tests' || section === 'documents') {
        completedSections++;
        return;
      }

      const sectionData = masterData[section];

      if (!sectionData) return;

      // ✅ FULL COMPLETE
      if (sectionData._isValid === true) {
        completedSections++;
        return;
      }

      // ✅ PARTIAL
      if (isFilled(sectionData)) {
        completedSections += 0.5;
      }
    });

    return Math.round((completedSections / totalSections) * 100);
  } catch (e) {
    return 0;
  }
};
  useEffect(() => {
    const updateProgress = () => {
      const progress = calculateMasterApplicationProgress();
      setMasterAppProgress(progress);
    };
    
    updateProgress();
    
    const handleMasterUpdate = () => {
      updateProgress();
      setForceUpdate(p => p + 1);
    };
    
    window.addEventListener('masterApplicationUpdated', handleMasterUpdate);
    window.addEventListener('storage', handleMasterUpdate);
    
    return () => {
      window.removeEventListener('masterApplicationUpdated', handleMasterUpdate);
      window.removeEventListener('storage', handleMasterUpdate);
    };
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/testing')) setExpandedSections(prev => ({ ...prev, testing: true }));
    if (path.includes('/colleges') && !path.includes('/college-search')) setExpandedSections(prev => ({ ...prev, colleges: true }));
    if (path.includes('/writing')) setExpandedSections(prev => ({ ...prev, writing: true }));
    if (path.includes('/activities')) setExpandedSections(prev => ({ ...prev, activities: true }));
    if (path.includes('/courses')) setExpandedSections(prev => ({ ...prev, courses: true }));
    if (path.includes('/application')) setExpandedSections(prev => ({ ...prev, application: true }));
    if (path.includes('/master-application')) setExpandedSections(prev => ({ ...prev, masterApplication: true }));
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.includes('/colleges/')) {
      const pathParts = location.pathname.split('/');
      const collegeIdIndex = pathParts.findIndex(part => part === 'colleges') + 1;
      if (collegeIdIndex < pathParts.length && pathParts[collegeIdIndex]) {
        const collegeId = pathParts[collegeIdIndex];
        if (collegeId && collegeId !== 'colleges') {
          setExpandedSections(prev => ({
            ...prev,
            expandedColleges: { ...prev.expandedColleges, [collegeId]: true }
          }));
        }
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const h = () => setForceUpdate(p => p + 1);
    window.addEventListener('storage', h);
    window.addEventListener('testingDataUpdated', h);
    window.addEventListener('collegeFormUpdated', h);
    window.addEventListener('applicationUpdated', h);
    window.addEventListener('masterApplicationUpdated', h);
    return () => {
      window.removeEventListener('storage', h);
      window.removeEventListener('testingDataUpdated', h);
      window.removeEventListener('collegeFormUpdated', h);
      window.removeEventListener('applicationUpdated', h);
      window.removeEventListener('masterApplicationUpdated', h);
    };
  }, []);

  const getStudentId = () => {
    if (!userData) return 'CAID Loading...';
    const possibleIds = [userData.studentId, userData.caId, userData.CAID, userData.studentID, userData._id];
    const foundId = possibleIds.find(id => id && id !== '');
    if (foundId) {
      if (foundId.length === 24) return `CAID-${foundId.substring(0, 8).toUpperCase()}`;
      return foundId;
    }
    return 'CAID Loading...';
  };

const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('gusApplicationData');
    localStorage.removeItem('masterApplicationData');
    localStorage.removeItem('selectedCourseForApplication');
    localStorage.removeItem('currentSelectedCourse');
    localStorage.removeItem('profileCompleted');   // ← also clear this
    localStorage.removeItem('userProfile');        // ← and this
    localStorage.removeItem('studentType');        // ← and this
    localStorage.removeItem('userEmail');          // ← and this
    navigate('/sign-in');  // ← change to your signin route
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCollege = (collegeId) => {
    setExpandedSections(prev => ({
      ...prev,
      expandedColleges: { ...prev.expandedColleges, [collegeId]: !prev.expandedColleges[collegeId] }
    }));
  };

  const getSelectedTests = () => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        return parsedData.testingData?.testsToReport || [];
      } catch (error) {}
    }
    return userData?.testingData?.testsToReport || [];
  };

  const getApplicationProgress = () => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        return parsedData.applicationProgress?.application || 0;
      } catch (error) {}
    }
    return userData?.applicationProgress?.application || 0;
  };

  const getMasterApplicationProgressDisplay = () => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        return parsedData.applicationProgress?.masterApplication || masterAppProgress;
      } catch (error) {}
    }
    return userData?.applicationProgress?.masterApplication || masterAppProgress;
  };

  const calculateApplicationStepProgress = (step) => {
    const gusAppData = JSON.parse(localStorage.getItem('gusApplicationData') || '{}');
    const isFieldFilled = (v) => {
      if (v === null || v === undefined || v === false) return false;
      if (typeof v === 'string') return v.trim() !== '';
      if (typeof v === 'number') return true;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') {
        if (v.grade9 || v.grade10 || v.grade11 || v.grade12 || v.satTotal || v.act || v.toefl || v.ielts) return true;
        return Object.keys(v).length > 0;
      }
      return !!v;
    };
    switch (step) {
      case 'personal': { const f = ['firstName','lastName','gender','dob','nationality','countryOfResidence','email','mobile']; return (f.filter(x => isFieldFilled(gusAppData[x])).length / f.length) * 100; }
      case 'address': { const f = ['currentAddress','city','country','state','postalCode']; return (f.filter(x => isFieldFilled(gusAppData[x])).length / f.length) * 100; }
      case 'entrance-qualification': { const f = ['eqheDate','eqheCity','eqheCountry','eqheOriginalTitle','hasAnotherEQHE']; return (f.filter(x => isFieldFilled(gusAppData[x])).length / f.length) * 100; }
      case 'special-needs': { if (gusAppData.hasSpecialNeeds === 'no') return 100; if (gusAppData.hasSpecialNeeds === 'yes' && isFieldFilled(gusAppData.specialNeedsDescription)) return 100; return 0; }
      case 'education': { const f = ['qualificationLevel','institutionName','boardUniversity','countryOfStudy','startYear','endYear']; return (f.filter(x => isFieldFilled(gusAppData[x])).length / f.length) * 100; }
      case 'test-scores': { const s = gusAppData.scores || {}; return (s.grade9 || s.grade10 || s.grade11 || s.grade12 || s.satTotal || s.act || s.toefl || s.ielts) ? 100 : 0; }
      case 'documents': { const f = ['passport','transcripts','degreeCertificate','sop','lor1','lor2','eqheCertificate']; return (f.filter(x => isFieldFilled(gusAppData[x]) || isFieldFilled(gusAppData[x + 'FileName'])).length / f.length) * 100; }
      case 'preview': return gusAppData.agreedToTerms ? 100 : 0;
      default: return 0;
    }
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
  const selectedTestTypes = selectedTests.length > 0 ? testTypes.filter(t => selectedTests.includes(t.id)) : [];
  const applicationProgress = getApplicationProgress();
  const masterAppProgressDisplay = getMasterApplicationProgressDisplay();

  const CollegeSidebarItem = ({ college, isExpanded, onToggle, onNavigate }) => {
    const [showInternational, setShowInternational] = useState(false);
    useEffect(() => {
      setShowInternational(localStorage.getItem(`college_${college.collegeId}_show_international`) === 'true');
    }, [college.collegeId]);
    useEffect(() => {
      const h = (e) => { if (e.detail.collegeId === college.collegeId) setShowInternational(e.detail.showInternational); };
      window.addEventListener('collegeFormUpdated', h);
      return () => window.removeEventListener('collegeFormUpdated', h);
    }, [college.collegeId]);

    const applicationSubsections = [
      { id: 'documents', name: 'Documents' }, { id: 'general', name: 'General' },
      { id: 'academics', name: 'Academics' }, { id: 'high-school', name: 'High School Curriculum' },
      { id: 'activities', name: 'Activities' }, { id: 'contacts', name: 'Contacts' },
      { id: 'family', name: 'Family' }, { id: 'residency', name: 'Residency' },
      ...(showInternational ? [{ id: 'international', name: 'International Student Information' }] : []),
    ];
    const isCollegeActive = location.pathname.includes(`/colleges/${college.collegeId}`);
    return (
      <li className="nav-college-item">
        <div className={`nav-college-header ${isCollegeActive ? 'active' : ''}`} onClick={onToggle}>
          <span className="nav-dot"></span>
          <span className="nav-text">{college.name}</span>
          <span className="nav-chevron">{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <ul className="nav-college-submenu">
            <li className="nav-college-subitem">
              <div className="nav-college-subheader">
                <span className="nav-text">APPLICATION</span>
              </div>
              <ul className="nav-application-submenu">
                {applicationSubsections.map((sub) => {
                  const isActive = location.pathname === `${basePath}/colleges/${college.collegeId}/${sub.id}`;
                  return (
                    <li key={sub.id} className={`nav-application-subitem ${isActive ? 'active' : ''}`}>
                      <div className={`nav-content ${isActive ? 'active' : ''}`} onClick={() => onNavigate(`college-${college.collegeId}-${sub.id}`)}>
                        <span className="nav-dot"></span>
                        <span className="nav-text">{sub.name}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
            <li className={`nav-college-subitem ${location.pathname === `${basePath}/colleges/${college.collegeId}/review` ? 'active' : ''}`}>
              <div className={`nav-content ${location.pathname === `${basePath}/colleges/${college.collegeId}/review` ? 'active' : ''}`} onClick={() => onNavigate(`college-${college.collegeId}-review`)}>
                <span className="nav-dot"></span>
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

  // Reusable NavItem component
  const NavItem = ({ label, isActive, onClick, badge, hint }) => (
    <li className={`nav-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="nav-content">
        <span className="nav-dot"></span>
        <span className="nav-text">{hint || label}</span>
        {badge !== undefined && badge !== '' && <div className="nav-progress">{badge}</div>}
      </div>
    </li>
  );

  // Expandable nav section
  const ExpandableNav = ({ label, isExpanded, onToggle, badge, children }) => (
    <li className="nav-section-expandable">
      <div className={`nav-header ${isExpanded ? 'expanded' : ''}`} onClick={onToggle}>
        <span className="nav-dot"></span>
        <span className="nav-text">{label}</span>
        <div className="nav-header-right">
          {badge !== undefined && badge !== '' && <span className="nav-progress-small">{badge}</span>}
          <span className="nav-chevron">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>
      {isExpanded && <ul className="nav-submenu">{children}</ul>}
    </li>
  );

  const SubItem = ({ label, isActive, onClick, badge }) => (
    <li className={`nav-subitem ${isActive ? 'active' : ''}`}>
      <div className="nav-content" onClick={onClick}>
        <span className="nav-dot"></span>
        <span className="nav-text">{label}</span>
        {badge !== undefined && <div className="nav-progress-tiny">{badge}</div>}
      </div>
    </li>
  );

  // Profile sidebar items with progress indicators
  const profileNavItems = [
    { key: 'personal', label: 'Personal Information', path: `${basePath}/profile/personal` },
    { key: 'contact', label: 'Contact Details', path: `${basePath}/profile/contact` },
    { key: 'address', label: 'Address', path: `${basePath}/profile/address` },
    { key: 'demographics', label: 'Demographics', path: `${basePath}/profile/demographics` },
    { key: 'language', label: 'Language', path: `${basePath}/profile/language` },
    { key: 'geography', label: 'Geography & Nationality', path: `${basePath}/profile/geography` },
  ];

  const getSidebarContent = () => {
    // PROFILE Section
    if (activeMainSection === 'profile') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">PROFILE</h4>
          <ul className="nav-menu">
            {profileNavItems.map(item => (
              <NavItem
                key={item.key}
                label={item.label}
                isActive={location.pathname.includes(`/${item.key}`)}
                onClick={() => navigate(item.path)}
              />
            ))}
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'master-application') {
      const masterSteps = [
  { id: 'overview',    label: 'Overview' },   // ✅ ADD THIS
  { id: 'personal',    label: 'Personal Information' },
  { id: 'contact',     label: 'Contact Details' },
  { id: 'course',      label: 'Course Selection' },
  { id: 'academic',    label: 'Academic History' },
  { id: 'tests',       label: 'Test Scores' },
  { id: 'documents',   label: 'Documents' },
  { id: 'preview',     label: 'Preview & Submit' },
];
const getMasterStepProgress = (stepId) => {
  try {
    const masterData = JSON.parse(localStorage.getItem('masterApplicationData') || '{}');

    const isFilled = (obj) => {
      if (!obj || typeof obj !== 'object') return false;
      return Object.keys(obj).some(key => key !== '_isValid' && obj[key]);
    };

    // ✅ OVERVIEW
    if (stepId === 'overview') {
      const sections = ['personal', 'contact', 'course', 'academic'];
      const hasAnyData = sections.some(sec => isFilled(masterData[sec]));
      return hasAnyData ? '✓' : '';
    }

    // ✅ OPTIONAL SECTIONS
    if (stepId === 'tests' || stepId === 'documents') {
      return '✓'; // keep if business rule
    }

    // ✅ PREVIEW
    if (stepId === 'preview') return '';

    const section = masterData[stepId];

    if (!section) return '';

    // ✅ FULLY COMPLETE
    if (section._isValid === true) return '✓';

    // ✅ PARTIAL
    if (isFilled(section)) return '…';

    return '';
  } catch (e) {
    return '';
  }
};
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">MASTER APPLICATION</h4>
          <ul className="nav-menu">
            {masterSteps.map((step, index) => {
              const isActive = location.pathname.includes(`/master-application/${step.id}`);
              const badge = getMasterStepProgress(step.id);
              return (
                <NavItem
                  key={step.id}
                  label={`${index + 1}. ${step.label}`}
                  isActive={isActive}
                  onClick={() => navigate(`${basePath}/master-application/${step.id}`)}
                  badge={badge}
                />
              );
            })}
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'family') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">FAMILY</h4>
          <ul className="nav-menu">
            {[
              ['household','Household'],
              ['parent1','Parent 1'],
              ['parent2','Parent 2'],
              ['sibling','Sibling']
            ].map(([key, label]) => (
              <NavItem 
                key={key} 
                label={label} 
                isActive={location.pathname.includes(`/${key}`)} 
                onClick={() => navigate(`${basePath}/family/${key}`)} 
              />
            ))}
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'education') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">EDUCATION</h4>
          <ul className="nav-menu">
            {[
              ['current-school','Current or Most Recent Secondary/High School'],
              ['other-schools','Other Secondary/High Schools'],
              ['grades','Grades'],
              ['current-courses','Current or Most Recent Year Courses'],
              ['honors','Honors'],
              ['community-organizations','Community-Based Organizations'],
              ['future-plans','Future Plans'],
              ['documents','Documents Upload'],
            ].map(([key, label]) => (
              <NavItem 
                key={key} 
                label={label} 
                isActive={location.pathname.includes(`/${key}`)} 
                onClick={() => navigate(`${basePath}/education/${key}`)} 
              />
            ))}
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'writing') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">WRITING</h4>
          <ul className="nav-menu">
            <NavItem 
              label="Personal Essay" 
              isActive={location.pathname.includes('/personal-essay')} 
              onClick={() => navigate(`${basePath}/writing/personal-essay`)} 
            />
            <NavItem 
              label="Additional Information" 
              isActive={location.pathname.includes('/additional-information')} 
              onClick={() => navigate(`${basePath}/writing/additional-information`)} 
            />
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'activities') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">ACTIVITIES</h4>
          <ul className="nav-menu">
            <NavItem 
              label="Activities" 
              isActive={location.pathname.includes('/activities/activities')} 
              onClick={() => navigate(`${basePath}/activities/activities`)} 
            />
            <NavItem 
              label="Responsibilities and circumstances" 
              isActive={location.pathname.includes('/responsibilities')} 
              onClick={() => navigate(`${basePath}/activities/responsibilities`)} 
            />
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'testing') {
      const sectionDisplayNames = { 
        'tests-taken':'Tests Taken',
        'act-tests':'ACT Tests',
        'sat-tests':'SAT Tests',
        'sat-subject-tests':'SAT Subject Tests',
        'ap-subject-tests':'AP Tests',
        'ib-subject-tests':'IB Tests',
        'cambridge':'Cambridge Tests',
        'toefl-ibt':'TOEFL iBT',
        'pte-academic-tests':'PTE Academic',
        'ielts':'IELTS',
        'duolingo-english-test':'Duolingo English Test'
      };
      const sectionsToShow = ['tests-taken', ...selectedTests.filter(t => t !== 'tests-taken')];
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">TESTING</h4>
          <ul className="nav-menu">
            {sectionsToShow.map(s => (
              <NavItem 
                key={s} 
                label={sectionDisplayNames[s] || s} 
                isActive={location.pathname.includes(`/${s}`)} 
                onClick={() => navigate(`${basePath}/testing/${s}`)} 
              />
            ))}
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
          <h4 className="nav-section-title">UNIVERSITY APPLICATION</h4>
          <ul className="nav-menu">
            <NavItem 
              label="Application Overview" 
              isActive={location.pathname.includes('/application/overview')} 
              onClick={() => navigate(`${basePath}/application/overview`)} 
            />
            {applicationSteps.slice(1).map(step => {
              const isActive = location.pathname === step.route ||
                (step.id === 'entrance-qualification' && location.pathname.includes('/application/language')) ||
                (step.id === 'special-needs' && location.pathname.includes('/application/specialneeds')) ||
                (step.id === 'test-scores' && location.pathname.includes('/application/scores'));
              return (
                <NavItem 
                  key={step.id} 
                  label={step.name} 
                  isActive={isActive} 
                  onClick={() => navigate(step.route)}
                  badge={`${Math.round(calculateApplicationStepProgress(step.id))}%`} 
                />
              );
            })}
          </ul>
        </div>
      );
    }

    // Default sidebar - Main Dashboard Menu
    return (
      <>
        <div className="nav-section">
          <h4 className="nav-section-title">MAIN MENU</h4>
          <ul className="nav-menu">
            <NavItem 
              label="Dashboard" 
              isActive={activeMainSection === 'dashboard'}
              onClick={() => onSectionChange('dashboard')} 
              badge={`${calculateOverallProgress()}%`} 
            />
          </ul>
        </div>

        <div className="nav-section">
          <h4 className="nav-section-title">PROFILE</h4>
          <ul className="nav-menu">
            <NavItem
              label="Profile"
              isActive={activeMainSection === 'profile'}
              onClick={() => navigate(`${basePath}/profile/personal`)}
              badge={userData?.profileProgress >= 100 ? '✓' : userData?.profileProgress > 0 ? `${userData.profileProgress}%` : 'Start'}
            />
          </ul>
        </div>

        <div className="nav-section">
          <h4 className="nav-section-title">APPLICATION</h4>
          <ul className="nav-menu">
            {/* Master Application Section */}
           <ExpandableNav 
  label="Master Application" 
  isExpanded={expandedSections.masterApplication}
  onToggle={() => toggleSection('masterApplication')} 
  badge={`${masterAppProgressDisplay}%`}
>
  {[
    { id: 'overview',    label: 'Overview' },
    { id: 'personal',    label: 'Personal Information' },
    { id: 'contact',     label: 'Contact Details' },
    { id: 'course',      label: 'Course Selection' },
    { id: 'academic',    label: 'Academic History' },
    { id: 'tests',       label: 'Test Scores' },
    { id: 'documents',   label: 'Documents' },
    { id: 'preview',     label: 'Preview & Submit' },
  ].map((step, index) => (
                <SubItem
                  key={step.id}
                  label={`${index + 1}. ${step.label}`}
                  isActive={location.pathname.includes(`/master-application/${step.id}`)}
                  onClick={() => navigate(`${basePath}/master-application/${step.id}`)}
                />
              ))}
            </ExpandableNav>

            <ExpandableNav 
              label="University Application" 
              isExpanded={expandedSections.application}
              onToggle={() => toggleSection('application')} 
              badge={`${applicationProgress}%`}
            >
              <SubItem 
                label="Application Overview" 
                isActive={location.pathname === `${basePath}/application/overview`}
                onClick={() => navigate(`${basePath}/application/overview`)} 
              />
              {[
                { id: 'personal', label: 'Personal Information', route: `${basePath}/application/personal` },
                { id: 'address', label: 'Address', route: `${basePath}/application/address` },
                { id: 'entrance-qualification', label: 'Entrance Qualification', route: `${basePath}/application/language` },
                { id: 'special-needs', label: 'Special Needs', route: `${basePath}/application/specialneeds` },
                { id: 'education', label: 'Education', route: `${basePath}/application/firsteducation` },
                { id: 'test-scores', label: 'Test Scores', route: `${basePath}/application/scores` },
                { id: 'documents', label: 'Documents', route: `${basePath}/application/documents` },
                { id: 'preview', label: 'Preview & Submit', route: `${basePath}/application/preview` },
              ].map(s => (
                <SubItem 
                  key={s.id} 
                  label={s.label} 
                  isActive={location.pathname.includes(s.route)}
                  onClick={() => navigate(s.route)} 
                  badge={`${Math.round(calculateApplicationStepProgress(s.id))}%`} 
                />
              ))}
            </ExpandableNav>

            <NavItem 
              label="Family" 
              isActive={activeMainSection === 'family'}
              onClick={() => onSectionChange('family')}
              badge={userData?.applicationProgress?.family >= 100 ? '✓' : userData?.applicationProgress?.family > 0 ? `${userData.applicationProgress.family}%` : 'Start'} 
            />

            <NavItem 
              label="Education" 
              isActive={activeMainSection === 'education'}
              onClick={() => onSectionChange('education')}
              badge={userData?.applicationProgress?.education >= 100 ? '✓' : userData?.applicationProgress?.education > 0 ? `${userData.applicationProgress.education}%` : 'Start'} 
            />

            <ExpandableNav 
              label="Testing" 
              isExpanded={expandedSections.testing}
              onToggle={() => toggleSection('testing')}
              badge={userData?.applicationProgress?.testing >= 100 ? '✓' : userData?.applicationProgress?.testing > 0 ? `${userData.applicationProgress.testing}%` : '0%'}
            >
              <SubItem 
                label="Tests Taken" 
                isActive={location.pathname.includes('/tests-taken')} 
                onClick={() => navigate(`${basePath}/testing/tests-taken`)} 
              />
              {selectedTestTypes.length > 0 ? selectedTestTypes.map(t => (
                <SubItem 
                  key={t.id} 
                  label={t.name} 
                  isActive={location.pathname.includes(t.id)} 
                  onClick={() => navigate(t.route)} 
                />
              )) : (
                <li className="nav-subitem"><div className="nav-content"><span className="nav-dot"></span><span className="nav-text nav-text--muted">No tests selected</span></div></li>
              )}
            </ExpandableNav>

            <ExpandableNav 
              label="Activities" 
              isExpanded={expandedSections.activities}
              onToggle={() => toggleSection('activities')}
              badge={userData?.applicationProgress?.activities >= 100 ? '✓' : userData?.applicationProgress?.activities > 0 ? `${userData.applicationProgress.activities}%` : '0%'}
            >
              <SubItem 
                label="Activities" 
                isActive={location.pathname === `${basePath}/activities`} 
                onClick={() => navigate(`${basePath}/activities`)} 
              />
              <SubItem 
                label="Responsibilities" 
                isActive={location.pathname.includes('/responsibilities')} 
                onClick={() => navigate(`${basePath}/activities/responsibilities`)} 
              />
            </ExpandableNav>

            <ExpandableNav 
              label="Writing" 
              isExpanded={expandedSections.writing}
              onToggle={() => toggleSection('writing')}
              badge={userData?.applicationProgress?.writing >= 100 ? '✓' : userData?.applicationProgress?.writing > 0 ? `${userData.applicationProgress.writing}%` : '0%'}
            >
              <SubItem 
                label="Personal Essay" 
                isActive={location.pathname.includes('/personal-essay')} 
                onClick={() => navigate(`${basePath}/writing/personal-essay`)} 
              />
              <SubItem 
                label="Additional Information" 
                isActive={location.pathname.includes('/additional-information')} 
                onClick={() => navigate(`${basePath}/writing/additional-information`)} 
              />
            </ExpandableNav>
          </ul>
        </div>

        <div className="nav-section">
          <h4 className="nav-section-title">COLLEGES</h4>
          <ul className="nav-menu">
            <NavItem 
              label="College Search" 
              isActive={location.pathname.includes('/college-search')} 
              onClick={() => navigate(`${basePath}/college-search`)} 
            />
            
           

            <ExpandableNav 
              label="Courses & Programs" 
              isExpanded={expandedSections.courses} 
              onToggle={() => toggleSection('courses')}
            >
              <SubItem 
                label="College Search" 
                isActive={location.pathname.includes('/college-search')} 
                onClick={() => onSectionChange('courses')} 
              />
              <SubItem 
                label="GUS Portal Universities" 
                isActive={false} 
                onClick={() => { onSectionChange('courses'); setTimeout(() => window.dispatchEvent(new CustomEvent('filterGUSUniversities')), 100); }} 
              />
              <li className="nav-subitem">
                <div className="nav-content" onClick={() => {
                  const saved = JSON.parse(localStorage.getItem('savedPrograms') || '[]');
                  if (saved.length > 0) {
                    alert(`You have ${saved.length} saved programs`);
                  } else {
                    alert('No saved programs yet.');
                    onSectionChange('courses');
                  }
                }}>
                  <span className="nav-dot"></span>
                  <span className="nav-text">Saved Programs</span>
                  {(() => { const c = JSON.parse(localStorage.getItem('savedPrograms') || '[]').length; return c > 0 ? <span className="nav-count-small">{c}</span> : null; })()}
                </div>
              </li>
            </ExpandableNav>
          </ul>
        </div>

        <div className="nav-section">
          <h4 className="nav-section-title">RESOURCES</h4>
          <ul className="nav-menu">
            <NavItem 
              label="Direct Admissions" 
              isActive={false} 
              onClick={() => {}} 
            />
            <NavItem 
              label="Financial Aid" 
              isActive={false} 
              onClick={() => {}} 
            />
            <NavItem 
              label="Settings" 
              isActive={false} 
              onClick={() => {}} 
            />
          </ul>
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu">
          <span className="mobile-menu-icon"></span>
        </button>
        <div className="mobile-brand-logo">
          <img 
            src={logo} 
            alt="Edutech" 
            className="mobile-logo-img"
            style={{ width: '38px', height: '38px' }}
            onError={e => { e.target.style.display = 'none'; }} 
          />
        </div>
        <div className="mobile-avatar">
          {userData?.firstName && userData?.lastName ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase() : 'AA'}
        </div>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close navigation menu">
          <span className="sidebar-close-icon"></span>
        </button>

        <div className="sidebar-header">
          <div className="brand-section">
            <div className="brand-logo-container">
              <img 
                src={logo} 
                alt="Edutech Logo" 
                className="brand-logo-image"
                style={{ height: '45px', width: 'auto' }}
                onError={e => { 
                  e.target.style.display = 'none'; 
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'; 
                }} 
              />
              <span className="brand-logo" style={{ display: 'none' }}>EDUTECH</span>
            </div>
          </div>

          <div className="user-profile-card">
            <div className="user-avatar">
              {userData?.firstName && userData?.lastName ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase() : 'AA'}
            </div>
            <div className="user-info">
              <h3 className="user-name">
                {userData?.firstName && userData?.lastName ? `${userData.firstName} ${userData.lastName}` : 'Loading...'}
              </h3>
              <p className="user-email">{userData?.email || 'Loading...'}</p>
              <p className="user-id">{getStudentId()}</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-navigation">
          {getSidebarContent()}
          <div className="nav-footer">
            <ul className="nav-menu">
              <li className="nav-item nav-item--signout" onClick={handleSignOut}>
                <div className="nav-content">
                  <span className="nav-dot nav-dot--danger"></span>
                  <span className="nav-text">Sign Out</span>
                </div>
              </li>
            </ul>
            <div className="copyright">© 2026 EDUTECH. All rights reserved.</div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">{children}</div>
    </div>
  );
};

export default DashboardLayout;