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
import TestingForm from './Testing'; // ✅ ADDED - Testing section

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null); // ✅ NEW: Separate dashboard display data
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainSection, setActiveMainSection] = useState('application');

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
        console.log('🔑 Token exists:', !!token);
        console.log('🔍 Token value:', token ? token.substring(0, 30) + '...' : 'MISSING');
        
        if (!token) {
          console.warn('⚠️ No token found - retrying...');
          
          await new Promise(resolve => setTimeout(resolve, 200));
          const retryToken = localStorage.getItem('token');
          
          console.log('🔄 Retry - Token exists:', !!retryToken);
          
          if (!retryToken) {
            console.warn('⚠️ No token found - using localStorage fallback');
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
              try {
                const parsedData = JSON.parse(storedUserData);
                setUserData(parsedData);
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
        console.log('📦 Token being sent:', finalToken ? 'Yes ✅' : 'No ❌');
        
        const response = await axiosInstance.get('/api/transfer/profile');
        
        console.log('✅ Response received:', response.status);
        console.log('📦 Response data:', response.data);

        if (response.data.success) {
          const transferData = response.data.account;
          
          console.log('✅ Transfer student data found:', transferData.firstName);
          console.log('📊 Dashboard data received:', response.data.dashboard); // ✅ Debug dashboard data

          // ✅ Store account data
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
          
          // ✅ NEW: Store dashboard display data separately
          if (response.data.dashboard) {
            setDashboardData(response.data.dashboard);
            localStorage.setItem('dashboardData', JSON.stringify(response.data.dashboard));
          } else {
            // ✅ Fallback: Generate dashboard data from account data
            const generatedDashboardData = {
              displayName: `${transferData.firstName} ${transferData.lastName}`,
              displayInitials: (transferData.firstName?.charAt(0) + transferData.lastName?.charAt(0)).toUpperCase(),
              caid: transferData._id ? transferData._id.toString().slice(-8).toUpperCase() : 'CAID-' + transferData._id?.slice(-8)?.toUpperCase() || 'N/A',
              email: transferData.email,
              username: transferData.username,
              profileCompletion: response.data.profileProgress || 0
            };
            setDashboardData(generatedDashboardData);
            localStorage.setItem('dashboardData', JSON.stringify(generatedDashboardData));
          }
          
          localStorage.setItem('userData', JSON.stringify(formattedUserData));
          console.log('✅ User data stored in state and localStorage');
          console.log('📊 Dashboard data set:', dashboardData);
        } else {
          console.warn('⚠️ Unexpected response structure');
          
          // ✅ Try to use stored dashboard data
          const storedDashboardData = localStorage.getItem('dashboardData');
          if (storedDashboardData) {
            try {
              const parsedDashboardData = JSON.parse(storedDashboardData);
              setDashboardData(parsedDashboardData);
              console.log('✅ Using stored dashboard data (fallback)');
            } catch (parseError) {
              console.error('❌ Error parsing stored dashboard data:', parseError);
            }
          }
          
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            try {
              const parsedData = JSON.parse(storedUserData);
              setUserData(parsedData);
              console.log('✅ Using stored user data (fallback)');
            } catch (parseError) {
              console.error('❌ Error parsing stored user data:', parseError);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching transfer student data:');
        console.error('   Status:', error.response?.status);
        console.error('   Message:', error.response?.data?.message || error.message);
        console.error('   URL:', error.config?.url);
        
        // ✅ Try to use stored dashboard data on error
        const storedDashboardData = localStorage.getItem('dashboardData');
        if (storedDashboardData) {
          try {
            const parsedDashboardData = JSON.parse(storedDashboardData);
            setDashboardData(parsedDashboardData);
            console.log('✅ Using stored dashboard data due to fetch error');
          } catch (parseError) {
            console.error('❌ Error parsing stored dashboard data:', parseError);
          }
        }
        
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          try {
            const parsedData = JSON.parse(storedUserData);
            setUserData(parsedData);
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
    } else if (path.includes('/testing')) { // ✅ ADDED - Testing section detection
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
      case 'testing': // ✅ ADDED - Testing section navigation
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
    { name: "Profile", completed: false, progress: 0, path: "/transfer/dashboard/profile/personal" },
    { name: "Family", completed: false, progress: 0, path: "/transfer/dashboard/family/household" },
    { name: "Education", completed: false, progress: 0, path: "/transfer/dashboard/education/current-school" },
    { name: "Testing", completed: false, progress: 0, path: "/transfer/dashboard/testing/tests-taken" }, // ✅ UPDATED - Testing path
    { name: "Activities", completed: false, progress: 0, path: "/transfer/dashboard/activities/activities" },
    { name: "Writing", completed: false, progress: 0, path: "/transfer/dashboard/writing/personal-essay" }
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
    console.log('Section clicked:', section);  // ✅ Debug log
    if (section && section.path) {
      navigate(section.path);  // ✅ Uses the correct path like "/dashboard/profile/personal"
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
              <div className="progress-indicator">0/76 sections complete</div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '0%' }}></div>
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
      dashboardData={dashboardData} // ✅ NEW: Pass dashboard display data
      activeMainSection={activeMainSection}
      onSectionChange={handleSectionChange}
    >
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/profile/*" element={<ProfileForm />} />
        <Route path="/family/*" element={<FamilyForm />} />
        <Route path="/education/*" element={<EducationForm />} />
        <Route path="/testing/*" element={<TestingForm />} /> {/* ✅ ADDED - Testing route */}
        <Route path="/activities/*" element={<ActivitiesForm />} />
        <Route path="/writing/*" element={<WritingForm />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;