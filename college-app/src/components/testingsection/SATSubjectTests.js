// components/testing-sections/SATSubjectTests.js
import React from 'react';

const SATSubjectTests = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange 
}) => {
  const subjectTestTemplate = {
    subject: '',
    score: '',
    testDate: ''
  };

  const subjects = [
    'Literature',
    'U.S. History',
    'World History',
    'Math Level 1',
    'Math Level 2',
    'Biology E/M',
    'Chemistry',
    'Physics',
    'French',
    'German',
    'Spanish',
    'Modern Hebrew',
    'Italian',
    'Latin',
    'Chinese with Listening',
    'French with Listening',
    'German with Listening',
    'Japanese with Listening',
    'Korean with Listening',
    'Spanish with Listening'
  ];

  const scores = Array.from({ length: 601 }, (_, i) => 200 + i).filter(s => s <= 800);

  return (
    <div className="testing-section">
      <h3>SAT Subject Tests</h3>
      <p className="section-subtitle">In progress</p>

      <div className="form-question">
        <label>Number of SAT Subject Test scores you wish to report*</label>
        <select 
          className="form-select"
          value={formData.satSubjectTestsCount || 0}
          onChange={(e) => {
            const count = parseInt(e.target.value);
            handleInputChange('satSubjectTestsCount', count);
            const tests = Array.from({ length: count }, () => ({ ...subjectTestTemplate }));
            handleInputChange('satSubjectTests', tests);
          }}
        >
          <option value="">Select number</option>
          {[0, 1, 2, 3, 4, 5, 6].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {formData.satSubjectTestsCount > 0 && formData.satSubjectTests?.map((test, index) => (
        <div key={index} className="test-entry-form">
          <h4>SAT Subject Test {index + 1}</h4>

          <div className="form-question">
            <label>Subject*</label>
            <select 
              className="form-select"
              value={test.subject}
              onChange={(e) => handleArrayChange('satSubjectTests', index, 'subject', e.target.value)}
            >
              <option value="">- Choose a subject -</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Score*</label>
            <select 
              className="form-select"
              value={test.score}
              onChange={(e) => handleArrayChange('satSubjectTests', index, 'score', e.target.value)}
            >
              <option value="">- Choose a score -</option>
              {scores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Test date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.testDate}
              onChange={(e) => handleArrayChange('satSubjectTests', index, 'testDate', e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SATSubjectTests;
