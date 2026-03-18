// src/components/EducationPreview.js
import React from 'react';
import './EducationPre.css'

const EducationPreview = ({ educationData, onEditSection, onBackToForm, onFinalSubmit, saving, message }) => {
  const sections = [
    { key: 'current-school', title: 'Current or Most Recent Secondary/High School' },
    { key: 'other-schools', title: 'Other Secondary/High Schools' },
    { key: 'colleges', title: 'Colleges & Universities' },
    { key: 'grades', title: 'Grades' },
    { key: 'current-courses', title: 'Current or Most Recent Year Courses' },
    { key: 'honors', title: 'Honors' },
    { key: 'community-organizations', title: 'Community-Based Organizations' },
    { key: 'future-plans', title: 'Future Plans' },
    { key: 'documents', title: 'Documents' }
  ];

  const getCompletionStatus = (sectionKey) => {
    return educationData.educationCompletion?.[sectionKey] || false;
  };

  const getSectionSummary = (sectionKey) => {
    const data = educationData[sectionKey];
    
    switch (sectionKey) {
      case 'current-school':
        return data?.schoolName ? `School: ${data.schoolName}` : 'Not provided';
      
      case 'other-schools':
        return data?.numberOfSchools > 0 ? `${data.numberOfSchools} school(s) added` : 'No schools added';
      
      case 'colleges':
        return data?.numberOfColleges > 0 ? `${data.numberOfColleges} college(s) added` : 'No colleges added';
      
      case 'grades':
        return data?.cumulativeGPA ? `GPA: ${data.cumulativeGPA}` : 'Not provided';
      
      case 'current-courses':
        return data?.numberOfCourses > 0 ? `${data.numberOfCourses} course(s) added` : 'No courses added';
      
      case 'honors':
        return data?.reportHonors === 'yes' ? 'Honors reported' : 'No honors reported';
      
      case 'community-organizations':
        return data?.numberOfOrganizations > 0 ? `${data.numberOfOrganizations} organization(s) added` : 'No organizations added';
      
      case 'future-plans':
        return data?.studentType ? `Student type: ${data.studentType}` : 'Not provided';
      
      case 'documents':
        const docCount = [data?.passport, data?.tenthMarksheet, data?.twelfthMarksheet].filter(Boolean).length;
        return `${docCount} document(s) uploaded`;
      
      default:
        return 'Not provided';
    }
  };

  return (
    <div className="education-preview">
      <div className="preview-header">
        <h2>Education Information Preview</h2>
        <p>Review your education information before final submission.</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {message.text}
        </div>
      )}

      <div className="preview-sections">
        {sections.map((section) => (
          <div key={section.key} className="preview-section">
            <div className="preview-section-header">
              <div>
                <h3>{section.title}</h3>
                <p className="preview-summary">{getSectionSummary(section.key)}</p>
              </div>
              <div className="preview-actions">
                <span className={`status-badge ${getCompletionStatus(section.key) ? 'completed' : 'incomplete'}`}>
                  {getCompletionStatus(section.key) ? '✓ Completed' : '✗ Incomplete'}
                </span>
                <button
                  type="button"
                  className="edit-section-btn"
                  onClick={() => onEditSection(section.key)}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="preview-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onBackToForm}
          disabled={saving}
        >
          ← Back to Form
        </button>
        
        <button
          type="button"
          className="primary-button"
          onClick={onFinalSubmit}
          disabled={saving}
        >
          {saving ? 'Submitting...' : 'Submit Education Information'}
        </button>
      </div>

      <div className="preview-note">
        <p>
          <strong>Note:</strong> Once submitted, you can still make changes to your education information 
          until you finalize your college applications.
        </p>
      </div>
    </div>
  );
};

export default EducationPreview;