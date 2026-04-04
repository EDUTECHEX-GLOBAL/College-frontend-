// src/components/Dashboard.js
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

// SVG Icon Components
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
  </svg>
);

const UniversityAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM4 13.18V16L12 20L20 16V13.18L12 17L4 13.18Z" fill="currentColor"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
  </svg>
);

const FamilyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6ZM16 8C17.1 8 18 7.1 18 6C18 4.9 17.1 4 16 4C14.9 4 14 4.9 14 6C14 7.1 14.9 8 16 8ZM8 8C9.1 8 10 7.1 10 6C10 4.9 9.1 4 8 4C6.9 4 6 4.9 6 6C6 7.1 6.9 8 8 8ZM4 18C4 15.8 5.8 14 8 14H16C18.2 14 20 15.8 20 18V20H4V18ZM12 12C9.8 12 8 13.8 8 16H16C16 13.8 14.2 12 12 12Z" fill="currentColor"/>
  </svg>
);

const EducationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 13.18V16L12 20L19 16V13.18L12 17L5 13.18ZM12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" fill="currentColor"/>
  </svg>
);

const TestingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
  </svg>
);

const ActivitiesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 13H8V3H3V13ZM3 21H8V15H3V21ZM10 21H15V11H10V21ZM10 3V9H15V3H10ZM17 3V7H22V3H17ZM17 13H22V21H17V13Z" fill="currentColor"/>
  </svg>
);

const WritingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63Z" fill="currentColor"/>
  </svg>
);

const MyCollegesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM4 13.18V16L12 20L20 16V13.18L12 17L4 13.18Z" fill="currentColor"/>
    <path d="M12 22L4 18V15L12 19L20 15V18L12 22Z" fill="currentColor"/>
  </svg>
);

const CoursesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20V18H4V6ZM4 4H20C22.2 4 24 5.8 24 8V16C24 18.2 22.2 20 20 20H4C1.8 20 0 18.2 0 16V8C0 5.8 1.8 4 4 4Z" fill="currentColor"/>
    <path d="M4 8V10H20V8H4Z" fill="currentColor"/>
  </svg>
);

const CollegeSearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z" fill="currentColor"/>
  </svg>
);

const DirectAdmissionsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15 8H22L16 12L19 18L12 14L5 18L8 12L2 8H9L12 2Z" fill="currentColor"/>
  </svg>
);

const FinancialAidIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.8 10.9C9.2 10.1 8.5 9.3 8.5 8.5C8.5 7.5 9.4 6.7 10.7 6.7C12.2 6.7 13.3 7.5 13.6 8.7H16.1C15.7 6.1 13.6 4.5 11.3 4.2V2H10.1V4.2C7.6 4.5 6.3 6.1 6.3 8.3C6.3 10.8 8.2 12.2 11.3 13.1C14.2 13.9 14.9 15.1 14.9 16.1C14.9 17.3 13.8 18.2 12.1 18.2C10.2 18.2 9.1 17.3 8.8 15.9H6.2C6.6 18.8 9 20.4 11.3 20.7V22H12.5V20.7C15.2 20.4 17 18.9 17 16.4C17 13.5 14.7 11.8 11.8 10.9Z" fill="currentColor"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.68 19.18 11.36 19.13 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.92 2.4H10.08C9.84 2.4 9.65 2.57 9.61 2.81L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33C5.02 5.25 4.77 5.33 4.65 5.55L2.74 8.87C2.62 9.08 2.66 9.34 2.86 9.48L4.89 11.06C4.84 11.36 4.8 11.69 4.8 12C4.8 12.31 4.82 12.64 4.87 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.65 21.43 9.84 21.6 10.08 21.6H13.92C14.16 21.6 14.36 21.43 14.39 21.19L14.75 18.65C15.34 18.41 15.88 18.08 16.37 17.71L18.76 18.67C18.98 18.75 19.23 18.67 19.35 18.45L21.27 15.13C21.39 14.91 21.34 14.66 21.15 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z" fill="currentColor"/>
  </svg>
);

const SignOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 10L12 15L17 10H7Z" fill="currentColor"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 7L15 12L10 17V7Z" fill="currentColor"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill="currentColor"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
  </svg>
);

const API_URL = process.env.REACT_APP_API_URL;

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
      path: `${basePath}/application/overview`,
      statusText: applicationProgress === 100 ? "Review" : applicationProgress > 0 ? "Continue" : "Start",
      progressColor: "#0a5c2e"
    },
    {
      name: "Profile",
      completed: userData?.profileProgress >= 100,
      progress: userData?.profileProgress || 0,
      path: `${basePath}/profile/personal`,
      statusText: userData?.profileProgress === 100 ? "Review" : userData?.profileProgress > 0 ? "Continue" : "Start",
      progressColor: "#0a5c2e"
    },
    {
      name: "Family",
      completed: familyCompleted || (userData?.applicationProgress?.family >= 100),
      progress: familyCompleted ? 100 : (userData?.applicationProgress?.family || 0),
      path: `${basePath}/family`,
      statusText: (familyCompleted || userData?.applicationProgress?.family >= 100) ? "Review" : (userData?.applicationProgress?.family > 0 || familyCompleted) ? "Continue" : "Start",
      progressColor: "#0a5c2e"
    },
    {
      name: "Education",
      completed: userData?.applicationProgress?.education >= 100,
      progress: userData?.applicationProgress?.education || 0,
      path: `${basePath}/education/current-school`,
      statusText: userData?.applicationProgress?.education === 100 ? "Review" : userData?.applicationProgress?.education > 0 ? "Continue" : "Start",
      progressColor: "#0a5c2e"
    },
    {
      name: "Testing",
      completed: userData?.applicationProgress?.testing >= 100,
      progress: userData?.applicationProgress?.testing || 0,
      path: `${basePath}/testing/tests-taken`,
      statusText: userData?.applicationProgress?.testing === 100 ? "Review" : userData?.applicationProgress?.testing > 0 ? "Continue" : "Start",
      progressColor: "#0a5c2e"
    },
    {
      name: "Activities",
      completed: userData?.applicationProgress?.activities >= 100,
      progress: userData?.applicationProgress?.activities || 0,
      path: `${basePath}/activities`,
      statusText: userData?.applicationProgress?.activities === 100 ? "Review" : userData?.applicationProgress?.activities > 0 ? "Continue" : "Start",
      progressColor: "#0a5c2e"
    },
    {
      name: "Writing",
      completed: userData?.applicationProgress?.writing >= 100,
      progress: userData?.applicationProgress?.writing || 0,
      path: `${basePath}/writing/personal-essay`,
      statusText: userData?.applicationProgress?.writing === 100 ? "Review" : userData?.applicationProgress?.writing > 0 ? "Continue" : "Start",
      progressColor: "#0a5c2e"
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
                  🔍 Search Colleges
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
          <h1 className="welcome-name">Welcome back, {userData?.firstName || 'Student'}!</h1>
          <p className="welcome-subtitle">Track your college application progress and manage your applications</p>
        </div>
      </div>
    </header>

    <div className="main-content">
      {/* My Common Application Section - Updated to match design exactly */}
      <section className="content-section application-section">
        <div className="section-header">
          <div className="section-title-group">
            <h2 className="section-title">My Common Application</h2>
            <div className="progress-indicator">
              {completedSections}/{totalSections} sections complete
            </div>
          </div>
        </div>

        <div className="application-sections-grid">
          {applicationSections.map((section, index) => (
            <div key={index} className="application-section-card" onClick={() => handleSectionClick(section)}>
              <div className="section-header-mini">
                <h4 className="section-name">{section.name}</h4>
                {section.progress > 0 && (
                  <div className="section-progress-percentage">{section.progress}%</div>
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleSectionClick(section);
                }}
              >
                {section.progress === 100 ? '✓ Review' : section.progress > 0 ? '▶ Continue' : '▶ Start'}
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
                <h3 className="empty-state-title">No colleges added yet</h3>
                <p className="empty-state-description">
                  Start by searching for colleges to add to your list. You can manage your applications from the sidebar.
                </p>
                <button
                  className="primary-action-button"
                  onClick={() => navigate(`${basePath}/college-search`)}
                >
                  🔍 Search Colleges
                </button>
              </div>
            </div>
          ) : (
            <div className="college-preview-list">
              {userColleges.slice(0, 3).map((college) => (
                <div 
                  key={college.collegeId} 
                  className="college-preview-item"
                  onClick={() => navigate(`${basePath}/colleges/${college.collegeId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <h4 className="college-name">{college.name}</h4>
                  <p className="college-location">{college.city}, {college.state}</p>
                  <span className={`status-badge-small ${college.status || 'not-started'}`}>
                    {college.status || 'Not Started'}
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

      {/* Quick Access Section */}
      <section className="content-section quick-access-section">
        <div className="section-header">
          <h2 className="section-title">Quick Access</h2>
        </div>

        <div className="quick-access-grid">
          <div className="quick-access-card" onClick={() => navigate(`${basePath}/application/overview`)}>
            <div className="quick-access-icon">
              <UniversityAppIcon />
            </div>
            <div className="quick-access-content">
              <h4 className="quick-access-title">University Application</h4>
              <p className="quick-access-description">
                Complete your university application in easy steps
              </p>
            </div>
            <div className="quick-access-arrow">→</div>
          </div>

          <div className="quick-access-card" onClick={() => navigate(`${basePath}/college-search`)}>
            <div className="quick-access-icon">
              <CollegeSearchIcon />
            </div>
            <div className="quick-access-content">
              <h4 className="quick-access-title">Explore Programs</h4>
              <p className="quick-access-description">
                Browse detailed program information for partner universities
              </p>
            </div>
            <div className="quick-access-arrow">→</div>
          </div>

          <div className="quick-access-card" onClick={() => navigate(`${basePath}/college-search`)}>
            <div className="quick-access-icon">
              <CoursesIcon />
            </div>
            <div className="quick-access-content">
              <h4 className="quick-access-title">View Course Details</h4>
              <p className="quick-access-description">
                Click on any university to see available courses and programs
              </p>
            </div>
            <div className="quick-access-arrow">→</div>
          </div>
        </div>
      </section>

      {/* Help & Support Section */}
      <section className="content-section help-section">
        <div className="section-header">
          <h2 className="section-title">Help & Support</h2>
        </div>

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

        <div className="faq-section">
          <h3 className="faq-section-title">Frequently Asked Questions</h3>
          <div className="faq-list">
            {faqItems.map((faq, index) => (
              <div key={index} className="faq-card">
                <div className="faq-content">
                  <h4 className="faq-question">{faq.question}</h4>
                  <p className="faq-answer">{faq.shortAnswer}</p>
                </div>
                <button 
                  className="faq-action-button"
                  onClick={() => alert(faq.answer)}
                >
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
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        // SVG Icons passed to DashboardLayout
        DashboardIcon={DashboardIcon}
        UniversityAppIcon={UniversityAppIcon}
        ProfileIcon={ProfileIcon}
        FamilyIcon={FamilyIcon}
        EducationIcon={EducationIcon}
        TestingIcon={TestingIcon}
        ActivitiesIcon={ActivitiesIcon}
        WritingIcon={WritingIcon}
        MyCollegesIcon={MyCollegesIcon}
        CoursesIcon={CoursesIcon}
        CollegeSearchIcon={CollegeSearchIcon}
        DirectAdmissionsIcon={DirectAdmissionsIcon}
        FinancialAidIcon={FinancialAidIcon}
        SettingsIcon={SettingsIcon}
        SignOutIcon={SignOutIcon}
        ChevronDownIcon={ChevronDownIcon}
        ChevronRightIcon={ChevronRightIcon}
        MenuIcon={MenuIcon}
        CloseIcon={CloseIcon}
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