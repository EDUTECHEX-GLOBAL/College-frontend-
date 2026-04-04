import React from 'react';
import { useParams } from 'react-router-dom';
import './CollegeSubsection.css';

// Import specific subsection components
import General from './mycollege-sections/General';
import Academics from './mycollege-sections/Academics';
import HighSchoolCurriculum from './mycollege-sections/HighSchoolCurriculum';
import Activities from './mycollege-sections/Activities';
import FirstContacts from './mycollege-sections/FirstContacts';
import FirstFamily from './mycollege-sections/FirstFamily';
import FirstResidency from './mycollege-sections/FirstResidency';
import InternationalStudent from './mycollege-sections/InternationalStudent';
import Review from './mycollege-sections/FirstReview'; // Add this import

const CollegeSubsection = () => {
  const { collegeId, subsection } = useParams();

  const subsectionComponents = {
    'general': General,
    'academics': Academics,
    'high-school': HighSchoolCurriculum,
    'activities': Activities,
    'contacts': FirstContacts,
    'family': FirstFamily,
    'residency': FirstResidency,
    'international': InternationalStudent,
    'review': Review, // Add this line
  };

  const SubsectionComponent = subsectionComponents[subsection];

  // If we have a specific component for this subsection, render it
  if (SubsectionComponent) {
    return (
      <div className="college-subsection-container">
        <SubsectionComponent />
      </div>
    );
  }

  // Fallback to generic placeholder for subsections without specific components
  const subsectionTitles = {
    'info': 'College Information',
    'general': 'General Application',
    'academics': 'Academics',
    'high-school': 'High School Curriculum',
    'activities': 'Activities',
    'contacts': 'Contacts',
    'family': 'Family',
    'residency': 'Residency',
    'international': 'International Student Information',
    'review': 'Review and Submit Application'
  };

  const title = subsectionTitles[subsection] || 'College Application';

  return (
    <div className="college-subsection-container">
      <div className="college-subsection-header">
        <div className="subsection-header-nav">
          <button className="subsection-back-button" onClick={() => window.history.back()}>
            ← Back
          </button>
        </div>
        
        <div className="subsection-header-info">
          <h1 className="subsection-title">{title}</h1>
          <p className="subsection-description">
            This section is under development. Content for {subsection} will be displayed here.
          </p>
        </div>
      </div>

      <div className="college-subsection-content">
        <section className="subsection-content-section">
          <h2 className="subsection-section-title">{title}</h2>
          <div className="subsection-text-content">
            <p><strong>College ID:</strong> {collegeId}</p>
            <p><strong>Subsection:</strong> {subsection}</p>
            <p>This page will contain the specific application questions and forms for this section.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CollegeSubsection;