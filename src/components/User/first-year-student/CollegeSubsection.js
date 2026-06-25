import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CollegeSubsection.css';

const CollegeSubsection = () => {
  const { collegeId, subsection } = useParams();
  const navigate = useNavigate();

  // Detect base path (firstyear / transfer)
  const isFirstYear = window.location.pathname.includes('/firstyear/');
  const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';

  // Titles
  const subsectionTitles = {
    info: 'College Information',
    general: 'General Application',
    academics: 'Academics',
    'high-school': 'High School Curriculum',
    activities: 'Activities',
    contacts: 'Contacts',
    family: 'Family',
    residency: 'Residency',
    international: 'International Student Information',
    review: 'Review and Submit Application',
  };

  const title = subsectionTitles[subsection] || 'College Application';

  return (
    <div className="college-subsection-container">
      
      {/* Header */}
      <div className="college-subsection-header">
        <div className="subsection-header-nav">
          <button
            className="subsection-back-button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(basePath);
              }
            }}
          >
            ← Back
          </button>
        </div>

        <div className="subsection-header-info">
          <h1 className="subsection-title">{title}</h1>
          <p className="subsection-description">
            This section is simplified. All application data is handled through the Master Application.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="college-subsection-content">
        <section className="subsection-content-section">
          <h2 className="subsection-section-title">{title}</h2>

          <div className="subsection-text-content">
            <p><strong>College ID:</strong> {collegeId || 'N/A'}</p>
            <p><strong>Subsection:</strong> {subsection || 'N/A'}</p>

            <p>
              You no longer need to fill separate forms for each college.
              Your data from the <strong>Master Application</strong> will be used here.
            </p>

            <button
              className="dashboard-btn dashboard-btn--primary"
              onClick={() => navigate(`${basePath}/master-application`)}
              style={{ marginTop: '16px' }}
            >
              Go to university  Application →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CollegeSubsection;