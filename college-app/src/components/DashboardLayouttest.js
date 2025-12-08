// src/components/DashboardLayout.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardLayout = ({ userData, children, activeMainSection, onSectionChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSections, setActiveSections] = useState(['tests-taken', 'senior-secondary-exams']);

  const studentType = location.pathname.includes('/transfer/') ? 'transfer' : 'firstyear';
  const basePath = `/${studentType}/dashboard`;

  // ✅ Listen for changes to active testing sections from localStorage
  useEffect(() => {
    const updateActiveSections = () => {
      const storedSections = localStorage.getItem('testingActiveSections');
      if (storedSections) {
        try {
          const sections = JSON.parse(storedSections);
          setActiveSections(sections);
          console.log('📋 DashboardLayout: Active sections updated:', sections);
        } catch (error) {
          console.error('Error parsing testingActiveSections:', error);
        }
      }
    };

    // Initial load
    updateActiveSections();

    // Listen for storage changes (when TestingForm updates)
    window.addEventListener('storage', updateActiveSections);
    
    // Also poll for changes (for same-window updates)
    const interval = setInterval(updateActiveSections, 1000);

    return () => {
      window.removeEventListener('storage', updateActiveSections);
      clearInterval(interval);
    };
  }, []);

  const getStudentId = () => {
    if (!userData) return 'CAID Loading...';
    
    const possibleIds = [
      userData.studentId,
      userData.caId,
      userData.CAID,
      userData.studentID,
      userData._id
    ];
    
    const foundId = possibleIds.find(id => id && id !== '');
    
    if (foundId) {
      if (foundId.length === 24) {
        return `CAID-${foundId.substring(0, 8).toUpperCase()}`;
      }
      return foundId;
    }
    
    return 'CAID Loading...';
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('testingActiveSections');
    navigate('/');
  };

  // Determine which sidebar to show based on active section
  const getSidebarContent = () => {
    if (activeMainSection === 'profile') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Profile</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/personal') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('personal')}>
                <span className="nav-text">Personal Information</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/contact') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('contact')}>
                <span className="nav-text">Contact Details</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/address') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('address')}>
                <span className="nav-text">Address</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/demographics') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('demographics')}>
                <span className="nav-text">Demographics</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/language') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('language')}>
                <span className="nav-text">Language</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/geography') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('geography')}>
                <span className="nav-text">Geography & Nationality</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'family') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Family</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/household') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/family/household`)}>
                <span className="nav-text">Household</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/parent1') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/family/parent1`)}>
                <span className="nav-text">Parent 1</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/parent2') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/family/parent2`)}>
                <span className="nav-text">Parent 2</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/sibling') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/family/sibling`)}>
                <span className="nav-text">Sibling</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'education') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Education</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/current-school') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/current-school`)}>
                <span className="nav-text">Current or Most Recent Secondary/High School</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/other-schools') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/other-schools`)}>
                <span className="nav-text">Other Secondary/High Schools</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/colleges') && !location.pathname.includes('/dashboard/colleges') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/colleges`)}>
                <span className="nav-text">Colleges & Universities</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/grades') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/grades`)}>
                <span className="nav-text">Grades</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/current-courses') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/current-courses`)}>
                <span className="nav-text">Current or Most Recent Year Courses</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/honors') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/honors`)}>
                <span className="nav-text">Honors</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/community-organizations') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/community-organizations`)}>
                <span className="nav-text">Community-Based Organizations</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/future-plans') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/future-plans`)}>
                <span className="nav-text">Future Plans</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/documents') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/education/documents`)}>
                <span className="nav-text">Documents Upload</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    // ✅ UPDATED - Dynamic Testing sidebar section
    if (activeMainSection === 'testing') {
      // ✅ Map section names to display names
      const sectionDisplayNames = {
        'tests-taken': 'Tests Taken',
        'act-tests': 'ACT Tests',
        'sat-tests': 'SAT Tests',
        'sat-subject-tests': 'SAT Subject Tests',
        'ap-tests': 'AP Tests',
        'ib-tests': 'IB Tests',
        'cambridge-tests': 'Cambridge Tests',
        'toefl-tests': 'TOEFL iBT',
        'pte-tests': 'PTE Academic',
        'ielts-tests': 'IELTS',
        'duolingo-tests': 'Duolingo English Test',
        'senior-secondary-exams': 'Senior Secondary Leaving Examinations'
      };
      
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Testing</h4>
          <ul className="nav-menu">
            {activeSections.map((section) => (
              <li
                key={section}
                className={`nav-item ${location.pathname.includes(`/${section}`) ? 'active' : ''}`}
              >
                <div
                  className="nav-content"
                  onClick={() => navigate(`${basePath}/testing/${section}`)}
                >
                  <span className="nav-text">{sectionDisplayNames[section]}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'writing') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Writing</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/personal-essay') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/writing/personal-essay`)}>
                <span className="nav-text">Personal Essay</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/additional-information') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/writing/additional-information`)}>
                <span className="nav-text">Additional Information</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    if (activeMainSection === 'activities') {
      return (
        <div className="nav-section">
          <h4 className="nav-section-title">Activities</h4>
          <ul className="nav-menu">
            <li className={`nav-item ${location.pathname.includes('/activities/activities') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/activities/activities`)}>
                <span className="nav-text">Activities</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/responsibilities') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate(`${basePath}/activities/responsibilities`)}>
                <span className="nav-text">Responsibilities and circumstances</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    // Default dashboard sidebar
    return (
      <div className="nav-section">
        <h4 className="nav-section-title">Dashboard</h4>
        <ul className="nav-menu">
          <li className={`nav-item ${activeMainSection === 'application' ? 'active' : ''}`}>
            <div className="nav-content" onClick={() => onSectionChange('application')}>
              <span className="nav-text">My Common Application</span>
              <div className="nav-progress">0/76</div>
            </div>
          </li>
          <li className={`nav-item ${activeMainSection === 'colleges' ? 'active' : ''}`}>
            <div className="nav-content" onClick={() => onSectionChange('colleges')}>
              <span className="nav-text">My Colleges</span>
            </div>
          </li>
          <li className="nav-item">
            <div className="nav-content">
              <span className="nav-text">College Search</span>
            </div>
          </li>
          <li className="nav-item">
            <div className="nav-content">
              <span className="nav-text">Direct Admissions</span>
            </div>
          </li>
          <li className="nav-item">
            <div className="nav-content">
              <span className="nav-text">Financial Aid</span>
            </div>
          </li>
          <li className="nav-item">
            <div className="nav-content">
              <span className="nav-text">Settings</span>
            </div>
          </li>
        </ul>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="brand-section">
            <h2 className="brand-logo">EduTechEX</h2>
          </div>
          
          <div className="user-profile-card">
            <div className="user-avatar">
              {userData?.firstName && userData?.lastName 
                ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
                : 'AA'
              }
            </div>
            <div className="user-info">
              <h3 className="user-name">
                {userData?.firstName && userData?.lastName 
                  ? `${userData.firstName} ${userData.lastName}`
                  : 'Loading...'
                }
              </h3>
              <p className="user-email">{userData?.email || 'Loading...'}</p>
              <p className="user-id">{getStudentId()}</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-navigation">
          {getSidebarContent()}
          
          {/* Fixed Sign Out Section */}
          <div className="nav-footer">
            <li className="nav-item sign-out" onClick={handleSignOut}>
              <div className="nav-content">
                <span className="nav-text">Sign Out</span>
              </div>
            </li>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
