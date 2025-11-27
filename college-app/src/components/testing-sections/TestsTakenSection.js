// src/components/testing-sections/TestsTakenSection.js
import React from 'react';
import './TestsTakenSection.css';

const TestsTakenSection = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange,
  clearAnswer,
  clearArrayAnswer 
}) => {
  const testTypes = [
    { id: 'act-tests', name: 'ACT Tests' },
    { id: 'sat-tests', name: 'SAT Tests' },
    { id: 'sat-subject-tests', name: 'SAT Subject Tests' },
    { id: 'ap-subject-tests', name: 'AP Subject Tests' },
    { id: 'ib-subject-tests', name: 'IB Subject Tests' },
    { id: 'cambridge', name: 'Cambridge' },
    { id: 'toefl-ibt', name: 'TOEFL iBT' },
    { id: 'pte-academic-tests', name: 'PTE Academic Tests' },
    { id: 'ielts', name: 'IELTS' },
    { id: 'duolingo-english-test', name: 'Duolingo English Test' }
  ];

  const handleTestSelection = (testId) => {
    handleArrayChange('testsToReport', testId);
  };

  const isTestSelected = (testId) => {
    return formData.testsToReport.includes(testId);
  };

  return (
    <div className="tests-taken-section">
      <h2>Tests Taken</h2>
      <div className="section-status">
        {formData.selfReportScores && formData.internationalPromotionExams ? 'Complete' : 'In Progress'}
      </div>
      
      <div className="form-content">
        {/* Main Self-Reporting Question */}
        <div className="form-group">
          <p className="question-text">
            In addition to sending official score reports as required by colleges, do you wish to self-report scores or future test dates for any of the following standardized tests: ACT, SAT/SAT Subject, AP, IB, Cambridge, TOEFL, PTE Academic, IELTS, and Duolingo English Test?*
          </p>
          <div className="radio-group-horizontal">
            <label className="radio-option">
              <input
                type="radio"
                name="selfReportScores"
                value="yes"
                checked={formData.selfReportScores === 'yes'}
                onChange={handleInputChange}
              />
              <span className="radio-label">Yes</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="selfReportScores"
                value="no"
                checked={formData.selfReportScores === 'no'}
                onChange={handleInputChange}
              />
              <span className="radio-label">No</span>
            </label>
          </div>
          <button 
            type="button" 
            className="clear-answer-button"
            onClick={() => clearAnswer('selfReportScores')}
          >
            Clear answer
          </button>
        </div>

        {/* Tests to Report Section - Show all test types as selectable checkboxes */}
        {formData.selfReportScores === 'yes' && (
          <div className="form-group">
            <p className="question-text">
              Indicate all tests you wish to report. Be sure to include tests you expect to take in addition to tests you have already taken.*
            </p>
            
            {/* Test Types as Selectable Checkboxes */}
            <div className="test-types-grid">
              {testTypes.map((test) => (
                <label key={test.id} className="test-checkbox-item">
                  <input
                    type="checkbox"
                    checked={isTestSelected(test.id)}
                    onChange={() => handleTestSelection(test.id)}
                  />
                  <span className="test-checkbox-label">{test.name}</span>
                  {isTestSelected(test.id) && (
                    <span className="test-selected-icon">✓</span>
                  )}
                </label>
              ))}
            </div>
            <button 
              type="button" 
              className="clear-answer-button"
              onClick={() => clearArrayAnswer('testsToReport')}
            >
              Clear all selections
            </button>
          </div>
        )}

        {/* International Applicant Question */}
        <div className="form-group">
          <p className="question-text">
            <strong>International applicants:</strong> Is promotion within your educational system based upon standard leaving examinations given at the end of lower and/or senior secondary school by a state or national leaving examinations board? (Students studying in the US typically answer no to this question.)
          </p>
          <div className="radio-group-horizontal">
            <label className="radio-option">
              <input
                type="radio"
                name="internationalPromotionExams"
                value="yes"
                checked={formData.internationalPromotionExams === 'yes'}
                onChange={handleInputChange}
              />
              <span className="radio-label">Yes</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="internationalPromotionExams"
                value="no"
                checked={formData.internationalPromotionExams === 'no'}
                onChange={handleInputChange}
              />
              <span className="radio-label">No</span>
            </label>
          </div>
          <button 
            type="button" 
            className="clear-answer-button"
            onClick={() => clearAnswer('internationalPromotionExams')}
          >
            Clear answer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestsTakenSection;