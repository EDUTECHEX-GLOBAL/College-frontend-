import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
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
import ApplicationProgressPage from './ApplicationProgressPage';


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
        <button className="lock-modal__close" onClick={onClose} aria-label="Close">×</button>
        <div className="lock-modal__icon"></div>
        <h3 className="lock-modal__title">
          {isUniversity ? 'University Application Locked' : 'Master Application Locked'}
        </h3>
        <p className="lock-modal__desc">
          To unlock the{' '}
          <strong>{isUniversity ? 'University Application' : 'Master Application'}</strong>,
          go to <strong>College Search</strong>, select a{' '}
          {isUniversity ? "bachelor's" : "master's"} university, and choose a program.
        </p>
        <div className="lock-modal__actions">
          <button
            className="lock-modal__btn lock-modal__btn--primary"
            onClick={() => { onClose(); onGoToSearch(); }}
          >
            Go to College Search
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Circular Progress Ring ── */
const ProgressRing = ({ percent = 0, size = 80 }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#0e7490" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#ringGrad)" strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x={size / 2} y={size / 2 + 5}
          textAnchor="middle" fontSize={size * 0.2}
          fontWeight="700" fill="#0f172a"
        >
          {Math.round(percent)}%
        </text>
      </svg>
    </div>
  );
};

const getPctClass = (progress) => {
  if (progress >= 100) return 'pct--success';
  if (progress >= 50) return 'pct--progress';
  if (progress > 0) return 'pct--warning';
  return 'pct--zero';
};

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainSection, setActiveMainSection] = useState('dashboard');
  const [userColleges, setUserColleges] = useState([]);
  const [familyCompleted, setFamilyCompleted] = useState(false);
  const [applicationProgress, setApplicationProgress] = useState(0);
  const [selectedCourseData, setSelectedCourseData] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [masterAppProgress, setMasterAppProgress] = useState(0);
  const [unlockedAppType, setUnlockedAppType] = useState(getUnlockedAppType);
  const [lockTooltip, setLockTooltip] = useState({ visible: false, appType: null });

  const isFirstYear = location.pathname.includes('/firstyear/');
  const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';

  const refreshUnlockState = useCallback(() => {
    setUnlockedAppType(getUnlockedAppType());
  }, []);

  const calculateLocalApplicationProgress = (appData) => {
    if (!appData) return 0;
    let completedFields = 0, totalFields = 0;
    const isFieldFilled = (v) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.trim() !== '';
      if (typeof v === 'boolean') return true;
      if (typeof v === 'number') return true;
      if (typeof v === 'object') {
        if (v.grade9 || v.grade10 || v.grade11 || v.grade12 || v.satTotal || v.act || v.toefl || v.ielts) return true;
        return Object.keys(v).length > 0;
      }
      return !!v;
    };
    const countFields = (fields) =>
      fields.forEach(f => { totalFields++; if (isFieldFilled(appData[f])) completedFields++; });
    countFields(['firstName', 'lastName', 'dob', 'gender', 'nationality', 'countryOfResidence', 'email', 'mobile', 'passportFileName', 'photographFileName']);
    countFields(['currentAddress', 'city', 'state', 'country', 'postalCode', 'nationalIdFileName']);
    countFields(['eqheDate', 'eqheCity', 'eqheCountry', 'eqheOriginalTitle', 'hasAnotherEQHE', 'anotherEqheDate', 'anotherEqheCity', 'anotherEqheCountry', 'anotherEqheOriginalTitle', 'eqheCertificateFileName']);
    totalFields++; if (isFieldFilled(appData['hasSpecialNeeds'])) completedFields++;
    if (appData.hasSpecialNeeds === 'yes') { totalFields++; if (isFieldFilled(appData.specialNeedsDescription)) completedFields++; }
    countFields(['qualificationLevel', 'institutionName', 'boardUniversity', 'countryOfStudy', 'startYear', 'endYear', 'resultStatus', 'gradingSystem', 'transcriptsFileName', 'degreeCertificateFileName']);
    totalFields++; if (isFieldFilled(appData['scores'])) completedFields++;
    countFields(['sopFileName', 'lor1FileName', 'lor2FileName', 'portfolioFileName', 'researchProposalFileName']);
    return Math.round((completedFields / totalFields) * 100);
  };

  const calculateMasterApplicationProgress = (masterData) => {
    if (!masterData) return 0;
    let totalSections = 0, completedSections = 0;
    const sections = ['personal', 'contact', 'course', 'academic', 'tests', 'documents', 'declaration'];
    sections.forEach(section => {
      totalSections++;
      const sd = masterData[section];
      if (sd && sd._isValid === true) completedSections++;
      else if (section === 'tests') completedSections++;
      else if (section === 'documents') completedSections++;
      else if (sd && Object.keys(sd).length > 0 && sd._isValid !== false) {
        if (Object.keys(sd).some(k => k !== '_isValid' && sd[k])) completedSections += 0.5;
      }
    });
    return Math.round((completedSections / totalSections) * 100);
  };

const refreshUserData = useCallback(async () => {
  try {
  const token = localStorage.getItem('token'); // ✅ keep for null check
if (!token) { navigate('/sign-in'); return; }
const response = await axiosInstance.get('/api/students/profile/detailed');
      if (response.data.success && response.data.account) {
        const user = response.data.account;
        const gusApplicationData = localStorage.getItem('gusApplicationData');
        let appProgress = 0;
        if (gusApplicationData) {
          try { appProgress = calculateLocalApplicationProgress(JSON.parse(gusApplicationData)); } catch (e) {}
        }
        let masterProgress = 0;
        const masterAppData = localStorage.getItem('masterApplicationData');
        if (masterAppData) {
          try {
            masterProgress = calculateMasterApplicationProgress(JSON.parse(masterAppData));
            setMasterAppProgress(masterProgress);
          } catch (e) {}
        }
        const selectedCourse = localStorage.getItem('selectedCourseForApplication');
        if (selectedCourse) {
          try { setSelectedCourseData(JSON.parse(selectedCourse)); } catch (e) {}
        }
        setUserData({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          studentId: user._id ? `CAID ${user._id.toString().slice(-8).toUpperCase()}` : 'CAID 48555228',
          firstName: user.firstName,
          lastName: user.lastName,
          profileProgress: response.data.profileProgress || 0,
          educationProgress: user.applicationProgress?.education || 0,
          testingProgress: user.applicationProgress?.testing || 0,
          writingProgress: user.applicationProgress?.writing || 0,
          activitiesProgress: user.applicationProgress?.activities || 0,
          testingData: user.testingData || { testsToReport: [] },
          applicationProgress: { ...user.applicationProgress, application: appProgress, masterApplication: masterProgress },
          ...user
        });
        setApplicationProgress(appProgress);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, []);

  const fetchUserColleges = useCallback(async () => {
  try {
    const token = localStorage.getItem('token'); // ✅ keep for null check
if (!token) return;
const response = await axiosInstance.get('/api/colleges');
      if (response.data.success) setUserColleges(response.data.colleges);
    } catch (error) {
      console.error('Error fetching user colleges:', error);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    await refreshUserData();
    await fetchUserColleges();
  }, [refreshUserData, fetchUserColleges]);

  const handleFamilyComplete = useCallback((isComplete) => {
    setFamilyCompleted(isComplete);
    localStorage.setItem('familySectionComplete', isComplete ? 'true' : 'false');
    if (userData) {
      setUserData(prev => ({
        ...prev,
        applicationProgress: {
          ...prev.applicationProgress,
          family: isComplete ? 100 : (prev.applicationProgress?.family || 0)
        }
      }));
    }
  }, [userData]);

  const handleCourseSelection = (courseData) => {
    const level = (courseData?.programDetails?.level || '').toLowerCase();
    const isMaster = level === 'master' || localStorage.getItem('selectedMasterCourseForApplication') !== null;
    if (isMaster) {
      localStorage.setItem('selectedMasterCourseForApplication', JSON.stringify(courseData));
      localStorage.setItem('unlockedApplicationType', 'master');
      localStorage.removeItem('selectedCourseForApplication');
      setUnlockedAppType('master');
      navigate(`${basePath}/master-application/overview`, {
        state: { fromCoursesPage: true, courseData, isMasterApplication: true }
      });
    } else {
      setSelectedCourseData(courseData);
      localStorage.setItem('selectedCourseForApplication', JSON.stringify(courseData));
      localStorage.setItem('unlockedApplicationType', 'bachelor');
      setUnlockedAppType('bachelor');
      navigate(`${basePath}/application/overview`, { state: { fromCoursesPage: true, courseData } });
    }
  };

  const handleMasterApplicationUpdate = useCallback(() => {
    const masterAppData = localStorage.getItem('masterApplicationData');
    if (masterAppData) {
      try {
        const masterData = JSON.parse(masterAppData);
        const progress = calculateMasterApplicationProgress(masterData);
        setMasterAppProgress(progress);
        if (userData) {
          setUserData(prev => ({
            ...prev,
            applicationProgress: { ...prev.applicationProgress, masterApplication: progress }
          }));
        }
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
            setUserData(prev => ({
              ...prev,
              applicationProgress: { ...prev.applicationProgress, application: progress }
            }));
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
const response = await axiosInstance.get('/api/students/profile/detailed');
        if (response.data.success && response.data.account) {
          const user = response.data.account;
          const storedFamilyComplete = localStorage.getItem('familySectionComplete') === 'true';
          setFamilyCompleted(storedFamilyComplete);
          const gusApplicationData = localStorage.getItem('gusApplicationData');
          let appProgress = 0;
          if (gusApplicationData) {
            try {
              appProgress = calculateLocalApplicationProgress(JSON.parse(gusApplicationData));
              setApplicationProgress(appProgress);
            } catch (e) {}
          }
          const masterAppData = localStorage.getItem('masterApplicationData');
          let masterProgress = 0;
          if (masterAppData) {
            try {
              masterProgress = calculateMasterApplicationProgress(JSON.parse(masterAppData));
              setMasterAppProgress(masterProgress);
            } catch (e) {}
          }
          const selectedCourse = localStorage.getItem('selectedCourseForApplication');
          if (selectedCourse) {
            try { setSelectedCourseData(JSON.parse(selectedCourse)); } catch (e) {}
          }
          setUserData({
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            studentId: user._id ? `CAID ${user._id.toString().slice(-8).toUpperCase()}` : 'CAID 48555228',
            firstName: user.firstName,
            lastName: user.lastName,
            profileProgress: response.data.profileProgress || 0,
            educationProgress: user.applicationProgress?.education || 0,
            testingProgress: user.applicationProgress?.testing || 0,
            writingProgress: user.applicationProgress?.writing || 0,
            activitiesProgress: user.applicationProgress?.activities || 0,
            applicationProgress: {
              ...user.applicationProgress,
              application: appProgress,
              family: storedFamilyComplete ? 100 : (user.applicationProgress?.family || 0),
              masterApplication: masterProgress
            },
            testingData: user.testingData || { testsToReport: [] },
            ...user
          });
        }
      } catch (error) {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData && storedUserData !== 'undefined') {
          try {
            const parsedData = JSON.parse(storedUserData);
            setUserData(parsedData);
            setFamilyCompleted(localStorage.getItem('familySectionComplete') === 'true');
            const gusApplicationData = localStorage.getItem('gusApplicationData');
            if (gusApplicationData) {
              try { setApplicationProgress(calculateLocalApplicationProgress(JSON.parse(gusApplicationData))); } catch (e) {}
            }
            const masterAppData = localStorage.getItem('masterApplicationData');
            if (masterAppData) {
              try { setMasterAppProgress(calculateMasterApplicationProgress(JSON.parse(masterAppData))); } catch (e) {}
            }
          } catch (e) {}
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
    fetchUserColleges();
  }, [navigate, fetchUserColleges]);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard') || path.includes('/colleges') || path.includes('/college-search')) {
      refreshAllData();
    }
  }, [location.pathname, refreshAllData]);

  const handleSectionChange = (section) => {
    const routes = {
      dashboard: `${basePath}`,
      application: `${basePath}/application`,
      'master-application': `${basePath}/master-application`,
      colleges: `${basePath}/colleges`,
      education: `${basePath}/education/current-school`,
      testing: `${basePath}/testing/tests-taken`,
      writing: `${basePath}/writing/personal-essay`,
      activities: `${basePath}/activities`,
      personal: `${basePath}/profile/personal`,
      family: `${basePath}/family`,
      'college-search': `${basePath}/college-search`,
    };
    if (routes[section]) { navigate(routes[section]); return; }
    navigate(basePath);
  };

  const completedSections = userData?.applicationProgress
    ? Object.values(userData.applicationProgress).filter(p => p >= 100).length
    : 0;
  const totalSections = userData?.applicationProgress
    ? Object.keys(userData.applicationProgress).length
    : 0;
  const overallProgress = userData?.applicationProgress
    ? Math.round(
        Object.values(userData.applicationProgress).reduce((s, p) => s + p, 0) /
        Math.max(1, Object.values(userData.applicationProgress).length)
      )
    : 0;

  const isUniversityAppLocked = unlockedAppType !== 'bachelor';
  const isMasterAppLocked = unlockedAppType !== 'master';
  const handleLockedCardClick = (appType) => setLockTooltip({ visible: true, appType });

  const profileProgress = userData?.profileProgress || 0;

  /* ── Build applicationSections array (shared between dashboard & detail page) ── */
  const applicationSections = [
    {
      name: 'Profile',
      progress: profileProgress,
      path: `${basePath}/profile/personal`,
      locked: false,
      desc: 'Personal information and background'
    },
    {
      name: 'Master Application',
      progress: masterAppProgress,
      path: `${basePath}/master-application`,
      locked: isMasterAppLocked,
      lockedFor: 'master',
      desc: 'Complete your university registration form'
    },
    {
      name: 'University Application',
      progress: applicationProgress,
      path: `${basePath}/application/overview`,
      locked: isUniversityAppLocked,
      lockedFor: 'university',
      desc: 'Apply to universities in simple steps'
    },
    {
      name: 'Family',
      progress: familyCompleted ? 100 : (userData?.applicationProgress?.family || 0),
      path: `${basePath}/family`,
      locked: false,
      desc: 'Family details and information'
    },
    {
      name: 'Education',
      progress: userData?.applicationProgress?.education || 0,
      path: `${basePath}/education/current-school`,
      locked: false,
      desc: 'Academic history and achievements'
    },
    {
      name: 'Testing',
      progress: userData?.applicationProgress?.testing || 0,
      path: `${basePath}/testing/tests-taken`,
      locked: false,
      desc: 'Standardized test scores'
    },
    {
      name: 'Activities',
      progress: userData?.applicationProgress?.activities || 0,
      path: `${basePath}/activities`,
      locked: false,
      desc: 'Extracurricular activities and honors'
    },
    {
      name: 'Writing',
      progress: userData?.applicationProgress?.writing || 0,
      path: `${basePath}/writing/personal-essay`,
      locked: false,
      desc: 'Personal statements and essays'
    },
  ];

  const handleSectionClick = (section) => {
    if (section.locked) { handleLockedCardClick(section.lockedFor); return; }
    if (section?.path) navigate(section.path);
  };

  /* ══════════════════════════════════════════════════════════
     DASHBOARD HOME — Application Progress shown as SUMMARY BOX only.
     Clicking navigates to /applicationprogress detail page.
  ══════════════════════════════════════════════════════════ */
  const DashboardHome = () => {
    const completedCount = applicationSections.filter(s => !s.locked && s.progress >= 100).length;
    const inProgressCount = applicationSections.filter(s => !s.locked && s.progress > 0 && s.progress < 100).length;
    const lockedCount = applicationSections.filter(s => s.locked).length;
    const notStartedCount = applicationSections.filter(s => !s.locked && s.progress === 0).length;

    const getPillClass = (s) => {
      if (s.locked) return 'ap-pill--lock';
      if (s.progress >= 100) return 'ap-pill--done';
      if (s.progress > 0) return 'ap-pill--prog';
      return 'ap-pill--zero';
    };
 

    return (
      <>
        <LockTooltip
          visible={lockTooltip.visible}
          appType={lockTooltip.appType}
          onClose={() => setLockTooltip({ visible: false, appType: null })}
          onGoToSearch={() => navigate(`${basePath}/college-search`)}
        />

        {/* ── Top Header ── */}
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
                <span className="header-user-chip__avatar">
                  {userData?.firstName?.[0]}{userData?.lastName?.[0]}
                </span>
                <span className="header-user-chip__name">
                  {userData?.firstName} {userData?.lastName}
                </span>
                <span className="header-user-chip__caret">▼</span>
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-body">

          {/* ── Overall Progress Banner ── */}
          <div className="dashboard-progress-banner-new">
            <ProgressRing percent={overallProgress} size={80} />
            <div className="dashboard-banner__content-new">
              <div className="dashboard-banner__chip">
                {completedSections} of {totalSections} Sections Complete
              </div>
              <h2 className="dashboard-banner__title-new">
                {overallProgress >= 100
                  ? 'Application Complete! Ready to Submit.'
                  : overallProgress >= 50
                  ? "Keep Going! You're Making Great Progress."
                  : "Let's Get Started on Your Application!"}
              </h2>
              <p className="dashboard-banner__desc-new">
                {overallProgress >= 100
                  ? 'All sections are complete. Review your application and submit.'
                  : 'Complete the remaining sections to submit your application.'}
              </p>
            </div>
          </div>

         <div className="dashboard-three-cards-row">

  {/* ── CARD 1: My Application ── */}
  <div className="dash-info-card dash-info-card--teal">
    <div className="dash-info-card__topbar dash-info-card__topbar--teal"></div>
    <div className="dash-info-card__body">
      <div className="dash-info-card__label">MY APPLICATION</div>
      <div className="dash-info-card__inner">
        <div className="dash-info-card__icon dash-info-card__icon--teal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
        <div>
          <div className="dash-info-card__value">{overallProgress}%</div>
          <div className="dash-info-card__sub">{completedSections} of {totalSections} sections complete</div>
        </div>
      </div>
      <div className="dash-info-card__start-box">
        <div className="dash-info-card__start-title">Start Your Application Here</div>
        <div className="dash-info-card__start-desc">Pick up where you left off or begin a new section.</div>
        <button
          className="dash-info-card__start-btn"
          onClick={() => navigate(`${basePath}/applicationprogress`)}
        >
          Continue Application →
        </button>
      </div>
    </div>
  </div>

  {/* ── CARD 2: My Colleges ── */}
  <div className="dash-info-card">
    <div className="dash-info-card__topbar dash-info-card__topbar--blue"></div>
    <div className="dash-info-card__body">
      <div className="dash-info-card__label">MY COLLEGES</div>
      <div className="dash-info-card__inner">
        <div className="dash-info-card__icon dash-info-card__icon--blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div>
          <div className="dash-info-card__value">{userColleges.length}</div>
          <div className="dash-info-card__sub">colleges added</div>
        </div>
      </div>
      {userColleges.length === 0 ? (
        <div className="dash-info-card__empty">
          <p>No colleges added yet</p>
          <button
            className="dash-info-card__start-btn"
            onClick={() => navigate(`${basePath}/college-search`)}
          >
            Search Colleges →
          </button>
        </div>
      ) : (
        <div className="dash-info-card__college-list">
          {userColleges.slice(0, 3).map(college => (
            <div
              key={college.collegeId}
              className="dash-info-card__college-item"
              onClick={() => navigate(`${basePath}/colleges/${college.collegeId}`)}
            >
              <div>
                <div className="dash-info-card__college-name">{college.name}</div>
                <div className="dash-info-card__college-loc">{college.city}, {college.state}</div>
              </div>
              <span className={`college-status college-status--${college.status || 'researching'}`}>
                {college.status || 'Researching'}
              </span>
            </div>
          ))}
          {userColleges.length > 3 && (
            <button className="view-all-btn" onClick={() => navigate(`${basePath}/colleges`)}>
              View all {userColleges.length} colleges →
            </button>
          )}
        </div>
      )}
    </div>
  </div>

  {/* ── CARD 3: Quick Access ── */}
  <div className="dash-info-card">
    <div className="dash-info-card__topbar dash-info-card__topbar--purple"></div>
    <div className="dash-info-card__body">
      <div className="dash-info-card__label">QUICK ACCESS</div>
      <div className="dash-info-card__inner">
        <div className="dash-info-card__icon dash-info-card__icon--purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
        </div>
        <div>
          <div className="dash-info-card__value" style={{fontSize:'16px', color:'var(--purple)'}}>Shortcuts</div>
          <div className="dash-info-card__sub">quick links</div>
        </div>
      </div>
      <div className="dash-info-card__qa-list">
        <div
          className="dash-info-card__qa-item"
          onClick={() => navigate(`${basePath}/college-search`)}
        >
          <div className="dash-info-card__qa-icon dash-info-card__qa-icon--teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div>
            <div className="dash-info-card__qa-title">Explore Programs</div>
            <div className="dash-info-card__qa-sub">Browse partner universities</div>
          </div>
        </div>
        <div
          className="dash-info-card__qa-item"
          onClick={() => navigate(`${basePath}/colleges`)}
        >
          <div className="dash-info-card__qa-icon dash-info-card__qa-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <div>
            <div className="dash-info-card__qa-title">View all colleges</div>
            <div className="dash-info-card__qa-sub">Manage college applications</div>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>

          {/* ── Help & Support ── */}
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <h2 className="dashboard-card__title">Help &amp; Support</h2>
            </div>
            <div className="help-search">
              <div className="help-search-wrapper">
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  className="help-search-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="faq-list">
              {[
                {
                  question: "How can I add a college to My colleges?",
                  answer: "Select College search from the navigation menu, browse and click 'Add to My Colleges'."
                },
                {
                  question: "I already submitted, can I change some of my answers?",
                  answer: "You can return at any time and change most answers before final submission."
                },
                {
                  question: "How many colleges can I add to My colleges list?",
                  answer: "You can add up to 20 colleges to your My Colleges list."
                },
                {
                  question: "What is the Master Application?",
                  answer: "The Master Application collects all info for university admission including personal details, course selection, academic history, test scores and documents."
                },
              ]
                .filter(faq =>
                  !searchQuery ||
                  faq.question.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((faq, i) => (
                  <div key={i} className="faq-item">
                    <div className="faq-question">{faq.question}</div>
                    <div className="faq-answer">{faq.answer}</div>
                  </div>
                ))}
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

 const ApplicationWrapper = () => (
    <Application
        onCourseSelect={handleCourseSelection}
        selectedCourseData={selectedCourseData}
        studentId={userData?._id || ''}  // ✅ ADD THIS LINE
    />
);

  const OverviewWrapper = () => (
    <Overview
      selectedCourseData={selectedCourseData}
      onStartApplication={() => navigate(`${basePath}/application/personal`)}
      onChangeCourse={() => {
        localStorage.removeItem('selectedCourseForApplication');
        setSelectedCourseData(null);
        navigate(`${basePath}/college-search`);
      }}
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
          <Route path="/" element={<DashboardHome />} />

          {/* ── NEW: Application Progress detail page ── */}
          <Route
            path="/applicationprogress"
            element={
              <ApplicationProgressPage
                applicationSections={applicationSections}
                overallProgress={overallProgress}
                completedSections={completedSections}
                totalSections={totalSections}
                onSectionClick={handleSectionClick}
                onLockedCardClick={handleLockedCardClick}
                lockTooltip={lockTooltip}
                setLockTooltip={setLockTooltip}
                basePath={basePath}
                userData={userData}
              />
            }
          />

          <Route path="/application/overview" element={<OverviewWrapper />} />
          <Route path="/application/*" element={<ApplicationWrapper />} />
          <Route
            path="/master-application/*"
            element={<Master onUpdate={handleMasterApplicationUpdate} />}
          />
          <Route path="/colleges" element={<CollegesSection />} />
          <Route path="/profile/*" element={<ProfileForm />} />
          <Route
            path="/family/*"
            element={<FamilySection onComplete={handleFamilyComplete} />}
          />
          <Route path="/education/*" element={<EducationForm />} />
          <Route path="/testing/*" element={<TestingForm />} />
          <Route path="/activities" element={<ActivitiesSection />} />
          <Route path="/activities/responsibilities" element={<ResponsibilitiesSection />} />
          <Route path="/writing/*" element={<WritingSection />} />
          <Route
            path="/college-search"
            element={<CollegeSearch onCollegeUpdate={fetchUserColleges} />}
          />
          <Route
            path="/courses/:universityId"
            element={<Courses onCourseSelect={handleCourseSelection} />}
          />
        </Routes>
      </DashboardLayout>
      <ChatWidget />
    </>
  );
};

/* ══════════════════════════════════════════════════════════
   COLLEGES SECTION (unchanged)
══════════════════════════════════════════════════════════ */
const CollegesSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstYear = location.pathname.includes('/firstyear/');
  const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';
  const [userColleges, setUserColleges] = useState([]);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
      const token = localStorage.getItem('token');
if (!token) return;
const response = await axiosInstance.get('/api/colleges');
        if (response.data.success) setUserColleges(response.data.colleges);
      } catch (error) {
        console.error('Error fetching colleges:', error);
      }
    };
    fetchColleges();
  }, []);

  return (
    <>
      <div className="dashboard-header">
        <div className="dashboard-header__inner">
          <div className="dashboard-header__title-group">
            <div>
              <h1 className="dashboard-header__welcome">My Colleges</h1>
              <p className="dashboard-header__subtitle">
                Manage your college applications and track progress
              </p>
            </div>
          </div>
          <div className="dashboard-header__actions">
            <button className="header-user-chip">
              <span className="header-user-chip__avatar">AA</span>
              <span className="header-user-chip__name">Account</span>
              <span className="header-user-chip__caret">▼</span>
            </button>
          </div>
        </div>
      </div>
      <div className="dashboard-body">
        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h2 className="dashboard-card__title">Your College List</h2>
            <span className="dashboard-badge">{userColleges.length} colleges</span>
          </div>
          {userColleges.length === 0 ? (
            <div className="dashboard-empty-state">
              <p>No colleges added yet</p>
              <button
                className="dashboard-btn dashboard-btn--primary"
                onClick={() => navigate(`${basePath}/college-search`)}
              >
                Search Colleges
              </button>
            </div>
          ) : (
            <div className="my-colleges-list">
              {userColleges.map(college => (
                <div
                  key={college.collegeId}
                  className="my-college-item"
                  onClick={() => navigate(`${basePath}/colleges/${college.collegeId}`)}
                >
                  <div className="my-college-item__info">
                    <h4 className="my-college-item__name">{college.name}</h4>
                    <p className="my-college-item__location">
                      {college.city}, {college.state} - USA
                    </p>
                  </div>
                  <button className="view-details-btn">View Details</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;