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

  // NEW: Function to fetch family progress
  const fetchFamilyProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('📊 Fetching family progress...');

      const response = await axiosInstance.get('/api/family-background');

      if (response.data.success) {
        const familyProgress = response.data.familyProgress || 0;
        console.log('✅ Family progress received:', familyProgress + '%');

        setSectionProgress(prev => ({
          ...prev,
          family: familyProgress
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching family progress:', error);
    }
  };

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

  // UPDATED: Use familyCompletion if available, otherwise check objects
  const calculateFamilyProgress = (userData) => {
    if (!userData) return 0;

    if (userData.familyCompletion) {
      const completionValues = Object.values(userData.familyCompletion);
      const completedCount = completionValues.filter(Boolean).length;
      return Math.round((completedCount / completionValues.length) * 100);
    }

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

  // UPDATED: Prefer educationProgress stored from backend / custom event
  const calculateEducationProgress = (userData) => {
    if (!userData) return 0;

    if (typeof userData.educationProgress === 'number') {
      return userData.educationProgress;
    }

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

  // UPDATED: Prefer testingProgress from localStorage, then fall back
  const calculateTestingProgress = (userData) => {
    if (!userData) return 0;

    if (typeof userData.testingProgress === 'number') {
      return userData.testingProgress;
    }

    const testingData = userData.testingData || {};

    const testFields = [
      'testsTaken', 'actTests', 'satTests', 'satSubjectTests',
      'apTests', 'ibTests', 'cambridgeTests', 'toeflTests',
      'pteTests', 'ieltsTests', 'duolingoTests', 'seniorSecondaryExams',
      'selfReportTests', 'selectedTests', 'internationalApplicant'
    ];

    let completed = 0;

    console.log('🔍 Checking testing progress in userData:', {
      hasTestingDataObject: !!userData.testingData,
      rootLevelData: testFields.filter(field => userData[field])
    });

    testFields.forEach(field => {
      let fieldData;

      if (userData[field]) {
        fieldData = userData[field];
        console.log(`  - Found ${field} at root level`);
      } else if (testingData[field]) {
        fieldData = testingData[field];
        console.log(`  - Found ${field} in testingData object`);
      }

      if (fieldData) {
        if (Array.isArray(fieldData)) {
          if (fieldData.length > 0) {
            completed++;
            console.log(`    ✓ ${field} has array with ${fieldData.length} items`);
          } else {
            console.log(`    ✗ ${field} has empty array`);
          }
        } else if (typeof fieldData === 'string' && fieldData.trim() !== '') {
          completed++;
        } else if (typeof fieldData === 'boolean') {
          completed++;
        } else if (typeof fieldData === 'number' && fieldData > 0) {
          completed++;
        } else if (typeof fieldData === 'object' && fieldData !== null && Object.keys(fieldData).length > 0) {
          completed++;
        }
      }
    });

    const percentage = Math.round((completed / testFields.length) * 100);
    console.log(`📊 Testing Progress (fallback): ${completed}/${testFields.length} = ${percentage}%`);
    return percentage;
  };

  // UPDATED: Prefer activitiesProgress from localStorage, then fall back
  const calculateActivitiesProgress = (userData) => {
    if (!userData) return 0;

    if (typeof userData.activitiesProgress === 'number') {
      return userData.activitiesProgress;
    }

    const activitiesData = userData.activitiesData || {};
    const activityFields = ['activitiesList', 'responsibilities'];

    let completed = 0;
    activityFields.forEach(field => {
      if (activitiesData[field] && activitiesData[field].length > 0) {
        completed++;
      }
    });

    return Math.round((completed / activityFields.length) * 100);
  };

  // UPDATED: Prefer writingProgress from localStorage, then fall back
  const calculateWritingProgress = (userData) => {
    if (!userData) return 0;

    // value saved by WritingForm
    if (typeof userData.writingProgress === 'number') {
      return userData.writingProgress;
    }

    const writingData = userData.writingData || {};
    const writingFields = ['personalEssay', 'additionalInformation'];

    let completed = 0;
    writingFields.forEach(field => {
      if (writingData[field]) {
        completed++;
      }
    });

    return Math.round((completed / writingFields.length) * 100);
  };

  // UPDATED: Update all progress calculations
  const updateAllProgress = (userData) => {
    const newProgress = {
      profile: calculateProfileProgress(userData),
      family: calculateFamilyProgress(userData),
      education: calculateEducationProgress(userData),
      testing: calculateTestingProgress(userData),
      activities: calculateActivitiesProgress(userData),
      writing: calculateWritingProgress(userData)
    };

    console.log('📊 Progress calculated:', newProgress);

    setSectionProgress(newProgress);

    const sectionPercentages = Object.values(newProgress);
    const averageProgress = Math.round(
      sectionPercentages.reduce((a, b) => a + b, 0) / sectionPercentages.length
    );

    const completedSections = Math.round((averageProgress / 100) * 76);

    setTotalProgress({
      completedSections,
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

          // merge stored educationProgress, testingProgress, activitiesProgress, writingProgress
          let storedEducationProgress = 0;
          let storedTestingProgress = 0;
          let storedActivitiesProgress = 0;
          let storedWritingProgress = 0;
          const existingStored = localStorage.getItem('userData');
          if (existingStored) {
            try {
              const parsed = JSON.parse(existingStored);
              if (typeof parsed.educationProgress === 'number') {
                storedEducationProgress = parsed.educationProgress;
              }
              if (typeof parsed.testingProgress === 'number') {
                storedTestingProgress = parsed.testingProgress;
              }
              if (typeof parsed.activitiesProgress === 'number') {
                storedActivitiesProgress = parsed.activitiesProgress;
              }
              if (typeof parsed.writingProgress === 'number') {
                storedWritingProgress = parsed.writingProgress;
              }
            } catch (e) {
              console.error('Error reading stored userData', e);
            }
          }

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
            educationProgress: storedEducationProgress,
            testingProgress: storedTestingProgress,
            activitiesProgress: storedActivitiesProgress,
            writingProgress: storedWritingProgress,
            ...transferData
          };

          setUserData(formattedUserData);
          localStorage.setItem('userData', JSON.stringify(formattedUserData));

          updateAllProgress(formattedUserData);

          await fetchFamilyProgress();

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

  // Listen for family progress updates
  useEffect(() => {
    const handleFamilyProgressUpdate = (event) => {
      if (event.detail && event.detail.familyProgress !== undefined) {
        console.log('📡 Received family progress update:', event.detail.familyProgress + '%');
        setSectionProgress(prev => ({
          ...prev,
          family: event.detail.familyProgress
        }));
      }
    };

    window.addEventListener('familyProgressUpdate', handleFamilyProgressUpdate);

    return () => {
      window.removeEventListener('familyProgressUpdate', handleFamilyProgressUpdate);
    };
  }, []);

  // Listen for education progress updates
  useEffect(() => {
    const handleEducationProgressUpdate = (event) => {
      if (event.detail && event.detail.educationProgress !== undefined) {
        console.log('📡 Received education progress update:', event.detail.educationProgress + '%');

        setSectionProgress(prev => ({
          ...prev,
          education: event.detail.educationProgress
        }));

        const storedData = localStorage.getItem('userData');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            const updatedData = {
              ...parsedData,
              educationProgress: event.detail.educationProgress
            };
            localStorage.setItem('userData', JSON.stringify(updatedData));
            console.log('💾 Updated education progress in localStorage');
          } catch (error) {
            console.error('Error updating localStorage:', error);
          }
        }
      }
    };

    window.addEventListener('educationProgressUpdate', handleEducationProgressUpdate);

    return () => {
      window.removeEventListener('educationProgressUpdate', handleEducationProgressUpdate);
    };
  }, []);

  // NEW: Listen for testing progress updates
  useEffect(() => {
    const handleTestingProgressUpdate = (event) => {
      if (event.detail && event.detail.testingProgress !== undefined) {
        console.log('📡 Received testing progress update:', event.detail.testingProgress + '%');

        setSectionProgress(prev => ({
          ...prev,
          testing: event.detail.testingProgress
        }));

        const storedData = localStorage.getItem('userData');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            const updatedData = {
              ...parsedData,
              testingProgress: event.detail.testingProgress
            };
            localStorage.setItem('userData', JSON.stringify(updatedData));
            console.log('💾 Updated testingProgress in localStorage');
          } catch (error) {
            console.error('Error updating testingProgress in localStorage:', error);
          }
        }
      }
    };

    window.addEventListener('testingProgressUpdate', handleTestingProgressUpdate);

    return () => {
      window.removeEventListener('testingProgressUpdate', handleTestingProgressUpdate);
    };
  }, []);

  // NEW: Listen for activities progress updates
  useEffect(() => {
    const handleActivitiesProgressUpdate = (event) => {
      if (event.detail && event.detail.activitiesProgress !== undefined) {
        console.log('📡 Received activities progress update:', event.detail.activitiesProgress + '%');

        setSectionProgress(prev => ({
          ...prev,
          activities: event.detail.activitiesProgress
        }));

        const storedData = localStorage.getItem('userData');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            const updatedData = {
              ...parsedData,
              activitiesProgress: event.detail.activitiesProgress
            };
            localStorage.setItem('userData', JSON.stringify(updatedData));
            console.log('💾 Updated activitiesProgress in localStorage');
          } catch (error) {
            console.error('Error updating activitiesProgress in localStorage:', error);
          }
        }
      }
    };

    window.addEventListener('activitiesProgressUpdate', handleActivitiesProgressUpdate);

    return () => {
      window.removeEventListener('activitiesProgressUpdate', handleActivitiesProgressUpdate);
    };
  }, []);

  // NEW: Listen for writing progress updates
  useEffect(() => {
    const handleWritingProgressUpdate = (event) => {
      if (event.detail && event.detail.writingProgress !== undefined) {
        console.log('📡 Received writing progress update:', event.detail.writingProgress + '%');

        setSectionProgress(prev => ({
          ...prev,
          writing: event.detail.writingProgress
        }));

        const storedData = localStorage.getItem('userData');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            const updatedData = {
              ...parsedData,
              writingProgress: event.detail.writingProgress
            };
            localStorage.setItem('userData', JSON.stringify(updatedData));
            console.log('💾 Updated writingProgress in localStorage');
          } catch (error) {
            console.error('Error updating writingProgress in localStorage:', error);
          }
        }
      }
    };

    window.addEventListener('writingProgressUpdate', handleWritingProgressUpdate);

    return () => {
      window.removeEventListener('writingProgressUpdate', handleWritingProgressUpdate);
    };
  }, []);

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

  // Recalculate total progress when any section progress changes
  useEffect(() => {
    const sectionPercentages = Object.values(sectionProgress);
    const averageProgress = Math.round(
      sectionPercentages.reduce((a, b) => a + b, 0) / sectionPercentages.length
    );
    const completedSections = Math.round((averageProgress / 100) * 76);

    setTotalProgress({
      completedSections,
      totalSections: 76,
      percentage: averageProgress
    });
  }, [sectionProgress]);

  const refreshFamilyProgress = async () => {
    await fetchFamilyProgress();
  };

  const refreshEducationProgress = () => {
    console.log('🔄 Manually refreshing education progress...');
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        const educationProgress = calculateEducationProgress(parsedData);
        console.log('📊 Calculated education progress:', educationProgress + '%');

        setSectionProgress(prev => ({
          ...prev,
          education: educationProgress
        }));
      } catch (error) {
        console.error('Error refreshing education progress:', error);
      }
    }
  };

  const handleSectionChange = (section) => {
    switch (section) {
      case 'dashboard':
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
    { name: 'Profile', progress: sectionProgress.profile, path: '/transfer/dashboard/profile/personal' },
    { name: 'Family', progress: sectionProgress.family, path: '/transfer/dashboard/family/household' },
    { name: 'Education', progress: sectionProgress.education, path: '/transfer/dashboard/education/current-school' },
    { name: 'Testing', progress: sectionProgress.testing, path: '/transfer/dashboard/testing/tests-taken' },
    { name: 'Activities', progress: sectionProgress.activities, path: '/transfer/dashboard/activities/activities' },
    { name: 'Writing', progress: sectionProgress.writing, path: '/transfer/dashboard/writing/personal-essay' }
  ];

  const faqItems = [
    {
      question: 'How can I add a college to My colleges?',
      answer: "To add a college to your account: Select College search from the navigation menu, browse colleges, and click 'Add to My Colleges'.",
      shortAnswer: 'To add a college to your account: Select College search from the navigation menu...'
    },
    {
      question: 'I already submitted, can I change some of my answers?',
      answer: 'You can return at any time and change your answer to most questions before submission. After submission, contact colleges directly for changes.',
      shortAnswer: 'You can return at any time and change your answer to most questions...'
    },
    {
      question: 'How many colleges can I add to My colleges list?',
      answer: 'You can add up to 20 colleges to your My Colleges list to compare and manage applications effectively.',
      shortAnswer: 'You can add up to 20 colleges to your My Colleges list...'
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
            <button className="help-button" onClick={refreshFamilyProgress}>
              <span className="help-icon">?</span>
              Need Help?
            </button>
            <button
              className="help-button"
              onClick={refreshEducationProgress}
              style={{ marginLeft: '10px', backgroundColor: '#4CAF50' }}
            >
              <span className="help-icon">🔄</span>
              Refresh Education
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
                <div className="icon-background">🏫</div>
              </div>
              <div className="empty-state-content">
                <h3 className="empty-state-title">Nothing here yet!</h3>
                <p className="empty-state-description">
                  Add some colleges to your list to get started with your applications.
                </p>
                <button
                  className="primary-action-button"
                  onClick={() => navigate('/transfer/dashboard/college-search')}
                >
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
              <div className="icon-background">🏫</div>
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
