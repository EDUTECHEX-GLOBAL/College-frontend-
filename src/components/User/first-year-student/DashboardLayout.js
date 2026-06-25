import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from './../../../assets/Edutech-logo.svg';
import { clearAllUserData } from '../api/axiosInstance';
import { FaCheckCircle, FaChevronDown, FaChevronRight, FaEllipsisH } from 'react-icons/fa';

const hasValidSelectedCourse = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === "undefined" || raw === "null") return false;
    const data = JSON.parse(raw);

    const universityId =
      data.universityId || data.UNITID || data.id || data.collegeId ||
      data.collegeData?._id || data.collegeData?.UNITID;

    const universityName =
      data.universityName || data.university || data.INSTNM || data.name ||
      data.collegeData?.universityName || data.collegeData?.INSTNM;

    const course =
      data.selectedCourse || data.course || data.program ||
      data.programDetails || data.selectedCourses?.[0];

    return Boolean(universityId && universityName && course);
  } catch {
    return false;
  }
};

const DashboardLayout = ({
  userData,
  children,
  activeMainSection,
  onSectionChange,
  onLockedApplicationClick,
  userColleges = [],
  sidebarCollapsed = false,
  onToggleSidebar
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Added family and education to initial state
  const [expandedSections, setExpandedSections] = useState({
    testing: false,
    colleges: false,
    writing: false,
    activities: false,
    courses: false,
    application: false,
    masterApplication: false,
    profileInApp: false,
    family: false,
    education: false,
    expandedColleges: {}
  });

  const [forceUpdate, setForceUpdate] = useState(0);
  const [masterAppProgress, setMasterAppProgress] = useState(0);

  const safeGetLocalStorageValue = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw === 'undefined' || raw === 'null') return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const getMasterApplicationStorageKey = (studentId) =>
    studentId ? `masterApplicationData_${studentId}` : 'masterApplicationData';

  const getLocalMasterApplicationData = () => {
    const studentId = userData?._id || userData?.realStudentId || '';
    const scopedData = studentId ? safeGetLocalStorageValue(getMasterApplicationStorageKey(studentId)) : null;
    const legacyData = safeGetLocalStorageValue('masterApplicationData');

    if (scopedData && legacyData) return { ...legacyData, ...scopedData };
    return scopedData || legacyData || null;
  };

  useEffect(() => {
    setSidebarOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.header-user-chip')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userDropdownOpen]);

  const calculateOverallProgress = () => {
    if (!userData) return 0;
    const hasMasterCourse = hasValidSelectedCourse("selectedMasterCourseForApplication");
    const hasBachelorCourse = hasValidSelectedCourse("selectedCourseForApplication");
    const masterUnlocked =
      localStorage.getItem("unlockedApplicationType") === "master" && hasMasterCourse;
    const bachelorUnlocked =
      localStorage.getItem("unlockedApplicationType") === "bachelor" && hasBachelorCourse;
    const sections = [
      bachelorUnlocked ? userData.applicationProgress?.application || 0 : 0,
      masterUnlocked ? userData.applicationProgress?.masterApplication || 0 : 0,
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
    const masterData = getLocalMasterApplicationData();
    const masterAppData = masterData;
    if (!masterAppData) return 0;

    try {
      const isFilled = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        return Object.keys(obj).some(key => key !== '_isValid' && obj[key]);
      };
      const isPersonalComplete = (personal = {}) => !!(
        personal.fullName &&
        personal.dateOfBirth &&
        personal.gender &&
        personal.nationality &&
        personal.passportNumber &&
        personal.maritalStatus
      );
      const isContactComplete = (contact = {}) => (
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.emailAddress || contact.email || '') &&
        /^\+?\d{8,15}$/.test(contact.mobileNumber || '') &&
        /^[A-Za-z0-9\s,/-]+$/.test(contact.addressLine1 || '') &&
        /^[A-Za-z\s-]+$/.test(contact.city || '') &&
        /^[A-Za-z\s-]+$/.test(contact.state || '') &&
        !!(contact.country || '').trim() &&
        !!(contact.postalCode || '').trim()
      );

      let totalSections = 0;
      let completedSections = 0;

      const sections = ['overview', 'personal', 'contact', 'course', 'academic', 'tests', 'documents'];

      sections.forEach(section => {
        totalSections++;

        if (section === 'overview') {
          const hasAnyData = ['personal', 'contact', 'course', 'academic']
            .some(sec => isFilled(masterData[sec]));
          if (hasAnyData) completedSections++;
          return;
        }

        if (section === 'tests' || section === 'documents') {
          completedSections++;
          return;
        }

        const sectionData = masterData[section];
        if (!sectionData) return;

        if (section === 'personal' && isPersonalComplete(sectionData)) {
          completedSections++;
          return;
        }

        if (section === 'contact' && isContactComplete(sectionData)) {
          completedSections++;
          return;
        }

        if (sectionData._isValid === true) {
          completedSections++;
          return;
        }

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
  }, [userData]);

  // Added family and education to path-based auto-expand
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/testing')) setExpandedSections(prev => ({ ...prev, testing: true }));
    if (path.includes('/colleges') && !path.includes('/college-search')) setExpandedSections(prev => ({ ...prev, colleges: true }));
    if (path.includes('/writing')) setExpandedSections(prev => ({ ...prev, writing: true }));
    if (path.includes('/activities')) setExpandedSections(prev => ({ ...prev, activities: true }));
    if (path.includes('/courses')) setExpandedSections(prev => ({ ...prev, courses: true }));
    if (path.includes('/application')) setExpandedSections(prev => ({ ...prev, application: true }));
    if (path.includes('/master-application')) setExpandedSections(prev => ({ ...prev, masterApplication: true }));
    if (path.includes('/profile')) setExpandedSections(prev => ({ ...prev, profileInApp: true }));
    if (path.includes('/family')) setExpandedSections(prev => ({ ...prev, family: true }));
    if (path.includes('/education')) setExpandedSections(prev => ({ ...prev, education: true }));
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
    clearAllUserData();
    navigate('/sign-in');
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

  const safeGetLocalStorage = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw === 'undefined' || raw === 'null') return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const getApplicationStorageKey = (studentId) =>
    studentId ? `gusApplicationData_${studentId}` : 'gusApplicationData';

  const getLocalApplicationData = () => {
    const studentId = userData?._id || userData?.realStudentId || '';
    const scopedData = studentId ? safeGetLocalStorage(getApplicationStorageKey(studentId)) : null;
    const legacyData = safeGetLocalStorage('gusApplicationData');

    if (scopedData && legacyData) return { ...legacyData, ...scopedData };
    return scopedData || legacyData || {};
  };

  const calculateApplicationStepProgress = (step) => {
    const gusAppData = getLocalApplicationData();
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
    const isAnyFieldFilled = (fields) => fields.some(field => isFieldFilled(gusAppData[field]));
    const calculateFieldsProgress = (fields) => {
      const completed = fields.filter(field => (
        Array.isArray(field) ? isAnyFieldFilled(field) : isFieldFilled(gusAppData[field])
      )).length;
      return fields.length ? (completed / fields.length) * 100 : 0;
    };

    switch (step) {
      case 'personal': {
        const fields = [
          'firstName',
          'lastName',
          'email',
          'dateOfBirth',
          'placeOfBirth',
          'countryOfBirth',
          'citizenship',
          'passportNumber',
          'passportIssueDate',
          'passportExpiryDate',
          'issuingCountry',
          'mobile',
          'correspondenceLanguage',
          ['passportFileName', 'passportOriginalName'],
          ['photographFileName', 'photographOriginalName']
        ];
        return calculateFieldsProgress(fields);
      }
      case 'address': {
        const f = [
          ['currentAddress', 'streetAndHouseNumber'],
          'city',
          'country',
          ['state', 'stateProvince'],
          ['postalCode', 'postcode']
        ];
        return calculateFieldsProgress(f);
      }
      case 'special-needs': { if (gusAppData.hasSpecialNeeds === 'no') return 100; if (gusAppData.hasSpecialNeeds === 'yes' && isFieldFilled(gusAppData.specialNeedsDescription)) return 100; return 0; }
      case 'education': { const f = ['qualificationLevel','institutionName','boardUniversity','countryOfStudy','startYear','endYear']; return calculateFieldsProgress(f); }
      case 'test-scores': { const s = gusAppData.scores || {}; return (s.grade9 || s.grade10 || s.grade11 || s.grade12 || s.satTotal || s.act || s.toefl || s.ielts) ? 100 : 0; }
      case 'documents': { const f = ['passport','transcripts','degreeCertificate','sop','lor1','lor2']; return (f.filter(x => isFieldFilled(gusAppData[x]) || isFieldFilled(gusAppData[x + 'FileName'])).length / f.length) * 100; }
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
  const hasMasterCourse = hasValidSelectedCourse("selectedMasterCourseForApplication");
  const hasBachelorCourse = hasValidSelectedCourse("selectedCourseForApplication");
  const isMasterAppUnlocked =
    localStorage.getItem("unlockedApplicationType") === "master" && hasMasterCourse;
  const isUniversityAppUnlocked =
    localStorage.getItem("unlockedApplicationType") === "bachelor" && hasBachelorCourse;
  const safeMasterProgress = isMasterAppUnlocked ? getMasterApplicationProgressDisplay() : 0;
  const safeApplicationProgress = isUniversityAppUnlocked ? applicationProgress : 0;
  const masterAppProgressDisplay = safeMasterProgress;

  const showLockedMasterApplication = () => {
    if (onLockedApplicationClick) onLockedApplicationClick('master');
  };

  const navigateMasterApplication = (path = `${basePath}/master-application/overview`) => {
    if (!isMasterAppUnlocked) {
      showLockedMasterApplication();
      return;
    }
    navigate(path);
  };

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
          <span className="nav-chevron" aria-hidden="true">{isExpanded ? <FaChevronDown /> : <FaChevronRight />}</span>
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

  const renderBadge = (badge, className) => {
    if (badge === undefined || badge === '') return null;
    if (badge === 'complete') {
      return <div className={className} aria-label="Complete"><FaCheckCircle aria-hidden="true" /></div>;
    }
    if (badge === 'partial') {
      return <div className={className} aria-label="In progress"><FaEllipsisH aria-hidden="true" /></div>;
    }
    return <div className={className}>{badge}</div>;
  };

  const NavItem = ({ label, isActive, onClick, badge }) => (
    <li className={`nav-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="nav-content">
        <span className="nav-dot"></span>
        <span className="nav-text">{label}</span>
        {renderBadge(badge, 'nav-progress')}
      </div>
    </li>
  );

  const ExpandableNav = ({ label, isExpanded, onToggle, badge, children }) => (
    <li className="nav-section-expandable">
      <div className={`nav-header ${isExpanded ? 'expanded' : ''}`} onClick={onToggle}>
        <span className="nav-dot"></span>
        <span className="nav-text">{label}</span>
        <div className="nav-header-right">
          {renderBadge(badge, 'nav-progress-small')}
          <span className="nav-chevron" aria-hidden="true">{isExpanded ? <FaChevronDown /> : <FaChevronRight />}</span>
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
        {renderBadge(badge, 'nav-progress-tiny')}
      </div>
    </li>
  );

  const profileNavItems = [
    { key: 'personal', label: 'Personal Information', path: `${basePath}/profile/personal` },
    { key: 'contact', label: 'Contact Details', path: `${basePath}/profile/contact` },
    { key: 'address', label: 'Address', path: `${basePath}/profile/address` },
    { key: 'demographics', label: 'Demographics', path: `${basePath}/profile/demographics` },
    { key: 'language', label: 'Language', path: `${basePath}/profile/language` },
    { key: 'geography', label: 'Geography & Nationality', path: `${basePath}/profile/geography` },
  ];

  const getSidebarContent = () => {
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
        { id: 'overview', label: 'Overview' },
        { id: 'personal', label: 'Personal Information' },
        { id: 'contact', label: 'Contact Details' },
        { id: 'course', label: 'Course Selection' },
        { id: 'academic', label: 'Academic History' },
        { id: 'tests', label: 'Test Scores' },
        { id: 'documents', label: 'Documents' },
        { id: 'preview', label: 'Preview & Submit' },
      ];
      const getMasterStepProgress = (stepId) => {
        try {
          const masterData = getLocalMasterApplicationData() || {};
          const isFilled = (obj) => {
            if (!obj || typeof obj !== 'object') return false;
            return Object.keys(obj).some(key => key !== '_isValid' && obj[key]);
          };
          const isPersonalComplete = (personal = {}) => !!(
            personal.fullName &&
            personal.dateOfBirth &&
            personal.gender &&
            personal.nationality &&
            personal.passportNumber &&
            personal.maritalStatus
          );
          const isContactComplete = (contact = {}) => (
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.emailAddress || contact.email || '') &&
            /^\+?\d{8,15}$/.test(contact.mobileNumber || '') &&
            /^[A-Za-z0-9\s,/-]+$/.test(contact.addressLine1 || '') &&
            /^[A-Za-z\s-]+$/.test(contact.city || '') &&
            /^[A-Za-z\s-]+$/.test(contact.state || '') &&
            !!(contact.country || '').trim() &&
            !!(contact.postalCode || '').trim()
          );
          if (stepId === 'overview') {
            const sections = ['personal', 'contact', 'course', 'academic'];
            const hasAnyData = sections.some(sec => isFilled(masterData[sec]));
            return hasAnyData ? 'complete' : '';
          }
          if (stepId === 'tests' || stepId === 'documents') {
            return 'complete';
          }
          if (stepId === 'preview') return '';
          const section = masterData[stepId];
          if (!section) return '';
          if (stepId === 'personal' && isPersonalComplete(section)) return 'complete';
          if (stepId === 'contact' && isContactComplete(section)) return 'complete';
          if (section._isValid === true) return 'complete';
          if (isFilled(section)) return 'partial';
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
                  onClick={() => navigateMasterApplication(`${basePath}/master-application/${step.id}`)}
                  badge={isMasterAppUnlocked ? badge : ''}
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
          <h4 className="nav-section-title">APPLICATION</h4>
          <ul className="nav-menu">

            {/* Profile Section */}
            <ExpandableNav
              label="Profile"
              isExpanded={expandedSections.profileInApp}
              onToggle={() => toggleSection('profileInApp')}
              badge={userData?.profileProgress >= 100 ? 'complete' : userData?.profileProgress > 0 ? `${userData.profileProgress}%` : 'Start'}
            >
              {profileNavItems.map(item => (
                <SubItem
                  key={item.key}
                  label={item.label}
                  isActive={location.pathname.includes(item.path)}
                  onClick={() => navigate(item.path)}
                  badge={item.key === 'personal' ? (userData?.profileProgress >= 100 ? 'complete' : userData?.profileProgress > 0 ? `${userData.profileProgress}%` : '') : ''}
                />
              ))}
            </ExpandableNav>

            {/* Master Application Section */}
            <ExpandableNav
              label="Master Application"
              isExpanded={expandedSections.masterApplication}
              onToggle={() => {
                if (!isMasterAppUnlocked) {
                  showLockedMasterApplication();
                  return;
                }
                toggleSection('masterApplication');
              }}
              badge={`${masterAppProgressDisplay}%`}
            >
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'personal', label: 'Personal Information' },
                { id: 'contact', label: 'Contact Details' },
                { id: 'course', label: 'Course Selection' },
                { id: 'academic', label: 'Academic History' },
                { id: 'tests', label: 'Test Scores' },
                { id: 'documents', label: 'Documents' },
                { id: 'preview', label: 'Preview & Submit' },
              ].map((step, index) => (
                <SubItem
                  key={step.id}
                  label={`${index + 1}. ${step.label}`}
                  isActive={location.pathname.includes(`/master-application/${step.id}`)}
                  onClick={() => navigateMasterApplication(`${basePath}/master-application/${step.id}`)}
                />
              ))}
            </ExpandableNav>

            {/* University Application Section */}
            <ExpandableNav
              label="University Application"
              isExpanded={expandedSections.application}
              onToggle={() => toggleSection('application')}
              badge={`${safeApplicationProgress}%`}
            >
              <SubItem
                label="Application Overview"
                isActive={location.pathname === `${basePath}/application/overview`}
                onClick={() => navigate(`${basePath}/application/overview`)}
              />
              {[
                { id: 'personal', label: 'Personal Information', route: `${basePath}/application/personal` },
                { id: 'address', label: 'Address', route: `${basePath}/application/address` },
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

            {/* Family */}
            <ExpandableNav
              label="Family"
              isExpanded={expandedSections.family}
              onToggle={() => toggleSection('family')}
              badge={userData?.applicationProgress?.family >= 100 ? 'complete' : userData?.applicationProgress?.family > 0 ? `${userData.applicationProgress.family}%` : 'Start'}
            >
              {[
                ['household', 'Household'],
                ['parent1', 'Parent 1'],
                ['parent2', 'Parent 2'],
                ['sibling', 'Sibling'],
              ].map(([key, label]) => (
                <SubItem
                  key={key}
                  label={label}
                  isActive={location.pathname.includes(`/${key}`)}
                  onClick={() => navigate(`${basePath}/family/${key}`)}
                />
              ))}
            </ExpandableNav>

            {/* Education */}
            <ExpandableNav
              label="Education"
              isExpanded={expandedSections.education}
              onToggle={() => toggleSection('education')}
              badge={userData?.applicationProgress?.education >= 100 ? 'complete' : userData?.applicationProgress?.education > 0 ? `${userData.applicationProgress.education}%` : 'Start'}
            >
              {[
                ['current-school', 'Current or Most Recent Secondary/High School'],
                ['other-schools', 'Other Secondary/High Schools'],
                ['grades', 'Grades'],
                ['current-courses', 'Current or Most Recent Year Courses'],
                ['honors', 'Honors'],
                ['community-organizations', 'Community-Based Organizations'],
                ['future-plans', 'Future Plans'],
                ['documents', 'Documents Upload'],
              ].map(([key, label]) => (
                <SubItem
                  key={key}
                  label={label}
                  isActive={location.pathname.includes(`/${key}`)}
                  onClick={() => navigate(`${basePath}/education/${key}`)}
                />
              ))}
            </ExpandableNav>

            {/* Testing */}
            <ExpandableNav
              label="Testing"
              isExpanded={expandedSections.testing}
              onToggle={() => toggleSection('testing')}
              badge={userData?.applicationProgress?.testing >= 100 ? 'complete' : userData?.applicationProgress?.testing > 0 ? `${userData.applicationProgress.testing}%` : '0%'}
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
                <li className="nav-subitem">
                  <div className="nav-content">
                    <span className="nav-dot"></span>
                    <span className="nav-text nav-text--muted">No tests selected</span>
                  </div>
                </li>
              )}
            </ExpandableNav>

            {/* Activities */}
            <ExpandableNav
              label="Activities"
              isExpanded={expandedSections.activities}
              onToggle={() => toggleSection('activities')}
              badge={userData?.applicationProgress?.activities >= 100 ? 'complete' : userData?.applicationProgress?.activities > 0 ? `${userData.applicationProgress.activities}%` : '0%'}
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

            {/* Writing */}
            <ExpandableNav
              label="Writing"
              isExpanded={expandedSections.writing}
              onToggle={() => toggleSection('writing')}
              badge={userData?.applicationProgress?.writing >= 100 ? 'complete' : userData?.applicationProgress?.writing > 0 ? `${userData.applicationProgress.writing}%` : '0%'}
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

            {userColleges.length > 0 && (
              <ExpandableNav
                label="My Colleges"
                isExpanded={expandedSections.colleges}
                onToggle={() => toggleSection('colleges')}
                badge={`${userColleges.length}`}
              >
                {userColleges.map(college => (
                  <li key={college.collegeId} className="nav-college-item">
                    <div
                      className={`nav-college-header ${location.pathname.includes(`/colleges/${college.collegeId}`) ? 'active' : ''}`}
                      onClick={() => {
                        toggleCollege(college.collegeId);
                        navigate(`${basePath}/colleges/${college.collegeId}`);
                      }}
                    >
                      <span className="nav-dot"></span>
                      <span className="nav-text">{college.name}</span>
                      <span className="nav-chevron">
                        {expandedSections.expandedColleges[college.collegeId] ? <FaChevronDown /> : <FaChevronRight />}
                      </span>
                    </div>
                    {expandedSections.expandedColleges[college.collegeId] && (
                      <ul className="nav-college-submenu">
                        {[
                          { id: 'documents', name: 'Documents' },
                          { id: 'general', name: 'General' },
                          { id: 'academics', name: 'Academics' },
                          { id: 'activities', name: 'Activities' },
                          { id: 'contacts', name: 'Contacts' },
                          { id: 'family', name: 'Family' },
                          { id: 'residency', name: 'Residency' },
                        ].map(sub => (
                          <li
                            key={sub.id}
                            className={`nav-application-subitem ${location.pathname === `${basePath}/colleges/${college.collegeId}/${sub.id}` ? 'active' : ''}`}
                            onClick={() => navigate(`${basePath}/colleges/${college.collegeId}/${sub.id}`)}
                          >
                            <div className="nav-content">
                              <span className="nav-dot"></span>
                              <span className="nav-text">{sub.name}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ExpandableNav>
            )}

            <ExpandableNav
              label="Courses & Programs"
              isExpanded={expandedSections.courses}
              onToggle={() => toggleSection('courses')}
            >
              <SubItem
                label="Browse All Courses"
                isActive={location.pathname.includes('/college-search')}
                onClick={() => navigate(`${basePath}/college-search`)}
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
      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu">
          <span className="mobile-menu-icon"></span>
        </button>
        <div className="mobile-brand-logo">
          <img
            src={logo}
            alt="Edutech"
            className="mobile-logo-img"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
        <div className="mobile-avatar">
          {userData?.firstName && userData?.lastName ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase() : 'AA'}
        </div>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

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
            <div className="copyright">&copy; 2026 EDUTECH. All rights reserved.</div>
          </div>
        </nav>
      </div>

      <div className="dashboard-main">{children}</div>
    </div>
  );
};

export default DashboardLayout;
