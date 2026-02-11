import React, { useState, useEffect } from 'react';
import './ApplicationFirstEducation.css';

const ApplicationFirstEducation = ({
  formData,
  onInputChange,
  onFileUpload,
  onNext,
  onPrev
}) => {
  const [additionalQualifications, setAdditionalQualifications] = useState([]);
  const [showAdditionalForm, setShowAdditionalForm] = useState(false);

  const [newQualification, setNewQualification] = useState({
    level: '',
    institution: '',
    board: '',
    country: '',
    startYear: '',
    endYear: '',
    status: '',
    system: ''
  });

  const [marks, setMarks] = useState({
    obtained: '',
    total: '',
    percentage: '',
    gpa: ''
  });

  /* ------------------ SYNC MARKS FROM FORMDATA ------------------ */
  useEffect(() => {
    setMarks({
      obtained: '',
      total: '',
      percentage: formData.percentage || '',
      gpa: formData.gpa || ''
    });
  }, [formData.percentage, formData.gpa]);

  /* ------------------ FILE UPLOAD ------------------ */
  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB');
      return;
    }
    if (!file.type.includes('pdf')) {
      alert('Only PDF files allowed');
      return;
    }
    onFileUpload(field, file);
  };

  /* ------------------ MARKS HANDLER ------------------ */
  const handleMarksChange = (field, value) => {
    const updated = { ...marks, [field]: value };
    setMarks(updated);

    if (field === 'obtained' || field === 'total') {
      const obtained = parseFloat(updated.obtained) || 0;
      const total = parseFloat(updated.total) || 0;

      if (total > 0) {
        const percent = ((obtained / total) * 100).toFixed(2);
        setMarks(prev => ({ ...prev, percentage: percent }));
        onInputChange('percentage', percent);
      }
    }

    onInputChange(field, value);
  };

  const handleGradingSystemChange = (value) => {
    onInputChange('gradingSystem', value);
    if (value === 'percentage') {
      onInputChange('gpa', '');
    } else {
      onInputChange('percentage', '');
    }
  };

  /* ------------------ VALIDATION + NEXT ------------------ */
  const handleNextClick = () => {
    if (
      !formData.qualificationLevel ||
      !formData.institutionName ||
      !formData.boardUniversity ||
      !formData.countryOfStudy ||
      !formData.startYear ||
      !formData.endYear ||
      !formData.resultStatus ||
      !formData.gradingSystem
    ) {
      alert('Please fill all required fields');
      return;
    }

    if (formData.gradingSystem === 'percentage' && !formData.percentage) {
      alert('Enter valid percentage');
      return;
    }

    if (formData.gradingSystem === 'gpa' && !formData.gpa) {
      alert('Enter valid GPA');
      return;
    }

    if (!formData.transcripts) {
      alert('Upload transcripts');
      return;
    }

    onNext();
  };

  const yearOptions = [];
  for (let y = 2025; y >= 1980; y--) yearOptions.push(y);

  return (
    <form className="form-section" onSubmit={(e) => e.preventDefault()}>
      <div className="section-header">
        <div className="section-number">3</div>
        <div>
          <h2 className="section-title">Educational Background</h2>
          <p className="section-subtitle">
            Provide details of your highest qualification
          </p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="required">Qualification Level</label>
          <select
            value={formData.qualificationLevel || ''}
            onChange={(e) => onInputChange('qualificationLevel', e.target.value)}
          >
            <option value="">Select</option>
            <option value="high-school">High School</option>
            <option value="diploma">Diploma</option>
            <option value="bachelor">Bachelor</option>
            <option value="master">Master</option>
          </select>
        </div>

        <div className="form-group">
          <label className="required">Institution Name</label>
          <input
            type="text"
            value={formData.institutionName || ''}
            onChange={(e) => onInputChange('institutionName', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="required">Board / University</label>
          <input
            type="text"
            value={formData.boardUniversity || ''}
            onChange={(e) => onInputChange('boardUniversity', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="required">Country of Study</label>
          <select
            value={formData.countryOfStudy || ''}
            onChange={(e) => onInputChange('countryOfStudy', e.target.value)}
          >
            <option value="">Select</option>
            <option value="india">India</option>
            <option value="usa">USA</option>
            <option value="uk">UK</option>
          </select>
        </div>

        <div className="form-group">
          <label className="required">Start Year</label>
          <select
            value={formData.startYear || ''}
            onChange={(e) => onInputChange('startYear', e.target.value)}
          >
            <option value="">Select</option>
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="required">End Year</label>
          <select
            value={formData.endYear || ''}
            onChange={(e) => onInputChange('endYear', e.target.value)}
          >
            <option value="">Select</option>
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="required">Grading System</label>
        <label>
          <input
            type="radio"
            checked={formData.gradingSystem === 'percentage'}
            onChange={() => handleGradingSystemChange('percentage')}
          />
          Percentage
        </label>
        <label>
          <input
            type="radio"
            checked={formData.gradingSystem === 'gpa'}
            onChange={() => handleGradingSystemChange('gpa')}
          />
          GPA
        </label>
      </div>

      {formData.gradingSystem === 'percentage' && (
        <div className="form-group">
          <input
            type="number"
            placeholder="Obtained"
            value={marks.obtained}
            onChange={(e) => handleMarksChange('obtained', e.target.value)}
          />
          <input
            type="number"
            placeholder="Total"
            value={marks.total}
            onChange={(e) => handleMarksChange('total', e.target.value)}
          />
          <p>Percentage: {marks.percentage || '--'}%</p>
        </div>
      )}

      {formData.gradingSystem === 'gpa' && (
        <div className="form-group">
          <input
            type="number"
            placeholder="GPA"
            value={formData.gpa || ''}
            onChange={(e) => onInputChange('gpa', e.target.value)}
          />
        </div>
      )}

      <div className="form-group">
        <label className="required">Transcripts (PDF)</label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileChange(e, 'transcripts')}
        />
      </div>

      <div className="form-navigation">
        <button type="button" onClick={onPrev}>Previous</button>
        <button type="button" onClick={handleNextClick}>Next</button>
      </div>
    </form>
  );
};

export default ApplicationFirstEducation;
