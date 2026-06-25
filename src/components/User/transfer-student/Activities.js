// src/components/ActivitiesForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './Activities.css';

// Import activities section components
import ActivitiesSection from './activitiessection/Activities';
import ResponsibilitiesSection from './activitiessection/Responsibilities';
import ActivitiesPreview from './ActivitiesPre';

const ActivitiesForm = () => {
  const navigate = useNavigate();
  const { '*': section } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('activities');
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Define all activities sections in order
  const sections = ['activities', 'responsibilities'];

  // Main activities form state
  const [activitiesData, setActivitiesData] = useState({
    // Activities List
    activities: {
      hasActivities: '',
      activitiesList: []
    },

    // Responsibilities and Circumstances
    responsibilities: {
      selectedResponsibilities: [],
      selectedCircumstances: []
    },

    // Activities Completion Tracking
    activitiesCompletion: {
      activities: false,
      responsibilities: false
    }
  });

  // Set active section based on URL
  useEffect(() => {
    if (section) {
      setActiveSection(section);
    } else {
      navigate('/transfer/dashboard/activities/activities', { replace: true });
    }
  }, [section, navigate]);

  // Fetch existing activities data
  const fetchActivitiesData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        navigate('/sign-in');
        return;
      }

      console.log('📥 Fetching activities data...');
      const response = await axiosInstance.get('/api/transfer/activities');

      console.log('✅ Activities data received:', response.data);

      if (response.data.success && response.data.activities) {
        setActivitiesData(response.data.activities);
        const serverProgress = response.data.activitiesProgress || 0;
        setProgress(serverProgress);
        console.log('📊 Activities progress:', serverProgress);

        // ✅ NEW: sync progress to localStorage and notify dashboard
        try {
          const stored = JSON.parse(localStorage.getItem('userData') || '{}');
          localStorage.setItem(
            'userData',
            JSON.stringify({ ...stored, activitiesProgress: serverProgress })
          );
          console.log('💾 Stored activitiesProgress in localStorage:', serverProgress);
        } catch (e) {
          console.error('Error storing activitiesProgress in localStorage', e);
        }

        window.dispatchEvent(
          new CustomEvent('activitiesProgressUpdate', {
            detail: { activitiesProgress: serverProgress }
          })
        );
      }
    } catch (error) {
      console.error('❌ Error fetching activities:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      
      if (error.response?.status === 401) {
        console.error('❌ Unauthorized - redirecting to sign-in');
        localStorage.removeItem('token');
        navigate('/sign-in');
        return;
      }
      
      setMessage({ 
        type: 'error', 
        text: 'Failed to load activities data. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch activities data on component mount
  useEffect(() => {
    fetchActivitiesData();
  }, []);

  // Handler functions
  const handleInputChange = (section, field, value) => {
    setActivitiesData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayChange = (section, arrayField, index, field, value) => {
    setActivitiesData(prev => {
      const updatedArray = [...prev[section][arrayField]];
      updatedArray[index] = {
        ...updatedArray[index],
        [field]: value
      };
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [arrayField]: updatedArray
        }
      };
    });
  };

  const addArrayItem = (section, arrayField, newItem) => {
    setActivitiesData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [arrayField]: [...prev[section][arrayField], newItem]
      }
    }));
  };

  const removeArrayItem = (section, arrayField, index) => {
    setActivitiesData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [arrayField]: prev[section][arrayField].filter((_, i) => i !== index)
      }
    }));
  };

  // Save activities function
  const saveActivities = async (section = null) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        navigate('/sign-in');
        return;
      }

      console.log('💾 Saving activities data...');

      const response = await axiosInstance.put('/api/transfer/activities', activitiesData);

      console.log('✅ Backend response:', response.data);

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Activities data saved successfully!' 
        });
        
        const newProgress =
          response.data.progress?.activities ||
          response.data.activitiesProgress ||
          0;
        setProgress(newProgress);
        console.log('📊 Updated progress:', newProgress);

        // ✅ NEW: persist progress + notify dashboard
        try {
          const stored = JSON.parse(localStorage.getItem('userData') || '{}');
          localStorage.setItem(
            'userData',
            JSON.stringify({ ...stored, activitiesProgress: newProgress })
          );
          console.log('💾 Updated activitiesProgress in localStorage');
        } catch (e) {
          console.error('Error updating activitiesProgress in localStorage', e);
        }

        window.dispatchEvent(
          new CustomEvent('activitiesProgressUpdate', {
            detail: { activitiesProgress: newProgress }
          })
        );

        console.log('✅ Activities saved');
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save activities');
      }
    } catch (error) {
      console.error('❌ Error saving activities:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save activities. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Save and Continue with correct navigation
  const handleSaveAndContinue = () => {
    saveActivities(activeSection);
    
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex < sections.length - 1) {
      setTimeout(() => {
        navigate(`/transfer/dashboard/activities/${sections[currentIndex + 1]}`);
      }, 500);
    } else {
      setShowPreview(true);
    }
  };

  const handleSaveOnly = () => {
    saveActivities(activeSection);
  };

  // Back to Dashboard with correct path
  const handleBackToDashboard = () => {
    navigate('/transfer/dashboard');
  };

  // Edit Section with correct path
  const handleEditSection = (section) => {
    setShowPreview(false);
    navigate(`/transfer/dashboard/activities/${section}`);
  };

  // Final Submit with correct redirect
  const handleFinalSubmit = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        setMessage({ 
          type: 'error', 
          text: 'Session expired. Please sign in again.' 
        });
        setTimeout(() => {
          navigate('/sign-in');
        }, 2000);
        return;
      }

      console.log('🎯 Final activities submission...');

      const finalCompletion = {
        activities: true,
        responsibilities: true
      };

      const finalData = {
        ...activitiesData,
        activitiesCompletion: finalCompletion
      };

      const response = await axiosInstance.put('/api/transfer/activities', finalData);

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: '🎉 Activities section completed successfully!' 
        });
        
        setProgress(100);

        // ✅ NEW: store 100 and notify dashboard
        try {
          const stored = JSON.parse(localStorage.getItem('userData') || '{}');
          localStorage.setItem(
            'userData',
            JSON.stringify({ ...stored, activitiesProgress: 100 })
          );
          console.log('💾 Stored final activitiesProgress = 100 in localStorage');
        } catch (e) {
          console.error('Error storing final activitiesProgress', e);
        }

        window.dispatchEvent(
          new CustomEvent('activitiesProgressUpdate', {
            detail: { activitiesProgress: 100 }
          })
        );

        console.log('✅ Activities submitted successfully!');
        console.log('🔄 Redirecting to dashboard in 3 seconds...');
        
        setTimeout(() => {
          navigate('/transfer/dashboard');
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save activities');
      }
      
    } catch (error) {
      console.error('❌ Error submitting activities:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to submit activities. Please try again.';
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackToForm = () => {
    setShowPreview(false);
  };

  // Check if current section is the last one
  const isLastSection = activeSection === sections[sections.length - 1];

  if (loading) {
    return (
      <div className="activities-loading">
        <div className="loading-spinner"></div>
        <p>Loading your activities information...</p>
      </div>
    );
  }

  // Render the active section component
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'activities':
        return (
          <ActivitiesSection 
            activitiesData={activitiesData} 
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
          />
        );
      case 'responsibilities':
        return (
          <ResponsibilitiesSection 
            activitiesData={activitiesData} 
            handleInputChange={handleInputChange}
          />
        );
      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <div className="activities-container">
      {/* Header with Back Button and Centered Title */}
      <div className="activities-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h1>Complete your Activities</h1>
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{progress}% Complete</span>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="activities-content">
        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {message.text}
          </div>
        )}

        {showPreview ? (
          <ActivitiesPreview 
            activitiesData={activitiesData}
            onEditSection={handleEditSection}
            onBackToForm={handleBackToForm}
            onFinalSubmit={handleFinalSubmit}
            saving={saving}
            message={message}
          />
        ) : (
          <>
            {renderActiveSection()}

            {/* Action Buttons */}
            <div className="form-actions">
              <button 
                type="button" 
                className="secondary-button"
                onClick={handleSaveOnly}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Section'}
              </button>
              
              <button 
                type="button" 
                className="primary-button"
                onClick={handleSaveAndContinue}
                disabled={saving}
              >
                {isLastSection ? 'Save & Preview' : 'Save & Continue →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivitiesForm;
