import React, { useState, useEffect } from 'react';
import './CambridgeSection.css';

const CambridgeSection = ({ formData, handleInputChange, handleComplexChange, clearAnswer }) => {
  const [numberOfTests, setNumberOfTests] = useState(formData.cambridgeNumberOfTests || '');
  const [showErrors, setShowErrors] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(null);

  // Subject options
  const subjectOptions = [
    'Accounting', 'Afrikaans Language', 'Agriculture', 'Arabic', 'Art and Design',
    'Biblical Studies (formerly Divinity)', 'Biology', 'Business', 'Chemistry',
    'Chinese Language & Literature (or Chinese)', 'Classical Studies',
    'Co-ordinated Science double', 'Combined Science', 'Communication Technology',
    'Computer Science', 'Design & Technology', 'Design & Textiles',
    'Digital Media & Design', 'Drama', 'Dutch', 'Economics',
    'English (as an Additional Language)', 'English First Language',
    'English General Paper', 'English Language', 'English Language and Literature',
    'English Literature', 'Environmental Management', 'Food and Nutrition',
    'French', 'French Language & Literature', 'French Literature', 'Geography',
    'German', 'German Language & Literature', 'Global Perspectives', 'Greek',
    'Hindi Language', 'Hinduism', 'History', 'History (American)',
    'History (European)', 'History (International)', 'Information Technology',
    'Italian', 'Japanese', 'Latin', 'Law', 'Marine Science', 'Mathematics',
    'Mathematics (Mechanics & Probability & Statistics)', 'Mathematics (Mechanics)',
    'Mathematics (Probability & Statistics)', 'Mathematics (Pure & Mechanics & Probability & Statistics)',
    'Mathematics (Pure & Mechanics)', 'Mathematics (Pure & Probability & Statistics)',
    'Mathematics - Additional', 'Mathematics Further', 'Mathematics International',
    'Mathematics Pure', 'Media Studies', 'Music', 'Physical Science', 'Physics',
    'Portuguese', 'Psychology', 'Sanskrit', 'Sociology', 'Spanish First Language',
    'Spanish Language & Literature (or Spanish)', 'Spanish Literature',
    'Sport & Physical Education (or Physical Education)', 'Statistics', 'Swahili',
    'Tamil Language', 'Thinking Skills', 'Travel & Tourism', 'Urdu Language',
    'Vietnamese First Language', 'World Literature'
  ];

  // Level options (AS/A/O)
  const levelOptions = ['AS', 'A', 'O'];

  // Grade options (A*, A, B, C, D, E, F, G, U, Pending)
  const gradeOptions = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U', 'Pending'];

  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
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
    if (!numberOfTests || numberOfTests === '' || numberOfTests === '0') return false;
    
    const numTests = parseInt(numberOfTests);
    const tests = formData.cambridgeTests || [];
    
    for (let i = 0; i < numTests; i++) {
      const test = tests[i];
      if (!test || !test.subject || !test.level || !test.grade || !test.date) return false;
    }
    
    return true;
  };

  const handleNumberOfTestsChange = (e) => {
    const value = e.target.value;
    setNumberOfTests(value);
    handleInputChange(e);
    setShowErrors(false);
    
    if (value && value !== '' && value !== '0') {
      const num = parseInt(value);
      const currentTests = formData.cambridgeTests || [];
      const newTests = [];
      
      for (let i = 0; i < num; i++) {
        newTests.push(currentTests[i] || { subject: '', level: '', grade: '', date: '' });
      }
      
      handleComplexChange('cambridgeTests', newTests);
    } else {
      handleComplexChange('cambridgeTests', []);
    }
  };

  const handleTestFieldChange = (index, field, value) => {
    const updatedTests = [...(formData.cambridgeTests || [])];
    if (!updatedTests[index]) {
      updatedTests[index] = { subject: '', level: '', grade: '', date: '' };
    }
    updatedTests[index][field] = value;
    handleComplexChange('cambridgeTests', updatedTests);
  };

  const handleYearSelect = (index, year) => {
    setSelectedYear(year);
    setCurrentTestIndex(index);
    setShowCalendar(true);
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
  };

  const handleConfirmDate = () => {
    if (selectedMonth && selectedYear && currentTestIndex !== null) {
      const fullDate = `${selectedMonth} ${selectedYear}`;
      handleTestFieldChange(currentTestIndex, 'date', fullDate);
      setShowCalendar(false);
      setSelectedYear(null);
      setSelectedMonth(null);
      setCurrentTestIndex(null);
    }
  };

  const clearTestDate = (index) => {
    handleTestFieldChange(index, 'date', '');
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.cam-calendar-container')) {
        setShowCalendar(false);
        setSelectedYear(null);
        setSelectedMonth(null);
        setCurrentTestIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // Helper to check if a field is missing
  const isFieldMissing = (test, field) => {
    return showErrors && !test?.[field];
  };

  return (
    <div className="cam-container">
      <div className="cam-card">
        <div className="cam-card-header">
          <h2 className="cam-card-title">Cambridge Exams</h2>
          <div className="cam-status-badge">
            {isSectionComplete() ? 'Complete' : 'In Progress'}
          </div>
        </div>

        <div className="cam-content">
          {/* Number of Tests Question */}
          <div className="cam-form-section">
            <div className="cam-form-group">
              <label className="cam-question-label required">
                Number of Cambridge International subject tests you wish to report, including tests you expect to take*
              </label>
              <div className="cam-input-container">
                <select
                  name="cambridgeNumberOfTests"
                  value={numberOfTests}
                  onChange={handleNumberOfTestsChange}
                  className={`cam-select ${showErrors && (!numberOfTests || numberOfTests === '0') ? 'error' : ''}`}
                >
                  <option value="">- Choose an option -</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                </select>
              </div>
              {showErrors && (!numberOfTests || numberOfTests === '0') && (
                <div className="cam-error-message">Please complete this required question.</div>
              )}
            </div>
          </div>

          {/* Dynamic Test Fields - One per test as per document structure */}
          {numberOfTests && numberOfTests !== '' && numberOfTests !== '0' && (
            <div className="cam-tests-section">
              {Array.from({ length: parseInt(numberOfTests) }, (_, index) => {
                const test = formData.cambridgeTests?.[index] || { subject: '', level: '', grade: '', date: '' };
                return (
                  <div key={index} className="cam-test-entry">
                    <h3 className="cam-test-number">Test {index + 1}</h3>
                    
                    <div className="cam-test-fields">
                      {/* Subject Field */}
                      <div className="cam-form-group">
                        <label className="cam-question-label required">Subject*</label>
                        <div className="cam-input-container">
                          <select
                            value={test.subject || ''}
                            onChange={(e) => handleTestFieldChange(index, 'subject', e.target.value)}
                            className={`cam-select ${isFieldMissing(test, 'subject') ? 'error' : ''}`}
                          >
                            <option value="">- Choose an option -</option>
                            {subjectOptions.map(subject => (
                              <option key={subject} value={subject}>{subject}</option>
                            ))}
                          </select>
                        </div>
                        {isFieldMissing(test, 'subject') && (
                          <div className="cam-error-message">Please complete this required question.</div>
                        )}
                      </div>

                      {/* Level Field (AS/A/O) */}
                      <div className="cam-form-group">
                        <label className="cam-question-label required">Level (AS/A/O)*</label>
                        <div className="cam-input-container">
                          <select
                            value={test.level || ''}
                            onChange={(e) => handleTestFieldChange(index, 'level', e.target.value)}
                            className={`cam-select ${isFieldMissing(test, 'level') ? 'error' : ''}`}
                          >
                            <option value="">- Choose an option -</option>
                            {levelOptions.map(level => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                        </div>
                        {isFieldMissing(test, 'level') && (
                          <div className="cam-error-message">Please complete this required question.</div>
                        )}
                      </div>

                      {/* Grade Field */}
                      <div className="cam-form-group">
                        <label className="cam-question-label required">Grade*</label>
                        <div className="cam-input-container">
                          <select
                            value={test.grade || ''}
                            onChange={(e) => handleTestFieldChange(index, 'grade', e.target.value)}
                            className={`cam-select ${isFieldMissing(test, 'grade') ? 'error' : ''}`}
                          >
                            <option value="">- Choose an option -</option>
                            {gradeOptions.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </div>
                        {isFieldMissing(test, 'grade') && (
                          <div className="cam-error-message">Please complete this required question.</div>
                        )}
                      </div>

                      {/* Date Field */}
                      <div className="cam-form-group">
                        <label className="cam-question-label required">Date*</label>
                        <div className="cam-input-container">
                          {!test.date ? (
                            <select
                              value={selectedYear || ''}
                              onChange={(e) => handleYearSelect(index, e.target.value)}
                              className={`cam-select ${isFieldMissing(test, 'date') ? 'error' : ''}`}
                            >
                              <option value="">- Select Year -</option>
                              {generateYears().map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="cam-selected-date">
                              {test.date}
                              <button
                                type="button"
                                className="cam-change-date"
                                onClick={() => clearTestDate(index)}
                              >
                                Change
                              </button>
                            </div>
                          )}
                          <div className="cam-field-note">Date uses "month year" format (e.g., JUN 2020)</div>
                        </div>

                        {/* Calendar Popup */}
                        {showCalendar && currentTestIndex === index && (
                          <div className="cam-calendar-container">
                            <div className="cam-calendar-header">
                              Select Month for {selectedYear}
                            </div>
                            <div className="cam-calendar-grid">
                              {months.map(month => (
                                <button
                                  key={month}
                                  type="button"
                                  className={`cam-calendar-month ${selectedMonth === month ? 'selected' : ''}`}
                                  onClick={() => handleMonthSelect(month)}
                                >
                                  {month}
                                </button>
                              ))}
                            </div>
                            <div className="cam-calendar-actions">
                              <button
                                type="button"
                                className="cam-calendar-confirm"
                                onClick={handleConfirmDate}
                                disabled={!selectedMonth || !selectedYear}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="cam-calendar-cancel"
                                onClick={() => {
                                  setShowCalendar(false);
                                  setSelectedYear(null);
                                  setSelectedMonth(null);
                                  setCurrentTestIndex(null);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {isFieldMissing(test, 'date') && (
                          <div className="cam-error-message">Please complete this required question.</div>
                        )}
                      </div>
                    </div>
                    
                    {index < parseInt(numberOfTests) - 1 && <div className="cam-test-divider"></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CambridgeSection;