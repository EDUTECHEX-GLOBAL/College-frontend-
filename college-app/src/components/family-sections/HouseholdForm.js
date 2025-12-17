import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import './HouseholdForm.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const HouseholdForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    parentsMaritalStatus: '',
    permanentHomeWith: '',
    hasChildren: '',
    childrenCount: ''
  });
  const [loading, setLoading] = useState(false);

  // Options for dropdowns
  const maritalStatusOptions = [
    { value: 'married', label: 'Married' },
    { value: 'separated', label: 'Separated' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'never_married', label: 'Never Married' },
    { value: 'civil_union', label: 'Civil Union/Domestic Partnership' }
  ];

  const permanentHomeOptions = [
    { value: 'both_parents', label: 'Both Parents' },
    { value: 'parent1', label: 'Parent 1' },
    { value: 'parent2', label: 'Parent 2' },
    { value: 'other_relatives', label: 'Other Relatives' },
    { value: 'guardian', label: 'Guardian' },
    { value: 'on_my_own', label: 'On My Own' }
  ];

  useEffect(() => {
    fetchHouseholdData();
  }, []);

  const fetchHouseholdData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/students/family-dashb`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success && response.data.familyData.household) {
        const householdData = response.data.familyData.household;
        setFormData({
          parentsMaritalStatus: householdData.parentsMaritalStatus || '',
          permanentHomeWith: householdData.permanentHomeWith || '',
          hasChildren: householdData.hasChildren || '',
          childrenCount: householdData.childrenCount || ''
        });
      }
    } catch (error) {
      console.error('Error fetching household data:', error);
    }
  };

  const handleSelectChange = (field, selectedOption) => {
    setFormData(prev => ({
      ...prev,
      [field]: selectedOption ? selectedOption.value : ''
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/students/family-dashb/household`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      navigate('/firstyear/dashboard/family/parent1');
    } catch (error) {
      console.error('Error saving household data:', error);
      alert('Error saving household data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get selected values for react-select
  const getSelectedMaritalStatus = () => {
    return maritalStatusOptions.find(option => option.value === formData.parentsMaritalStatus);
  };

  const getSelectedPermanentHome = () => {
    return permanentHomeOptions.find(option => option.value === formData.permanentHomeWith);
  };

  return (
    <div className="family-form-container">
      <div className="form-header">
        <h2 className="form-title">Household</h2>
        <div className="progress-indicator">In Progress</div>
      </div>

      <form onSubmit={handleSubmit} className="family-form">
        {/* Parents' Marital Status */}
        <div className="form-field">
          <label className="form-label required">
            Parents' marital status (relative to each other)*
          </label>
          <Select
            className="react-select-container"
            classNamePrefix="react-select"
            value={getSelectedMaritalStatus()}
            onChange={(option) => handleSelectChange('parentsMaritalStatus', option)}
            options={maritalStatusOptions}
            placeholder="Choose an option"
            isSearchable={false}
            required
          />
        </div>

        {/* Permanent Home */}
        <div className="form-field">
          <label className="form-label required">
            With whom do you make your permanent home?*
          </label>
          <Select
            className="react-select-container"
            classNamePrefix="react-select"
            value={getSelectedPermanentHome()}
            onChange={(option) => handleSelectChange('permanentHomeWith', option)}
            options={permanentHomeOptions}
            placeholder="Choose an option"
            isSearchable={false}
            required
          />
        </div>

        {/* Children */}
        <div className="form-field">
          <label className="form-label">
            Do you have any children?
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="hasChildren"
                value="yes"
                checked={formData.hasChildren === 'yes'}
                onChange={(e) => handleInputChange('hasChildren', e.target.value)}
              />
              Yes
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="hasChildren"
                value="no"
                checked={formData.hasChildren === 'no'}
                onChange={(e) => handleInputChange('hasChildren', e.target.value)}
              />
              No
            </label>
          </div>
          <button 
            type="button" 
            className="clear-answer"
            onClick={() => handleInputChange('hasChildren', '')}
          >
            Clear answer
          </button>
        </div>

        {/* Children Count */}
        {formData.hasChildren === 'yes' && (
          <div className="form-field">
            <label className="form-label required">
              How many?*
            </label>
            <input
              type="number"
              className="form-input"
              min="1"
              max="20"
              value={formData.childrenCount}
              onChange={(e) => handleInputChange('childrenCount', e.target.value)}
              required
            />
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

export default HouseholdForm;