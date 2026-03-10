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

  // DYNAMIC BASE PATH DETECTION
  const isFirstYear = location.pathname.includes('/firstyear/');
  const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';

  // Function to refresh user data
  const refreshUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/students/profile/detailed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.account) {
        const user = response.data.account;

        const gusApplicationData = localStorage.getItem('gusApplicationData');
        let appProgress = 0;
        if (gusApplicationData) {
          try {
            const appData = JSON.parse(gusApplicationData);
            appProgress = calculateLocalApplicationProgress(appData);
          } catch (e) {
            console.error('Error parsing gusApplicationData:', e);
          }
        }

        const selectedCourse = localStorage.getItem('selectedCourseForApplication');
        if (selectedCourse) {
          try {
            const courseData = JSON.parse(selectedCourse);
            setSelectedCourseData(courseData);
          } catch (error) {
            console.error('Error parsing selected course:', error);
          }
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
          applicationProgress: {
            ...user.applicationProgress,
            application: appProgress
          },
          ...user
        };

        setUserData(formattedUserData);
        setApplicationProgress(appProgress);
        localStorage.setItem('userData', JSON.stringify(formattedUserData));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, []);

  // Calculate application progress from localStorage data
  const calculateLocalApplicationProgress = (appData) => {
    if (!appData) return 0;

    let completedFields = 0;
    let totalFields = 0;

    const isFieldFilled = (fieldValue) => {
      if (fieldValue === null || fieldValue === undefined) return false;
      if (typeof fieldValue === 'string') return fieldValue.trim() !== '';
      if (typeof fieldValue === 'boolean') return true;
      if (typeof fieldValue === 'number') return true;
      if (typeof fieldValue === 'object') {
        if (fieldValue.grade9 || fieldValue.grade10 || fieldValue.grade11 || fieldValue.grade12 ||
            fieldValue.satTotal || fieldValue.act || fieldValue.toefl || fieldValue.ielts) {
          return true;
        }
        return Object.keys(fieldValue).length > 0;
      }
      return !!fieldValue;
    };

    // Personal Information
    const personalFields = ['firstName', 'lastName', 'dob', 'gender', 'nationality',
                           'countryOfResidence', 'email', 'mobile', 'passportFileName', 'photographFileName'];
    personalFields.forEach(field => {
      totalFields++;
      if (isFieldFilled(appData[field])) completedFields++;
    });

    // Address
    const addressFields = ['currentAddress', 'city', 'state', 'country', 'postalCode', 'nationalIdFileName'];
    addressFields.forEach(field => {
      totalFields++;
      if (isFieldFilled(appData[field])) completedFields++;
    });

    // Entrance Qualification
    const eqheFields = ['eqheDate', 'eqheCity', 'eqheCountry', 'eqheOriginalTitle', 'hasAnotherEQHE',
                        'anotherEqheDate', 'anotherEqheCity', 'anotherEqheCountry', 'anotherEqheOriginalTitle',
                        'eqheCertificateFileName'];
    eqheFields.forEach(field => {
      totalFields++;
      if (isFieldFilled(appData[field])) completedFields++;
    });

    // Special Needs
    const specialNeedsFields = ['hasSpecialNeeds'];
    specialNeedsFields.forEach(field => {
      totalFields++;
      if (isFieldFilled(appData[field])) completedFields++;
    });
    if (appData.hasSpecialNeeds === 'yes') {
      totalFields++;
      if (isFieldFilled(appData.specialNeedsDescription)) completedFields++;
    }

    // Education
    const educationFields = ['qualificationLevel', 'institutionName', 'boardUniversity',
                            'countryOfStudy', 'startYear', 'endYear', 'resultStatus',
                            'gradingSystem', 'transcriptsFileName', 'degreeCertificateFileName'];
    educationFields.forEach(field => {
      totalFields++;
      if (isFieldFilled(appData[field])) completedFields++;
    });

    // Test Scores
    const scoresFields = ['scores'];
    scoresFields.forEach(field => {
      totalFields++;
      if (isFieldFilled(appData[field])) completedFields++;
    });

    // Documents
    const documentFields = ['sopFileName', 'lor1FileName', 'lor2FileName',
                           'portfolioFileName', 'researchProposalFileName'];
    documentFields.forEach(field => {
      totalFields++;
      if (isFieldFilled(appData[field])) completedFields++;
    });

    const progress = Math.round((completedFields / totalFields) * 100);
    console.log(`📈 Local Application Progress: ${completedFields}/${totalFields} fields = ${progress}%`);
    return progress;
  };

  // Function to fetch user's colleges
  const fetchUserColleges = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/colleges`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setUserColleges(response.data.colleges);
      }
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
    setSelectedCourseData(courseData);
    localStorage.setItem('selectedCourseForApplication', JSON.stringify(courseData));
    navigate(`${basePath}/application/overview`, {
      state: { fromCoursesPage: true, courseData: courseData }
    });
  };

  // Update application progress when localStorage changes
  useEffect(() => {
    const handleApplicationUpdate = () => {
      const gusApplicationData = localStorage.getItem('gusApplicationData');
      if (gusApplicationData) {
        try {
          const appData = JSON.parse(gusApplicationData);
          const progress = calculateLocalApplicationProgress(appData);
          setApplicationProgress(progress);

          if (userData) {
            setUserData(prev => ({
              ...prev,
              applicationProgress: {
                ...prev.applicationProgress,
                application: progress
              }
            }));

            const updatedUserData = {
              ...userData,
              applicationProgress: {
                ...userData.applicationProgress,
                application: progress
              }
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
          }
        } catch (error) {
          console.error('Error updating application progress:', error);
        }
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
        if (!token) {
          navigate('/sign-in');
          return;
        }

        const response = await axios.get(`${API_URL}/api/students/profile/detailed`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success && response.data.account) {
          const user = response.data.account;
          const storedFamilyComplete = localStorage.getItem('familySectionComplete') === 'true';
          setFamilyCompleted(storedFamilyComplete);

          const gusApplicationData = localStorage.getItem('gusApplicationData');
          let appProgress = 0;
          if (gusApplicationData) {
            try {
              const appData = JSON.parse(gusApplicationData);
              appProgress = calculateLocalApplicationProgress(appData);
              setApplicationProgress(appProgress);
            } catch (e) {
              console.error('Error parsing gusApplicationData:', e);
            }
          }

          const selectedCourse = localStorage.getItem('selectedCourseForApplication');
          if (selectedCourse) {
            try {
              const courseData = JSON.parse(selectedCourse);
              setSelectedCourseData(courseData);
            } catch (error) {
              console.error('Error parsing selected course:', error);
            }
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
            applicationProgress: {
              ...user.applicationProgress,
              application: appProgress,
              family: storedFamilyComplete ? 100 : (user.applicationProgress?.family || 0)
            },
            testingData: user.testingData || { testsToReport: [] },
            ...user
          };

          setUserData(formattedUserData);
          localStorage.setItem('userData', JSON.stringify(formattedUserData));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData && storedUserData !== 'undefined') {
          try {
            const parsedData = JSON.parse(storedUserData);
            setUserData(parsedData);
            const storedFamilyComplete = localStorage.getItem('familySectionComplete') === 'true';
            setFamilyCompleted(storedFamilyComplete);

            const gusApplicationData = localStorage.getItem('gusApplicationData');
            if (gusApplicationData) {
              try {
                const appData = JSON.parse(gusApplicationData);
                const appProgress = calculateLocalApplicationProgress(appData);
                setApplicationProgress(appProgress);
              } catch (e) {
                console.error('Error parsing gusApplicationData:', e);
              }
            }

            const selectedCourse = localStorage.getItem('selectedCourseForApplication');
            if (selectedCourse) {
              try {
                const courseData = JSON.parse(selectedCourse);
                setSelectedCourseData(courseData);
              } catch (error) {
                console.error('Error parsing selected course:', error);
              }
            }
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
          }
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

  useEffect(() => {
    const handleCollegesUpdate = () => fetchUserColleges();
    window.addEventListener('collegesUpdated', handleCollegesUpdate);
    return () => window.removeEventListener('collegesUpdated', handleCollegesUpdate);
  }, [fetchUserColleges]);

  useEffect(() => {
    const handleFamilyCompletion = (event) => {
      if (event.detail && event.detail.section === 'family') {
        handleFamilyComplete(event.detail.isComplete);
      }
    };
    window.addEventListener('familySectionComplete', handleFamilyCompletion);
    return () => window.removeEventListener('familySectionComplete', handleFamilyCompletion);
  }, [handleFamilyComplete]);

  // Update active section based on route
  useEffect(() => {
    const path = location.pathname;

    if (path.includes('/profile')) {
      setActiveMainSection('profile');
    } else if (path.includes('/colleges') && !path.includes('/education/colleges')) {
      setActiveMainSection('colleges');
    } else if (path.includes('/education')) {
      setActiveMainSection('education');
    } else if (path.includes('/testing')) {
      setActiveMainSection('testing');
    } else if (path.includes('/writing')) {
      setActiveMainSection('writing');
    } else if (path.includes('/activities')) {
      setActiveMainSection('activities');
    } else if (path.includes('/college-search')) {
      setActiveMainSection('college-search');
    } else if (path.includes('/family')) {
      setActiveMainSection('family');
    } else if (path.includes('/courses')) {
      setActiveMainSection('courses');
    } else if (path.includes('/application')) {
      setActiveMainSection('application');
    } else {
      setActiveMainSection('dashboard');
    }
  }, [location.pathname]);

  const handleSectionChange = (section) => {
    switch (section) {
      case 'dashboard':
        navigate(`${basePath}`);
        break;
      case 'application':
        navigate(`${basePath}/application`);
        break;
      case 'colleges':
        navigate(`${basePath}/colleges`);
        break;
      case 'education':
        navigate(`${basePath}/education/current-school`);
        break;
      case 'testing':
        navigate(`${basePath}/testing/tests-taken`);
        break;
      case 'writing':
        navigate(`${basePath}/writing/personal-essay`);
        break;
      case 'activities':
        navigate(`${basePath}/activities`);
        break;
      case 'personal':
        navigate(`${basePath}/profile/personal`);
        break;
      case 'contact':
        navigate(`${basePath}/profile/contact`);
        break;
      case 'address':
        navigate(`${basePath}/profile/address`);
        break;
      case 'demographics':
        navigate(`${basePath}/profile/demographics`);
        break;
      case 'language':
        navigate(`${basePath}/profile/language`);
        break;
      case 'geography':
        navigate(`${basePath}/profile/geography`);
        break;
      case 'family':
        navigate(`${basePath}/family`);
        break;
      case 'courses':
        navigate(`${basePath}/college-search`);
        break;
      default:
        if (section.startsWith('college-')) {
          const parts = section.split('-');
          const collegeId = parts[1];
          const subsection = parts.slice(2).join('-');
          navigate(`${basePath}/colleges/${collegeId}/${subsection}`);
        } else {
          navigate(`${basePath}`);
        }
    }
  };

  const overallProgress = userData?.applicationProgress
    ? (Object.values(userData.applicationProgress).reduce((sum, progress) => sum + progress, 0)) /
      Math.max(1, Object.values(userData.applicationProgress).length)
    : 0;

  const completedSections = userData?.applicationProgress
    ? Object.values(userData.applicationProgress).filter(progress => progress >= 100).length
    : 0;

  const totalSections = userData?.applicationProgress
    ? Object.keys(userData.applicationProgress).length
    : 0;

  const applicationSections = [
    {
      name: "University Application",
      completed: applicationProgress >= 100,
      progress: applicationProgress || 0,
      path: `${basePath}/application/overview`
    },
    {
      name: "Profile",
      completed: userData?.profileProgress >= 100,
      progress: userData?.profileProgress || 0,
      path: `${basePath}/profile/personal`
    },
    {
      name: "Family",
      completed: familyCompleted || (userData?.applicationProgress?.family >= 100),
      progress: familyCompleted ? 100 : (userData?.applicationProgress?.family || 0),
      path: `${basePath}/family`
    },
    {
      name: "Education",
      completed: userData?.applicationProgress?.education >= 100,
      progress: userData?.applicationProgress?.education || 0,
      path: `${basePath}/education/current-school`
    },
    {
      name: "Testing",
      completed: userData?.applicationProgress?.testing >= 100,
      progress: userData?.applicationProgress?.testing || 0,
      path: `${basePath}/testing/tests-taken`
    },
    {
      name: "Activities",
      completed: userData?.applicationProgress?.activities >= 100,
      progress: userData?.applicationProgress?.activities || 0,
      path: `${basePath}/activities`
    },
    {
      name: "Writing",
      completed: userData?.applicationProgress?.writing >= 100,
      progress: userData?.applicationProgress?.writing || 0,
      path: `${basePath}/writing/personal-essay`
    }
  ];

  const faqItems = [
    {
      question: "How can I add a college to My colleges?",
      answer: "To add a college to your account: Select College search from the navigation menu, browse colleges, and click 'Add to My Colleges'.",
      shortAnswer: "To add a college to your account: Select College search from the navigation menu..."
    },
    {
      question: "I already submitted, can I change some of my answers?",
      answer: "You can return at any time and change your answer to most questions before submission. After submission, contact colleges directly for changes.",
      shortAnswer: "You can return at any time and change your answer to most questions..."
    },
    {
      question: "How many colleges can I add to My colleges list?",
      answer: "You can add up to 20 colleges to your My Colleges list to compare and manage applications effectively.",
      shortAnswer: "You can add up to 20 colleges to your My Colleges list..."
    }
  ];

  const handleSectionClick = (section) => {
    if (section && section.path) {
      navigate(section.path);
    } else {
      alert(`${section?.name || 'This'} section coming soon!`);
    }
  };

  const ApplicationWrapper = () => (
    <Application
      onCourseSelect={handleCourseSelection}
      selectedCourseData={selectedCourseData}
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

  // ─── CollegesSection ───
  const CollegesSection = () => (
    <>
      <header className="main-header">
        <div className="header-content">
          <div className="welcome-section-centered">
            <h1 className="welcome-title">My Colleges - Overview</h1>
            <p className="welcome-subtitle">Manage your college applications and track progress</p>
          </div>
        </div>
      </header>

      <div className="main-content">
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Your College List</h2>
            <div className="college-count">{userColleges.length} colleges</div>
          </div>

          {userColleges.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <div className="icon-background">🏫</div>
              </div>
              <div className="empty-state-content">
                <h3 className="empty-state-title">No colleges added yet</h3>
                <p className="empty-state-description">
                  Start by searching for colleges to add to your list. You can manage your applications from the sidebar.
                </p>
                <button
                  className="primary-action-button"
                  onClick={() => navigate(`${basePath}/college-search`)}
                >
                  Search Colleges
                </button>
              </div>
            </div>
          ) : (
            <div className="college-list">
              {userColleges.map((college) => (
                <div key={college.collegeId} className="college-list-item">
                  <div className="college-info">
                    <div className="college-text">
                      <h4
                        className="college-name-link"
                        onClick={() => navigate(`${basePath}/colleges/${college.collegeId}`)}
                      >
                        {college.name}
                      </h4>
                      <p className="college-location-small">
                        {college.city}, {college.state} - USA
                      </p>
                      <div className="college-status">
                        <span className={`status-badge ${college.status}`}>
                          {college.status || 'Not Started'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="view-details-button"
                    onClick={() => navigate(`${basePath}/colleges/${college.collegeId}`)}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {userColleges.length > 0 && (
          <section className="content-section">
            <h2 className="section-title">Application Progress Summary</h2>
            <div className="progress-summary">
              <p>Click on any college in the sidebar to start working on your application sections.</p>
              <p>Each college has its own set of application requirements and deadlines.</p>
            </div>
          </section>
        )}
      </div>
    </>
  );

  // ─── DashboardHome ───
  const DashboardHome = () => (
    <>
      <header className="main-header">
        <div className="header-content">
          <div className="welcome-section-centered">
            <h1 className="welcome-name">{userData?.name || 'Student'}</h1>
            <p className="welcome-subtitle">Welcome back to your application dashboard</p>
          </div>
        </div>
      </header>

      <div className="main-content">
        <section className="content-section application-section">
          <div className="section-header">
            <div className="section-title-group">
              <h2 className="section-title">My Common Application</h2>
              <div className="progress-indicator">{completedSections}/{totalSections} sections complete</div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="application-sections-grid">
            {applicationSections.map((section, index) => (
              <div key={index} className="application-section-card">
                <div className="section-header-mini">
                  <h4 className="section-name">{section.name}</h4>
                  {section.progress > 0 && (
                    <div className="section-progress">{section.progress}%</div>
                  )}
                </div>
                <div className="section-progress-bar">
                  <div
                    className="section-progress-fill"
                    style={{ width: `${section.progress}%` }}
                  ></div>
                </div>
                <button
                  className={`section-action-button ${section.progress === 100 ? 'completed' : ''}`}
                  onClick={() => handleSectionClick(section)}
                >
                  {section.progress === 100 ? 'Review' : section.progress > 0 ? 'Continue' : 'Start'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section colleges-section">
          <div className="section-header">
            <div className="section-title-group">
              <h2 className="section-title">My Colleges</h2>
              <div className="college-count">{userColleges.length} colleges</div>
            </div>
          </div>

          <div className="colleges-content">
            {userColleges.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <div className="icon-background">🏫</div>
                </div>
                <div className="empty-state-content">
                  <h3 className="empty-state-title">Nothing here yet!</h3>
                  <p className="empty-state-description">
                    Add some colleges to your list to get started with your applications.
                  </p>
                  <button
                    className="primary-action-button"
                    onClick={() => navigate(`${basePath}/college-search`)}
                  >
                    Add Colleges
                  </button>
                </div>
              </div>
            ) : (
              <div className="college-preview-list">
                {userColleges.slice(0, 3).map((college) => (
                  <div key={college.collegeId} className="college-preview-item">
                    <h4 className="college-name">{college.name}</h4>
                    <p className="college-location">{college.city}, {college.state}</p>
                    <span className={`status-badge-small ${college.status}`}>
                      {college.status}
                    </span>
                  </div>
                ))}
                {userColleges.length > 3 && (
                  <button
                    className="view-all-colleges-button"
                    onClick={() => navigate(`${basePath}/colleges`)}
                  >
                    View all {userColleges.length} colleges →
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="content-section quick-access-section">
          <div className="section-header">
            <h2 className="section-title">Quick Access</h2>
          </div>

          <div className="quick-access-grid">
            <div className="quick-access-card" onClick={() => navigate(`${basePath}/application/overview`)}>
              <div className="quick-access-icon">📝</div>
              <div className="quick-access-content">
                <h4 className="quick-access-title">University Application</h4>
                <p className="quick-access-description">
                  Complete your GUS University application in 7 easy steps
                </p>
              </div>
              <div className="quick-access-arrow">→</div>
            </div>

            <div className="quick-access-card" onClick={() => navigate(`${basePath}/college-search`)}>
              <div className="quick-access-icon">🔍</div>
              <div className="quick-access-content">
                <h4 className="quick-access-title">Explore Programs</h4>
                <p className="quick-access-description">
                  Browse detailed program information for GUS portal universities
                </p>
              </div>
              <div className="quick-access-arrow">→</div>
            </div>

            <div className="quick-access-card" onClick={() => navigate(`${basePath}/college-search`)}>
              <div className="quick-access-icon">🎓</div>
              <div className="quick-access-content">
                <h4 className="quick-access-title">View Course Details</h4>
                <p className="quick-access-description">
                  Click on any GUS university to see available courses and programs
                </p>
              </div>
              <div className="quick-access-arrow">→</div>
            </div>
          </div>
        </section>

        <section className="content-section help-section">
          <div className="section-header">
            <h2 className="section-title">Help & Support</h2>
          </div>

          <div className="search-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search FAQs"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="search-hint">
                Search takes you to the student solution center
              </div>
            </div>
          </div>

          <div className="faq-section">
            <h3 className="faq-section-title">Frequently Asked Questions</h3>
            <div className="faq-list">
              {faqItems.map((faq, index) => (
                <div key={index} className="faq-card">
                  <div className="faq-content">
                    <h4 className="faq-question">{faq.question}</h4>
                    <p className="faq-answer">{faq.shortAnswer}</p>
                  </div>
                  <button className="faq-action-button">
                    Read full answer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <DashboardLayout
        userData={userData}
        activeMainSection={activeMainSection}
        onSectionChange={handleSectionChange}
        userColleges={userColleges}
        onRefreshColleges={fetchUserColleges}
      >
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/application/*" element={<ApplicationWrapper />} />
          <Route path="/application/overview" element={<OverviewWrapper />} />
          <Route path="/colleges" element={<CollegesSection />} />
          <Route path="/colleges/:collegeId" element={<CollegeDetails />} />
          <Route path="/colleges/:collegeId/:subsection" element={<CollegeSubsection />} />
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