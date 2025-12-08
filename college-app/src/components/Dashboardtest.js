// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './Dashboardtest.css';
import DashboardLayout from './DashboardLayouttest';
import ProfileForm from './Profile';
import FamilyForm from './Family';
import EducationForm from './Education';
import WritingForm from './Writing';
import ActivitiesForm from './Activities';
import TestingForm from './Testing';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainSection, setActiveMainSection] = useState('application');
  const [sectionProgress, setSectionProgress] = useState({
    profile: 0,
    family: 0,
    education: 0,
    testing: 0,
    activities: 0,
    writing: 0
  });
  const [totalProgress, setTotalProgress] = useState({
    completedSections: 0,
    totalSections: 76,
    percentage: 0
  });

  // Calculate progress for each section
  const calculateProfileProgress = (userData) => {
    if (!userData) return 0;
    
    const profileFields = [
      'firstName', 'lastName', 'birthDate', 'phone', 'email',
      'addressLine1', 'city', 'state', 'zipCode', 'country',
      'gender', 'legalSex', 'citizenshipStatus',
      'languages', 'languagesProficient'
    ];
    
    let completed = 0;
    profileFields.forEach(field => {
      if (userData[field] && userData[field] !== '') {
        completed++;
      }
    });
    
    return Math.round((completed / profileFields.length) * 100);
  };

  const calculateFamilyProgress = (userData) => {
    if (!userData) return 0;
    
    const familyFields = [
      'householdInformation', 'parent1', 'parent2', 'siblings'
    ];
    
    let completed = 0;
    familyFields.forEach(field => {
      if (userData[field] && Object.keys(userData[field]).length > 0) {
        completed++;
      }
    });
    
    return Math.round((completed / familyFields.length) * 100);
  };

  const calculateEducationProgress = (userData) => {
    if (!userData) return 0;
    
    const educationFields = [
      'currentSchool', 'otherSchools', 'colleges', 'grades',
      'currentCourses', 'honors', 'communityOrganizations',
      'futurePlans', 'documents'
    ];
    
    let completed = 0;
    educationFields.forEach(field => {
      if (userData[field]) {
        completed++;
      }
    });
    
    return Math.round((completed / educationFields.length) * 100);
  };

  const calculateTestingProgress = (userData) => {
    if (!userData) return 0;
    
    const testingData = userData.testingData || {};
    const testFields = [
      'testsTaken', 'actTests', 'satTests', 'satSubjectTests',
      'apTests', 'ibTests', 'cambridgeTests', 'toeflTests',
      'pteTests', 'ieltsTests', 'duolingoTests', 'seniorSecondaryExams'
    ];
    
    let completed = 0;
    testFields.forEach(field => {
      if (testingData[field]) {
        completed++;
      }
    });
    
    return Math.round((completed / testFields.length) * 100);
  };

  const calculateActivitiesProgress = (userData) => {
    if (!userData) return 0;
    
    const activitiesData = userData.activitiesData || {};
    const activityFields = [
      'activitiesList', 'responsibilities'
    ];
    
    let completed = 0;
    activityFields.forEach(field => {
      if (activitiesData[field] && activitiesData[field].length > 0) {
        completed++;
      }
    });
    
    return Math.round((completed / activityFields.length) * 100);
  };

  const calculateWritingProgress = (userData) => {
    if (!userData) return 0;
    
    const writingData = userData.writingData || {};
    const writingFields = [
      'personalEssay', 'additionalInformation'
    ];
    
    let completed = 0;
    writingFields.forEach(field => {
      if (writingData[field] && writingData[field] !== '') {
        completed++;
      }
    });
    
    return Math.round((completed / writingFields.length) * 100);
  };

  // Update all progress calculations
  const updateAllProgress = (userData) => {
    const newProgress = {
      profile: calculateProfileProgress(userData),
      family: calculateFamilyProgress(userData),
      education: calculateEducationProgress(userData),
      testing: calculateTestingProgress(userData),
      activities: calculateActivitiesProgress(userData),
      writing: calculateWritingProgress(userData)
    };
    
    setSectionProgress(newProgress);
    
    // Calculate total progress
    const sectionPercentages = Object.values(newProgress);
    const averageProgress = Math.round(sectionPercentages.reduce((a, b) => a + b, 0) / sectionPercentages.length);
    
    // Calculate completed sections (76 total sections)
    // Based on your structure: Profile(15) + Family(4) + Education(9) + Testing(12) + Activities(2) + Writing(2) = 44 sections
    // Let's adjust to match your 76 sections requirement
    const completedSections = Math.round((averageProgress / 100) * 76);
    
    setTotalProgress({
      completedSections: completedSections,
      totalSections: 76,
      percentage: averageProgress
    });
  };

  // Fetch transfer student data from backend on mount
  useEffect(() => {
    const fetchTransferStudentData = async () => {
      try {
        setLoading(true);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const token = localStorage.getItem('token');
        const studentType = localStorage.getItem('studentType');
        
        console.log('📥 Dashboard mounted');
        console.log('👤 Student type:', studentType);
        
        if (!token) {
          console.warn('⚠️ No token found - retrying...');
          
          await new Promise(resolve => setTimeout(resolve, 200));
          const retryToken = localStorage.getItem('token');
          
          if (!retryToken) {
            console.warn('⚠️ No token found - using localStorage fallback');
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
              try {
                const parsedData = JSON.parse(storedUserData);
                setUserData(parsedData);
                updateAllProgress(parsedData);
                console.log('✅ Using stored user data');
              } catch (parseError) {
                console.error('❌ Error parsing stored data:', parseError);
                navigate('/sign-in');
              }
            } else {
              navigate('/sign-in');
            }
            setLoading(false);
            return;
          }
        }

        const finalToken = token || localStorage.getItem('token');
        
        console.log('🔗 Fetching transfer student profile from /api/transfer/profile');
        
        const response = await axiosInstance.get('/api/transfer/profile');
        
        console.log('✅ Response received:', response.status);

        if (response.data.success && response.data.account) {
          const transferData = response.data.account;
          
          console.log('✅ Transfer student data found:', transferData.firstName);

          const formattedUserData = {
            name: `${transferData.firstName} ${transferData.lastName}`,
            firstName: transferData.firstName,
            lastName: transferData.lastName,
            email: transferData.email,
            username: transferData.username,
            primaryPhone: transferData.primaryPhone,
            alternatePhone: transferData.alternatePhone,
            collegeCredits: transferData.collegeCredits || '',
            bornBefore2003: transferData.bornBefore2003 || '',
            degreeStatus: transferData.degreeStatus || '',
            communityCollege: transferData.communityCollege || '',
            degreeGoal: transferData.degreeGoal || '',
            militaryStatus: transferData.militaryStatus || '',
            ...transferData
          };
          
          setUserData(formattedUserData);
          localStorage.setItem('userData', JSON.stringify(formattedUserData));
          updateAllProgress(formattedUserData);
          console.log('✅ User data stored in state and localStorage');
        } else {
          console.warn('⚠️ Unexpected response structure');
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            setUserData(parsedData);
            updateAllProgress(parsedData);
            console.log('✅ Using stored user data (fallback)');
          }
        }
      } catch (error) {
        console.error('❌ Error fetching transfer student data:', error);
        
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          try {
            const parsedData = JSON.parse(storedUserData);
            setUserData(parsedData);
            updateAllProgress(parsedData);
            console.log('✅ Using stored user data due to fetch error');
          } catch (parseError) {
            console.error('❌ Error parsing stored user data:', parseError);
            navigate('/sign-in');
          }
        } else {
          console.error('❌ No fallback data available - redirecting to sign-in');
          navigate('/sign-in');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransferStudentData();
  }, [navigate]);

  // Update active section based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/profile')) {
      setActiveMainSection('profile');
    } else if (path.includes('/family')) {
      setActiveMainSection('family');
    } else if (path.includes('/college-search') || path.includes('/college-detail')) {
      setActiveMainSection('colleges');
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
    } else {
      setActiveMainSection('application');
    }
  }, [location.pathname]);

  const handleSectionChange = (section) => {
    switch (section) {
      case 'dashboard':
        navigate('/transfer/dashboard');
        break;
      case 'application':
        navigate('/transfer/dashboard');
        break;
      case 'colleges':
        navigate('/transfer/dashboard/colleges');
        break;
      case 'college-search':
        navigate('/transfer/dashboard/college-search');
        break;
      case 'education':
        navigate('/transfer/dashboard/education/current-school');
        break;
      case 'testing':
        navigate('/transfer/dashboard/testing/tests-taken');
        break;
      case 'writing':
        navigate('/transfer/dashboard/writing/personal-essay');
        break;
      case 'activities':
        navigate('/transfer/dashboard/activities/activities');
        break;
      case 'personal':
        navigate('/transfer/dashboard/profile/personal');
        break;
      case 'contact':
        navigate('/transfer/dashboard/profile/contact');
        break;
      case 'address':
        navigate('/transfer/dashboard/profile/address');
        break;
      case 'demographics':
        navigate('/transfer/dashboard/profile/demographics');
        break;
      case 'language':
        navigate('/transfer/dashboard/profile/language');
        break;
      case 'geography':
        navigate('/transfer/dashboard/profile/geography');
        break;
      default:
        navigate('/transfer/dashboard');
    }
  };

  const applicationSections = [
    { name: "Profile", progress: sectionProgress.profile, path: "/transfer/dashboard/profile/personal" },
    { name: "Family", progress: sectionProgress.family, path: "/transfer/dashboard/family/household" },
    { name: "Education", progress: sectionProgress.education, path: "/transfer/dashboard/education/current-school" },
    { name: "Testing", progress: sectionProgress.testing, path: "/transfer/dashboard/testing/tests-taken" },
    { name: "Activities", progress: sectionProgress.activities, path: "/transfer/dashboard/activities/activities" },
    { name: "Writing", progress: sectionProgress.writing, path: "/transfer/dashboard/writing/personal-essay" }
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const DashboardHome = () => (
    <>
      <header className="main-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="welcome-title">
              Hello, {userData?.firstName || 'User'}!
            </h1>
            <p className="welcome-subtitle">Welcome back to your application dashboard</p>
          </div>
          <div className="header-actions">
            <button className="help-button">
              <span className="help-icon">?</span>
              Need Help?
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Application Progress Section */}
        <section className="content-section application-section">
          <div className="section-header">
            <div className="section-title-group">
              <h2 className="section-title">My Common Application</h2>
              <div className="progress-indicator">
                {totalProgress.completedSections}/{totalProgress.totalSections} sections complete
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${totalProgress.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="application-sections-grid">
            {applicationSections.map((section, index) => (
              <div key={index} className="application-section-card">
                <div className="section-header-mini">
                  <h4 className="section-name">{section.name}</h4>
                  <div className="section-progress">{section.progress}%</div>
                </div>
                <div className="section-progress-bar">
                  <div 
                    className="section-progress-fill" 
                    style={{ width: `${section.progress}%` }}
                  ></div>
                </div>
                <button 
                  className="section-action-button"
                  onClick={() => handleSectionClick(section)}
                >
                  {section.progress > 0 ? 'Continue' : 'Start'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* My Colleges Section */}
        <section className="content-section colleges-section">
          <div className="section-header">
            <div className="section-title-group">
              <h2 className="section-title">My Colleges</h2>
              <div className="college-count">0 colleges</div>
            </div>
          </div>
          
          <div className="colleges-content">
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
                <button className="primary-action-button" onClick={() => navigate('/transfer/dashboard/college-search')}>
                  Search Colleges
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Help & Support Section */}
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

  const CollegesSection = () => (
    <>
      <header className="main-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="welcome-title">My Colleges</h1>
            <p className="welcome-subtitle">Manage your college applications</p>
          </div>
        </div>
      </header>

      <div className="main-content">
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Your College List</h2>
            <div className="college-count">0 colleges</div>
          </div>
          
          <div className="empty-state">
            <div className="empty-state-icon">
              <div className="icon-background">
                🏫
              </div>
            </div>
            <div className="empty-state-content">
              <h3 className="empty-state-title">No colleges added yet</h3>
              <p className="empty-state-description">
                Start by searching for colleges to add to your list.
              </p>
              <button 
                className="primary-action-button"
                onClick={() => navigate('/transfer/dashboard/college-search')}
              >
                Search Colleges
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );

  return (
    <DashboardLayout 
      userData={userData} 
      activeMainSection={activeMainSection}
      onSectionChange={handleSectionChange}
    >
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/profile/*" element={<ProfileForm />} />
        <Route path="/family/*" element={<FamilyForm />} />
        <Route path="/education/*" element={<EducationForm />} />
        <Route path="/testing/*" element={<TestingForm />} />
        <Route path="/activities/*" element={<ActivitiesForm />} />
        <Route path="/writing/*" element={<WritingForm />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;