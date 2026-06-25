// src/components/EducationPreview.js
import React from 'react';
import './EducationPreview.css'

// Section name mapping - URL names to database field names
const SECTION_NAME_MAP = {
  'current-school': 'currentSchool',
  'other-schools': 'otherSchools', 
  'colleges': 'colleges',
  'grades': 'grades',
  'current-courses': 'currentCourses',
  'honors': 'honors',
  'community-organizations': 'communityOrganizations',
  'future-plans': 'futurePlans',
  'documents': 'documents'
};

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
    // Convert URL key to database field name
    const dbSectionKey = SECTION_NAME_MAP[sectionKey];
    return educationData.educationCompletion?.[dbSectionKey] || false;
  };

  const getSectionSummary = (sectionKey) => {
    // Convert URL key to database field name
    const dbSectionKey = SECTION_NAME_MAP[sectionKey];
    const data = educationData[dbSectionKey];
    
    switch (dbSectionKey) {
      case 'currentSchool':
        return data?.schoolName ? `School: ${data.schoolName}` : 'Not provided';
      
      case 'otherSchools':
        return data?.schools?.length > 0 ? `${data.schools.length} school(s) added` : 'No schools added';
      
      case 'colleges':
        return data?.collegesList?.length > 0 ? `${data.collegesList.length} college(s) added` : 'No colleges added';
      
      case 'grades':
        return data?.cumulativeGPA ? `GPA: ${data.cumulativeGPA}` : 'Not provided';
      
      case 'currentCourses':
        return data?.courses?.length > 0 ? `${data.courses.length} course(s) added` : 'No courses added';
      
      case 'honors':
        return data?.reportHonors === 'yes' ? 'Honors reported' : 'No honors reported';
      
      case 'communityOrganizations':
        return data?.organizations?.length > 0 ? `${data.organizations.length} organization(s) added` : 'No organizations added';
      
      case 'futurePlans':
        return data?.studentType ? `Student type: ${data.studentType}` : 'Not provided';
      
      case 'documents':
        const docCount = [data?.passport, data?.tenthMarksheet, data?.twelfthMarksheet].filter(Boolean).length;
        return `${docCount} document(s) uploaded`;
      
      default:
        return 'Not provided';
    }
  };

  // Check if all sections are completed
  const allSectionsCompleted = sections.every(section => getCompletionStatus(section.key));

  return (
    <div className="education-preview">
      <div className="preview-header">
        <h2>Education Information Preview</h2>
        <p>Review your education information before final submission.</p>
        
        {/* Overall Completion Status */}
        <div className={`overall-status ${allSectionsCompleted ? 'completed' : 'incomplete'}`}>
          {allSectionsCompleted ? '✓ All sections completed' : '✗ Some sections are incomplete'}
        </div>
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
          disabled={saving || !allSectionsCompleted}
        >
          {saving ? 'Submitting...' : 'Submit Education Information'}
        </button>
      </div>

      <div className="preview-note">
        <p>
          <strong>Note:</strong> Once submitted, you can still make changes to your education information 
          until you finalize your college applications.
        </p>
        {!allSectionsCompleted && (
          <p style={{color: '#dc2626', marginTop: '8px'}}>
            <strong>Important:</strong> Complete all sections before submitting.
          </p>
        )}
      </div>
    </div>
  );
};

export default EducationPreview;