// src/components/testing-sections/SATSubjectTestsSection.js
import React, { useState, useEffect, useRef } from 'react';
import './SATSubjectTestsSection.css';

const SATSubjectTestsSection = ({ 
  formData = {}, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [numberOfTests, setNumberOfTests] = useState(() => {
    return formData.numberOfSATSubjectTests || '';
  });
  const [tests, setTests] = useState(() => {
    return formData.satSubjectTests || [];
  });
  const [showErrors, setShowErrors] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(null);
  const [currentDateField, setCurrentDateField] = useState(null);

  // Subject options exactly as per document
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

  // Score options from 200 to 800
  const scoreOptions = Array.from({ length: 601 }, (_, i) => 800 - i);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years from 1990 to 2026
  const generateYears = () => {
    const years = [];
    for (let year = 1990; year <= 2026; year++) {
      years.push(year);
    }
    return years;
  };

  // Check if section is complete
  const isSectionComplete = () => {
    if (!numberOfTests || numberOfTests === '') return false;
    
    const count = parseInt(numberOfTests);
    if (count === 0) return true;
    
    for (let i = 0; i < count; i++) {
      const test = tests[i];
      if (!test || !test.subject || !test.date) {
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

    if (count < tests.length) {
      const newTests = tests.slice(0, count);
      setTests(newTests);
      if (handleInputChange) {
        handleInputChange({ target: { name: 'satSubjectTests', value: newTests } });
      }
    } 
    else if (count > tests.length) {
      const newTests = [...tests];
      for (let i = tests.length; i < count; i++) {
        newTests.push({ subject: '', score: '', date: '' });
      }
      setTests(newTests);
      if (handleInputChange) {
        handleInputChange({ target: { name: 'satSubjectTests', value: newTests } });
      }
    }
  }, [numberOfTests]);

  // Handle number of tests change
  const handleNumberOfTestsChange = (e) => {
    const value = e.target.value;
    setNumberOfTests(value);
    if (handleInputChange) {
      handleInputChange({ target: { name: 'numberOfSATSubjectTests', value: value } });
    }
    setShowErrors(false);
    
    if (value === '0' && clearRelatedFields) {
      clearRelatedFields('numberOfSATSubjectTests', ['satSubjectTests']);
    }
  };

  // Handle individual test field changes
  const handleTestChange = (index, field, value) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, [field]: value } : test
    );
    setTests(updatedTests);
    if (handleInputChange) {
      handleInputChange({ target: { name: 'satSubjectTests', value: updatedTests } });
    }
  };

  // Handle year selection for date picker
  const handleYearSelect = (index, year) => {
    setSelectedYear(year);
    setCurrentTestIndex(index);
    setCurrentDateField('date');
    setShowCalendar(true);
  };

  // Handle month selection for date picker
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
  };

  // Confirm date selection
  const handleConfirmDate = () => {
    if (selectedMonth && selectedYear && currentTestIndex !== null) {
      const fullDate = `${selectedMonth} ${selectedYear}`;
      handleTestChange(currentTestIndex, 'date', fullDate);
      setShowCalendar(false);
      setSelectedYear(null);
      setSelectedMonth(null);
      setCurrentTestIndex(null);
      setCurrentDateField(null);
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.satsubjecttestssection-calendar-container')) {
        setShowCalendar(false);
        setSelectedYear(null);
        setSelectedMonth(null);
        setCurrentTestIndex(null);
        setCurrentDateField(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // Check if a specific test field is missing
  const isFieldMissing = (test, field) => {
    return showErrors && !test?.[field];
  };

  // Handle clearing all tests
  const handleClearAllTests = () => {
    setNumberOfTests('');
    setTests([]);
    if (clearRelatedFields) {
      clearRelatedFields('numberOfSATSubjectTests', ['satSubjectTests']);
    } else if (clearAnswer) {
      clearAnswer('numberOfSATSubjectTests');
      clearAnswer('satSubjectTests');
    }
  };

  // Check if any test has data
  const hasAnyTestData = () => {
    return tests.some(test => 
      test.subject || test.score || test.date
    );
  };

  return (
    <div className="satsubjecttestssection-container">
      <div className="satsubjecttestssection-card">
        <div className="satsubjecttestssection-card-header">
          <h2 className="satsubjecttestssection-card-title">SAT Subject Tests</h2>
          <div className="satsubjecttestssection-status-badge">
            {isSectionComplete() ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="satsubjecttestssection-form-content">
          {/* Number of Tests Question */}
          <div className="satsubjecttestssection-form-group">
            <label className="satsubjecttestssection-question-label required">
              Number of SAT Subject Tests you wish to report, including tests you expect to take*
            </label>
            <div className="satsubjecttestssection-select-group">
              <select
                name="numberOfSATSubjectTests"
                value={numberOfTests}
                onChange={handleNumberOfTestsChange}
                className={`satsubjecttestssection-select ${showErrors && !numberOfTests ? 'error' : ''}`}
              >
                <option value="">Choose an option</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num.toString()}>{num}</option>
                ))}
              </select>
            </div>
            {numberOfTests && numberOfTests !== '0' && hasAnyTestData() && (
              <button 
                type="button" 
                className="satsubjecttestssection-clear-link"
                onClick={handleClearAllTests}
              >
                Clear all tests
              </button>
            )}
            {showErrors && !numberOfTests && (
              <div className="satsubjecttestssection-error-message">
                Please complete this required question.
              </div>
            )}
          </div>

          {/* Dynamic Test Forms based on number selected */}
          {numberOfTests && parseInt(numberOfTests) > 0 && (
            <div className="satsubjecttestssection-tests-container">
              {tests.map((test, index) => (
                <div key={index} className="satsubjecttestssection-test-entry">
                  <h3>Test {index + 1}</h3>
                  
                  {/* Subject Field - First as per document order */}
                  <div className="satsubjecttestssection-form-group">
                    <label className="satsubjecttestssection-question-label required">Subject*</label>
                    <select
                      value={test.subject || ''}
                      onChange={(e) => handleTestChange(index, 'subject', e.target.value)}
                      className={`satsubjecttestssection-select ${isFieldMissing(test, 'subject') ? 'error' : ''}`}
                    >
                      <option value="">Choose an option</option>
                      {subjectOptions.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    {isFieldMissing(test, 'subject') && (
                      <div className="satsubjecttestssection-error-message">
                        Please complete this required question.
                      </div>
                    )}
                  </div>

                  {/* Score Field - Optional as per document */}
                  <div className="satsubjecttestssection-form-group">
                    <label className="satsubjecttestssection-question-label">Score (200-800)</label>
                    <select
                      value={test.score || ''}
                      onChange={(e) => handleTestChange(index, 'score', e.target.value)}
                      className="satsubjecttestssection-select"
                    >
                      <option value="">Choose an option</option>
                      {scoreOptions.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>

                  {/* Test Date Field */}
                  <div className="satsubjecttestssection-form-group">
                    <label className="satsubjecttestssection-question-label required">Test Date*</label>
                    <div className="satsubjecttestssection-input-container">
                      {!test.date ? (
                        <select
                          value={selectedYear || ''}
                          onChange={(e) => handleYearSelect(index, e.target.value)}
                          className={`satsubjecttestssection-select ${isFieldMissing(test, 'date') ? 'error' : ''}`}
                        >
                          <option value="">- Select Year -</option>
                          {generateYears().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="satsubjecttestssection-selected-date">
                          {test.date}
                          <button
                            type="button"
                            className="satsubjecttestssection-change-date"
                            onClick={() => handleTestChange(index, 'date', '')}
                          >
                            Change
                          </button>
                        </div>
                      )}
                      <div className="satsubjecttestssection-field-note">Date uses "month year" format (e.g., August 2020)</div>
                    </div>

                    {/* Calendar Popup */}
                    {showCalendar && currentTestIndex === index && (
                      <div className="satsubjecttestssection-calendar-container">
                        <div className="satsubjecttestssection-calendar-header">
                          Select Month for {selectedYear}
                        </div>
                        <div className="satsubjecttestssection-calendar-grid">
                          {months.map(month => (
                            <button
                              key={month}
                              type="button"
                              className={`satsubjecttestssection-calendar-month ${selectedMonth === month ? 'selected' : ''}`}
                              onClick={() => handleMonthSelect(month)}
                            >
                              {month}
                            </button>
                          ))}
                        </div>
                        <div className="satsubjecttestssection-calendar-actions">
                          <button
                            type="button"
                            className="satsubjecttestssection-calendar-confirm"
                            onClick={handleConfirmDate}
                            disabled={!selectedMonth || !selectedYear}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="satsubjecttestssection-calendar-cancel"
                            onClick={() => {
                              setShowCalendar(false);
                              setSelectedYear(null);
                              setSelectedMonth(null);
                              setCurrentTestIndex(null);
                              setCurrentDateField(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {isFieldMissing(test, 'date') && (
                      <div className="satsubjecttestssection-error-message">
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

export default SATSubjectTestsSection;