// src/components/Dashboard.js — Redesigned to match reference UI
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
import CollegeDetails from "./CollegeDetails";
import CollegeSubsection from "./CollegeSubsection";
import Documents from './mycollege-sections/Documents';
import General from './mycollege-sections/General';
import Academics from './mycollege-sections/Academics';
import HighSchoolCurriculum from './mycollege-sections/HighSchoolCurriculum';
import Activities from './mycollege-sections/Activities';
import FirstContacts from './mycollege-sections/FirstContacts';
import FirstFamily from './mycollege-sections/FirstFamily';
import FirstResidency from './mycollege-sections/FirstResidency';
import InternationalStudent from './mycollege-sections/InternationalStudent';
import Review from './mycollege-sections/FirstReview';
import WritingSection from './writing-sections/WritingSection';
import FamilySection from './family-sections/FamilySection';
import ChatWidget from './Chatbot/ChatWidget';
import Courses from './Courses';
import Application from './Application/Application';
import Overview from './Application/Overview';

const API_URL = process.env.REACT_APP_API_BASE_URL;

/* ── Circular Progress Ring ── */
const ProgressRing = ({ percent = 0 }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="dashboard-ring">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#0e7490" />
          </linearGradient>
        </defs>
        <circle className="dashboard-ring__bg" cx="60" cy="60" r={radius} />
        <circle
          className="dashboard-ring__fill"
          cx="60" cy="60" r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke="url(#ringGrad)"
        />
      </svg>
      <div className="dashboard-ring__label">
        <span className="dashboard-ring__pct">{Math.round(percent)}%</span>
        <span className="dashboard-ring__sub">Completed</span>
      </div>
    </div>
  );
};

/* ── Section icon renderer - removed icons ── */
const SectionIcon = ({ type }) => {
  const colorMap = {
    university: 'section-icon--university',
    profile:    'section-icon--profile',
    family:     'section-icon--family',
    education:  'section-icon--education',
    testing:    'section-icon--testing',
    activities: 'section-icon--activities',
    writing:    'section-icon--writing',
  };
  return (
    <div className={`dashboard-section-card__icon ${colorMap[type] || ''}`}>
    </div>
  );
};

/* ── Get bar color class based on progress ── */
const getBarColor = (progress) => {
  if (progress >= 100) return 'bar--success';
  if (progress >= 50)  return 'bar--blue';
  if (progress > 0)    return 'bar--orange';
  return 'bar--gray';
};

/* ── Get percent badge class ── */
const getPctClass = (progress) => {
  if (progress >= 100) return 'pct--success';
  if (progress > 0)    return 'pct--progress';
  return 'pct--zero';
};

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

  const isFirstYear = location.pathname.includes('/firstyear/');
  const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';

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
        if (gusApplicationData) {
          try { const appData = JSON.parse(gusApplicationData); appProgress = calculateLocalApplicationProgress(appData); } catch (e) {}
        }
        const selectedCourse = localStorage.getItem('selectedCourseForApplication');
        if (selectedCourse) {
          try { setSelectedCourseData(JSON.parse(selectedCourse)); } catch (e) {}
        }
        const formattedUserData = {
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
          applicationProgress: { ...user.applicationProgress, application: appProgress },
          ...user
        };
        setUserData(formattedUserData);
        setApplicationProgress(appProgress);
        localStorage.setItem('userData', JSON.stringify(formattedUserData));
      }
    } catch (error) { console.error('Error refreshing user data:', error); }
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
    setSelectedCourseData(courseData);
    localStorage.setItem('selectedCourseForApplication', JSON.stringify(courseData));
    navigate(`${basePath}/application/overview`, { state: { fromCoursesPage: true, courseData } });
  };

  useEffect(() => {
    const handleApplicationUpdate = () => {
      const gusApplicationData = localStorage.getItem('gusApplicationData');
      if (gusApplicationData) {
        try {
          const appData = JSON.parse(gusApplicationData);
          const progress = calculateLocalApplicationProgress(appData);
          setApplicationProgress(progress);
          if (userData) {
            setUserData(prev => ({ ...prev, applicationProgress: { ...prev.applicationProgress, application: progress } }));
            localStorage.setItem('userData', JSON.stringify({ ...userData, applicationProgress: { ...userData.applicationProgress, application: progress } }));
          }
        } catch (error) {}
      }
    };
    window.addEventListener('applicationUpdated', handleApplicationUpdate);
    return () => window.removeEventListener('applicationUpdated', handleApplicationUpdate);
  }, [userData]);

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
          if (gusApplicationData) {
            try { const appData = JSON.parse(gusApplicationData); appProgress = calculateLocalApplicationProgress(appData); setApplicationProgress(appProgress); } catch (e) {}
          }
          const selectedCourse = localStorage.getItem('selectedCourseForApplication');
          if (selectedCourse) { try { setSelectedCourseData(JSON.parse(selectedCourse)); } catch (e) {} }
          const formattedUserData = {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            studentId: user._id ? `CAID ${user._id.toString().slice(-8).toUpperCase()}` : 'CAID 48555228',
            firstName: user.firstName, lastName: user.lastName,
            profileProgress: response.data.profileProgress || 0,
            educationProgress: user.applicationProgress?.education || 0,
            testingProgress: user.applicationProgress?.testing || 0,
            writingProgress: user.applicationProgress?.writing || 0,
            activitiesProgress: user.applicationProgress?.activities || 0,
            applicationProgress: { ...user.applicationProgress, application: appProgress, family: storedFamilyComplete ? 100 : (user.applicationProgress?.family || 0) },
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
            if (gusApplicationData) {
              try { const appData = JSON.parse(gusApplicationData); setApplicationProgress(calculateLocalApplicationProgress(appData)); } catch (e) {}
            }
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
    const h = () => fetchUserColleges();
    window.addEventListener('collegesUpdated', h);
    return () => window.removeEventListener('collegesUpdated', h);
  }, [fetchUserColleges]);

  useEffect(() => {
    const h = (e) => { if (e.detail?.section === 'family') handleFamilyComplete(e.detail.isComplete); };
    window.addEventListener('familySectionComplete', h);
    return () => window.removeEventListener('familySectionComplete', h);
  }, [handleFamilyComplete]);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/profile'))                                        setActiveMainSection('profile');
    else if (path.includes('/colleges') && !path.includes('/education/colleges')) setActiveMainSection('colleges');
    else if (path.includes('/education'))   setActiveMainSection('education');
    else if (path.includes('/testing'))     setActiveMainSection('testing');
    else if (path.includes('/writing'))     setActiveMainSection('writing');
    else if (path.includes('/activities'))  setActiveMainSection('activities');
    else if (path.includes('/college-search')) setActiveMainSection('college-search');
    else if (path.includes('/family'))      setActiveMainSection('family');
    else if (path.includes('/courses'))     setActiveMainSection('courses');
    else if (path.includes('/application')) setActiveMainSection('application');
    else                                    setActiveMainSection('dashboard');
  }, [location.pathname]);

  const handleSectionChange = (section) => {
    const routes = {
      dashboard: `${basePath}`, application: `${basePath}/application`,
      colleges: `${basePath}/colleges`, education: `${basePath}/education/current-school`,
      testing: `${basePath}/testing/tests-taken`, writing: `${basePath}/writing/personal-essay`,
      activities: `${basePath}/activities`, personal: `${basePath}/profile/personal`,
      contact: `${basePath}/profile/contact`, address: `${basePath}/profile/address`,
      demographics: `${basePath}/profile/demographics`, language: `${basePath}/profile/language`,
      geography: `${basePath}/profile/geography`, family: `${basePath}/family`,
      courses: `${basePath}/college-search`,
    };
    if (routes[section]) { navigate(routes[section]); return; }
    if (section.startsWith('college-')) {
      const parts = section.split('-');
      navigate(`${basePath}/colleges/${parts[1]}/${parts.slice(2).join('-')}`);
    } else { navigate(basePath); }
  };

  /* Compute summary numbers */
  const completedSections = userData?.applicationProgress
    ? Object.values(userData.applicationProgress).filter(p => p >= 100).length : 0;
  const totalSections = userData?.applicationProgress
    ? Object.keys(userData.applicationProgress).length : 0;
  const overallProgress = userData?.applicationProgress
    ? Math.round(Object.values(userData.applicationProgress).reduce((s, p) => s + p, 0) /
        Math.max(1, Object.values(userData.applicationProgress).length))
    : 0;

  const applicationSections = [
    {
      type: 'university', name: 'University Application', desc: 'Select your program and institutions',
      progress: applicationProgress || 0, path: `${basePath}/application/overview`,
    },
    {
      type: 'profile', name: 'Profile', desc: 'Personal information and background',
      progress: userData?.profileProgress || 0, path: `${basePath}/profile/personal`,
    },
    {
      type: 'family', name: 'Family', desc: 'Family details and information',
      progress: familyCompleted ? 100 : (userData?.applicationProgress?.family || 0),
      path: `${basePath}/family`,
    },
    {
      type: 'education', name: 'Education', desc: 'Academic history and achievements',
      progress: userData?.applicationProgress?.education || 0,
      path: `${basePath}/education/current-school`,
    },
    {
      type: 'testing', name: 'Testing', desc: 'Standardized test scores',
      progress: userData?.applicationProgress?.testing || 0,
      path: `${basePath}/testing/tests-taken`,
    },
    {
      type: 'activities', name: 'Activities', desc: 'Extracurricular activities and honors',
      progress: userData?.applicationProgress?.activities || 0,
      path: `${basePath}/activities`,
    },
    {
      type: 'writing', name: 'Writing', desc: 'Personal statements and essays',
      progress: userData?.applicationProgress?.writing || 0,
      path: `${basePath}/writing/personal-essay`,
    },
  ];

  const faqItems = [
    { question: "How can I add a college to My colleges?", answer: "To add a college to your account: Select College search from the navigation menu, browse colleges, and click 'Add to My Colleges'.", shortAnswer: "Select College search from the navigation menu..." },
    { question: "I already submitted, can I change some of my answers?", answer: "You can return at any time and change your answer to most questions before submission. After submission, contact colleges directly for changes.", shortAnswer: "You can return at any time and change your answer to most questions..." },
    { question: "How many colleges can I add to My colleges list?", answer: "You can add up to 20 colleges to your My Colleges list.", shortAnswer: "You can add up to 20 colleges to your My Colleges list..." },
  ];

  const handleSectionClick = (section) => {
    if (section?.path) navigate(section.path);
  };

  const getNextIncomplete = () => {
    const s = applicationSections.find(s => s.progress < 100);
    return s || applicationSections[0];
  };

  const getActionLabel = (progress) => {
    if (progress >= 100) return 'Review & Edit';
    if (progress > 0)    return 'Continue';
    return 'Get Started';
  };

  /* ─── Colleges Page ─── */
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
            <button className="header-notif-btn" aria-label="Notifications">
              <span className="notif-bell"></span>
              <span className="notif-badge"></span>
            </button>
            <button className="header-user-chip">
              <span className="header-user-chip__avatar">
                {userData?.firstName?.[0]}{userData?.lastName?.[0]}
              </span>
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

  /* ─── Dashboard Home ─── */
  const DashboardHome = () => {
    const nextSection = getNextIncomplete();
    const remaining = applicationSections.filter(s => s.progress < 100).length;

    return (
      <>
        {/* Top nav bar */}
        <div className="dashboard-header">
          <div className="dashboard-header__inner">
            <div className="dashboard-header__title-group">
              <div>
                <h1 className="dashboard-header__welcome">My Application</h1>
                <p className="dashboard-header__subtitle">Track your progress and complete your application</p>
              </div>
            </div>
            <div className="dashboard-header__actions">
              <button className="header-notif-btn" aria-label="Notifications">
                <span className="notif-bell"></span>
                <span className="notif-badge"></span>
              </button>
              <button className="header-user-chip">
                <span className="header-user-chip__avatar">
                  {userData?.firstName?.[0]}{userData?.lastName?.[0]}
                </span>
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
                {overallProgress >= 100
                  ? 'Application Complete! Ready to Submit.'
                  : overallProgress >= 50
                    ? 'Keep Going! You\'re Making Great Progress.'
                    : 'Let\'s Get Started on Your Application!'}
              </h2>
              <p className="dashboard-banner__desc">
                {overallProgress >= 100
                  ? 'All sections are complete. Review your application and submit.'
                  : 'Complete the remaining sections to submit your application.'}
              </p>
            </div>

            <div className="dashboard-banner__stats">
              <div className="dashboard-banner__stat">
                <div className="dashboard-banner__stat-icon dashboard-banner__stat-icon--blue">
                  <span className="icon-clipboard"></span>
                </div>
                <div>
                  <div className="dashboard-banner__stat-num dashboard-banner__stat-num--blue">{completedSections}</div>
                  <div className="dashboard-banner__stat-label">Completed</div>
                </div>
              </div>
              <div className="dashboard-banner__stat">
                <div className="dashboard-banner__stat-icon dashboard-banner__stat-icon--orange">
                  <span className="icon-clock"></span>
                </div>
                <div>
                  <div className="dashboard-banner__stat-num dashboard-banner__stat-num--orange">{remaining}</div>
                  <div className="dashboard-banner__stat-label">Remaining</div>
                </div>
              </div>
            </div>

            <button
              className="dashboard-banner__cta"
              onClick={() => nextSection && navigate(nextSection.path)}
            >
              Continue Application
              <span className="dashboard-banner__cta-arrow">→</span>
            </button>
          </div>

          {/* ── My Common Application sections grid ── */}
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <div className="dashboard-card__title-row">
                <h2 className="dashboard-card__title">My Common Application</h2>
                <span className="dashboard-badge">{completedSections}/{totalSections} sections complete</span>
              </div>
            </div>

            <div className="dashboard-sections-grid">
              {applicationSections.map((section, i) => (
                <div
                  key={i}
                  className="dashboard-section-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => handleSectionClick(section)}
                >
                  <SectionIcon type={section.type} />

                  <div className="dashboard-section-card__header">
                    <div>
                      <h4 className="dashboard-section-card__name">{section.name}</h4>
                      <p className="dashboard-section-card__desc">{section.desc}</p>
                    </div>
                    {section.progress > 0 && (
                      <span className={`dashboard-section-card__pct ${getPctClass(section.progress)}`}>
                        {section.progress}%
                      </span>
                    )}
                    {section.progress === 0 && (
                      <span className={`dashboard-section-card__pct pct--zero`}>0%</span>
                    )}
                  </div>

                  <div className="dashboard-progress-bar">
                    <div
                      className={`dashboard-progress-bar__fill ${getBarColor(section.progress)}`}
                      style={{ width: `${section.progress}%` }}
                    />
                  </div>

                  <button
                    className={`dashboard-section-card__action ${section.progress >= 100 ? 'dashboard-section-card__action--done' : ''}`}
                    onClick={e => { e.stopPropagation(); handleSectionClick(section); }}
                  >
                    {getActionLabel(section.progress)} →
                  </button>
                </div>
              ))}
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
            <div className="dashboard-card__header">
              <h2 className="dashboard-card__title">Quick Access</h2>
            </div>
            <div className="dashboard-quick-grid">
              <div className="dashboard-quick-card" onClick={() => navigate(`${basePath}/application/overview`)}>
                <div className="dashboard-quick-card__content">
                  <h4 className="dashboard-quick-card__title">University Application</h4>
                  <p className="dashboard-quick-card__desc">Complete your university application in easy steps</p>
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

          {/* ── Help & FAQ ── */}
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <h2 className="dashboard-card__title">Help & Support</h2>
            </div>
            <div className="dashboard-search-wrap">
              <input
                type="text"
                placeholder="Search FAQs"
                className="dashboard-search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <div className="dashboard-search__hint">Search takes you to the student solution center</div>
            </div>
            <div className="dashboard-faq">
              <h3 className="dashboard-faq__heading">Frequently Asked Questions</h3>
              <div className="dashboard-faq__list">
                {faqItems
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
  const OverviewWrapper = () => (
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
          <Route path="/" element={<DashboardHome />} />
          <Route path="/application/*" element={<ApplicationWrapper />} />
          <Route path="/application/overview" element={<OverviewWrapper />} />
          <Route path="/colleges" element={<CollegesSection />} />
          <Route path="/colleges/:collegeId" element={<CollegeDetails />} />
          <Route path="/colleges/:collegeId/:subsection" element={<CollegeSubsection />} />
          <Route path="/profile/*" element={<ProfileForm />} />
          <Route path="/family/*" element={<FamilySection onComplete={handleFamilyComplete} />} />
          <Route path="/education/*" element={<EducationForm />} />
          <Route path="/testing/*" element={<TestingForm />} />
          <Route path="/activities" element={<ActivitiesSection />} />
          <Route path="/activities/responsibilities" element={<ResponsibilitiesSection />} />
          <Route path="/writing/*" element={<WritingSection />} />
          <Route path="/college-search" element={<CollegeSearch onCollegeUpdate={fetchUserColleges} />} />
          <Route path="/courses/:universityId" element={<Courses onCourseSelect={handleCourseSelection} />} />
          <Route path="/colleges/:collegeId/general" element={<General />} />
          <Route path="/colleges/:collegeId/documents" element={<Documents />} />
          <Route path="/colleges/:collegeId/academics" element={<Academics />} />
          <Route path="/colleges/:collegeId/high-school" element={<HighSchoolCurriculum />} />
          <Route path="/colleges/:collegeId/activities" element={<Activities />} />
          <Route path="/colleges/:collegeId/contacts" element={<FirstContacts />} />
          <Route path="/colleges/:collegeId/family" element={<FirstFamily />} />
          <Route path="/colleges/:collegeId/residency" element={<FirstResidency />} />
          <Route path="/colleges/:collegeId/international" element={<InternationalStudent />} />
          <Route path="/colleges/:collegeId/review" element={<Review />} />
        </Routes>
      </DashboardLayout>
      <ChatWidget />
    </>
  );
};

export default Dashboard;