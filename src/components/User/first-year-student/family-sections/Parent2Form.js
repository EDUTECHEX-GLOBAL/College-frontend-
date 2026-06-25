import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Select from 'react-select';
import {
  buildParentPayload,
  getParentErrors,
  hasFamilyErrors,
  normalizeParentData,
  parentDefaults,
} from './../../../../utils/familyValidation';
import './Parent2Form.css';

const Parent2Form = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ ...parentDefaults, noOtherParent: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const prefixOptions = [
    { value: 'mr', label: 'Mr.' },
    { value: 'ms', label: 'Ms.' },
    { value: 'mrs', label: 'Mrs.' },
    { value: 'dr', label: 'Dr.' },
  ];

  const suffixOptions = [
    { value: 'jr', label: 'Jr.' },
    { value: 'sr', label: 'Sr.' },
    { value: 'ii', label: 'II' },
    { value: 'iii', label: 'III' },
  ];

  const educationLevelOptions = [
    { value: 'high_school', label: 'High School' },
    { value: 'some_college', label: 'Some College' },
    { value: 'associates', label: "Associate's Degree" },
    { value: 'bachelors', label: "Bachelor's Degree" },
    { value: 'masters', label: "Master's Degree" },
    { value: 'doctorate', label: 'Doctorate' },
    { value: 'professional', label: 'Professional Degree' },
  ];

  useEffect(() => {
    fetchParent2Data();
  }, []);

  const fetchParent2Data = async () => {
    try {
      const response = await axiosInstance.get('/api/students/family-dashb');
      if (response.data.success && response.data.familyData.parent2) {
        const nextData = {
          ...normalizeParentData(response.data.familyData.parent2),
          noOtherParent: response.data.familyData.parent2.parentType === 'no_other_parent',
        };
        setFormData(nextData);
        setErrors(getParentErrors(nextData, { requireAll: false, allowNoOtherParent: true }));
      }
    } catch (error) {
      console.error('Error fetching parent 2 data:', error);
    }
  };

  const updateData = (nextData) => {
    setFormData(nextData);
    const nextErrors = getParentErrors(nextData, { requireAll: false, allowNoOtherParent: true });
    setErrors(nextErrors);
    console.log('FAMILY VALIDATION ERRORS:', nextErrors);
  };

  const handleInputChange = (field, value) => {
    updateData({
      ...formData,
      [field]: value,
      ...(field === 'parentType'
        ? { noOtherParent: value === 'no_other_parent' }
        : {}),
    });
  };

  const handleSelectChange = (field, selectedOption) => {
    handleInputChange(field, selectedOption ? selectedOption.value : '');
  };

  const submitPayload = async (payload, nextRoute) => {
    console.log('FAMILY PAYLOAD BEFORE SAVE:', payload);
    setLoading(true);
    try {
      await axiosInstance.post('/api/students/family-dashb/parent2', payload);
      navigate(nextRoute);
    } catch (error) {
      const backendErrors = error.response?.data?.errors;
      if (backendErrors) {
        setErrors(backendErrors);
        console.log('FAMILY VALIDATION ERRORS:', backendErrors);
      }
      console.error('Error saving parent 2 data:', error);
      alert(error.response?.data?.message || 'Error saving parent 2 data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNoOtherParentContinue = async () => {
    const payload = { parentType: 'no_other_parent', noOtherParent: true };
    const finalErrors = getParentErrors(payload, { requireAll: true, allowNoOtherParent: true });
    setErrors(finalErrors);
    console.log('FAMILY VALIDATION ERRORS:', finalErrors);
    if (!hasFamilyErrors(finalErrors)) {
      await submitPayload(payload, '/firstyear/dashboard/family/sibling');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalErrors = getParentErrors(formData, { requireAll: true, allowNoOtherParent: true });
    setErrors(finalErrors);
    console.log('FAMILY VALIDATION ERRORS:', finalErrors);

    if (hasFamilyErrors(finalErrors)) {
      return;
    }

    await submitPayload(buildParentPayload(formData), '/firstyear/dashboard/family/sibling');
  };

  const renderError = (field) =>
    errors[field] ? <div className="family-field-error">{errors[field]}</div> : null;

  const inputClass = (field) => `form-input${errors[field] ? ' error' : ''}`;
  const getSelectedPrefix = () => prefixOptions.find((o) => o.value === formData.prefix);
  const getSelectedSuffix = () => suffixOptions.find((o) => o.value === formData.suffix);
  const getSelectedEducationLevel = () =>
    educationLevelOptions.find((o) => o.value === formData.educationLevel);

  const showFields = formData.parentType && !['no_other_parent', 'limited_info'].includes(formData.parentType);

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
            type="button"
            onClick={handleNoOtherParentContinue}
            className="continue-button"
            disabled={loading || hasFamilyErrors(errors)}
          >
            {loading ? 'Saving...' : 'Continue to Sibling Section'}
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

      <form onSubmit={handleSubmit} className="family-form parent2-form" noValidate>
        <div className="form-field">
          <label className="form-label required">Parent 2 type</label>
          <div className="radio-group vertical">
            {[
              { value: 'mother', label: 'Mother' },
              { value: 'father', label: 'Father' },
              { value: 'guardian', label: 'Guardian' },
              { value: 'other', label: 'Other' },
              { value: 'limited_info', label: 'I have limited information about this parent' },
              { value: 'no_other_parent', label: 'I do not have another parent to list' },
            ].map(({ value, label }) => (
              <label className="radio-label" key={value}>
                <input
                  type="radio"
                  name="parentType"
                  value={value}
                  checked={formData.parentType === value}
                  onChange={(e) => handleInputChange('parentType', e.target.value)}
                />
                {label}
              </label>
            ))}
          </div>
          {renderError('parentType')}
          <button type="button" className="clear-answer" onClick={() => handleInputChange('parentType', '')}>
            Clear answer
          </button>
        </div>

        {showFields && (
          <>
            <div className="form-field">
              <label className="form-label">Is parent 2 living?</label>
              <div className="radio-group">
                {['yes', 'no'].map((val) => (
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
            </div>

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
                <label className="form-label required">First/Given name</label>
                <input
                  type="text"
                  className={inputClass('firstName')}
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  autoComplete="given-name"
                />
                {renderError('firstName')}
              </div>
              <div className="form-field">
                <label className="form-label required">Middle name</label>
                <input
                  type="text"
                  className={inputClass('middleName')}
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  placeholder="Enter middle name"
                />
                {renderError('middleName')}
              </div>
            </div>

            <div className="form-row name-fields">
              <div className="form-field">
                <label className="form-label required">Last/Family/Surname</label>
                <input
                  type="text"
                  className={inputClass('lastName')}
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  autoComplete="family-name"
                />
                {renderError('lastName')}
              </div>
              <div className="form-field">
                <label className="form-label">Former last name</label>
                <input
                  type="text"
                  className={inputClass('formerLastName')}
                  value={formData.formerLastName}
                  onChange={(e) => handleInputChange('formerLastName', e.target.value)}
                  placeholder="Enter former last name"
                />
                {renderError('formerLastName')}
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

            <div className="form-row form-field-group">
              <div className="form-field">
                <label className="form-label required">Occupation</label>
                <input
                  type="text"
                  className={inputClass('occupation')}
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  placeholder="Software Engineer"
                />
                {renderError('occupation')}
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

            <div className="form-row form-field-group">
              <div className="form-field">
                <label className="form-label required">Employer/Company name</label>
                <input
                  type="text"
                  className={inputClass('employer')}
                  value={formData.employer}
                  onChange={(e) => handleInputChange('employer', e.target.value)}
                  placeholder="ABC Technologies Pvt Ltd"
                />
                {renderError('employer')}
              </div>
              <div className="form-field">
                <label className="form-label required">Annual income</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputClass('annualIncome')}
                  value={formData.annualIncome}
                  onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                  placeholder="0"
                />
                {renderError('annualIncome')}
              </div>
            </div>

            <div className="form-row form-field-group">
              <div className="form-field">
                <label className="form-label required">Email</label>
                <input
                  type="email"
                  className={inputClass('email')}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="parent@example.com"
                  autoComplete="email"
                />
                {renderError('email')}
              </div>
              <div className="form-field">
                <label className="form-label required">Phone number</label>
                <input
                  type="tel"
                  className={inputClass('phoneNumber')}
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+919876543210"
                  autoComplete="tel"
                />
                {renderError('phoneNumber')}
              </div>
            </div>

            <div className="form-row form-field-group">
              <div className="form-field">
                <label className="form-label required">Country</label>
                <input
                  type="text"
                  className={inputClass('country')}
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="India"
                />
                {renderError('country')}
              </div>
              <div className="form-field">
                <label className="form-label required">State/Province</label>
                <input
                  type="text"
                  className={inputClass('state')}
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Telangana"
                />
                {renderError('state')}
              </div>
            </div>

            <div className="form-row form-field-group">
              <div className="form-field">
                <label className="form-label required">City</label>
                <input
                  type="text"
                  className={inputClass('city')}
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Hyderabad"
                />
                {renderError('city')}
              </div>
              <div className="form-field">
                <label className="form-label required">ZIP/Postal Code</label>
                <input
                  type="text"
                  className={inputClass('zipCode')}
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="500008"
                />
                {renderError('zipCode')}
              </div>
            </div>

            <div className="form-row form-field-group">
              <div className="form-field">
                <label className="form-label required">Address Line 1</label>
                <input
                  type="text"
                  className={inputClass('addressLine1')}
                  value={formData.addressLine1}
                  onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                  placeholder="House #, street"
                />
                {renderError('addressLine1')}
              </div>
              <div className="form-field">
                <label className="form-label required">Address Line 2</label>
                <input
                  type="text"
                  className={inputClass('addressLine2')}
                  value={formData.addressLine2}
                  onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                  placeholder="Area, landmark"
                />
                {renderError('addressLine2')}
              </div>
            </div>
          </>
        )}

        <div className="form-actions">
          <button type="submit" className="continue-button" disabled={loading || hasFamilyErrors(errors)}>
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Parent2Form;
