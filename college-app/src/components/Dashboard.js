import React, { useState, useEffect } from 'react';
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
import FamilySection from './family-sections/FamilySection'; // ✅ Added

const API_URL = process.env.REACT_APP_API_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainSection, setActiveMainSection] = useState('application');
  const [userColleges, setUserColleges] = useState([]);
  // ADD THIS LINE: State to track family section completion locally
  const [familyCompleted, setFamilyCompleted] = useState(false);

  // ✅ DYNAMIC BASE PATH DETECTION
  const isFirstYear = location.pathname.includes('/firstyear/');
  const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';

  // Function to refresh user data
  const refreshUserData = async () => {
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
          ...user
        };
        
        setUserData(formattedUserData);
        localStorage.setItem('userData', JSON.stringify(formattedUserData));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Function to fetch user's colleges
  const fetchUserColleges = async () => {
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
        console.log(`📋 Loaded ${response.data.colleges.length} colleges for user`);
      }
    } catch (error) {
      console.error('Error fetching user colleges:', error);
    }
  };

  // Function to refresh both user data and colleges
  const refreshAllData = async () => {
    await refreshUserData();
    await fetchUserColleges();
  };

  // ADD THIS FUNCTION: Handle family completion
  const handleFamilyComplete = (isComplete) => {
    setFamilyCompleted(isComplete);
    // Update local storage for persistence
    localStorage.setItem('familySectionComplete', isComplete ? 'true' : 'false');
    
    // Update userData if it exists
    if (userData) {
      setUserData(prev => ({
        ...prev,
        applicationProgress: {
          ...prev.applicationProgress,
          family: isComplete ? 100 : (prev.applicationProgress?.family || 0)
        }
      }));
    }
  };

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
          // ADD THIS: Check local storage for family completion status
          const storedFamilyComplete = localStorage.getItem('familySectionComplete') === 'true';
          setFamilyCompleted(storedFamilyComplete);
          
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
            // ADD THIS: Include family progress
            applicationProgress: {
              ...user.applicationProgress,
              family: storedFamilyComplete ? 100 : (user.applicationProgress?.family || 0)
            },
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
            // Check local storage for family completion
            const storedFamilyComplete = localStorage.getItem('familySectionComplete') === 'true';
            setFamilyCompleted(storedFamilyComplete);
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
  }, [navigate]);

  // Refresh data when navigating to dashboard or college-related pages
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard') || path.includes('/colleges') || path.includes('/college-search')) {
      refreshAllData();
    }
  }, [location.pathname]);

  // Listen for college updates from other components
  useEffect(() => {
    const handleCollegesUpdate = () => {
      console.log('🔄 Received college update event, refreshing college list...');
      fetchUserColleges();
    };

    window.addEventListener('collegesUpdated', handleCollegesUpdate);
    
    return () => {
      window.removeEventListener('collegesUpdated', handleCollegesUpdate);
    };
  }, []);

  // ADD THIS: Listen for family completion events
  useEffect(() => {
    const handleFamilyCompletion = (event) => {
      if (event.detail && event.detail.section === 'family') {
        handleFamilyComplete(event.detail.isComplete);
      }
    };

    window.addEventListener('familySectionComplete', handleFamilyCompletion);
    
    return () => {
      window.removeEventListener('familySectionComplete', handleFamilyCompletion);
    };
  }, []);

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
    } else {
      setActiveMainSection('application');
    }
  }, [location.pathname]);

  // ✅ FIXED: Sidebar navigation with correct base path
  const handleSectionChange = (section) => {
    console.log('🔄 Section change requested:', section);
    switch (section) {
      case 'dashboard':
      case 'application':
        navigate(`${basePath}`);
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
      default:
        if (section.startsWith('college-')) {
          const parts = section.split('-');
          const collegeId = parts[1];
          const subsection = parts.slice(2).join('-');
          console.log('🎯 Navigating to college subsection:', collegeId, subsection);
          navigate(`${basePath}/colleges/${collegeId}/${subsection}`);
        } else {
          navigate(`${basePath}`);
        }
    }
  };

  // Calculate overall progress
  const overallProgress = userData?.applicationProgress 
    ? Object.values(userData.applicationProgress).reduce((sum, progress) => sum + progress, 0) / 
      Object.values(userData.applicationProgress).length 
    : 0;

  // FIX THIS: Update completedSections to use 100% as completion threshold
  const completedSections = userData?.applicationProgress 
    ? Object.values(userData.applicationProgress).filter(progress => progress >= 100).length 
    : 0;

  const totalSections = 6;

  // ✅ FIXED: applicationSections with dynamic base path
  const applicationSections = [
    { 
      name: "Profile", 
      completed: userData?.profileProgress >= 100, 
      progress: userData?.profileProgress || 0, 
      path: `${basePath}/profile/personal`
    },
    { 
      name: "Family", 
      // FIX THIS: Use familyCompleted state OR backend progress
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
    console.log('Section clicked:', section);
    if (section && section.path) {
      navigate(section.path);
    } else {
      alert(`${section?.name || 'This'} section coming soon!`);
    }
  };

  // ✅ FIXED: CollegesSection with correct navigation paths
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
              <div className="icon-background">
                🏫
              </div>
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

  // ✅ FIXED: DashboardHome with correct Add Colleges button
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
                <div className="icon-background">
                  🏫
                </div>
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
    <DashboardLayout 
      userData={userData} 
      activeMainSection={activeMainSection}
      onSectionChange={handleSectionChange}
      userColleges={userColleges}
      onRefreshColleges={fetchUserColleges}
    >
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/colleges" element={<CollegesSection />} />
        <Route path="/colleges/:collegeId" element={<CollegeDetails />} />
        <Route path="/colleges/:collegeId/:subsection" element={<CollegeSubsection />} />
        <Route path="/profile/*" element={<ProfileForm />} />
        {/* PASS THE COMPLETION HANDLER TO FAMILYSECTION */}
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
        
        <Route path="/colleges/:collegeId/general" element={<General />} />
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
  );
};

export default Dashboard;