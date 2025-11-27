import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SiblingForm.css';

const API_URL = process.env.REACT_APP_API_URL;

const SiblingForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    siblingsCount: '',
    siblingsList: []
  });
  const [loading, setLoading] = useState(false);

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
        setFormData({
          siblingsCount: siblingsData.siblingsCount?.toString() || '',
          siblingsList: siblingsData.siblingsList || []
        });
      }
    } catch (error) {
      console.error('Error fetching sibling data:', error);
    }
  };

  const handleSiblingsCountChange = (count) => {
    const siblingsCount = parseInt(count);
    const newSiblingsList = Array.from({ length: siblingsCount }, (_, index) => 
      formData.siblingsList[index] || { firstName: '', lastName: '', age: '' }
    );
    
    setFormData(prev => ({
      ...prev,
      siblingsCount: count,
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
      // Prepare data for submission
      const submissionData = {
        siblingsCount: parseInt(formData.siblingsCount),
        siblingsList: formData.siblingsList
      };

      // Validate required fields for siblings if count > 0
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
      const response = await axios.post(`${API_URL}/api/students/family-dashb/sibling`, submissionData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        // Navigate back to dashboard
        navigate('/dashboard');
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

  return (
    <div className="family-form-container">
      <div className="form-header">
        <h2 className="form-title">Sibling</h2>
        <div className="progress-indicator">In Progress</div>
      </div>

      <form onSubmit={handleSubmit} className="family-form">
        {/* Siblings Count */}
        <div className="form-field">
          <label className="form-label required">
            Please specify number of siblings you have*
          </label>
          <select 
            className="form-select sibling-count-select"
            value={formData.siblingsCount}
            onChange={(e) => handleSiblingsCountChange(e.target.value)}
            required
          >
            <option value="">Choose an option</option>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10+</option>
          </select>
        </div>

        {/* Display selected number */}
        {formData.siblingsCount && formData.siblingsCount !== '0' && (
          <div className="selected-count-display">
            <p className="count-text">{formData.siblingsCount}</p>
          </div>
        )}

        {/* Sibling Details Forms */}
        {formData.siblingsCount && formData.siblingsCount !== '0' && (
          <div className="siblings-details-section">
            <h3 className="siblings-section-title">Sibling Details</h3>
            
            {formData.siblingsList.map((sibling, index) => (
              <div key={index} className="sibling-form-card">
                <h4 className="sibling-title">Sibling {index + 1}</h4>
                
                <div className="sibling-form-fields">
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label required">
                        First/Given name*
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={sibling.firstName}
                        onChange={(e) => handleSiblingChange(index, 'firstName', e.target.value)}
                        required
                        placeholder="Enter first name"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label required">
                        Last/Family/Surname*
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={sibling.lastName}
                        onChange={(e) => handleSiblingChange(index, 'lastName', e.target.value)}
                        required
                        placeholder="Enter last name"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">
                        Age
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        max="100"
                        value={sibling.age}
                        onChange={(e) => handleSiblingChange(index, 'age', e.target.value)}
                        placeholder="Enter age"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show message when 0 siblings selected */}
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