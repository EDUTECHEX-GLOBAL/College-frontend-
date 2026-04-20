import React, { useState, useEffect } from 'react';
import { ibSubjects } from '../../data/ibSubjects';
import './IBSubjectTests.css';

const IBSubjectTestsSection = ({ formData, handleInputChange, clearAnswer }) => {
  const [numberOfTests, setNumberOfTests] = useState(formData.numberOfIBTests || '');
  const [tests, setTests] = useState(formData.ibSubjectTests || []);
  const [showErrors, setShowErrors] = useState(false);
  const [showYearGrid, setShowYearGrid] = useState(null);

  // Score options for IB Tests (1-7)
  const scoreOptions = [7, 6, 5, 4, 3, 2, 1];

  // Level options (SL/HL) - matching document
  const levelOptions = ['SL', 'HL'];

  // Year options grid (1998 to current year + 1) in 4-column layout
  const currentYear = new Date().getFullYear();
  const startYear = 1998;
  const endYear = currentYear + 1;
  const yearOptions = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  // Group years into rows of 4 for the grid
  const yearRows = [];
  for (let i = 0; i < yearOptions.length; i += 4) {
    yearRows.push(yearOptions.slice(i, i + 4));
  }

  // Check if section is complete
  const isSectionComplete = () => {
    if (!numberOfTests || numberOfTests === '') return false;
    
    const count = parseInt(numberOfTests);
    if (count === 0) return true;
    
    for (let i = 0; i < count; i++) {
      const test = tests[i];
      if (!test || !test.subject || !test.level || !test.year) {
        return false;
      }
    }
    
    return true;
  };

  // Initialize tests when number of tests changes
  useEffect(() => {
    if (numberOfTests === '') {
      setTests([]);
      return;
    }

    const count = parseInt(numberOfTests);
    if (isNaN(count) || count < 0) return;

    // If we're reducing the number of tests, truncate the array
    if (count < tests.length) {
      const newTests = tests.slice(0, count);
      setTests(newTests);
      handleInputChange({ target: { name: 'ibSubjectTests', value: newTests } });
    } 
    // If we're increasing the number of tests, add empty objects
    else if (count > tests.length) {
      const newTests = [...tests];
      for (let i = tests.length; i < count; i++) {
        newTests.push({ subject: '', level: '', score: '', year: '' });
      }
      setTests(newTests);
      handleInputChange({ target: { name: 'ibSubjectTests', value: newTests } });
    }
  }, [numberOfTests]);

  // Handle number of tests change
  const handleNumberOfTestsChange = (e) => {
    const value = e.target.value;
    setNumberOfTests(value);
    handleInputChange({ target: { name: 'numberOfIBTests', value: value } });
    setShowErrors(false);
  };

  // Handle individual test field changes
  const handleTestChange = (index, field, value) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, [field]: value } : test
    );
    setTests(updatedTests);
    handleInputChange({ target: { name: 'ibSubjectTests', value: updatedTests } });
  };

  // Handle year selection from grid
  const handleYearSelect = (index, year) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, year: year.toString() } : test
    );
    setTests(updatedTests);
    handleInputChange({ target: { name: 'ibSubjectTests', value: updatedTests } });
    setShowYearGrid(null);
  };

  // Toggle year grid visibility
  const toggleYearGrid = (index) => {
    setShowYearGrid(showYearGrid === index ? null : index);
  };

  // Check if a specific test field is missing
  const isFieldMissing = (test, field) => {
    return showErrors && !test[field];
  };

  // Handle validate and continue
  const handleContinue = () => {
    if (numberOfTests === '' || (parseInt(numberOfTests) > 0 && tests.some(test => !test.subject || !test.level || !test.year))) {
      setShowErrors(true);
    }
  };

  return (
    <div className="ibsubjecttestssection-container">
      <div className="ibsubjecttestssection-card">
        <div className="ibsubjecttestssection-card-header">
          <h2 className="ibsubjecttestssection-card-title">IB Subject Tests</h2>
          <div className="ibsubjecttestssection-status-badge">
            {isSectionComplete() ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="ibsubjecttestssection-form-content">
          {/* Number of Tests Question */}
          <div className="ibsubjecttestssection-form-group">
            <label className="ibsubjecttestssection-question-label required">
              Number of IB Tests you wish to report, including tests you expect to take*
            </label>
            <div className="ibsubjecttestssection-select-group">
              <select
                name="numberOfIBTests"
                value={numberOfTests}
                onChange={handleNumberOfTestsChange}
                className={`ibsubjecttestssection-select ${showErrors && !numberOfTests ? 'error' : ''}`}
              >
                <option value="">- Choose an option -</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num.toString()}>{num}</option>
                ))}
              </select>
            </div>
            {showErrors && !numberOfTests && (
              <div className="ibsubjecttestssection-error-message">
                Please complete this required question.
              </div>
            )}
          </div>

          {/* Dynamic Test Forms based on number selected */}
          {numberOfTests && parseInt(numberOfTests) > 0 && (
            <div className="ibsubjecttestssection-tests-container">
              {tests.map((test, index) => (
                <div key={index} className="ibsubjecttestssection-test-entry">
                  <h3>Test {index + 1}</h3>
                  
                  {/* Subject Field - First as per document order */}
                  <div className="ibsubjecttestssection-form-group">
                    <label className="ibsubjecttestssection-question-label required">Subject*</label>
                    <select
                      value={test.subject || ''}
                      onChange={(e) => handleTestChange(index, 'subject', e.target.value)}
                      className={`ibsubjecttestssection-select ${isFieldMissing(test, 'subject') ? 'error' : ''}`}
                    >
                      <option value="">- Choose an option -</option>
                      {ibSubjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    {isFieldMissing(test, 'subject') && (
                      <div className="ibsubjecttestssection-error-message">
                        Please complete this required question.
                      </div>
                    )}
                  </div>

                  {/* Level Field (SL/HL) */}
                  <div className="ibsubjecttestssection-form-group">
                    <label className="ibsubjecttestssection-question-label required">Level (SL/HL)*</label>
                    <div className="ibsubjecttestssection-select-with-clear">
                      <select
                        value={test.level || ''}
                        onChange={(e) => handleTestChange(index, 'level', e.target.value)}
                        className={`ibsubjecttestssection-select ${isFieldMissing(test, 'level') ? 'error' : ''}`}
                      >
                        <option value="">- Choose an option -</option>
                        {levelOptions.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      {test.level && (
                        <button 
                          type="button" 
                          className="ibsubjecttestssection-clear-link"
                          onClick={() => handleTestChange(index, 'level', '')}
                        >
                          Clear answer
                        </button>
                      )}
                    </div>
                    {isFieldMissing(test, 'level') && (
                      <div className="ibsubjecttestssection-error-message">
                        Please complete this required question.
                      </div>
                    )}
                  </div>

                  {/* Score Field - Radio buttons for IB scores (1-7) */}
                  <div className="ibsubjecttestssection-form-group">
                    <label className="ibsubjecttestssection-question-label">Score (1-7)</label>
                    <div className="ibsubjecttestssection-score-radio-group-horizontal">
                      {scoreOptions.map(score => (
                        <label key={score} className="ibsubjecttestssection-score-radio-option">
                          <input
                            type="radio"
                            name={`score-${index}`}
                            value={score}
                            checked={test.score === score.toString()}
                            onChange={(e) => handleTestChange(index, 'score', e.target.value)}
                          />
                          <span>{score}</span>
                        </label>
                      ))}
                    </div>
                    {test.score && (
                      <button 
                        type="button" 
                        className="ibsubjecttestssection-clear-link"
                        onClick={() => handleTestChange(index, 'score', '')}
                      >
                        Clear answer
                      </button>
                    )}
                  </div>

                  {/* Year Field */}
                  <div className="ibsubjecttestssection-form-group">
                    <label className="ibsubjecttestssection-question-label required">Year*</label>
                    <div className="ibsubjecttestssection-year-select-container">
                      <div 
                        className={`ibsubjecttestssection-year-display ${isFieldMissing(test, 'year') ? 'error' : ''}`}
                        onClick={() => toggleYearGrid(index)}
                      >
                        {test.year || 'Select Year'}
                        <span className="ibsubjecttestssection-dropdown-arrow">▼</span>
                      </div>
                      
                      {showYearGrid === index && (
                        <div className="ibsubjecttestssection-year-grid-container">
                          <div className="ibsubjecttestssection-year-grid">
                            {yearRows.map((row, rowIndex) => (
                              <div key={rowIndex} className="ibsubjecttestssection-year-row">
                                {row.map(year => (
                                  <div
                                    key={year}
                                    className={`ibsubjecttestssection-year-option ${test.year === year.toString() ? 'selected' : ''}`}
                                    onClick={() => handleYearSelect(index, year)}
                                  >
                                    {year}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {isFieldMissing(test, 'year') && (
                      <div className="ibsubjecttestssection-error-message">
                        Please complete this required question.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IBSubjectTestsSection;