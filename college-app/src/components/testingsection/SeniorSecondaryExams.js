// components/testing-sections/SeniorSecondaryExams.js
import React from 'react';

const SeniorSecondaryExams = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange, 
  addTestEntry, 
  removeTestEntry 
}) => {
  const examTemplate = {
    dateTaken: '',
    examBoard: '',
    academicSubject: '',
    score: '',
    scoreType: 'actual'
  };

  return (
    <div className="testing-section">
      <h3>Senior Secondary Leaving Examinations</h3>
      <p className="section-subtitle">In progress</p>

      <div className="form-question">
        <label>Number of Senior Secondary Leaving Examinations you have already taken*</label>
        <select 
          className="form-select"
          value={formData.seniorSecondaryExamsCount || 0}
          onChange={(e) => {
            const count = parseInt(e.target.value);
            handleInputChange('seniorSecondaryExamsCount', count);
            const exams = Array.from({ length: count }, () => ({ ...examTemplate }));
            handleInputChange('seniorSecondaryExams', exams);
          }}
        >
          <option value="">Select number</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {formData.seniorSecondaryExamsCount > 0 && formData.seniorSecondaryExams.map((exam, index) => (
        <div key={index} className="test-entry-form">
          <h4>Examination {index + 1}</h4>

          <div className="form-question">
            <label>Date taken*</label>
            <input 
              type="month"
              className="form-input"
              value={exam.dateTaken}
              onChange={(e) => handleArrayChange('seniorSecondaryExams', index, 'dateTaken', e.target.value)}
            />
            <small>Date uses "month year" format (e.g. August 2002)</small>
          </div>

          <div className="form-question">
            <label>Examination board*</label>
            <select 
              className="form-select"
              value={exam.examBoard}
              onChange={(e) => handleArrayChange('seniorSecondaryExams', index, 'examBoard', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
              <option value="ICSE">ICSE (Indian Certificate of Secondary Education)</option>
              <option value="State Board">State Board</option>
              <option value="IB">IB (International Baccalaureate)</option>
              <option value="Cambridge">Cambridge International</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-question">
            <label>Academic subject*</label>
            <input 
              type="text"
              className="form-input"
              placeholder="Enter subject name"
              value={exam.academicSubject}
              onChange={(e) => handleArrayChange('seniorSecondaryExams', index, 'academicSubject', e.target.value)}
            />
          </div>

          <div className="form-question">
            <label>Score*</label>
            <input 
              type="text"
              className="form-input"
              placeholder="Enter score"
              value={exam.score}
              onChange={(e) => handleArrayChange('seniorSecondaryExams', index, 'score', e.target.value)}
            />
          </div>

          <div className="form-question">
            <label>Score type*</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={exam.scoreType === 'actual'}
                  onChange={() => handleArrayChange('seniorSecondaryExams', index, 'scoreType', 'actual')}
                />
                <span>Actual</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={exam.scoreType === 'predicted'}
                  onChange={() => handleArrayChange('seniorSecondaryExams', index, 'scoreType', 'predicted')}
                />
                <span>Predicted</span>
              </label>
            </div>
            <button className="clear-answer-btn">Clear answer</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SeniorSecondaryExams;
