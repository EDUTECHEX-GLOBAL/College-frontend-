// components/testing-sections/APTests.js
import React from 'react';

const APTests = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange 
}) => {
  const apTemplate = {
    subject: '',
    score: '',
    year: ''
  };

  const subjects = [
    'Art History',
    'Biology',
    'Calculus AB',
    'Calculus BC',
    'Chemistry',
    'Chinese Language and Culture',
    'Computer Science A',
    'Computer Science Principles',
    'English Language and Composition',
    'English Literature and Composition',
    'Environmental Science',
    'European History',
    'French Language and Culture',
    'German Language and Culture',
    'Government and Politics: Comparative',
    'Government and Politics: United States',
    'Human Geography',
    'Italian Language and Culture',
    'Japanese Language and Culture',
    'Latin',
    'Macroeconomics',
    'Microeconomics',
    'Music Theory',
    'Physics 1',
    'Physics 2',
    'Physics C: Electricity and Magnetism',
    'Physics C: Mechanics',
    'Psychology',
    'Spanish Language and Culture',
    'Spanish Literature and Culture',
    'Statistics',
    'Studio Art: 2-D Design',
    'Studio Art: 3-D Design',
    'Studio Art: Drawing',
    'United States History',
    'World History'
  ];

  return (
    <div className="testing-section">
      <h3>AP Subject Tests</h3>
      <p className="section-subtitle">In progress</p>

      <div className="form-question">
        <label>Number of AP exams you wish to report*</label>
        <select 
          className="form-select"
          value={formData.apTestsCount || 0}
          onChange={(e) => {
            const count = parseInt(e.target.value);
            handleInputChange('apTestsCount', count);
            const tests = Array.from({ length: count }, () => ({ ...apTemplate }));
            handleInputChange('apTests', tests);
          }}
        >
          <option value="">Select number</option>
          {Array.from({ length: 21 }, (_, i) => i).map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {formData.apTestsCount > 0 && formData.apTests?.map((test, index) => (
        <div key={index} className="test-entry-form">
          <h4>AP Test {index + 1}</h4>

          <div className="form-question">
            <label>Subject*</label>
            <select 
              className="form-select"
              value={test.subject}
              onChange={(e) => handleArrayChange('apTests', index, 'subject', e.target.value)}
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
              onChange={(e) => handleArrayChange('apTests', index, 'score', e.target.value)}
            >
              <option value="">- Choose a score -</option>
              {[1, 2, 3, 4, 5].map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Year taken*</label>
            <input 
              type="number"
              className="form-input"
              placeholder="e.g. 2024"
              min="2000"
              max="2030"
              value={test.year}
              onChange={(e) => handleArrayChange('apTests', index, 'year', e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default APTests;
