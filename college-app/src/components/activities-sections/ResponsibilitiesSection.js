import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ResponsibilitiesSection.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const ResponsibilitiesSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [responsibilitiesData, setResponsibilitiesData] = useState({
    responsibilities: [],
    circumstances: []
  });

  // Determine if user is first year or transfer
  const isFirstYear = window.location.pathname.includes('/firstyear/');
  const basePath = isFirstYear ? '/firstyear' : '/transfer';

  const handleBackToDashboard = () => {
    navigate(`${basePath}/dashboard`);
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
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/sign-in');
          return;
        }

        const response = await axios.get(`${API_URL}/api/students/responsibilities`, {
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
          }
        });

        if (response.data.success) {
          setResponsibilitiesData(response.data.responsibilitiesData || {
            responsibilities: [],
            circumstances: []
          });
        }
      } catch (error) {
        console.error('Error fetching responsibilities data:', error);
        // If error, keep default empty arrays
      } finally {
        setLoading(false);
      }
    };
    fetchResponsibilitiesData();
  }, [navigate]);

  const handleResponsibilityChange = (responsibility, checked) => {
    setResponsibilitiesData(prev => {
      // Handle "None of these" selection
      if (responsibility === 'None of these') {
        if (checked) {
          return { ...prev, responsibilities: ['None of these'] };
        } else {
          return { ...prev, responsibilities: [] };
        }
      }
      
      // Remove "None of these" if it exists when selecting other options
      let newResponsibilities = checked
        ? [...prev.responsibilities.filter(r => r !== 'None of these'), responsibility]
        : prev.responsibilities.filter(r => r !== responsibility);
      
      return { ...prev, responsibilities: newResponsibilities };
    });
  };

  const handleCircumstanceChange = (circumstance, checked) => {
    setResponsibilitiesData(prev => {
      // Handle "None of these" selection
      if (circumstance === 'None of these') {
        if (checked) {
          return { ...prev, circumstances: ['None of these'] };
        } else {
          return { ...prev, circumstances: [] };
        }
      }
      
      // Remove "None of these" if it exists when selecting other options
      let newCircumstances = checked
        ? [...prev.circumstances.filter(c => c !== 'None of these'), circumstance]
        : prev.circumstances.filter(c => c !== circumstance);
      
      return { ...prev, circumstances: newCircumstances };
    });
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/sign-in');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/students/responsibilities`,
        { responsibilitiesData },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
          } 
        }
      );

      if (response.data.success) {
        // Update local storage with progress
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          localStorage.setItem('userData', JSON.stringify({
            ...userData,
            applicationProgress: { 
              ...userData.applicationProgress, 
              responsibilities: 100 
            }
          }));
        }
        
        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('responsibilitiesUpdated', { 
          detail: { completed: true } 
        }));
        
        // Navigate back to dashboard
        handleBackToDashboard();
      } else {
        alert('Error saving your information. Please try again.');
      }
    } catch (error) {
      console.error('Error saving responsibilities data:', error);
      alert('Error saving your information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    let total = 0;
    let completed = 0;
    
    if (responsibilitiesData.responsibilities.length > 0) {
      total++;
      completed++;
    }
    if (responsibilitiesData.circumstances.length > 0) {
      total++;
      completed++;
    }
    
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();

  // Reusable checkbox option component
  const OptionRow = ({ label, checked, onChange, isNone = false }) => (
    <label className={`option-label ${isNone ? 'none-option' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="option-input"
        disabled={saving}
      />
      <span className="checkmark"></span>
      <span className="option-text">{label}</span>
    </label>
  );

  if (loading) {
    return (
      <div className="responsibilities-container">
        <div className="responsibilities-content">
          <div className="responsibilities-card" style={{ textAlign: 'center', padding: '60px 32px' }}>
            <div className="loading-spinner" style={{ 
              width: '44px', 
              height: '44px', 
              border: '3px solid var(--resp-gray-200)', 
              borderTop: '3px solid var(--resp-primary)', 
              borderRadius: '50%', 
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: 'var(--resp-gray-600)' }}>Loading your information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="responsibilities-container">
      <div className="responsibilities-content">
        {/* Header */}
        <div className="responsibilities-header">
          <div className="header-left-container">
            <button
              className="back-dashboard-btn"
              onClick={handleBackToDashboard}
              disabled={saving}
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="header-center">
            <h1>Complete your Common Application</h1>
          </div>
          <div className="header-right">
            <div className="progress-status">{progress}% Complete</div>
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

          {/* Responsibilities Section */}
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
                  key={`resp-${index}`}
                  label={option}
                  checked={responsibilitiesData.responsibilities.includes(option)}
                  onChange={(checked) => handleResponsibilityChange(option, checked)}
                />
              ))}
              <OptionRow
                label="None of these"
                isNone={true}
                checked={responsibilitiesData.responsibilities.includes('None of these')}
                onChange={(checked) => handleResponsibilityChange('None of these', checked)}
              />
            </div>
          </div>

          {/* Circumstances Section */}
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
                  key={`circ-${index}`}
                  label={option}
                  checked={responsibilitiesData.circumstances.includes(option)}
                  onChange={(checked) => handleCircumstanceChange(option, checked)}
                />
              ))}
              <OptionRow
                label="None of these"
                isNone={true}
                checked={responsibilitiesData.circumstances.includes('None of these')}
                onChange={(checked) => handleCircumstanceChange('None of these', checked)}
              />
            </div>
          </div>

          {/* Continue Button */}
          <div className="continue-section">
            <button
              className="continue-btn"
              onClick={handleSaveAndContinue}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner" style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    marginRight: '8px'
                  }}></span>
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsibilitiesSection;