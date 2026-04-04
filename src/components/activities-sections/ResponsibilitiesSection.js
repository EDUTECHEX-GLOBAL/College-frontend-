import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ResponsibilitiesSection.css';

const API_URL = process.env.REACT_APP_API_URL;

const ResponsibilitiesSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [responsibilitiesData, setResponsibilitiesData] = useState({
    responsibilities: [],
    circumstances: []
  });

  const handleBackToDashboard = () => {
    const isFirstYear = window.location.pathname.includes('/firstyear/');
    navigate(isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard');
  };

  const responsibilityOptions = [
    "Assisting family or household members with tasks such as doctors' appointments, bank visits, or visa interviews",
    'Farm work or unpaid work for a family business',
    'Interpreting or translating for family or household members',
    'Managing family or household finances, budget, or paying bills',
    'Providing transportation for family or household members',
    'Taking care of sick, disabled, and/or elderly members of my family or household',
    'Taking care of younger family or household members',
    'Taking care of my own child or children',
    'Working at a paid job to contribute to my households income',
    'Other'
  ];

  const circumstanceOptions = [
    'Commuting 60 minutes or more to and from school each day',
    'Experiencing homelessness or another unstable living situation',
    'Living without consistent heat, power, water, or access to food',
    'Living without reliable or usable internet',
    'Living independently or living on my own (not including boarding school)'
  ];

  useEffect(() => {
    const fetchResponsibilitiesData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_URL}/api/students/responsibilities`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
          setResponsibilitiesData(response.data.responsibilitiesData || {
            responsibilities: [],
            circumstances: []
          });
        }
      } catch (error) {
        console.error('Error fetching responsibilities data:', error);
      }
    };
    fetchResponsibilitiesData();
  }, []);

  const handleResponsibilityChange = (responsibility, checked) => {
    setResponsibilitiesData(prev => {
      if (responsibility === 'None of these') {
        return { ...prev, responsibilities: checked ? [] : prev.responsibilities };
      }
      if (checked) {
        return {
          ...prev,
          responsibilities: [...prev.responsibilities.filter(r => r !== 'None of these'), responsibility]
        };
      }
      return { ...prev, responsibilities: prev.responsibilities.filter(r => r !== responsibility) };
    });
  };

  const handleCircumstanceChange = (circumstance, checked) => {
    setResponsibilitiesData(prev => {
      if (circumstance === 'None of these') {
        return { ...prev, circumstances: checked ? [] : prev.circumstances };
      }
      if (checked) {
        return {
          ...prev,
          circumstances: [...prev.circumstances.filter(c => c !== 'None of these'), circumstance]
        };
      }
      return { ...prev, circumstances: prev.circumstances.filter(c => c !== circumstance) };
    });
  };

  const handleSaveAndContinue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/sign-in'); return; }

      const response = await axios.post(
        `${API_URL}/api/students/responsibilities`,
        { responsibilitiesData },
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          localStorage.setItem('userData', JSON.stringify({
            ...userData,
            applicationProgress: { ...userData.applicationProgress, responsibilities: 100 }
          }));
        }
        handleBackToDashboard();
      }
    } catch (error) {
      console.error('Error saving responsibilities data:', error);
      alert('Error saving your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reusable checkbox option row
  const OptionRow = ({ label, checked, onChange, isNone = false }) => (
    <label className={`option-label${isNone ? ' none-option' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="option-input"
        disabled={loading}
      />
      <span className="checkmark"></span>
      <span className="option-text">{label}</span>
    </label>
  );

  return (
    <div className="responsibilities-container">
      <div className="responsibilities-content">
        {/* Header */}
        <div className="responsibilities-header">
          <div className="header-left-container">
            <button
              className="back-dashboard-btn"
              onClick={handleBackToDashboard}
              disabled={loading}
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="header-center">
            <h1>Complete your Common Application</h1>
          </div>
          <div className="header-right">
            <div className="progress-status">In progress</div>
          </div>
        </div>

        <div className="responsibilities-card">
          <h2>Responsibilities and circumstances</h2>

          <div className="responsibilities-description">
            <p>
              Sometimes academics and activities are impacted by household responsibilities or other
              circumstances. Sharing this information with colleges can help them better understand
              the context of your application. You may repeat information you already provided
              elsewhere in your application.
            </p>
          </div>

          {/* Responsibilities */}
          <div className="section-group">
            <div className="responsibilities-section-header">
              <h3>
                Please select which responsibilities you spend 4 or more hours per week doing.
                <span className="required-asterisk">*</span>
              </h3>
            </div>

            <div className="options-group">
              {responsibilityOptions.map((option, index) => (
                <OptionRow
                  key={index}
                  label={option}
                  checked={responsibilitiesData.responsibilities.includes(option)}
                  onChange={(e) => handleResponsibilityChange(option, e.target.checked)}
                />
              ))}
              <OptionRow
                label="None of these"
                isNone
                checked={responsibilitiesData.responsibilities.includes('None of these')}
                onChange={(e) => handleResponsibilityChange('None of these', e.target.checked)}
              />
            </div>
          </div>

          {/* Circumstances */}
          <div className="section-group">
            <div className="responsibilities-section-header">
              <h3>
                Please select which circumstances you've experienced.
                <span className="required-asterisk">*</span>
              </h3>
            </div>

            <div className="options-group">
              {circumstanceOptions.map((option, index) => (
                <OptionRow
                  key={index}
                  label={option}
                  checked={responsibilitiesData.circumstances.includes(option)}
                  onChange={(e) => handleCircumstanceChange(option, e.target.checked)}
                />
              ))}
              <OptionRow
                label="None of these"
                isNone
                checked={responsibilitiesData.circumstances.includes('None of these')}
                onChange={(e) => handleCircumstanceChange('None of these', e.target.checked)}
              />
            </div>
          </div>

          <div className="continue-section">
            <button
              className="continue-btn"
              onClick={handleSaveAndContinue}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsibilitiesSection;