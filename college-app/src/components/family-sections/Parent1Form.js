import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Parent1Form.css';

const API_URL = process.env.REACT_APP_API_URL;

const Parent1Form = () => {
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
    educationLevel: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchParent1Data();
  }, []);

  const fetchParent1Data = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/students/family-dashb`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success && response.data.familyData.parent1) {
        setFormData(response.data.familyData.parent1);
      }
    } catch (error) {
      console.error('Error fetching parent 1 data:', error);
    }
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
      await axios.post(`${API_URL}/api/students/family-dashb/parent1`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      navigate('/dashboard/family/parent2');
    } catch (error) {
      console.error('Error saving parent 1 data:', error);
      alert('Error saving parent 1 data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="family-form-container">
      <div className="form-header">
        <h2 className="form-title">Parent 1</h2>
        <div className="progress-indicator">In Progress</div>
      </div>

      <form onSubmit={handleSubmit} className="family-form">
        {/* Parent Type */}
        <div className="form-field">
          <label className="form-label required">
            Parent 1 type*
          </label>
          <div className="radio-group vertical">
            <label className="radio-label">
              <input
                type="radio"
                name="parentType"
                value="mother"
                checked={formData.parentType === 'mother'}
                onChange={(e) => handleInputChange('parentType', e.target.value)}
                required
              />
              Mother
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="parentType"
                value="father"
                checked={formData.parentType === 'father'}
                onChange={(e) => handleInputChange('parentType', e.target.value)}
              />
              Father
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="parentType"
                value="limited_info"
                checked={formData.parentType === 'limited_info'}
                onChange={(e) => handleInputChange('parentType', e.target.value)}
              />
              I have limited information about this parent
            </label>
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
        <div className="form-field">
          <label className="form-label">
            Is parent 1 living?
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="isLiving"
                value="yes"
                checked={formData.isLiving === 'yes'}
                onChange={(e) => handleInputChange('isLiving', e.target.value)}
              />
              Yes
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="isLiving"
                value="no"
                checked={formData.isLiving === 'no'}
                onChange={(e) => handleInputChange('isLiving', e.target.value)}
              />
              No
            </label>
          </div>
          <button 
            type="button" 
            className="clear-answer"
            onClick={() => handleInputChange('isLiving', '')}
          >
            Clear answer
          </button>
        </div>

        {/* Personal Information */}
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Prefix</label>
            <select 
              className="form-select"
              value={formData.prefix}
              onChange={(e) => handleInputChange('prefix', e.target.value)}
            >
              <option value="">Choose an option</option>
              <option value="mr">Mr.</option>
              <option value="ms">Ms.</option>
              <option value="mrs">Mrs.</option>
              <option value="dr">Dr.</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">First/Given name</label>
            <input
              type="text"
              className="form-input"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter first name"
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

        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Last/Family/Surname</label>
            <input
              type="text"
              className="form-input"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter last name"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Former last/family/surname (if any)</label>
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
            <select 
              className="form-select"
              value={formData.suffix}
              onChange={(e) => handleInputChange('suffix', e.target.value)}
            >
              <option value="">Choose an option</option>
              <option value="jr">Jr.</option>
              <option value="sr">Sr.</option>
              <option value="ii">II</option>
              <option value="iii">III</option>
            </select>
          </div>
        </div>

        {/* Occupation and Education */}
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Occupation (former occupation, if retired or deceased)</label>
            <select 
              className="form-select"
              value={formData.occupation}
              onChange={(e) => handleInputChange('occupation', e.target.value)}
            >
              <option value="">Choose an option</option>
              <option value="architect">Architect</option>
              <option value="doctor">Doctor</option>
              <option value="engineer">Engineer</option>
              <option value="teacher">Teacher</option>
              <option value="business_owner">Business Owner</option>
              <option value="retired">Retired</option>
              <option value="deceased">Deceased</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Highest education level</label>
            <select 
              className="form-select"
              value={formData.educationLevel}
              onChange={(e) => handleInputChange('educationLevel', e.target.value)}
            >
              <option value="">Choose an option</option>
              <option value="high_school">High School</option>
              <option value="some_college">Some College</option>
              <option value="associates">Associate's Degree</option>
              <option value="bachelors">Bachelor's Degree</option>
              <option value="masters">Master's Degree</option>
              <option value="doctorate">Doctorate</option>
              <option value="professional">Professional Degree</option>
            </select>
          </div>
        </div>

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

export default Parent1Form;