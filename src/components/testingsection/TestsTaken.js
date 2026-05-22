// components/testing-sections/TestsTaken.js
import React from 'react';

const TestsTaken = ({ formData, handleInputChange }) => {
  const testOptions = [
    'ACT Tests',
    'SAT Tests',
    'SAT Subject Tests',
    'AP Subject Tests',
    'IB Subject Tests',
    'Cambridge',
    'TOEFL iBT',
    'PTE Academic Test',
    'IELTS',
    'Duolingo English Test'
  ];

  const handleTestSelection = (test) => {
    const currentTests = formData.selectedTests || [];
    const isSelected = currentTests.includes(test);
    
    if (isSelected) {
      handleInputChange('selectedTests', currentTests.filter(t => t !== test));
    } else {
      handleInputChange('selectedTests', [...currentTests, test]);
    }
  };

  const handleClearFirstQuestion = () => {
    handleInputChange('selfReportTests', null);
    handleInputChange('selectedTests', []);
  };

  const handleClearInternationalQuestion = () => {
    handleInputChange('internationalApplicant', null);
  };

  return (
    <div className="testing-section">
      <h3>Tests Taken</h3>
      <p className="section-subtitle">In progress</p>

      {/* Question 1: Self-report tests */}
      <div className="form-question">
        <label>
          In addition to sending official score reports as required by colleges, do you wish to self-report 
          scores or future test dates for any of the following standardized tests: ACT, SAT/SAT Subject, 
          AP, IB, Cambridge, TOEFL, PTE Academic, IELTS, and Duolingo English Test?*
        </label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="selfReportTests"
              value="yes"
              checked={formData.selfReportTests === true}
              onChange={() => handleInputChange('selfReportTests', true)}
            />
            <span>Yes</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="selfReportTests"
              value="no"
              checked={formData.selfReportTests === false}
              onChange={() => handleInputChange('selfReportTests', false)}
            />
            <span>No</span>
          </label>
        </div>
        <button 
          className="clear-answer-btn"
          onClick={handleClearFirstQuestion}
          type="button"
        >
          Clear answer
        </button>
      </div>

      {/* Conditional Section: If user selects "Yes" */}
      {formData.selfReportTests === true && (
        <>
          {/* Question 2: Test selection */}
          <div className="form-question">
            <label>
              Indicate all tests you wish to report. Be sure to include tests you expect to take in 
              addition to tests you have already taken.*
            </label>
            <select 
              className="form-select"
              onChange={(e) => {
                if (e.target.value) {
                  handleTestSelection(e.target.value);
                  e.target.value = '';
                }
              }}
              value=""
            >
              <option value="">- Choose one or more options -</option>
              {testOptions.map((test, index) => (
                <option key={index} value={test}>{test}</option>
              ))}
            </select>
            
            {/* Display selected tests */}
            {formData.selectedTests && formData.selectedTests.length > 0 && (
              <div className="selected-tests">
                <p><strong>Selected Tests:</strong></p>
                <ul>
                  {formData.selectedTests.map((test, index) => (
                    <li key={index}>
                      <span>{test}</span>
                      <button 
                        className="remove-btn"
                        onClick={() => handleTestSelection(test)}
                        type="button"
                        aria-label={`Remove ${test}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Question 3: International applicants */}
          <div className="form-question">
            <label className="info-label">
              <strong>International applicants:</strong> Is promotion within your educational system based 
              upon standard leaving examinations given at the end of lower and/or senior secondary school 
              by a state or national leaving examinations board? (Students studying in the US typically 
              answer no to this question.)
            </label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="internationalApplicant"
                  value="yes"
                  checked={formData.internationalApplicant === true}
                  onChange={() => handleInputChange('internationalApplicant', true)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="internationalApplicant"
                  value="no"
                  checked={formData.internationalApplicant === false}
                  onChange={() => handleInputChange('internationalApplicant', false)}
                />
                <span>No</span>
              </label>
            </div>
            <button 
              className="clear-answer-btn"
              onClick={handleClearInternationalQuestion}
              type="button"
            >
              Clear answer
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TestsTaken;
