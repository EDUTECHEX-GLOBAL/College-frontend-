import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import DashboardLayout from './DashboardLayout';
import ProfileForm from './ProfileForm';
import EducationForm from './EducationForm';
import TestingForm from './TestingForm';
import ActivitiesSection from './activities-sections/ActivitiesSection';
import ResponsibilitiesSection from './activities-sections/ResponsibilitiesSection';
import CollegeSearch from "./CollegeSearch";
import CollegeSubsection from "./CollegeSubsection";
import WritingSection from './writing-sections/WritingSection';
import FamilySection from './family-sections/FamilySection';
import ChatWidget from './Chatbot/ChatWidget';
import Courses from './Courses';
import Application from './Application/Application';
import Overview from './Application/Overview';
import Master from './master-university/master';

const API_URL = process.env.REACT_APP_API_BASE_URL;

/* ══════════════════════════════════════════════════════════
   SVG ICON COMPONENTS
══════════════════════════════════════════════════════════ */
const LockIcon = ({ size = 16, color = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const InfoCircleIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ArrowRightIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const GraduationIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const SearchNavIcon = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CloseIcon = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronDownIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ── Circular Progress Ring ── */
const ProgressRing = ({ percent = 0 }) => {
  const radius        = 45;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference - (percent / 100) * circumference;
  return (
    <div className="dashboard-ring">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0891b2" />
            <stop offset="100%" stopColor="#0e7490" />
          </linearGradient>
        </defs>
        <circle className="dashboard-ring__bg"   cx="60" cy="60" r={radius} />
        <circle className="dashboard-ring__fill" cx="60" cy="60" r={radius}
          strokeDasharray={circumference} strokeDashoffset={offset} stroke="url(#ringGrad)" />
      </svg>
      <div className="dashboard-ring__label">
        <span className="dashboard-ring__pct">{Math.round(percent)}%</span>
        <span className="dashboard-ring__sub">Completed</span>
      </div>
    </div>
  );
};

const getPctClass = (progress) => {
  if (progress >= 100) return 'pct--success';
  if (progress >= 50)  return 'pct--progress';
  if (progress > 0)    return 'pct--warning';
  return 'pct--zero';
};

/* ══════════════════════════════════════════════════════════
   LOCK UTILITY
══════════════════════════════════════════════════════════ */
const getUnlockedAppType = () => {
  try { return localStorage.getItem('unlockedApplicationType') || null; }
  catch { return null; }
};

const LockTooltip = ({ visible, onClose, appType, onGoToSearch }) => {
  if (!visible) return null;
  const isUniversity = appType === 'university';
  return (
    <div className="lock-overlay" onClick={onClose}>
      <div className="lock-modal" onClick={e => e.stopPropagation()}>
        <button className="lock-modal__close" onClick={onClose} aria-label="Close">
          <CloseIcon size={13} color="#64748b" />
        </button>
        <div className="lock-modal__icon">
          <LockIcon size={30} color="#d97706" strokeWidth={1.8} />
        </div>
        <h3 className="lock-modal__title">
          {isUniversity ? 'University Application Locked' : 'Master Application Locked'}
        </h3>
        <p className="lock-modal__desc">
          To unlock the{' '}
          <strong>{isUniversity ? 'University Application' : 'Master Application'}</strong>,
          go to <strong>College Search</strong>, select a{' '}
          {isUniversity ? "bachelor's" : "master's"} university, and choose a program.
          The application will unlock automatically.
        </p>
        <div className="lock-modal__hint">
          <span className="lock-modal__hint-icon">
            <GraduationIcon size={14} color="#0891b2" />
          </span>
          <span>
            {isUniversity
              ? 'Look for universities tagged as "GUS Portal" or "Bachelor University".'
              : 'Look for universities tagged as "Master Portal" or "Master University".'}
          </span>
        </div>
        <div className="lock-modal__actions">
          <button
            className="lock-modal__btn lock-modal__btn--primary"
            onClick={() => { onClose(); onGoToSearch(); }}
          >
            <SearchNavIcon size={14} color="#fff" />
            Go to College Search
            <ArrowRightIcon size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [userData,            setUserData]            = useState(null);
  const [loading,             setLoading]             = useState(true);
  const [searchQuery,         setSearchQuery]         = useState('');
  const [activeMainSection,   setActiveMainSection]   = useState('dashboard');
  const [userColleges,        setUserColleges]        = useState([]);
  const [familyCompleted,     setFamilyCompleted]     = useState(false);
  const [applicationProgress, setApplicationProgress] = useState(0);
  const [selectedCourseData,  setSelectedCourseData]  = useState(null);
  const [sidebarCollapsed,    setSidebarCollapsed]    = useState(false);
  const [masterAppProgress,   setMasterAppProgress]   = useState(0);

  /* Lock state */
  const [unlockedAppType, setUnlockedAppType] = useState(getUnlockedAppType);
  const [lockTooltip,     setLockTooltip]     = useState({ visible: false, appType: null });

  /* Group card open/close state */
  const [groupOpen, setGroupOpen] = useState(false);

  const isFirstYear = location.pathname.includes('/firstyear/');
  const basePath    = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';

  const refreshUnlockState = useCallback(() => {
    setUnlockedAppType(getUnlockedAppType());
  }, []);

  /* ── Progress calculators ── */
  const calculateLocalApplicationProgress = (appData) => {
    if (!appData) return 0;
    let completedFields = 0, totalFields = 0;
    const isFieldFilled = (v) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string')  return v.trim() !== '';
      if (typeof v === 'boolean') return true;
      if (typeof v === 'number')  return true;
      if (typeof v === 'object') {
        if (v.grade9 || v.grade10 || v.grade11 || v.grade12 || v.satTotal || v.act || v.toefl || v.ielts) return true;
        return Object.keys(v).length > 0;
      }
      return !!v;
    };
    const countFields = (fields) => fields.forEach(f => { totalFields++; if (isFieldFilled(appData[f])) completedFields++; });
    countFields(['firstName','lastName','dob','gender','nationality','countryOfResidence','email','mobile','passportFileName','photographFileName']);
    countFields(['currentAddress','city','state','country','postalCode','nationalIdFileName']);
    countFields(['eqheDate','eqheCity','eqheCountry','eqheOriginalTitle','hasAnotherEQHE','anotherEqheDate','anotherEqheCity','anotherEqheCountry','anotherEqheOriginalTitle','eqheCertificateFileName']);
    totalFields++; if (isFieldFilled(appData['hasSpecialNeeds'])) completedFields++;
    if (appData.hasSpecialNeeds === 'yes') { totalFields++; if (isFieldFilled(appData.specialNeedsDescription)) completedFields++; }
    countFields(['qualificationLevel','institutionName','boardUniversity','countryOfStudy','startYear','endYear','resultStatus','gradingSystem','transcriptsFileName','degreeCertificateFileName']);
    totalFields++; if (isFieldFilled(appData['scores'])) completedFields++;
    countFields(['sopFileName','lor1FileName','lor2FileName','portfolioFileName','researchProposalFileName']);
    return Math.round((completedFields / totalFields) * 100);
  };

  const calculateMasterApplicationProgress = (masterData) => {
    if (!masterData) return 0;
    let totalSections = 0, completedSections = 0;
    const sections = ['personal','contact','course','academic','tests','documents','declaration'];
    sections.forEach(section => {
      totalSections++;
      const sd = masterData[section];
      if (sd && sd._isValid === true)            completedSections++;
      else if (section === 'tests')              completedSections++;
      else if (section === 'documents')          completedSections++;
      else if (sd && Object.keys(sd).length > 0 && sd._isValid !== false) {
        if (Object.keys(sd).some(k => k !== '_isValid' && sd[k])) completedSections += 0.5;
      }
    });
    return Math.round((completedSections / totalSections) * 100);
  };

  const refreshUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_URL}/api/students/profile/detailed`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.data.success && response.data.account) {
        const user = response.data.account;
        const gusApplicationData = localStorage.getItem('gusApplicationData');
        let appProgress = 0;
        if (gusApplicationData) { try { appProgress = calculateLocalApplicationProgress(JSON.parse(gusApplicationData)); } catch (e) {} }
        let masterProgress = 0;
        const masterAppData = localStorage.getItem('masterApplicationData');
        if (masterAppData) { try { masterProgress = calculateMasterApplicationProgress(JSON.parse(masterAppData)); setMasterAppProgress(masterProgress); } catch (e) {} }
        const selectedCourse = localStorage.getItem('selectedCourseForApplication');
        if (selectedCourse) { try { setSelectedCourseData(JSON.parse(selectedCourse)); } catch (e) {} }
        const formattedUserData = {
          name: `${user.firstName} ${user.lastName}`, email: user.email,
          studentId: user._id ? `CAID ${user._id.toString().slice(-8).toUpperCase()}` : 'CAID 48555228',
          firstName: user.firstName, lastName: user.lastName,
          profileProgress:    response.data.profileProgress          || 0,
          educationProgress:  user.applicationProgress?.education    || 0,
          testingProgress:    user.applicationProgress?.testing      || 0,
          writingProgress:    user.applicationProgress?.writing      || 0,
          activitiesProgress: user.applicationProgress?.activities   || 0,
          testingData: user.testingData || { testsToReport: [] },
          applicationProgress: { ...user.applicationProgress, application: appProgress, masterApplication: masterProgress },
          ...user
        };
        setUserData(formattedUserData);
        setApplicationProgress(appProgress);
        localStorage.setItem('userData', JSON.stringify(formattedUserData));
      }
    } catch (error) { console.error('Error refreshing user data:', error); }
  }, []);

  const fetchUserColleges = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_URL}/api/colleges`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.data.success) setUserColleges(response.data.colleges);
    } catch (error) { console.error('Error fetching user colleges:', error); }
  }, []);

  const refreshAllData = useCallback(async () => {
    await refreshUserData();
    await fetchUserColleges();
  }, [refreshUserData, fetchUserColleges]);

  const handleFamilyComplete = useCallback((isComplete) => {
    setFamilyCompleted(isComplete);
    localStorage.setItem('familySectionComplete', isComplete ? 'true' : 'false');
    if (userData) setUserData(prev => ({ ...prev, applicationProgress: { ...prev.applicationProgress, family: isComplete ? 100 : (prev.applicationProgress?.family || 0) } }));
  }, [userData]);

  const handleCourseSelection = (courseData) => {
    const level    = (courseData?.programDetails?.level || '').toLowerCase();
    const isMaster = level === 'master' || localStorage.getItem('selectedMasterCourseForApplication') !== null;
    if (isMaster) {
      localStorage.setItem('selectedMasterCourseForApplication', JSON.stringify(courseData));
      localStorage.setItem('unlockedApplicationType', 'master');
      localStorage.removeItem('selectedCourseForApplication');
      localStorage.removeItem('currentSelectedCourse');
      setUnlockedAppType('master');
      navigate(`${basePath}/master-application/overview`, { state: { fromCoursesPage: true, courseData, isMasterApplication: true } });
    } else {
      setSelectedCourseData(courseData);
      localStorage.setItem('selectedCourseForApplication', JSON.stringify(courseData));
      localStorage.setItem('currentSelectedCourse', JSON.stringify(courseData));
      localStorage.setItem('unlockedApplicationType', 'bachelor');
      localStorage.removeItem('selectedMasterCourseForApplication');
      setUnlockedAppType('bachelor');
      navigate(`${basePath}/application/overview`, { state: { fromCoursesPage: true, courseData } });
    }
  };

  const handleMasterApplicationUpdate = useCallback(() => {
    const masterAppData = localStorage.getItem('masterApplicationData');
    if (masterAppData) {
      try {
        const masterData = JSON.parse(masterAppData);
        const progress   = calculateMasterApplicationProgress(masterData);
        setMasterAppProgress(progress);
        if (userData) setUserData(prev => ({ ...prev, applicationProgress: { ...prev.applicationProgress, masterApplication: progress } }));
      } catch (e) {}
    }
  }, [userData]);

  useEffect(() => {
    const handleAppUpdate = () => {
      const gusApplicationData = localStorage.getItem('gusApplicationData');
      if (gusApplicationData) {
        try {
          const progress = calculateLocalApplicationProgress(JSON.parse(gusApplicationData));
          setApplicationProgress(progress);
          if (userData) {
            setUserData(prev => ({ ...prev, applicationProgress: { ...prev.applicationProgress, application: progress } }));
            localStorage.setItem('userData', JSON.stringify({ ...userData, applicationProgress: { ...userData.applicationProgress, application: progress } }));
          }
        } catch (e) {}
      }
    };
    window.addEventListener('applicationUpdated', handleAppUpdate);
    window.addEventListener('masterApplicationUpdated', handleMasterApplicationUpdate);
    return () => {
      window.removeEventListener('applicationUpdated', handleAppUpdate);
      window.removeEventListener('masterApplicationUpdated', handleMasterApplicationUpdate);
    };
  }, [userData, handleMasterApplicationUpdate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) { navigate('/sign-in'); return; }
        const response = await axios.get(`${API_URL}/api/students/profile/detailed`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.data.success && response.data.account) {
          const user = response.data.account;
          const storedFamilyComplete = localStorage.getItem('familySectionComplete') === 'true';
          setFamilyCompleted(storedFamilyComplete);
          const gusApplicationData = localStorage.getItem('gusApplicationData');
          let appProgress = 0;
          if (gusApplicationData) { try { appProgress = calculateLocalApplicationProgress(JSON.parse(gusApplicationData)); setApplicationProgress(appProgress); } catch (e) {} }
          const masterAppData = localStorage.getItem('masterApplicationData');
          let masterProgress = 0;
          if (masterAppData) { try { masterProgress = calculateMasterApplicationProgress(JSON.parse(masterAppData)); setMasterAppProgress(masterProgress); } catch (e) {} }
          const selectedCourse = localStorage.getItem('selectedCourseForApplication');
          if (selectedCourse) { try { setSelectedCourseData(JSON.parse(selectedCourse)); } catch (e) {} }
          const formattedUserData = {
            name: `${user.firstName} ${user.lastName}`, email: user.email,
            studentId: user._id ? `CAID ${user._id.toString().slice(-8).toUpperCase()}` : 'CAID 48555228',
            firstName: user.firstName, lastName: user.lastName,
            profileProgress:    response.data.profileProgress          || 0,
            educationProgress:  user.applicationProgress?.education    || 0,
            testingProgress:    user.applicationProgress?.testing      || 0,
            writingProgress:    user.applicationProgress?.writing      || 0,
            activitiesProgress: user.applicationProgress?.activities   || 0,
            applicationProgress: { ...user.applicationProgress, application: appProgress, family: storedFamilyComplete ? 100 : (user.applicationProgress?.family || 0), masterApplication: masterProgress },
            testingData: user.testingData || { testsToReport: [] },
            ...user
          };
          setUserData(formattedUserData);
          localStorage.setItem('userData', JSON.stringify(formattedUserData));
        }
      } catch (error) {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData && storedUserData !== 'undefined') {
          try {
            const parsedData = JSON.parse(storedUserData);
            setUserData(parsedData);
            setFamilyCompleted(localStorage.getItem('familySectionComplete') === 'true');
            const gusApplicationData = localStorage.getItem('gusApplicationData');
            if (gusApplicationData) { try { setApplicationProgress(calculateLocalApplicationProgress(JSON.parse(gusApplicationData))); } catch (e) {} }
            const masterAppData = localStorage.getItem('masterApplicationData');
            if (masterAppData) { try { setMasterAppProgress(calculateMasterApplicationProgress(JSON.parse(masterAppData))); } catch (e) {} }
            const selectedCourse = localStorage.getItem('selectedCourseForApplication');
            if (selectedCourse) { try { setSelectedCourseData(JSON.parse(selectedCourse)); } catch (e) {} }
          } catch (e) {}
        }
      } finally { setLoading(false); }
    };
    fetchUserProfile();
    fetchUserColleges();
  }, [navigate, fetchUserColleges]);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard') || path.includes('/colleges') || path.includes('/college-search')) refreshAllData();
  }, [location.pathname, refreshAllData]);

  useEffect(() => {
    const h = () => { fetchUserColleges(); refreshUnlockState(); };
    window.addEventListener('collegesUpdated', h);
    return () => window.removeEventListener('collegesUpdated', h);
  }, [fetchUserColleges, refreshUnlockState]);

  useEffect(() => {
    const h = (e) => { if (e.detail?.section === 'family') handleFamilyComplete(e.detail.isComplete); };
    window.addEventListener('familySectionComplete', h);
    return () => window.removeEventListener('familySectionComplete', h);
  }, [handleFamilyComplete]);

  useEffect(() => {
    const path = location.pathname;
    if      (path.includes('/profile'))            setActiveMainSection('profile');
    else if (path.includes('/colleges') && !path.includes('/education/colleges')) setActiveMainSection('colleges');
    else if (path.includes('/education'))          setActiveMainSection('education');
    else if (path.includes('/testing'))            setActiveMainSection('testing');
    else if (path.includes('/writing'))            setActiveMainSection('writing');
    else if (path.includes('/activities'))         setActiveMainSection('activities');
    else if (path.includes('/college-search'))     setActiveMainSection('college-search');
    else if (path.includes('/family'))             setActiveMainSection('family');
    else if (path.includes('/courses'))            setActiveMainSection('courses');
    else if (path.includes('/master-application')) setActiveMainSection('master-application');
    else setActiveMainSection('dashboard');
  }, [location.pathname]);

  const handleSectionChange = (section) => {
    const routes = {
      dashboard:            `${basePath}`,
      application:          `${basePath}/application`,
      'master-application': `${basePath}/master-application`,
      colleges:             `${basePath}/colleges`,
      education:            `${basePath}/education/current-school`,
      testing:              `${basePath}/testing/tests-taken`,
      writing:              `${basePath}/writing/personal-essay`,
      activities:           `${basePath}/activities`,
      personal:             `${basePath}/profile/personal`,
      contact:              `${basePath}/profile/contact`,
      address:              `${basePath}/profile/address`,
      demographics:         `${basePath}/profile/demographics`,
      language:             `${basePath}/profile/language`,
      geography:            `${basePath}/profile/geography`,
      family:               `${basePath}/family`,
      courses:              `${basePath}/college-search`,
    };
    if (routes[section]) { navigate(routes[section]); return; }
    if (section.startsWith('college-')) {
      const parts = section.split('-');
      navigate(`${basePath}/colleges/${parts[1]}/${parts.slice(2).join('-')}`);
    } else { navigate(basePath); }
  };

  /* Summary numbers */
  const completedSections = userData?.applicationProgress
    ? Object.values(userData.applicationProgress).filter(p => p >= 100).length : 0;
  const totalSections = userData?.applicationProgress
    ? Object.keys(userData.applicationProgress).length : 0;
  const overallProgress = userData?.applicationProgress
    ? Math.round(Object.values(userData.applicationProgress).reduce((s, p) => s + p, 0) / Math.max(1, Object.values(userData.applicationProgress).length))
    : 0;

  /* Lock helpers */
  const isUniversityAppLocked = unlockedAppType !== 'bachelor';
  const isMasterAppLocked     = unlockedAppType !== 'master';
  const handleLockedCardClick = (appType) => setLockTooltip({ visible: true, appType });

  /* ── Section definitions ── */
  const lockedSections = [
    { name: 'University Application', desc: 'Select your program and institutions',       progress: applicationProgress || 0, path: `${basePath}/application/overview`,  locked: isUniversityAppLocked, lockedFor: 'university' },
    { name: 'Master Application',     desc: 'Complete your university registration form', progress: masterAppProgress   || 0, path: `${basePath}/master-application`,    locked: isMasterAppLocked,     lockedFor: 'master'     },
  ];

  const commonSections = [
    { name: 'Profile',     desc: 'Personal information and background',   progress: userData?.profileProgress                                          || 0, path: `${basePath}/profile/personal`         },
    { name: 'Family',      desc: 'Family details and information',         progress: familyCompleted ? 100 : (userData?.applicationProgress?.family || 0), path: `${basePath}/family`                   },
    { name: 'Education',   desc: 'Academic history and achievements',      progress: userData?.applicationProgress?.education  || 0,                       path: `${basePath}/education/current-school` },
    { name: 'Testing',     desc: 'Standardized test scores',               progress: userData?.applicationProgress?.testing    || 0,                       path: `${basePath}/testing/tests-taken`      },
    { name: 'Activities',  desc: 'Extracurricular activities and honors',  progress: userData?.applicationProgress?.activities || 0,                       path: `${basePath}/activities`               },
    { name: 'Writing',     desc: 'Personal statements and essays',         progress: userData?.applicationProgress?.writing    || 0,                       path: `${basePath}/writing/personal-essay`   },
  ];

  /* Combined for banner stats */
  const applicationSections = [...lockedSections, ...commonSections];

  /* Group card computed values */
  const groupProgress  = commonSections.length
    ? Math.round(commonSections.reduce((sum, s) => sum + s.progress, 0) / commonSections.length)
    : 0;
  const groupCompleted  = commonSections.filter(s => s.progress >= 100).length;
  const groupInProgress = commonSections.filter(s => s.progress > 0 && s.progress < 100).length;

  const getActionLabel = (section) => {
    if (section.locked)          return 'Unlock';
    if (section.progress >= 100) return 'Review & Edit';
    if (section.progress > 0)    return 'Continue';
    return 'Get Started';
  };

  const getActionColor = (section) => {
    if (section.locked)          return '#94a3b8';
    if (section.progress >= 100) return '#10b981';
    if (section.progress > 0)    return '#0891b2';
    return '#9ca3af';
  };

  const handleSectionClick = (section) => {
    if (section.locked) { handleLockedCardClick(section.lockedFor); return; }
    if (section?.path)  navigate(section.path);
  };

  const getNextIncomplete = () => {
    const unlocked = applicationSections.filter(s => !s.locked);
    return unlocked.find(s => s.progress < 100) || unlocked[0];
  };

  /* ── Colleges Page ── */
  const CollegesSection = () => (
    <>
      <div className="dashboard-header">
        <div className="dashboard-header__inner">
          <div className="dashboard-header__title-group">
            <div>
              <h1 className="dashboard-header__welcome">My Colleges</h1>
              <p className="dashboard-header__subtitle">Manage your college applications and track progress</p>
            </div>
          </div>
          <div className="dashboard-header__actions">
            <button className="header-notif-btn" aria-label="Notifications"><span className="notif-bell"></span><span className="notif-badge"></span></button>
            <button className="header-user-chip">
              <span className="header-user-chip__avatar">{userData?.firstName?.[0]}{userData?.lastName?.[0]}</span>
              <span className="header-user-chip__name">{userData?.firstName} {userData?.lastName}</span>
              <span className="header-user-chip__caret">▾</span>
            </button>
          </div>
        </div>
      </div>
      <div className="dashboard-body">
        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title-row">
              <h2 className="dashboard-card__title">Your College List</h2>
              <span className="dashboard-badge">{userColleges.length} colleges</span>
            </div>
          </div>
          {userColleges.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty__icon"></div>
              <h3 className="dashboard-empty__title">No colleges added yet</h3>
              <p className="dashboard-empty__desc">Start by searching for colleges to add to your list.</p>
              <button className="dashboard-btn dashboard-btn--primary" onClick={() => navigate(`${basePath}/college-search`)}>Search Colleges</button>
            </div>
          ) : (
            <div className="dashboard-college-list">
              {userColleges.map(college => (
                <div key={college.collegeId} className="dashboard-college-row">
                  <div className="dashboard-college-row__info">
                    <h4 className="dashboard-college-row__name" onClick={() => navigate(`${basePath}/colleges/${college.collegeId}`)}>{college.name}</h4>
                    <p className="dashboard-college-row__location">{college.city}, {college.state} - USA</p>
                  </div>
                  <button className="dashboard-btn dashboard-btn--outline" onClick={() => navigate(`${basePath}/colleges/${college.collegeId}`)}>View Details</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {userColleges.length > 0 && (
          <div className="dashboard-card">
            <h2 className="dashboard-card__title" style={{ marginBottom: 16 }}>Application Progress Summary</h2>
            <div className="dashboard-progress-note">
              <p>Click on any college in the sidebar to start working on your application sections.</p>
              <p>Each college has its own set of application requirements and deadlines.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  /* ── Master Application Wrapper ── */
  const MasterApplicationWrapper = () => {
    const handleMasterUpdate = () => { handleMasterApplicationUpdate(); refreshUserData(); };
    return <Master onUpdate={handleMasterUpdate} />;
  };

  /* ══════════════════════════════════════════════════════════
     DASHBOARD HOME
  ══════════════════════════════════════════════════════════ */
  const DashboardHome = () => {
    const nextSection = getNextIncomplete();
    const remaining   = applicationSections.filter(s => !s.locked && s.progress < 100).length;

    return (
      <>
        {/* Lock Modal */}
        <LockTooltip
          visible={lockTooltip.visible}
          appType={lockTooltip.appType}
          onClose={() => setLockTooltip({ visible: false, appType: null })}
          onGoToSearch={() => navigate(`${basePath}/college-search`)}
        />

        <div className="dashboard-header">
          <div className="dashboard-header__inner">
            <div className="dashboard-header__title-group">
              <div>
                <h1 className="dashboard-header__welcome">My Application</h1>
                <p className="dashboard-header__subtitle">Track your progress and complete your application</p>
              </div>
            </div>
            <div className="dashboard-header__actions">
                          <button className="header-user-chip">
                <span className="header-user-chip__avatar">{userData?.firstName?.[0]}{userData?.lastName?.[0]}</span>
                <span className="header-user-chip__name">{userData?.firstName} {userData?.lastName}</span>
                <span className="header-user-chip__caret">▾</span>
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-body">

          {/* ── Progress Banner ── */}
          <div className="dashboard-progress-banner">
            <ProgressRing percent={overallProgress} />
            <div className="dashboard-banner__content">
              <div className="dashboard-banner__chip">{completedSections} of {totalSections} Sections Complete</div>
              <h2 className="dashboard-banner__title">
                {overallProgress >= 100 ? 'Application Complete! Ready to Submit.'
                  : overallProgress >= 50 ? "Keep Going! You're Making Great Progress."
                  : "Let's Get Started on Your Application!"}
              </h2>
              <p className="dashboard-banner__desc">
                {overallProgress >= 100
                  ? 'All sections are complete. Review your application and submit.'
                  : 'Complete the remaining sections to submit your application.'}
              </p>
            </div>
            <div className="dashboard-banner__stats">
              <div className="dashboard-banner__stat">
                <div className="dashboard-banner__stat-icon dashboard-banner__stat-icon--blue"><span className="icon-clipboard"></span></div>
                <div>
                  <div className="dashboard-banner__stat-num dashboard-banner__stat-num--blue">{completedSections}</div>
                  <div className="dashboard-banner__stat-label">Completed</div>
                </div>
              </div>
              <div className="dashboard-banner__stat">
                <div className="dashboard-banner__stat-icon dashboard-banner__stat-icon--orange"><span className="icon-clock"></span></div>
                <div>
                  <div className="dashboard-banner__stat-num dashboard-banner__stat-num--orange">{remaining}</div>
                  <div className="dashboard-banner__stat-label">Remaining</div>
                </div>
              </div>
            </div>
            <button className="dashboard-banner__cta" onClick={() => nextSection && navigate(nextSection.path)}>
              Continue Application
              <span className="dashboard-banner__cta-arrow">→</span>
            </button>
          </div>

          {/* ════════════════════════════════════════
              MY COMMON APPLICATION CARD
          ════════════════════════════════════════ */}
          <div className="dashboard-card app-card" style={{ background: 'linear-gradient(135deg,#f0f9ff 0%,#e8f4fd 100%)', borderColor: 'rgba(8,145,178,0.12)' }}>

            {/* Card header */}
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-row">
                <h2 className="dashboard-card__title">My Common Application</h2>
                <span className="dashboard-badge">{completedSections}/{totalSections} sections complete</span>
              </div>
            </div>

            {/* Unlock hint banner */}
            {isUniversityAppLocked && isMasterAppLocked && (
              <div className="unlock-hint-banner">
                <span className="unlock-hint-banner__icon">
                  <InfoCircleIcon size={17} color="#d97706" />
                </span>
                <span className="unlock-hint-banner__text">
                  <strong>University &amp; Master Applications are locked.</strong> Go to{' '}
                  <button className="unlock-hint-banner__link" onClick={() => navigate(`${basePath}/college-search`)}>
                    College Search
                  </button>{' '}
                  and select a university to unlock the relevant application.
                </span>
              </div>
            )}

            {/* ── Row 1: University + Master locked cards ── */}
            <div className="app-locked-row">
              {lockedSections.map((section, i) => (
                <div
                  key={i}
                  className={`app-locked-card${section.locked ? ' app-locked-card--locked' : ''}`}
                  onClick={() => handleSectionClick(section)}
                >
                  {section.locked && (
                    <div className="section-lock-badge">
                      <LockIcon size={12} color="#64748b" strokeWidth={2.5} />
                    </div>
                  )}
                  <div className="app-locked-card__header">
                    <div style={{ paddingRight: section.locked ? 36 : 0 }}>
                      <h4 className={`app-locked-card__name${section.locked ? ' locked-text' : ''}`}>
                        {section.name}
                      </h4>
                      <p className="app-locked-card__desc">
                        {section.locked
                          ? `Select a ${section.lockedFor === 'university' ? "bachelor's" : "master's"} university in College Search to unlock`
                          : section.desc}
                      </p>
                    </div>
                    <span className={`app-pct-badge ${section.locked ? 'pct--locked' : getPctClass(section.progress)}`}>
                      {section.locked
                        ? <span className="pct-lock-svg"><LockIcon size={11} color="#94a3b8" strokeWidth={2.5} /></span>
                        : `${section.progress}%`}
                    </span>
                  </div>

                  {!section.locked && section.progress > 0 && section.progress < 100 && (
                    <div className="dashboard-progress-bar" style={{ marginBottom: 10 }}>
                      <div className="dashboard-progress-bar__fill bar--blue" style={{ width: `${section.progress}%` }} />
                    </div>
                  )}

                  <button
                    className={`dashboard-section-card__action${section.locked ? ' dashboard-section-card__action--locked' : section.progress >= 100 ? ' dashboard-section-card__action--done' : ''}`}
                    style={{ color: getActionColor(section) }}
                    onClick={e => { e.stopPropagation(); handleSectionClick(section); }}
                  >
                    {section.locked ? (
                      <span className="action-row">
                        <LockIcon size={12} color="#94a3b8" strokeWidth={2.5} />
                        <span>Unlock</span>
                        <ArrowRightIcon size={12} color="#94a3b8" />
                      </span>
                    ) : (
                      <span className="action-row">
                        <span>{getActionLabel(section)}</span>
                        <ArrowRightIcon size={12} color={getActionColor(section)} />
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* ── Row 2: Collapsible group card ── */}
            <div className={`app-group-card${groupOpen ? ' app-group-card--open' : ''}`}>

              {/* Summary row — click to expand/collapse */}
              <div className="app-group-card__summary" onClick={() => setGroupOpen(o => !o)}>
                <div className="app-group-card__left">

                  {/* Mini SVG ring */}
                  <div className="app-mini-ring" style={{ flexShrink: 0 }}>
                    <svg width="56" height="56" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                      <circle
                        cx="28" cy="28" r="22"
                        fill="none"
                        stroke={groupProgress >= 100 ? '#10b981' : '#0891b2'}
                        strokeWidth="5"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={`${2 * Math.PI * 22 * (1 - groupProgress / 100)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 28 28)"
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                      <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="700"
                        fill={groupProgress >= 100 ? '#10b981' : '#0891b2'}>
                        {groupProgress}%
                      </text>
                    </svg>
                  </div>

                  <div className="app-group-card__info">
                    <h3 className="app-group-card__title">Common Application Sections</h3>
                    <p className="app-group-card__sub">
                      {groupCompleted} of {commonSections.length} complete
                      {groupInProgress > 0 && <> &nbsp;·&nbsp; {groupInProgress} in progress</>}
                    </p>
                    {/* Section pills */}
                    <div className="app-section-pills">
                      {commonSections.map((s, i) => (
                        <span
                          key={i}
                          className={`app-pill ${s.progress >= 100 ? 'app-pill--done' : s.progress > 0 ? 'app-pill--progress' : 'app-pill--zero'}`}
                        >
                          {s.progress >= 100 && <CheckIcon size={10} color="#15803d" />}
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="app-group-card__right">
                  <span className={`app-pct-badge ${getPctClass(groupProgress)}`}>{groupProgress}%</span>
                  <span className={`app-chevron${groupOpen ? ' app-chevron--open' : ''}`}>
                    <ChevronDownIcon size={18} color="#64748b" />
                  </span>
                </div>
              </div>

              {/* Expandable sub-cards */}
              <div className={`app-group-card__body${groupOpen ? ' app-group-card__body--open' : ''}`}>
               <div className={`app-group-card__body${groupOpen ? ' app-group-card__body--open' : ''}`}>

  {/* COMPLETED group */}
  {commonSections.filter(s => s.progress >= 100).length > 0 && (
    <>
      <p className="section-group-label" style={{ padding: '14px 20px 6px' }}>Completed</p>
      <div className="section-group-list" style={{ margin: '0 20px', borderRadius: 12 }}>
        {commonSections.filter(s => s.progress >= 100).map((section, i) => (
          <div
            key={i}
            className="dashboard-section-card"
            onClick={() => handleSectionClick(section)}
          >
            <div className="dashboard-section-card__body">
              <p className="dashboard-section-card__name">{section.name}</p>
              <p className="dashboard-section-card__desc">{section.desc}</p>
              <div className="dashboard-section-card__bar-wrap">
                <div className="dashboard-progress-bar">
                  <div
                    className="dashboard-progress-bar__fill bar--success"
                    style={{ width: `${section.progress}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="dashboard-section-card__right">
              <span className="dashboard-section-card__pct pct--success">
                {section.progress}%
              </span>
              <span className="section-status-badge section-status-badge--complete">
                Complete
              </span>
              <button
                className="dashboard-section-card__action dashboard-section-card__action--done"
                onClick={e => { e.stopPropagation(); handleSectionClick(section); }}
              >
                Review &amp; Edit <ArrowRightIcon size={12} color="#15803d" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )}

  {/* IN PROGRESS group */}
  {commonSections.filter(s => s.progress < 100).length > 0 && (
    <>
      <p className="section-group-label" style={{ padding: '14px 20px 6px' }}>In Progress</p>
      <div className="section-group-list" style={{ margin: '0 20px 20px', borderRadius: 12 }}>
        {commonSections.filter(s => s.progress < 100).map((section, i) => {
          const isAlmostDone = section.progress >= 75;
          return (
            <div
              key={i}
              className="dashboard-section-card"
              onClick={() => handleSectionClick(section)}
            >
              <div className="dashboard-section-card__body">
                <p className="dashboard-section-card__name">{section.name}</p>
                <p className="dashboard-section-card__desc">{section.desc}</p>
                <div className="dashboard-section-card__bar-wrap">
                  <div className="dashboard-progress-bar">
                    <div
                      className={`dashboard-progress-bar__fill ${
                        isAlmostDone ? 'bar--warning' : 'bar--blue'
                      }`}
                      style={{ width: `${section.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="dashboard-section-card__right">
                <span className={`dashboard-section-card__pct ${
                  isAlmostDone ? 'pct--warning' : 'pct--progress'
                }`}>
                  {section.progress}%
                </span>
                <span className={`section-status-badge ${
                  isAlmostDone
                    ? 'section-status-badge--almost'
                    : 'section-status-badge--progress'
                }`}>
                  {isAlmostDone ? 'Almost Done' : 'In Progress'}
                </span>
                <button
                  className="dashboard-section-card__action"
                  onClick={e => { e.stopPropagation(); handleSectionClick(section); }}
                >
                  Continue <ArrowRightIcon size={12} color="#0891b2" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  )}

</div>
              </div>
            </div>
          </div>

          {/* ── My Colleges ── */}
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-row">
                <h2 className="dashboard-card__title">My Colleges</h2>
                <span className="dashboard-badge">{userColleges.length} colleges</span>
              </div>
            </div>
            {userColleges.length === 0 ? (
              <div className="dashboard-empty">
                <div className="dashboard-empty__icon"></div>
                <h3 className="dashboard-empty__title">No colleges added yet</h3>
                <p className="dashboard-empty__desc">Start by searching for colleges to add to your list.</p>
                <button className="dashboard-btn dashboard-btn--primary" onClick={() => navigate(`${basePath}/college-search`)}>Search Colleges</button>
              </div>
            ) : (
              <div className="dashboard-college-preview">
                {userColleges.slice(0, 3).map(college => (
                  <div key={college.collegeId} className="dashboard-college-preview__item" onClick={() => navigate(`${basePath}/colleges/${college.collegeId}`)}>
                    <h4 className="dashboard-college-preview__name">{college.name}</h4>
                    <p className="dashboard-college-preview__location">{college.city}, {college.state}</p>
                    <span className={`dashboard-status dashboard-status--${college.status || 'not-started'}`}>{college.status || 'Not Started'}</span>
                  </div>
                ))}
                {userColleges.length > 3 && (
                  <button className="dashboard-btn dashboard-btn--ghost" onClick={() => navigate(`${basePath}/colleges`)}>
                    View all {userColleges.length} colleges →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Quick Access ── */}
          <div className="dashboard-card">
            <div className="dashboard-card__header"><h2 className="dashboard-card__title">Quick Access</h2></div>
            <div className="dashboard-quick-grid">
              <div className={`dashboard-quick-card${isUniversityAppLocked ? ' dashboard-quick-card--locked' : ''}`}
                onClick={() => { if (isUniversityAppLocked) { handleLockedCardClick('university'); return; } navigate(`${basePath}/application/overview`); }}>
                <div className="dashboard-quick-card__content">
                  <h4 className="dashboard-quick-card__title">
                    University Application
                    {isUniversityAppLocked && <span className="quick-lock-icon"><LockIcon size={12} color="#94a3b8" strokeWidth={2.5} /></span>}
                  </h4>
                  <p className="dashboard-quick-card__desc">Complete your university application in easy steps</p>
                </div>
                <div className="dashboard-quick-card__arrow">→</div>
              </div>
              <div className={`dashboard-quick-card${isMasterAppLocked ? ' dashboard-quick-card--locked' : ''}`}
                onClick={() => { if (isMasterAppLocked) { handleLockedCardClick('master'); return; } navigate(`${basePath}/master-application`); }}>
                <div className="dashboard-quick-card__content">
                  <h4 className="dashboard-quick-card__title">
                    Master Application
                    {isMasterAppLocked && <span className="quick-lock-icon"><LockIcon size={12} color="#94a3b8" strokeWidth={2.5} /></span>}
                  </h4>
                  <p className="dashboard-quick-card__desc">Complete your registration form for university admission</p>
                </div>
                <div className="dashboard-quick-card__arrow">→</div>
              </div>
              <div className="dashboard-quick-card" onClick={() => navigate(`${basePath}/college-search`)}>
                <div className="dashboard-quick-card__content">
                  <h4 className="dashboard-quick-card__title">Explore Programs</h4>
                  <p className="dashboard-quick-card__desc">Browse detailed program information for partner universities</p>
                </div>
                <div className="dashboard-quick-card__arrow">→</div>
              </div>
              <div className="dashboard-quick-card" onClick={() => navigate(`${basePath}/college-search`)}>
                <div className="dashboard-quick-card__content">
                  <h4 className="dashboard-quick-card__title">View Course Details</h4>
                  <p className="dashboard-quick-card__desc">Click on any university to see available courses and programs</p>
                </div>
                <div className="dashboard-quick-card__arrow">→</div>
              </div>
            </div>
          </div>

          {/* ── Help & Support ── */}
          <div className="dashboard-card">
            <div className="dashboard-card__header"><h2 className="dashboard-card__title">Help &amp; Support</h2></div>
            <div className="dashboard-search-wrap">
              <input type="text" placeholder="Search FAQs" className="dashboard-search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <div className="dashboard-search__hint">Search takes you to the student solution center</div>
            </div>
            <div className="dashboard-faq">
              <h3 className="dashboard-faq__heading">Frequently Asked Questions</h3>
              <div className="dashboard-faq__list">
                {[
                  { question: "How can I add a college to My colleges?",               shortAnswer: "Select College search from the navigation menu...",           answer: "To add a college: Select College search, browse and click 'Add to My Colleges'." },
                  { question: "I already submitted, can I change some of my answers?", shortAnswer: "You can return at any time and change your answer...",         answer: "You can return at any time and change most answers before final submission." },
                  { question: "How many colleges can I add to My colleges list?",      shortAnswer: "You can add up to 20 colleges to your list...",                answer: "You can add up to 20 colleges to your My Colleges list." },
                  { question: "What is the Master Application?",                       shortAnswer: "A comprehensive registration form for university admission...", answer: "The Master Application collects all info for university admission including personal details, course selection, academic history, test scores and documents." },
                ]
                  .filter(f => !searchQuery || f.question.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((faq, i) => (
                    <div key={i} className="dashboard-faq__card">
                      <div className="dashboard-faq__body">
                        <h4 className="dashboard-faq__question">{faq.question}</h4>
                        <p className="dashboard-faq__answer">{faq.shortAnswer}</p>
                      </div>
                      <button className="dashboard-btn dashboard-btn--faq" onClick={() => alert(faq.answer)}>Read full answer</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading__spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const ApplicationWrapper = () => <Application onCourseSelect={handleCourseSelection} selectedCourseData={selectedCourseData} />;
  const OverviewWrapper    = () => (
    <Overview
      selectedCourseData={selectedCourseData}
      onStartApplication={() => navigate(`${basePath}/application/personal`)}
      onChangeCourse={() => { localStorage.removeItem('selectedCourseForApplication'); setSelectedCourseData(null); navigate(`${basePath}/college-search`); }}
    />
  );

  return (
    <>
      <DashboardLayout
        userData={userData}
        activeMainSection={activeMainSection}
        onSectionChange={handleSectionChange}
        userColleges={userColleges}
        onRefreshColleges={fetchUserColleges}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        <Routes>
          <Route path="/"                            element={<DashboardHome />} />
          <Route path="/application/overview"        element={<OverviewWrapper />} />
          <Route path="/application/*"               element={<ApplicationWrapper />} />
          <Route path="/master-application/*"        element={<MasterApplicationWrapper />} />
          <Route path="/colleges"                    element={<CollegesSection />} />
          <Route path="/profile/*"                   element={<ProfileForm />} />
          <Route path="/family/*"                    element={<FamilySection onComplete={handleFamilyComplete} />} />
          <Route path="/education/*"                 element={<EducationForm />} />
          <Route path="/testing/*"                   element={<TestingForm />} />
          <Route path="/activities"                  element={<ActivitiesSection />} />
          <Route path="/activities/responsibilities" element={<ResponsibilitiesSection />} />
          <Route path="/writing/*"                   element={<WritingSection />} />
          <Route path="/college-search"              element={<CollegeSearch onCollegeUpdate={fetchUserColleges} />} />
          <Route path="/courses/:universityId"       element={<Courses onCourseSelect={handleCourseSelection} />} />
        </Routes>
      </DashboardLayout>
      <ChatWidget />
    </>
  );
};

export default Dashboard;