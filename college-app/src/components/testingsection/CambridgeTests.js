// components/testing-sections/CambridgeTests.js
import React from 'react';

const CambridgeTests = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange 
}) => {
  const cambridgeTemplate = {
    examType: '',
    subject: '',
    grade: '',
    testDate: '',
    predicted: false
  };

  const examTypes = [
    'Cambridge IGCSE',
    'Cambridge O Level',
    'Cambridge International AS Level',
    'Cambridge International A Level',
    'Cambridge Pre-U'
  ];

  const grades = ['A*', 'A', 'B', 'C', 'D', 'E', 'U'];

  return (
    <div className="testing-section">
      <h3>Cambridge International Examinations</h3>
      <p className="section-subtitle">In progress</p>

      <div className="form-question">
        <label>Number of Cambridge exams you wish to report*</label>
        <select 
          className="form-select"
          value={formData.cambridgeTestsCount || 0}
          onChange={(e) => {
            const count = parseInt(e.target.value);
            handleInputChange('cambridgeTestsCount', count);
            const tests = Array.from({ length: count }, () => ({ ...cambridgeTemplate }));
            handleInputChange('cambridgeTests', tests);
          }}
        >
          <option value="">Select number</option>
          {Array.from({ length: 16 }, (_, i) => i).map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {formData.cambridgeTestsCount > 0 && formData.cambridgeTests?.map((test, index) => (
        <div key={index} className="test-entry-form">
          <h4>Cambridge Exam {index + 1}</h4>

          <div className="form-question">
            <label>Examination type*</label>
            <select 
              className="form-select"
              value={test.examType}
              onChange={(e) => handleArrayChange('cambridgeTests', index, 'examType', e.target.value)}
            >
              <option value="">- Choose exam type -</option>
              {examTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Subject*</label>
            <input 
              type="text"
              className="form-input"
              placeholder="Enter subject name"
              value={test.subject}
              onChange={(e) => handleArrayChange('cambridgeTests', index, 'subject', e.target.value)}
            />
          </div>

          <div className="form-question">
            <label>Grade*</label>
            <select 
              className="form-select"
              value={test.grade}
              onChange={(e) => handleArrayChange('cambridgeTests', index, 'grade', e.target.value)}
            >
              <option value="">- Choose grade -</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Test date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.testDate}
              onChange={(e) => handleArrayChange('cambridgeTests', index, 'testDate', e.target.value)}
            />
            <small>Date uses "month year" format (e.g. June 2024)</small>
          </div>

          <div className="form-question">
            <label>Is this a predicted grade?*</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.predicted === true}
                  onChange={() => handleArrayChange('cambridgeTests', index, 'predicted', true)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.predicted === false}
                  onChange={() => handleArrayChange('cambridgeTests', index, 'predicted', false)}
                />
                <span>No</span>
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CambridgeTests;
