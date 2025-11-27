import React, { useState, useEffect } from 'react';
import './CambridgeSection.css';

const CambridgeSection = ({ formData, handleInputChange, handleComplexChange, clearAnswer }) => {
  const [numberOfTests, setNumberOfTests] = useState(formData.cambridgeNumberOfTests || '');
  const [showCertificateSection, setShowCertificateSection] = useState(formData.cambridgeCertificateReport || '');
  const [selectedYear, setSelectedYear] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(null);

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

  const certificateOptions = [
    'A2 Key',
    'B1 Preliminary', 
    'B2 First',
    'C1 Advanced',
    'C2 Proficiency'
  ];

  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  // Generate years from 2003 to 2026
  const generateYears = () => {
    const years = [];
    for (let year = 2003; year <= 2026; year++) {
      years.push(year);
    }
    return years;
  };

  const handleNumberOfTestsChange = (e) => {
    const value = e.target.value;
    setNumberOfTests(value);
    handleInputChange(e);
    
    // Initialize test entries array based on selected number
    if (value && value !== '') {
      const num = parseInt(value);
      const currentTests = formData.cambridgeTests || [];
      const newTests = [];
      
      for (let i = 0; i < num; i++) {
        newTests.push(currentTests[i] || { date: '', subject: '' });
      }
      
      handleComplexChange('cambridgeTests', newTests);
    } else {
      handleComplexChange('cambridgeTests', []);
    }
  };

  const handleTestFieldChange = (index, field, value) => {
    const updatedTests = [...(formData.cambridgeTests || [])];
    if (!updatedTests[index]) {
      updatedTests[index] = { date: '', subject: '' };
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
    const fullDate = `${month} ${selectedYear}`;
    handleTestFieldChange(currentTestIndex, 'date', fullDate);
    setShowCalendar(false);
    setSelectedYear(null);
    setCurrentTestIndex(null);
  };

  const handleCertificateChange = (e) => {
    const value = e.target.value;
    setShowCertificateSection(value);
    handleInputChange(e);
  };

  const clearCertificateAnswer = () => {
    setShowCertificateSection('');
    handleComplexChange('cambridgeCertificateReport', '');
    handleComplexChange('cambridgeCertificateDetails', { level: '', date: '' });
  };

  const handleCertificateDetailChange = (field, value) => {
    const currentDetails = formData.cambridgeCertificateDetails || { level: '', date: '' };
    const updatedDetails = {
      ...currentDetails,
      [field]: value
    };
    handleComplexChange('cambridgeCertificateDetails', updatedDetails);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.calendar-container')) {
        setShowCalendar(false);
        setSelectedYear(null);
        setCurrentTestIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  return (
    <div className="cambridge-section">
      <div className="cambridge-header">
        <h1>Cambridge</h1>
        <div className="progress-status">In progress</div>
      </div>

      <div className="cambridge-content">
        {/* Number of Tests Question */}
        <div className="form-section">
          <div className="form-question">
            <label className="question-label">
              Number of Cambridge International subject tests you wish to report, including tests you expect to take*
            </label>
            <div className="input-container">
              <select
                name="cambridgeNumberOfTests"
                value={numberOfTests}
                onChange={handleNumberOfTestsChange}
                className="form-dropdown"
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
          </div>
        </div>

        {/* Dynamic Test Fields */}
        {numberOfTests && numberOfTests !== '' && numberOfTests !== '0' && (
          <div className="tests-section">
            <div className="section-divider"></div>
            <h3 className="section-title">Test Details</h3>
            
            {Array.from({ length: parseInt(numberOfTests) }, (_, index) => (
              <div key={index} className="test-entry">
                <h4 className="test-number">Test {index + 1}</h4>
                
                <div className="test-fields">
                  {/* Date Field */}
                  <div className="form-question">
                    <label className="question-label">
                      Date taken or planned*
                    </label>
                    <div className="input-container">
                      {!formData.cambridgeTests?.[index]?.date.includes(' ') ? (
                        <select
                          value={formData.cambridgeTests?.[index]?.date || ''}
                          onChange={(e) => handleYearSelect(index, e.target.value)}
                          className="form-dropdown"
                        >
                          <option value="">- Choose an option -</option>
                          {generateYears().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="selected-date">
                          {formData.cambridgeTests?.[index]?.date}
                          <button
                            type="button"
                            className="change-date"
                            onClick={() => handleTestFieldChange(index, 'date', '')}
                          >
                            Change
                          </button>
                        </div>
                      )}
                      <div className="field-note">Date uses "month year" format (e.g., JUN 2020)</div>
                    </div>

                    {/* Calendar Popup */}
                    {showCalendar && currentTestIndex === index && (
                      <div className="calendar-container">
                        <div className="calendar-header">
                          Select Month for {selectedYear}
                        </div>
                        <div className="calendar-grid">
                          {months.map(month => (
                            <button
                              key={month}
                              type="button"
                              className="calendar-month"
                              onClick={() => handleMonthSelect(month)}
                            >
                              {month}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="calendar-cancel"
                          onClick={() => {
                            setShowCalendar(false);
                            setSelectedYear(null);
                            setCurrentTestIndex(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subject Field */}
                  <div className="form-question">
                    <label className="question-label">
                      Subject*
                    </label>
                    <div className="input-container">
                      <select
                        value={formData.cambridgeTests?.[index]?.subject || ''}
                        onChange={(e) => handleTestFieldChange(index, 'subject', e.target.value)}
                        className="form-dropdown"
                      >
                        <option value="">- Choose an option -</option>
                        {subjectOptions.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {index < parseInt(numberOfTests) - 1 && <div className="test-divider"></div>}
              </div>
            ))}
          </div>
        )}

        {/* Certificate Question */}
        <div className="form-section">
          <div className="section-divider"></div>
          <div className="form-question">
            <label className="question-label">
              Have you received a Cambridge English Qualifications certificate that you'd like to report?*
            </label>
            <div className="radio-container">
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="cambridgeCertificateReport"
                    value="yes"
                    checked={showCertificateSection === 'yes'}
                    onChange={handleCertificateChange}
                    className="radio-input"
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-text">Yes</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="cambridgeCertificateReport"
                    value="no"
                    checked={showCertificateSection === 'no'}
                    onChange={handleCertificateChange}
                    className="radio-input"
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-text">No</span>
                </label>
              </div>
              <button
                type="button"
                className="clear-answer"
                onClick={clearCertificateAnswer}
              >
                Clear answer
              </button>
            </div>
          </div>
        </div>

        {/* Certificate Details (shown only if Yes is selected) */}
        {showCertificateSection === 'yes' && (
          <div className="certificate-section">
            <div className="section-divider"></div>
            
            {/* Highest Level Certificate */}
            <div className="form-question">
              <label className="question-label">
                Highest level certificate earned*
              </label>
              <div className="input-container">
                <select
                  value={formData.cambridgeCertificateDetails?.level || ''}
                  onChange={(e) => handleCertificateDetailChange('level', e.target.value)}
                  className="form-dropdown"
                >
                  <option value="">- Choose an option -</option>
                  {certificateOptions.map(cert => (
                    <option key={cert} value={cert}>{cert}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Exam Session Date */}
            <div className="form-question">
              <label className="question-label">
                Exam session date*
              </label>
              <div className="input-container">
                <select
                  value={formData.cambridgeCertificateDetails?.date || ''}
                  onChange={(e) => handleCertificateDetailChange('date', e.target.value)}
                  className="form-dropdown"
                >
                  <option value="">- Choose an option -</option>
                  {generateYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="field-note">Date uses "year" format (e.g., 2002)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CambridgeSection;