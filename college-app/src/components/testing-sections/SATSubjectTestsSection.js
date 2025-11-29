// src/components/testing-sections/SATSubjectTestsSection.js
import React, { useState, useEffect } from 'react';
import './SATSubjectTestsSection.css';

const SATSubjectTestsSection = ({ formData, handleInputChange }) => {
  const [numberOfTests, setNumberOfTests] = useState(formData.numberOfSATTests || '');
  const [tests, setTests] = useState(formData.satSubjectTests || []);
  const [showErrors, setShowErrors] = useState(false);
  const [showYearGrid, setShowYearGrid] = useState(null); // Track which test shows year grid

  // Subject options exactly as per Common App
  const subjectOptions = [
    'Biology - Ecological',
    'Biology - Molecular',
    'Chemistry',
    'Chinese with Listening',
    'French Reading',
    'French with Listening',
    'German Reading',
    'German with Listening',
    'Italian Reading',
    'Japanese with Listening',
    'Korean with Listening',
    'Latin Reading',
    'Literature',
    'Math Level 1',
    'Math Level 2',
    'Modern Hebrew Reading',
    'Physics',
    'Spanish Reading',
    'Spanish with Listening',
    'US History',
    'World History',
    'Writing'
  ];

  // Score options from 200 to 800 as per Common App
  const scoreOptions = [
    800, 790, 780, 770, 760, 750, 740, 730, 720, 710, 700,
    690, 680, 670, 660, 650, 640, 630, 620, 610, 600,
    590, 580, 570, 560, 550, 540, 530, 520, 510, 500,
    490, 480, 470, 460, 450, 440, 430, 420, 410, 400,
    390, 380, 370, 360, 350, 340, 330, 320, 310, 300,
    290, 280, 270, 260, 250, 240, 230, 220, 210, 200
  ];

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
      handleInputChange({ target: { name: 'satSubjectTests', value: newTests } });
    } 
    // If we're increasing the number of tests, add empty objects
    else if (count > tests.length) {
      const newTests = [...tests];
      for (let i = tests.length; i < count; i++) {
        newTests.push({ month: '', year: '', subject: '', score: '' });
      }
      setTests(newTests);
      handleInputChange({ target: { name: 'satSubjectTests', value: newTests } });
    }
  }, [numberOfTests]);

  // Handle number of tests change
  const handleNumberOfTestsChange = (e) => {
    const value = e.target.value;
    setNumberOfTests(value);
    handleInputChange({ target: { name: 'numberOfSATTests', value: value } });
    setShowErrors(false); // Reset errors when number changes
  };

  // Handle individual test field changes
  const handleTestChange = (index, field, value) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, [field]: value } : test
    );
    setTests(updatedTests);
    handleInputChange({ target: { name: 'satSubjectTests', value: updatedTests } });
  };

  // Handle month selection
  const handleMonthChange = (index, month) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, month, year: test.year } : test
    );
    setTests(updatedTests);
    handleInputChange({ target: { name: 'satSubjectTests', value: updatedTests } });
  };

  // Handle year selection from grid
  const handleYearSelect = (index, year) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, year: year.toString() } : test
    );
    setTests(updatedTests);
    handleInputChange({ target: { name: 'satSubjectTests', value: updatedTests } });
    setShowYearGrid(null); // Close year grid after selection
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
    <div className="sat-subject-tests-section">
      <div className="section-header">
        <h2>SAT Subject Tests</h2>
        <div className={`section-status ${isSectionComplete ? 'complete' : 'in-progress'}`}>
          <span className="status-indicator"></span>
          {isSectionComplete ? 'Complete' : 'In Progress'}
        </div>
      </div>
      
      <div className="form-content">
        {/* Number of Tests Question */}
        <div className="form-group">
          <p className="question-text">
            Number of SAT Subject Tests you wish to report, including tests you expect to take*
          </p>
          <div className="select-group">
            <select
              name="numberOfSATTests"
              value={numberOfTests}
              onChange={handleNumberOfTestsChange}
              className={`number-select ${showErrors && !numberOfTests ? 'error' : ''}`}
            >
              <option value="">Choose an option</option>
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
                <div className="test-header">
                  <h3>Test {index + 1}</h3>
                </div>
                
                {/* Date Field with Month Selection and Year Grid */}
                <div className="form-group">
                  <p className="question-text">Date taken or planned*</p>
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
                            <div className="year-grid-header">
                              Select Year
                            </div>
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
                  <p className="question-text">Subject*</p>
                  <select
                    value={test.subject || ''}
                    onChange={(e) => handleTestChange(index, 'subject', e.target.value)}
                    className={`subject-select ${isFieldMissing(test, 'subject') ? 'error' : ''}`}
                  >
                    <option value="">Choose an option</option>
                    {subjectOptions.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  {isFieldMissing(test, 'subject') && (
                    <div className="error-message">
                      Please complete this required question.
                    </div>
                  )}
                </div>

                {/* Score Field (Optional) */}
                <div className="form-group">
                  <p className="question-text">Score</p>
                  <select
                    value={test.score || ''}
                    onChange={(e) => handleTestChange(index, 'score', e.target.value)}
                    className="score-select"
                  >
                    <option value="">Choose an option</option>
                    {scoreOptions.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SATSubjectTestsSection;