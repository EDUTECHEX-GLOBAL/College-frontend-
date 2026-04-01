// src/components/testing-sections/APSubjectTestsSection.js
import React, { useState, useEffect } from 'react';
import './APSubjectTestsSection.css';

const APSubjectTestsSection = ({ formData, handleInputChange }) => {
  const [numberOfTests, setNumberOfTests] = useState(formData.numberOfAPTests || '');
  const [tests, setTests] = useState(formData.apSubjectTests || []);
  const [showErrors, setShowErrors] = useState(false);
  const [showYearGrid, setShowYearGrid] = useState(null);

  // AP Subject options exactly as per Common App
  const subjectOptions = [
    'African American Studies',
    'Art History',
    'Art: 2-D Art & Design',
    'Art: 3-D Art & Design',
    'Art: Drawing',
    'Biology',
    'Calculus AB',
    'Calculus BC',
    'Chemistry',
    'Chinese Language & Culture',
    'Computer Science A',
    'Computer Science Principles',
    'Economics: Macroeconomics',
    'Economics: Microeconomics',
    'English Language & Composition',
    'English Literature & Composition',
    'Environmental Science',
    'European History',
    'French Language & Culture',
    'German Language & Culture',
    'Government & Politics: Comparative',
    'Government & Politics: United States',
    'Human Geography',
    'Italian Language & Culture',
    'Japanese Language & Culture',
    'Latin',
    'Music Theory',
    'Physics 1',
    'Physics 2',
    'Physics C - Electricity & Magnetism',
    'Physics C Mechanics',
    'Precalculus',
    'Psychology',
    'Research',
    'Seminar',
    'Spanish Language & Culture',
    'Spanish Literature & Culture',
    'Statistics',
    'United States History',
    'World History'
  ];

  // Score options for AP Tests (1-5)
  const scoreOptions = [5, 4, 3, 2, 1];

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
      handleInputChange({ target: { name: 'apSubjectTests', value: newTests } });
    } 
    // If we're increasing the number of tests, add empty objects
    else if (count > tests.length) {
      const newTests = [...tests];
      for (let i = tests.length; i < count; i++) {
        newTests.push({ month: '', year: '', subject: '', score: '' });
      }
      setTests(newTests);
      handleInputChange({ target: { name: 'apSubjectTests', value: newTests } });
    }
  }, [numberOfTests]);

  // Handle number of tests change
  const handleNumberOfTestsChange = (e) => {
    const value = e.target.value;
    setNumberOfTests(value);
    handleInputChange({ target: { name: 'numberOfAPTests', value: value } });
    setShowErrors(false);
  };

  // Handle individual test field changes
  const handleTestChange = (index, field, value) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, [field]: value } : test
    );
    setTests(updatedTests);
    handleInputChange({ target: { name: 'apSubjectTests', value: updatedTests } });
  };

  // Handle month selection
  const handleMonthChange = (index, month) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, month, year: test.year } : test
    );
    setTests(updatedTests);
    handleInputChange({ target: { name: 'apSubjectTests', value: updatedTests } });
  };

  // Handle year selection from grid
  const handleYearSelect = (index, year) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, year: year.toString() } : test
    );
    setTests(updatedTests);
    handleInputChange({ target: { name: 'apSubjectTests', value: updatedTests } });
    setShowYearGrid(null);
  };

  // Toggle year grid visibility
  const toggleYearGrid = (index) => {
    setShowYearGrid(showYearGrid === index ? null : index);
  };

  // Check if all required fields for a test are filled
  const isTestComplete = (test) => {
    return test.month && test.year && test.subject;
  };

  // Check if a specific test field is missing
  const isFieldMissing = (test, field) => {
    return showErrors && !test[field];
  };

  // Check if section is complete
  const isSectionComplete = numberOfTests && tests.every(test => isTestComplete(test));

  // Format date for display
  const formatDate = (test) => {
    if (test.month && test.year) {
      return `${test.month} ${test.year}`;
    }
    return '';
  };

  return (
    <div className="ap-container">
      <div className="ap-card">
        <div className="ap-card-header">
          <h2 className="ap-card-title">AP Subject Tests</h2>
          <div className="ap-status-badge">
            {isSectionComplete ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="ap-form-content">
          {/* Number of Tests Question */}
          <div className="ap-form-group">
            <label className="ap-question-label required">
              Number of AP Tests you wish to report, including tests you expect to take*
            </label>
            <div className="ap-select-group">
              <select
                name="numberOfAPTests"
                value={numberOfTests}
                onChange={handleNumberOfTestsChange}
                className={`ap-select ${showErrors && !numberOfTests ? 'error' : ''}`}
              >
                <option value="">Choose an option</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(num => (
                  <option key={num} value={num.toString()}>{num}</option>
                ))}
              </select>
            </div>
            {showErrors && !numberOfTests && (
              <div className="ap-error-message">
                Please complete this required question.
              </div>
            )}
          </div>

          {/* Dynamic Test Forms based on number selected */}
          {numberOfTests && parseInt(numberOfTests) > 0 && (
            <div className="ap-tests-container">
              {tests.map((test, index) => (
                <div key={index} className="ap-test-entry">
                  <h3>Test {index + 1}</h3>
                  
                  {/* Date Field with Month Selection and Year Grid */}
                  <div className="ap-form-group">
                    <label className="ap-question-label required">Date taken or planned*</label>
                    <div className="ap-date-selection">
                      <div className="ap-month-year-selection">
                        <div className="ap-month-select-container">
                          <select
                            value={test.month || ''}
                            onChange={(e) => handleMonthChange(index, e.target.value)}
                            className={`ap-select ${isFieldMissing(test, 'month') ? 'error' : ''}`}
                          >
                            <option value="">Month</option>
                            {monthOptions.map(month => (
                              <option key={month} value={month}>{month}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="ap-year-select-container">
                          <div 
                            className={`ap-year-display ${isFieldMissing(test, 'year') ? 'error' : ''}`}
                            onClick={() => toggleYearGrid(index)}
                          >
                            {test.year || 'Year'}
                            <span className="ap-dropdown-arrow">▼</span>
                          </div>
                          
                          {showYearGrid === index && (
                            <div className="ap-year-grid-container">
                              <div className="ap-year-grid">
                                {yearRows.map((row, rowIndex) => (
                                  <div key={rowIndex} className="ap-year-row">
                                    {row.map(year => (
                                      <div
                                        key={year}
                                        className={`ap-year-option ${test.year === year.toString() ? 'selected' : ''}`}
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
                      <div className="ap-date-format-hint">
                        Date uses "month year" format (e.g. August 2002)
                      </div>
                    </div>
                    {(isFieldMissing(test, 'month') || isFieldMissing(test, 'year')) && (
                      <div className="ap-error-message">
                        Please complete this required question.
                      </div>
                    )}
                    {formatDate(test) && (
                      <div className="ap-selected-date">
                        Selected: {formatDate(test)}
                      </div>
                    )}
                  </div>

                  {/* Subject Field */}
                  <div className="ap-form-group">
                    <label className="ap-question-label required">Subject*</label>
                    <select
                      value={test.subject || ''}
                      onChange={(e) => handleTestChange(index, 'subject', e.target.value)}
                      className={`ap-select ${isFieldMissing(test, 'subject') ? 'error' : ''}`}
                    >
                      <option value="">Choose an option</option>
                      {subjectOptions.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    {isFieldMissing(test, 'subject') && (
                      <div className="ap-error-message">
                        Please complete this required question.
                      </div>
                    )}
                  </div>

                  {/* Score Field - Radio buttons for AP scores (1-5) */}
                  <div className="ap-form-group">
                    <label className="ap-question-label">Score</label>
                    <div className="ap-score-radio-group-horizontal">
                      {scoreOptions.map(score => (
                        <label key={score} className="ap-score-radio-option">
                          <input
                            type="radio"
                            name={`score-${index}`}
                            value={score}
                            checked={test.score === score.toString()}
                            onChange={(e) => handleTestChange(index, 'score', e.target.value)}
                            className="ap-score-radio-input"
                          />
                          <span className="ap-score-radio-label">{score}</span>
                        </label>
                      ))}
                    </div>
                    {test.score && (
                      <button 
                        type="button" 
                        className="ap-clear-link"
                        onClick={() => handleTestChange(index, 'score', '')}
                      >
                        Clear answer
                      </button>
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

export default APSubjectTestsSection;