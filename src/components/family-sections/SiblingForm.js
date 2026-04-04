import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import './SiblingForm.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const SiblingForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    siblingsCount: '',
    siblingsList: []
  });
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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/students/family-dashb`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

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

        setFormData({
          siblingsCount: siblingsData.siblingsCount?.toString() || '',
          siblingsList: normalizedList
        });
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

    setFormData(prev => ({
      ...prev,
      siblingsCount,
      siblingsList: newSiblingsList
    }));
  };

  const handleSiblingChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      siblingsList: prev.siblingsList.map((sibling, i) =>
        i === index ? { ...sibling, [field]: value } : sibling
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
        siblingsCount: parseInt(formData.siblingsCount) || 0,
        siblingsList: formData.siblingsList
      };

      if (submissionData.siblingsCount > 0) {
        const hasEmptyRequiredFields = submissionData.siblingsList.some(
          sibling => !sibling.firstName?.trim() || !sibling.lastName?.trim()
        );

        if (hasEmptyRequiredFields) {
          alert('Please fill in all required fields (First name and Last name) for all siblings.');
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/students/family-dashb/sibling`,
        submissionData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        navigate('/firstyear/dashboard');
      }
    } catch (error) {
      console.error('Error saving sibling data:', error);
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
                        className="form-input"
                        value={sibling.firstName}
                        onChange={(e) => handleSiblingChange(index, 'firstName', e.target.value)}
                        required
                        placeholder="Enter first name"
                        autoComplete="off"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label required">Last/Family/Surname*</label>
                      <input
                        type="text"
                        className="form-input"
                        value={sibling.lastName}
                        onChange={(e) => handleSiblingChange(index, 'lastName', e.target.value)}
                        required
                        placeholder="Enter last name"
                        autoComplete="off"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Age</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        max="100"
                        value={sibling.age}
                        onChange={(e) => handleSiblingChange(index, 'age', e.target.value)}
                        placeholder="Enter age"
                        inputMode="numeric"
                      />
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
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiblingForm;