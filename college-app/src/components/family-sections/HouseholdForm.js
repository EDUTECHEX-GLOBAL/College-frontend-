import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HouseholdForm.css';

const API_URL = process.env.REACT_APP_API_URL;

const HouseholdForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    parentsMaritalStatus: '',
    permanentHomeWith: '',
    hasChildren: '',
    childrenCount: ''
  });
  const [loading, setLoading] = useState(false);

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
        setFormData(response.data.familyData.household);
      }
    } catch (error) {
      console.error('Error fetching household data:', error);
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
      await axios.post(`${API_URL}/api/students/family-dashb/household`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Navigate to next section
      navigate('/dashboard/family/parent1');
    } catch (error) {
      console.error('Error saving household data:', error);
      alert('Error saving household data. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <select 
            className="form-select"
            value={formData.parentsMaritalStatus}
            onChange={(e) => handleInputChange('parentsMaritalStatus', e.target.value)}
            required
          >
            <option value="">Choose an option</option>
            <option value="married">Married</option>
            <option value="separated">Separated</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
            <option value="never_married">Never Married</option>
            <option value="civil_union">Civil Union/Domestic Partnership</option>
          </select>
        </div>

        {/* Permanent Home */}
        <div className="form-field">
          <label className="form-label required">
            With whom do you make your permanent home?*
          </label>
          <select 
            className="form-select"
            value={formData.permanentHomeWith}
            onChange={(e) => handleInputChange('permanentHomeWith', e.target.value)}
            required
          >
            <option value="">Choose an option</option>
            <option value="both_parents">Both Parents</option>
            <option value="parent1">Parent 1</option>
            <option value="parent2">Parent 2</option>
            <option value="other_relatives">Other Relatives</option>
            <option value="guardian">Guardian</option>
            <option value="on_my_own">On My Own</option>
          </select>
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