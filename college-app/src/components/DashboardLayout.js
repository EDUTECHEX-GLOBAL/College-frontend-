// src/components/DashboardLayout.js - UPDATED WITH EDUTECH STYLE SIDEBAR
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/Edutech-logo.svg';

// ─── SVG Icon Components for Sidebar ───
const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Profile: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Contact: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Address: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Demographics: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Language: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14M12 3v5M8 8v10M16 8v10M6 18h12M9 21h6"/>
      <path d="M4 8h16"/>
    </svg>
  ),
  Geography: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Family: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Education: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  Testing: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  Activities: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Writing: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  Colleges: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Courses: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Application: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  DirectAdmissions: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Financial: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  SignOut: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  College: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
};

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
    expandedColleges: {}
  });
  const [forceUpdate, setForceUpdate] = useState(0);

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
      userData.profileProgress || 0,
      userData.applicationProgress?.family || 0,
      userData.applicationProgress?.education || 0,
      userData.applicationProgress?.testing || 0,
      userData.applicationProgress?.activities || 0,
      userData.applicationProgress?.writing || 0
    ];
    return Math.round(sections.reduce((sum, p) => sum + p, 0) / sections.length);
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/testing')) setExpandedSections(prev => ({ ...prev, testing: true }));
    if (path.includes('/colleges') && !path.includes('/college-search')) setExpandedSections(prev => ({ ...prev, colleges: true }));
    if (path.includes('/writing')) setExpandedSections(prev => ({ ...prev, writing: true }));
    if (path.includes('/activities')) setExpandedSections(prev => ({ ...prev, activities: true }));
    if (path.includes('/courses')) setExpandedSections(prev => ({ ...prev, courses: true }));
    if (path.includes('/application')) setExpandedSections(prev => ({ ...prev, application: true }));
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
    return () => {
      window.removeEventListener('storage', h);
      window.removeEventListener('testingDataUpdated', h);
      window.removeEventListener('collegeFormUpdated', h);
      window.removeEventListener('applicationUpdated', h);
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
    localStorage.removeItem('selectedCourseForApplication');
    localStorage.removeItem('currentSelectedCourse');
    navigate('/');
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
          <Icons.College />
          <span className="nav-text">{college.name}</span>
          <span className="expand-icon">{isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}</span>
        </div>
        {isExpanded && (
          <ul className="nav-college-submenu">
            <li className="nav-college-subitem">
              <div className="nav-college-subheader"><span className="nav-text">APPLICATION</span></div>
              <ul className="nav-application-submenu">
                {applicationSubsections.map((sub) => {
                  const isActive = location.pathname === `${basePath}/colleges/${college.collegeId}/${sub.id}`;
                  return (
                    <li key={sub.id} className={`nav-application-subitem ${isActive ? 'active' : ''}`}>
                      <div className={`nav-content ${isActive ? 'active' : ''}`} onClick={() => onNavigate(`college-${college.collegeId}-${sub.id}`)}>
                        <span className="nav-text">{sub.name}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
            <li className={`nav-college-subitem ${location.pathname === `${basePath}/colleges/${college.collegeId}/review` ? 'active' : ''}`}>
              <div className={`nav-content ${location.pathname === `${basePath}/colleges/${college.collegeId}/review` ? 'active' : ''}`} onClick={() => onNavigate(`college-${college.collegeId}-review`)}>
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

  // Reusable NavItem component with icon
  const NavItem = ({ icon: Icon, label, isActive, onClick, badge, hint }) => (
    <li className={`nav-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="nav-content">
        {Icon && <span className="nav-icon"><Icon /></span>}
        <span className="nav-text">{hint || label}</span>
        {badge !== undefined && badge !== '' && <div className="nav-progress">{badge}</div>}
      </div>
    </li>
  );

  // Expandable nav section with icon
  const ExpandableNav = ({ icon: Icon, label, isExpanded, onToggle, badge, children }) => (
    <li className="nav-section-expandable">
      <div className={`nav-header ${isExpanded ? 'expanded' : ''}`} onClick={onToggle}>
        {Icon && <span className="nav-icon"><Icon /></span>}
        <span className="nav-text">{label}</span>
        <div className="nav-header-right">
          {badge !== undefined && badge !== '' && <span className="nav-progress-small">{badge}</span>}
          <span className="expand-icon">{isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}</span>
        </div>
      </div>
      {isExpanded && <ul className="nav-submenu">{children}</ul>}
    </li>
  );

  const SubItem = ({ label, isActive, onClick, badge }) => (
    <li className={`nav-subitem ${isActive ? 'active' : ''}`}>
      <div className="nav-content" onClick={onClick}>
        <span className="nav-text">{label}</span>
        {badge !== undefined && <div className="nav-progress-tiny">{badge}</div>}
      </div>
    </li>
  );

  const getSidebarContent = () => {
    // PROFILE Section - This is the main sidebar for profile sections
    if (activeMainSection === 'profile') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">PROFILE</h4>
          <ul className="nav-menu">
            <NavItem 
              icon={Icons.Profile}
              label="Personal Information" 
              isActive={location.pathname.includes('/personal')} 
              onClick={() => onSectionChange('personal')} 
            />
            <NavItem 
              icon={Icons.Contact}
              label="Contact Details" 
              isActive={location.pathname.includes('/contact')} 
              onClick={() => onSectionChange('contact')} 
            />
            <NavItem 
              icon={Icons.Address}
              label="Address" 
              isActive={location.pathname.includes('/address')} 
              onClick={() => onSectionChange('address')} 
            />
            <NavItem 
              icon={Icons.Demographics}
              label="Demographics" 
              isActive={location.pathname.includes('/demographics')} 
              onClick={() => onSectionChange('demographics')} 
            />
            <NavItem 
              icon={Icons.Language}
              label="Language" 
              isActive={location.pathname.includes('/language')} 
              onClick={() => onSectionChange('language')} 
            />
            <NavItem 
              icon={Icons.Geography}
              label="Geography & Nationality" 
              isActive={location.pathname.includes('/geography')} 
              onClick={() => onSectionChange('geography')} 
            />
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
                icon={Icons.Family}
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
                icon={Icons.Education}
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
              icon={Icons.Writing}
              label="Personal Essay" 
              isActive={location.pathname.includes('/personal-essay')} 
              onClick={() => navigate(`${basePath}/writing/personal-essay`)} 
            />
            <NavItem 
              icon={Icons.Writing}
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
              icon={Icons.Activities}
              label="Activities" 
              isActive={location.pathname.includes('/activities/activities')} 
              onClick={() => navigate(`${basePath}/activities/activities`)} 
            />
            <NavItem 
              icon={Icons.Activities}
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
                icon={Icons.Testing}
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
              icon={Icons.Application}
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
                  icon={Icons.Application}
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

    // Default sidebar - Main Dashboard Menu with PROFILE section
    return (
      <>
        <div className="nav-section">
          <h4 className="nav-section-title">MAIN MENU</h4>
          <ul className="nav-menu">
            <NavItem 
              icon={Icons.Dashboard} 
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
              icon={Icons.Profile} 
              label="Personal Information" 
              isActive={activeMainSection === 'profile' && location.pathname.includes('/personal')}
              onClick={() => navigate(`${basePath}/profile/personal`)} 
              badge={userData?.profileProgress >= 100 ? '✓' : userData?.profileProgress > 0 ? `${userData.profileProgress}%` : 'Start'} 
            />
            <NavItem 
              icon={Icons.Contact} 
              label="Contact Details" 
              isActive={activeMainSection === 'profile' && location.pathname.includes('/contact')}
              onClick={() => navigate(`${basePath}/profile/contact`)} 
            />
            <NavItem 
              icon={Icons.Address} 
              label="Address" 
              isActive={activeMainSection === 'profile' && location.pathname.includes('/address')}
              onClick={() => navigate(`${basePath}/profile/address`)} 
            />
            <NavItem 
              icon={Icons.Demographics} 
              label="Demographics" 
              isActive={activeMainSection === 'profile' && location.pathname.includes('/demographics')}
              onClick={() => navigate(`${basePath}/profile/demographics`)} 
            />
            <NavItem 
              icon={Icons.Language} 
              label="Language" 
              isActive={activeMainSection === 'profile' && location.pathname.includes('/language')}
              onClick={() => navigate(`${basePath}/profile/language`)} 
            />
            <NavItem 
              icon={Icons.Geography} 
              label="Geography & Nationality" 
              isActive={activeMainSection === 'profile' && location.pathname.includes('/geography')}
              onClick={() => navigate(`${basePath}/profile/geography`)} 
            />
          </ul>
        </div>

        <div className="nav-section">
          <h4 className="nav-section-title">APPLICATION</h4>
          <ul className="nav-menu">
            <ExpandableNav 
              icon={Icons.Application} 
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
              icon={Icons.Family} 
              label="Family" 
              isActive={activeMainSection === 'family'}
              onClick={() => onSectionChange('family')}
              badge={userData?.applicationProgress?.family >= 100 ? '✓' : userData?.applicationProgress?.family > 0 ? `${userData.applicationProgress.family}%` : 'Start'} 
            />

            <NavItem 
              icon={Icons.Education} 
              label="Education" 
              isActive={activeMainSection === 'education'}
              onClick={() => onSectionChange('education')}
              badge={userData?.applicationProgress?.education >= 100 ? '✓' : userData?.applicationProgress?.education > 0 ? `${userData.applicationProgress.education}%` : 'Start'} 
            />

            <ExpandableNav 
              icon={Icons.Testing} 
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
                <li className="nav-subitem"><div className="nav-content"><span className="nav-text nav-text--muted">No tests selected</span></div></li>
              )}
            </ExpandableNav>

            <ExpandableNav 
              icon={Icons.Activities} 
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
              icon={Icons.Writing} 
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
              icon={Icons.Search} 
              label="College Search" 
              isActive={location.pathname.includes('/college-search')} 
              onClick={() => navigate(`${basePath}/college-search`)} 
            />
            
            <ExpandableNav 
              icon={Icons.Colleges} 
              label="My Colleges" 
              isExpanded={expandedSections.colleges} 
              onToggle={() => toggleSection('colleges')}
            >
              <SubItem 
                label="Overview" 
                isActive={location.pathname === `${basePath}/colleges`} 
                onClick={() => onSectionChange('colleges')} 
              />
              {userColleges.length > 0 ? userColleges.map(college => (
                <CollegeSidebarItem 
                  key={college.collegeId} 
                  college={college}
                  isExpanded={expandedSections.expandedColleges[college.collegeId]}
                  onToggle={() => toggleCollege(college.collegeId)}
                  onNavigate={handleCollegeSubsectionNavigate} 
                />
              )) : (
                <li className="nav-subitem"><div className="nav-content"><span className="nav-text nav-text--muted">No colleges added</span></div></li>
              )}
            </ExpandableNav>

            <ExpandableNav 
              icon={Icons.Courses} 
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
              icon={Icons.DirectAdmissions} 
              label="Direct Admissions" 
              isActive={false} 
              onClick={() => {}} 
            />
            <NavItem 
              icon={Icons.Financial} 
              label="Financial Aid" 
              isActive={false} 
              onClick={() => {}} 
            />
            <NavItem 
              icon={Icons.Settings} 
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
          <Icons.Menu />
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
          <Icons.Close />
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
              <li className="nav-item sign-out" onClick={handleSignOut}>
                <div className="nav-content">
                  <span className="nav-icon"><Icons.SignOut /></span>
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