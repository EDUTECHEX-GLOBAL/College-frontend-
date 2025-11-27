import React, { useState, useEffect } from 'react';
import { ibSubjects } from '../../data/ibSubjects';
import './IBSubjectTests.css';

const IBSubjectTestsSection = ({ formData, handleInputChange }) => {
  const [numberOfTests, setNumberOfTests] = useState(formData.numberOfIBTests || '');
  const [tests, setTests] = useState(formData.ibSubjectTests || []);
  const [showErrors, setShowErrors] = useState(false);
  const [showYearGrid, setShowYearGrid] = useState(null);

  // Score options for IB Tests (1-7)
  const scoreOptions = [7, 6, 5, 4, 3, 2, 1];

  // Level options
  const levelOptions = ['Higher level (HL)', 'Standard level (SL)'];

  // Month options for date selection
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
        newTests.push({ month: '', year: '', subject: '', level: '', score: '' });
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

  // Handle month selection
  const handleMonthChange = (index, month) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, month, year: test.year } : test
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

  // Format date for display
  const formatDate = (test) => {
    if (test.month && test.year) {
      return `${test.month} ${test.year}`;
    }
    return '';
  };

  return (
    <div className="ib-subject-tests-section">
      <h2>IB Subject Tests</h2>
      <div className="section-status">
        In progress
      </div>
      
      <div className="form-content">
        {/* Number of Tests Question */}
        <div className="form-group">
          <label className="question-label">
            Number of IB Tests you wish to report, including tests you expect to take*
          </label>
          <div className="select-group">
            <select
              name="numberOfIBTests"
              value={numberOfTests}
              onChange={handleNumberOfTestsChange}
              className={`number-select ${showErrors && !numberOfTests ? 'error' : ''}`}
            >
              <option value="">- Choose an option -</option>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num.toString()}>{num}</option>
              ))}
            </select>
          </div>
          {showErrors && !numberOfTests && (
            <div className="error-message">
              Please complete this required question.
            </div>
          )}
        </div>

        {/* Dynamic Test Forms based on number selected */}
        {numberOfTests && parseInt(numberOfTests) > 0 && (
          <div className="tests-container">
            {tests.map((test, index) => (
              <div key={index} className="test-entry">
                <h3>Test {index + 1}</h3>
                
                {/* Date Field with Month Selection and Year Grid */}
                <div className="form-group">
                  <label>Date taken or planned*</label>
                  <div className="date-selection">
                    <div className="month-year-selection">
                      <div className="month-select-container">
                        <select
                          value={test.month || ''}
                          onChange={(e) => handleMonthChange(index, e.target.value)}
                          className={`month-select ${isFieldMissing(test, 'month') ? 'error' : ''}`}
                        >
                          <option value="">Month</option>
                          {monthOptions.map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="year-select-container">
                        <div 
                          className={`year-display ${isFieldMissing(test, 'year') ? 'error' : ''}`}
                          onClick={() => toggleYearGrid(index)}
                        >
                          {test.year || 'Year'}
                          <span className="dropdown-arrow">▼</span>
                        </div>
                        
                        {showYearGrid === index && (
                          <div className="year-grid-container">
                            <div className="year-grid">
                              {yearRows.map((row, rowIndex) => (
                                <div key={rowIndex} className="year-row">
                                  {row.map(year => (
                                    <div
                                      key={year}
                                      className={`year-option ${test.year === year.toString() ? 'selected' : ''}`}
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
                    </div>
                    <div className="date-format-hint">
                      Date uses "month year" format (e.g. August 2002)
                    </div>
                  </div>
                  {(isFieldMissing(test, 'month') || isFieldMissing(test, 'year')) && (
                    <div className="error-message">
                      Please complete this required question.
                    </div>
                  )}
                  {formatDate(test) && (
                    <div className="selected-date">
                      Selected: {formatDate(test)}
                    </div>
                  )}
                </div>

                {/* Subject Field */}
                <div className="form-group">
                  <label>Subject*</label>
                  <select
                    value={test.subject || ''}
                    onChange={(e) => handleTestChange(index, 'subject', e.target.value)}
                    className={`subject-select ${isFieldMissing(test, 'subject') ? 'error' : ''}`}
                  >
                    <option value="">- Choose an option -</option>
                    {ibSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  {isFieldMissing(test, 'subject') && (
                    <div className="error-message">
                      Please complete this required question.
                    </div>
                  )}
                </div>

                {/* Level Field */}
                <div className="form-group">
                  <label>Level (select the one that applies)*</label>
                  <div className="select-with-clear">
                    <select
                      value={test.level || ''}
                      onChange={(e) => handleTestChange(index, 'level', e.target.value)}
                      className={`level-select ${isFieldMissing(test, 'level') ? 'error' : ''}`}
                    >
                      <option value="">- Choose an option -</option>
                      {levelOptions.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      className="clear-answer-button"
                      onClick={() => handleTestChange(index, 'level', '')}
                    >
                      Clear answer
                    </button>
                  </div>
                  {isFieldMissing(test, 'level') && (
                    <div className="error-message">
                      Please complete this required question.
                    </div>
                  )}
                </div>

                {/* Score Field - Radio buttons for IB scores (1-7) */}
                <div className="form-group">
                  <label>Score</label>
                  <div className="score-radio-group-horizontal">
                    {scoreOptions.map(score => (
                      <label key={score} className="score-radio-option-horizontal">
                        <input
                          type="radio"
                          name={`score-${index}`}
                          value={score}
                          checked={test.score === score.toString()}
                          onChange={(e) => handleTestChange(index, 'score', e.target.value)}
                          className="score-radio-input"
                        />
                        <span className="score-radio-custom"></span>
                        <span className="score-radio-label">{score}</span>
                      </label>
                    ))}
                  </div>
                  <button 
                    type="button" 
                    className="clear-answer-button"
                    onClick={() => handleTestChange(index, 'score', '')}
                  >
                    Clear answer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IBSubjectTestsSection;