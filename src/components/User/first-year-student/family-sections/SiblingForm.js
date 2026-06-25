import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Select from 'react-select';
import { getSiblingErrors, hasFamilyErrors } from './../../../../utils/familyValidation';
import './SiblingForm.css';



const SiblingForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    siblingsCount: '',
    siblingsList: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const siblingsCountOptions = [
    { value: '0', label: '0' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
    { value: '6', label: '6' },
    { value: '7', label: '7' },
    { value: '8', label: '8' },
    { value: '9', label: '9' },
    { value: '10', label: '10+' }
  ];

  const relationshipOptions = [
    { value: 'brother', label: 'Brother' },
    { value: 'sister', label: 'Sister' },
    { value: 'step_brother', label: 'Step-brother' },
    { value: 'step_sister', label: 'Step-sister' },
    { value: 'half_brother', label: 'Half-brother' },
    { value: 'half_sister', label: 'Half-sister' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchSiblingData();
  }, []);

  const fetchSiblingData = async () => {
    try {
 const response = await axiosInstance.get('/api/students/family-dashb');

      if (response.data.success && response.data.familyData.siblings) {
        const siblingsData = response.data.familyData.siblings;

        const normalizedList = (siblingsData.siblingsList || []).map((sibling) => ({
          firstName: sibling.firstName || '',
          lastName: sibling.lastName || '',
          age: sibling.age || '',
          relationship: sibling.relationship || '',
          collegeAttended: sibling.collegeAttended || '',
          degreeEarned: sibling.degreeEarned || ''
        }));

        const nextData = {
          siblingsCount: siblingsData.siblingsCount?.toString() || '',
          siblingsList: normalizedList
        };
        setFormData(nextData);
        setErrors(getSiblingErrors(nextData, { requireAll: false }));
      }
    } catch (error) {
      console.error('Error fetching sibling data:', error);
    }
  };

  const handleSiblingsCountChange = (selectedOption) => {
    const siblingsCount = selectedOption ? selectedOption.value : '';
    const countNum = parseInt(siblingsCount) || 0;

    const newSiblingsList = Array.from({ length: countNum }, (_, index) =>
      formData.siblingsList[index] || {
        firstName: '',
        lastName: '',
        age: '',
        relationship: '',
        collegeAttended: '',
        degreeEarned: ''
      }
    );

    const nextData = {
      ...formData,
      siblingsCount,
      siblingsList: newSiblingsList
    };
    setFormData(nextData);
    const nextErrors = getSiblingErrors(nextData, { requireAll: false });
    setErrors(nextErrors);
    console.log('FAMILY VALIDATION ERRORS:', nextErrors);
  };

  const handleSiblingChange = (index, field, value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        siblingsList: prev.siblingsList.map((sibling, i) =>
          i === index ? { ...sibling, [field]: value } : sibling
        )
      };
      const nextErrors = getSiblingErrors(updated, { requireAll: false });
      setErrors(nextErrors);
      console.log('FAMILY VALIDATION ERRORS:', nextErrors);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submissionData = {
        siblingsCount: parseInt(formData.siblingsCount) || 0,
        siblingsList: formData.siblingsList
      };

      const finalErrors = getSiblingErrors(formData, { requireAll: true });
      setErrors(finalErrors);
      console.log('FAMILY VALIDATION ERRORS:', finalErrors);

      if (hasFamilyErrors(finalErrors)) {
        return;
      }
      console.log('FAMILY PAYLOAD BEFORE SAVE:', submissionData);
      setLoading(true);
const response = await axiosInstance.post(
  '/api/students/family-dashb/sibling',
  submissionData
);

      if (response.data.success) {
        navigate('/firstyear/dashboard');
      }
    } catch (error) {
      console.error('Error saving sibling data:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        console.log('FAMILY VALIDATION ERRORS:', error.response.data.errors);
      }
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Error saving sibling data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSiblingsCount = () =>
    siblingsCountOptions.find(option => option.value === formData.siblingsCount);

  const getSelectedRelationship = (sibling) =>
    relationshipOptions.find(opt => opt.value === (sibling.relationship || ''));

  const renderError = (field) =>
    errors[field] ? <div className="family-field-error">{errors[field]}</div> : null;

  const renderSiblingError = (index, field) => {
    const rowError = errors[`siblingsList.${index}`];
    return rowError?.[field] ? <div className="family-field-error">{rowError[field]}</div> : null;
  };

  const inputClass = (index, field) =>
    `form-input${errors[`siblingsList.${index}`]?.[field] ? ' error' : ''}`;

  return (
    <div className="family-form-container">
      <div className="form-header">
        <h2 className="form-title">Sibling</h2>
        <div className="progress-indicator">In Progress</div>
      </div>

      <form onSubmit={handleSubmit} className="family-form sibling-form">
        {/* Siblings Count */}
        <div className="form-field">
          <label className="form-label required">
            Please specify number of siblings you have*
          </label>
          <div className="sibling-count-select">
            <Select
              className="react-select-container"
              classNamePrefix="react-select"
              value={getSelectedSiblingsCount()}
              onChange={handleSiblingsCountChange}
              options={siblingsCountOptions}
              placeholder="Choose an option"
              isSearchable={false}
              required
            />
          </div>
          {renderError('siblingsCount')}
        </div>

        {/* Sibling Details */}
        {formData.siblingsCount && formData.siblingsCount !== '0' && (
          <div className="siblings-details-section">
            <h3 className="siblings-section-title">Sibling Details</h3>

            {formData.siblingsList.map((sibling, index) => (
              <div key={index} className="sibling-form-card">
                <h4 className="sibling-title">Sibling {index + 1}</h4>

                <div className="sibling-form-fields">
                  {/* Row 1: First name / Last name / Age */}
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label required">First/Given name*</label>
                      <input
                        type="text"
                        className={inputClass(index, 'firstName')}
                        value={sibling.firstName}
                        onChange={(e) => handleSiblingChange(index, 'firstName', e.target.value)}
                        required
                        placeholder="Enter first name"
                        autoComplete="off"
                      />
                      {renderSiblingError(index, 'firstName')}
                    </div>

                    <div className="form-field">
                      <label className="form-label required">Last/Family/Surname*</label>
                      <input
                        type="text"
                        className={inputClass(index, 'lastName')}
                        value={sibling.lastName}
                        onChange={(e) => handleSiblingChange(index, 'lastName', e.target.value)}
                        required
                        placeholder="Enter last name"
                        autoComplete="off"
                      />
                      {renderSiblingError(index, 'lastName')}
                    </div>

                    <div className="form-field">
                      <label className="form-label">Age</label>
                      <input
                        type="number"
                        className={inputClass(index, 'age')}
                        min="0"
                        max="100"
                        value={sibling.age}
                        onChange={(e) => handleSiblingChange(index, 'age', e.target.value)}
                        placeholder="Enter age"
                        inputMode="numeric"
                      />
                      {renderSiblingError(index, 'age')}
                    </div>
                  </div>

                  {/* Row 2: Relationship / College / Degree */}
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label required">Relationship*</label>
                      <Select
                        className="react-select-container"
                        classNamePrefix="react-select"
                        value={getSelectedRelationship(sibling)}
                        onChange={(opt) =>
                          handleSiblingChange(index, 'relationship', opt ? opt.value : '')
                        }
                        options={relationshipOptions}
                        placeholder="Select relationship"
                        isSearchable={false}
                        isClearable
                      />
                      {renderSiblingError(index, 'relationship')}
                    </div>

                    <div className="form-field">
                      <label className="form-label">College Attended</label>
                      <input
                        type="text"
                        className="form-input"
                        value={sibling.collegeAttended || ''}
                        onChange={(e) => handleSiblingChange(index, 'collegeAttended', e.target.value)}
                        placeholder="Enter college attended"
                        autoComplete="off"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Degree Earned</label>
                      <input
                        type="text"
                        className="form-input"
                        value={sibling.degreeEarned || ''}
                        onChange={(e) => handleSiblingChange(index, 'degreeEarned', e.target.value)}
                        placeholder="Enter degree earned"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 0 siblings message */}
        {formData.siblingsCount === '0' && (
          <div className="no-siblings-message">
            <p>You have indicated that you have no siblings.</p>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="continue-button"
            disabled={loading || hasFamilyErrors(errors)}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiblingForm;
