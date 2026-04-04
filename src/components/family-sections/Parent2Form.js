import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import './Parent2Form.css';

const API_URL = process.env.REACT_APP_API_URL;

const Parent2Form = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    parentType: '',
    isLiving: '',
    prefix: '',
    firstName: '',
    middleInitial: '',
    lastName: '',
    formerLastName: '',
    suffix: '',
    occupation: '',
    educationLevel: '',
    noOtherParent: false
  });
  const [loading, setLoading] = useState(false);

  const prefixOptions = [
    { value: 'mr', label: 'Mr.' },
    { value: 'ms', label: 'Ms.' },
    { value: 'mrs', label: 'Mrs.' },
    { value: 'dr', label: 'Dr.' }
  ];

  const suffixOptions = [
    { value: 'jr', label: 'Jr.' },
    { value: 'sr', label: 'Sr.' },
    { value: 'ii', label: 'II' },
    { value: 'iii', label: 'III' }
  ];

  const occupationOptions = [
    { value: 'architect', label: 'Architect' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'engineer', label: 'Engineer' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'business_owner', label: 'Business Owner' },
    { value: 'retired', label: 'Retired' },
    { value: 'deceased', label: 'Deceased' },
    { value: 'other', label: 'Other' }
  ];

  const educationLevelOptions = [
    { value: 'high_school', label: 'High School' },
    { value: 'some_college', label: 'Some College' },
    { value: 'associates', label: "Associate's Degree" },
    { value: 'bachelors', label: "Bachelor's Degree" },
    { value: 'masters', label: "Master's Degree" },
    { value: 'doctorate', label: 'Doctorate' },
    { value: 'professional', label: 'Professional Degree' }
  ];

  useEffect(() => {
    fetchParent2Data();
  }, []);

  const fetchParent2Data = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/students/family-dashb`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success && response.data.familyData.parent2) {
        setFormData({
          ...response.data.familyData.parent2,
          noOtherParent: response.data.familyData.parent2.parentType === 'no_other_parent'
        });
      }
    } catch (error) {
      console.error('Error fetching parent 2 data:', error);
    }
  };

  const handleSelectChange = (field, selectedOption) => {
    setFormData(prev => ({
      ...prev,
      [field]: selectedOption ? selectedOption.value : '',
      ...(field === 'parentType' && selectedOption?.value !== 'no_other_parent'
        ? { noOtherParent: false }
        : {})
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'parentType' && value !== 'no_other_parent'
        ? { noOtherParent: false }
        : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/students/family-dashb/parent2`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      navigate('/firstyear/dashboard/family/sibling');
    } catch (error) {
      console.error('Error saving parent 2 data:', error);
      alert('Error saving parent 2 data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPrefix = () => prefixOptions.find(o => o.value === formData.prefix);
  const getSelectedSuffix = () => suffixOptions.find(o => o.value === formData.suffix);
  const getSelectedOccupation = () => occupationOptions.find(o => o.value === formData.occupation);
  const getSelectedEducationLevel = () => educationLevelOptions.find(o => o.value === formData.educationLevel);

  const showFields = formData.parentType && formData.parentType !== 'no_other_parent';

  if (formData.noOtherParent || formData.parentType === 'no_other_parent') {
    return (
      <div className="family-form-container">
        <div className="form-header">
          <h2 className="form-title">Parent 2</h2>
          <div className="progress-indicator">In Progress</div>
        </div>
        <div className="no-parent-message">
          <p>You have indicated that you do not have another parent to list.</p>
          <button
            onClick={() => navigate('/firstyear/dashboard/family/sibling')}
            className="continue-button"
          >
            Continue to Sibling Section
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="family-form-container">
      <div className="form-header">
        <h2 className="form-title">Parent 2</h2>
        <div className="progress-indicator">In Progress</div>
      </div>

      <form onSubmit={handleSubmit} className="family-form parent2-form">

        {/* Parent Type */}
        <div className="form-field">
          <label className="form-label required">Parent 2 type*</label>
          <div className="radio-group vertical">
            {[
              { value: 'mother', label: 'Mother' },
              { value: 'father', label: 'Father' },
              { value: 'limited_info', label: 'I have limited information about this parent' }
            ].map(({ value, label }) => (
              <label className="radio-label" key={value}>
                <input
                  type="radio"
                  name="parentType"
                  value={value}
                  checked={formData.parentType === value}
                  onChange={(e) => handleInputChange('parentType', e.target.value)}
                  required={value === 'mother'}
                />
                {label}
              </label>
            ))}
          </div>
          <button
            type="button"
            className="clear-answer"
            onClick={() => handleInputChange('parentType', '')}
          >
            Clear answer
          </button>
        </div>

        {/* Is Living */}
        {showFields && (
          <div className="form-field">
            <label className="form-label">Is parent 2 living?</label>
            <div className="radio-group">
              {['yes', 'no'].map(val => (
                <label className="radio-label" key={val}>
                  <input
                    type="radio"
                    name="isLiving"
                    value={val}
                    checked={formData.isLiving === val}
                    onChange={(e) => handleInputChange('isLiving', e.target.value)}
                  />
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </label>
              ))}
            </div>
            <button
              type="button"
              className="clear-answer"
              onClick={() => handleInputChange('isLiving', '')}
            >
              Clear answer
            </button>
          </div>
        )}

        {/* Personal Info */}
        {showFields && (
          <>
            {/* Row 1: Prefix / First name / Middle initial */}
            <div className="form-row name-fields">
              <div className="form-field">
                <label className="form-label">Prefix</label>
                <Select
                  className="react-select-container"
                  classNamePrefix="react-select"
                  value={getSelectedPrefix()}
                  onChange={(option) => handleSelectChange('prefix', option)}
                  options={prefixOptions}
                  placeholder="Choose"
                  isSearchable={false}
                  isClearable
                />
              </div>
              <div className="form-field">
                <label className="form-label">First/Given name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  autoComplete="given-name"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Middle initial</label>
                <input
                  type="text"
                  className="form-input"
                  maxLength="1"
                  value={formData.middleInitial}
                  onChange={(e) => handleInputChange('middleInitial', e.target.value.toUpperCase())}
                  placeholder="M"
                />
              </div>
            </div>

            {/* Row 2: Last name / Former last name / Suffix */}
            <div className="form-row name-fields">
              <div className="form-field">
                <label className="form-label">Last/Family/Surname</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  autoComplete="family-name"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Former last name (if any)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.formerLastName}
                  onChange={(e) => handleInputChange('formerLastName', e.target.value)}
                  placeholder="Enter former last name"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Suffix</label>
                <Select
                  className="react-select-container"
                  classNamePrefix="react-select"
                  value={getSelectedSuffix()}
                  onChange={(option) => handleSelectChange('suffix', option)}
                  options={suffixOptions}
                  placeholder="Choose"
                  isSearchable={false}
                  isClearable
                />
              </div>
            </div>

            {/* Row 3: Occupation / Education */}
            <div className="form-row form-field-group">
              <div className="form-field">
                <label className="form-label">Occupation (former, if retired/deceased)</label>
                <Select
                  className="react-select-container"
                  classNamePrefix="react-select"
                  value={getSelectedOccupation()}
                  onChange={(option) => handleSelectChange('occupation', option)}
                  options={occupationOptions}
                  placeholder="Choose an option"
                  isSearchable={false}
                  isClearable
                />
              </div>
              <div className="form-field">
                <label className="form-label">Highest education level</label>
                <Select
                  className="react-select-container"
                  classNamePrefix="react-select"
                  value={getSelectedEducationLevel()}
                  onChange={(option) => handleSelectChange('educationLevel', option)}
                  options={educationLevelOptions}
                  placeholder="Choose an option"
                  isSearchable={false}
                  isClearable
                />
              </div>
            </div>
          </>
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

export default Parent2Form;