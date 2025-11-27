import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const DashboardLayout = ({ userData, children, activeMainSection, onSectionChange, userColleges = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    testing: false,
    colleges: false,
    writing: false,
    activities: false,
    expandedColleges: {}
  });
  const [forceUpdate, setForceUpdate] = useState(0);

  const API_URL = process.env.REACT_APP_API_URL;

  // Auto-expand sections when on their pages
  useEffect(() => {
    const path = location.pathname;
    
    if (path.includes('/testing')) {
      setExpandedSections(prev => ({
        ...prev,
        testing: true
      }));
    }
    
    if (path.includes('/colleges') && !path.includes('/college-search')) {
      setExpandedSections(prev => ({
        ...prev,
        colleges: true
      }));
    }
    
    if (path.includes('/writing')) {
      setExpandedSections(prev => ({
        ...prev,
        writing: true
      }));
    }
    
    if (path.includes('/activities')) {
      setExpandedSections(prev => ({
        ...prev,
        activities: true
      }));
    }
  }, [location.pathname]);

  // Auto-expand specific college when on its pages
  useEffect(() => {
    if (location.pathname.includes('/colleges/')) {
      const pathParts = location.pathname.split('/');
      const collegeIdIndex = pathParts.findIndex(part => part === 'colleges') + 1;
      if (collegeIdIndex < pathParts.length && pathParts[collegeIdIndex]) {
        const collegeId = pathParts[collegeIdIndex];
        if (collegeId && collegeId !== 'colleges') {
          setExpandedSections(prev => ({
            ...prev,
            expandedColleges: {
              ...prev.expandedColleges,
              [collegeId]: true
            }
          }));
        }
      }
    }
  }, [location.pathname]);

  // Listen for storage changes to force re-render
  useEffect(() => {
    const handleStorageChange = () => {
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Listen for college form updates to show/hide international section
  useEffect(() => {
    const handleCollegeFormUpdate = () => {
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('collegeFormUpdated', handleCollegeFormUpdate);
    return () => {
      window.removeEventListener('collegeFormUpdated', handleCollegeFormUpdate);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCollege = (collegeId) => {
    setExpandedSections(prev => ({
      ...prev,
      expandedColleges: {
        ...prev.expandedColleges,
        [collegeId]: !prev.expandedColleges[collegeId]
      }
    }));
  };

  // Get selected tests from userData or localStorage
  const getSelectedTests = () => {
    if (userData?.testingData?.testsToReport) {
      return userData.testingData.testsToReport;
    }
    
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        return parsedData.testingData?.testsToReport || [];
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
    
    return [];
  };

  // Test types mapping
  const testTypes = [
    { id: 'act-tests', name: 'ACT Tests', route: '/dashboard/testing/act-tests' },
    { id: 'sat-tests', name: 'SAT Tests', route: '/dashboard/testing/sat-tests' },
    { id: 'sat-subject-tests', name: 'SAT Subject Tests', route: '/dashboard/testing/sat-subject-tests' },
    { id: 'ap-subject-tests', name: 'AP Subject Tests', route: '/dashboard/testing/ap-subject-tests' },
    { id: 'ib-subject-tests', name: 'IB Subject Tests', route: '/dashboard/testing/ib-subject-tests' },
    { id: 'cambridge', name: 'Cambridge', route: '/dashboard/testing/cambridge' },
    { id: 'toefl-ibt', name: 'TOEFL iBT', route: '/dashboard/testing/toefl-ibt' },
    { id: 'pte-academic-tests', name: 'PTE Academic Tests', route: '/dashboard/testing/pte-academic-tests' },
    { id: 'ielts', name: 'IELTS', route: '/dashboard/testing/ielts' },
    { id: 'duolingo-english-test', name: 'Duolingo English Test', route: '/dashboard/testing/duolingo-english-test' }
  ];

  // Filter test types to show only selected ones
  const selectedTests = getSelectedTests();
  const selectedTestTypes = selectedTests.length > 0 
    ? testTypes.filter(test => selectedTests.includes(test.id))
    : [];

  // CollegeSidebarItem Component with proper active states
  const CollegeSidebarItem = ({ college, isExpanded, onToggle, onNavigate }) => {
    const [showInternational, setShowInternational] = useState(false);

    // Check if international section should be shown
    useEffect(() => {
      const shouldShowInternational = localStorage.getItem(`college_${college.collegeId}_show_international`) === 'true';
      setShowInternational(shouldShowInternational);
    }, [college.collegeId]);

    // Listen for updates to international section visibility
    useEffect(() => {
      const handleCollegeFormUpdate = (event) => {
        if (event.detail.collegeId === college.collegeId) {
          setShowInternational(event.detail.showInternational);
        }
      };

      window.addEventListener('collegeFormUpdated', handleCollegeFormUpdate);
      return () => {
        window.removeEventListener('collegeFormUpdated', handleCollegeFormUpdate);
      };
    }, [college.collegeId]);

    const applicationSubsections = [
      { id: 'general', name: 'General' },
      { id: 'academics', name: 'Academics' },
      { id: 'high-school', name: 'High School Curriculum' },
      { id: 'activities', name: 'Activities' },
      { id: 'contacts', name: 'Contacts' },
      { id: 'family', name: 'Family' },
      { id: 'residency', name: 'Residency' },
      ...(showInternational ? [{ id: 'international', name: 'International Student Information' }] : []),
    ];

    // Check if this college is active (any of its pages)
    const isCollegeActive = location.pathname.includes(`/colleges/${college.collegeId}`);

    return (
      <li className="nav-college-item">
        {/* College Header */}
        <div 
          className={`nav-college-header ${isCollegeActive ? 'active' : ''}`}
          onClick={onToggle}
        >
          <span className="nav-text">{college.name}</span>
          <span className="expand-icon">{isExpanded ? '▼' : '►'}</span>
        </div>
        
        {/* College Sub-sections */}
        {isExpanded && (
          <ul className="nav-college-submenu">
            {/* APPLICATION Section */}
            <li className="nav-college-subitem">
              <div className="nav-college-subheader">
                <span className="nav-text">APPLICATION</span>
              </div>
              <ul className="nav-application-submenu">
                {applicationSubsections.map((subsection) => {
                  const isSubsectionActive = location.pathname === `/dashboard/colleges/${college.collegeId}/${subsection.id}`;
                  
                  return (
                    <li key={subsection.id} className={`nav-application-subitem ${isSubsectionActive ? 'active' : ''}`}>
                      <div 
                        className={`nav-content ${isSubsectionActive ? 'active' : ''}`}
                        onClick={() => {
                          onNavigate(`college-${college.collegeId}-${subsection.id}`);
                        }}
                      >
                        <span className="nav-text">{subsection.name}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* Review Section */}
            <li className={`nav-college-subitem ${location.pathname === `/dashboard/colleges/${college.collegeId}/review` ? 'active' : ''}`}>
              <div 
                className={`nav-content ${location.pathname === `/dashboard/colleges/${college.collegeId}/review` ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(`college-${college.collegeId}-review`);
                }}
              >
                <span className="nav-text">Review and submit application</span>
              </div>
            </li>
          </ul>
        )}
      </li>
    );
  };

  // Handle college subsection navigation
  const handleCollegeSubsectionNavigate = (sectionId) => {
    const parts = sectionId.split('-');
    const collegeId = parts[1];
    const subsection = parts.slice(2).join('-');
    
    // Navigate to the specific subsection
    navigate(`/dashboard/colleges/${collegeId}/${subsection}`);
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
            <li className={`nav-item ${location.pathname.includes('/feewaiver') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => onSectionChange('feewaiver')}>
                <span className="nav-text">Common App Fee Waiver</span>
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
              <div className="nav-content" onClick={() => navigate('/dashboard/education/current-school')}>
                <span className="nav-text">Current or Most Recent Secondary/High School</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/other-schools') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate('/dashboard/education/other-schools')}>
                <span className="nav-text">Other Secondary/High Schools</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/colleges') && !location.pathname.includes('/dashboard/colleges') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate('/dashboard/education/colleges')}>
                <span className="nav-text">Colleges & Universities</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/grades') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate('/dashboard/education/grades')}>
                <span className="nav-text">Grades</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/current-courses') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate('/dashboard/education/current-courses')}>
                <span className="nav-text">Current or Most Recent Year Courses</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/honors') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate('/dashboard/education/honors')}>
                <span className="nav-text">Honors</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/community-organizations') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate('/dashboard/education/community-organizations')}>
                <span className="nav-text">Community-Based Organizations</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/future-plans') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate('/dashboard/education/future-plans')}>
                <span className="nav-text">Future Plans</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/documents') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate('/dashboard/education/documents')}>
                <span className="nav-text">Documents Upload</span>
              </div>
            </li>
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
              <div className="nav-content" onClick={() => navigate('/dashboard/writing/personal-essay')}>
                <span className="nav-text">Personal Essay</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/additional-information') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate('/dashboard/writing/additional-information')}>
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
            <li className={`nav-item ${location.pathname === '/dashboard/activities' ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate('/dashboard/activities')}>
                <span className="nav-text">Activities</span>
              </div>
            </li>
            <li className={`nav-item ${location.pathname.includes('/responsibilities') ? 'active' : ''}`}>
              <div className="nav-content" onClick={() => navigate('/dashboard/activities/responsibilities')}>
                <span className="nav-text">Responsibilities</span>
              </div>
            </li>
          </ul>
        </div>
      );
    }

    // Default dashboard sidebar with expandable sections
    return (
      <div className="nav-section">
        <h4 className="nav-section-title">Dashboard</h4>
        <ul className="nav-menu">
          <li className={`nav-item ${activeMainSection === 'application' ? 'active' : ''}`}>
            <div className="nav-content" onClick={() => onSectionChange('application')}>
              <span className="nav-text">My Common Application</span>
            </div>
          </li>
          
          {/* Family Section */}
          <li className={`nav-item ${activeMainSection === 'family' ? 'active' : ''}`}>
            <div className="nav-content" onClick={() => onSectionChange('family')}>
              <span className="nav-text">Family</span>
            </div>
          </li>
          
          {/* Expandable My Colleges Section */}
          <li className="nav-section-expandable">
            <div 
              className={`nav-header ${expandedSections.colleges ? 'expanded' : ''}`}
              onClick={() => toggleSection('colleges')}
            >
              <span className="nav-text">My Colleges</span>
              <div className="nav-header-right">
                <span className="expand-icon">{expandedSections.colleges ? '▼' : '►'}</span>
              </div>
            </div>
            {expandedSections.colleges && (
              <ul className="nav-submenu">
                {/* Overview Item */}
                <li className={`nav-subitem ${location.pathname === '/dashboard/colleges' ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => onSectionChange('colleges')}>
                    <span className="nav-text">Overview</span>
                  </div>
                </li>
                
                {/* Individual Colleges */}
                {userColleges.length > 0 ? (
                  userColleges.map((college) => {
                    return (
                      <CollegeSidebarItem 
                        key={college.collegeId}
                        college={college}
                        isExpanded={expandedSections.expandedColleges[college.collegeId]}
                        onToggle={() => toggleCollege(college.collegeId)}
                        onNavigate={handleCollegeSubsectionNavigate}
                      />
                    );
                  })
                ) : (
                  <li className="nav-subitem">
                    <div className="nav-content">
                      <span className="nav-text" style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        No colleges added
                      </span>
                    </div>
                  </li>
                )}
              </ul>
            )}
          </li>
          
          {/* Expandable Testing Section */}
          <li className="nav-section-expandable">
            <div 
              className={`nav-header ${expandedSections.testing ? 'expanded' : ''}`}
              onClick={() => toggleSection('testing')}
            >
              <span className="nav-text">Testing</span>
              <span className="expand-icon">{expandedSections.testing ? '▼' : '►'}</span>
            </div>
            {expandedSections.testing && (
              <ul className="nav-submenu">
                {/* Always show Tests Taken */}
                <li className={`nav-subitem ${location.pathname.includes('/tests-taken') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate('/dashboard/testing/tests-taken')}>
                    <span className="nav-text">Tests Taken</span>
                  </div>
                </li>
                
                {/* Show selected test types only */}
                {selectedTestTypes.length > 0 ? (
                  selectedTestTypes.map((test) => (
                    <li key={test.id} className={`nav-subitem ${location.pathname.includes(test.id) ? 'active' : ''}`}>
                      <div className="nav-content" onClick={() => navigate(test.route)}>
                        <span className="nav-text">{test.name}</span>
                      </div>
                    </li>
                  ))
                ) : (
                  /* Show message when no tests selected */
                  <li className="nav-subitem">
                    <div className="nav-content">
                      <span className="nav-text" style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        No tests selected
                      </span>
                    </div>
                  </li>
                )}
              </ul>
            )}
          </li>

          {/* Expandable Activities Section */}
          <li className="nav-section-expandable">
            <div 
              className={`nav-header ${expandedSections.activities ? 'expanded' : ''}`}
              onClick={() => toggleSection('activities')}
            >
              <span className="nav-text">Activities</span>
              <span className="expand-icon">{expandedSections.activities ? '▼' : '►'}</span>
            </div>
            {expandedSections.activities && (
              <ul className="nav-submenu">
                <li className={`nav-subitem ${location.pathname === '/dashboard/activities' ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate('/dashboard/activities')}>
                    <span className="nav-text">Activities</span>
                  </div>
                </li>
                <li className={`nav-subitem ${location.pathname.includes('/responsibilities') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate('/dashboard/activities/responsibilities')}>
                    <span className="nav-text">Responsibilities</span>
                  </div>
                </li>
              </ul>
            )}
          </li>

          {/* Expandable Writing Section */}
          <li className="nav-section-expandable">
            <div 
              className={`nav-header ${expandedSections.writing ? 'expanded' : ''}`}
              onClick={() => toggleSection('writing')}
            >
              <span className="nav-text">Writing</span>
              <span className="expand-icon">{expandedSections.writing ? '▼' : '►'}</span>
            </div>
            {expandedSections.writing && (
              <ul className="nav-submenu">
                <li className={`nav-subitem ${location.pathname.includes('/personal-essay') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate('/dashboard/writing/personal-essay')}>
                    <span className="nav-text">Personal Essay</span>
                  </div>
                </li>
                <li className={`nav-subitem ${location.pathname.includes('/additional-information') ? 'active' : ''}`}>
                  <div className="nav-content" onClick={() => navigate('/dashboard/writing/additional-information')}>
                    <span className="nav-text">Additional Information</span>
                  </div>
                </li>
              </ul>
            )}
          </li>

          <li className={`nav-item ${location.pathname.includes('/college-search') ? 'active' : ''}`}>
            <div className="nav-content" onClick={() => navigate('/dashboard/college-search')}>
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
            <h2 className="brand-logo">College App</h2>
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
              <p className="user-id">{userData?.studentId || 'CAID Loading...'}</p>
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