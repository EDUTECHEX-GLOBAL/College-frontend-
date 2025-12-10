// src/components/WritingForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './Writing.css';

// Import writing section components
import PersonalEssaySection from './writingsection/PersonalEssay';
import AdditionalInformationSection from './writingsection/AdditionalInformation';
import WritingPreview from './WritingPre';

const WritingForm = () => {
  const navigate = useNavigate();
  const { '*': section } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('personal-essay');
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Define all writing sections in order
  const sections = [
    'personal-essay',
    'additional-information'
  ];

  // Main writing form state
  const [writingData, setWritingData] = useState({
    // Personal Essay
    personalEssay: {
      essayRequired: false,
      selectedTopic: '',
      essayText: '',
      wordCount: 0
    },

    // Additional Information
    additionalInformation: {
      shareDetails: '',
      challengesExperienced: '',
      additionalQualifications: ''
    },

    // Writing Completion Tracking
    writingCompletion: {
      personalEssay: false,
      additionalInformation: false
    }
  });

  // Set active section based on URL
  useEffect(() => {
    if (section) {
      setActiveSection(section);
    } else {
      navigate('/transfer/dashboard/writing/personal-essay', { replace: true });
    }
  }, [section, navigate]);

  // Fetch existing writing data
  const fetchWritingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        navigate('/sign-in');
        return;
      }

      console.log('📥 Fetching writing data...');
      
      const response = await axiosInstance.get('/api/writingtest');

      console.log('✅ Writing data received:', response.data);

      if (response.data.success && response.data.writing) {
        setWritingData(response.data.writing);
        const serverProgress = response.data.writingProgress || 0;
        setProgress(serverProgress);
        console.log('📊 Writing progress:', serverProgress);

        // ✅ NEW: sync writingProgress to localStorage and notify dashboard
        try {
          const stored = JSON.parse(localStorage.getItem('userData') || '{}');
          localStorage.setItem(
            'userData',
            JSON.stringify({ ...stored, writingProgress: serverProgress })
          );
          console.log('💾 Stored writingProgress in localStorage:', serverProgress);
        } catch (e) {
          console.error('Error storing writingProgress in localStorage', e);
        }

        window.dispatchEvent(
          new CustomEvent('writingProgressUpdate', {
            detail: { writingProgress: serverProgress }
          })
        );
      }
    } catch (error) {
      console.error('❌ Error fetching writing:');
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
        text: 'Failed to load writing data. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch writing data on component mount
  useEffect(() => {
    fetchWritingData();
  }, []);

  // Handler functions
  const handleInputChange = (section, field, value) => {
    setWritingData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Save writing function
  const saveWriting = async (section = null) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        navigate('/sign-in');
        return;
      }

      console.log('💾 Saving writing data...');

      const response = await axiosInstance.put('/api/writingtest', writingData);

      console.log('✅ Backend response:', response.data);

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Writing data saved successfully!' 
        });
        
        const newProgress =
          response.data.progress?.writing ||
          response.data.writingProgress ||
          0;
        setProgress(newProgress);
        console.log('📊 Updated progress:', newProgress);

        // ✅ NEW: persist writingProgress + notify dashboard
        try {
          const stored = JSON.parse(localStorage.getItem('userData') || '{}');
          localStorage.setItem(
            'userData',
            JSON.stringify({ ...stored, writingProgress: newProgress })
          );
          console.log('💾 Updated writingProgress in localStorage');
        } catch (e) {
          console.error('Error updating writingProgress in localStorage', e);
        }

        window.dispatchEvent(
          new CustomEvent('writingProgressUpdate', {
            detail: { writingProgress: newProgress }
          })
        );

        console.log('✅ Writing saved');
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save writing');
      }
    } catch (error) {
      console.error('❌ Error saving writing:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save writing. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Save and Continue with correct navigation
  const handleSaveAndContinue = () => {
    saveWriting(activeSection);
    
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex < sections.length - 1) {
      setTimeout(() => {
        navigate(`/transfer/dashboard/writing/${sections[currentIndex + 1]}`);
      }, 500);
    } else {
      setShowPreview(true);
    }
  };

  const handleSaveOnly = () => {
    saveWriting(activeSection);
  };

  // Back to Dashboard with correct path
  const handleBackToDashboard = () => {
    navigate('/transfer/dashboard');
  };

  // Edit Section with correct path
  const handleEditSection = (section) => {
    setShowPreview(false);
    navigate(`/transfer/dashboard/writing/${section}`);
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

      console.log('🎯 Final writing submission...');

      const finalCompletion = {
        personalEssay: true,
        additionalInformation: true
      };

      const finalData = {
        ...writingData,
        writingCompletion: finalCompletion
      };

      const response = await axiosInstance.put('/api/writingtest', finalData);

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: '🎉 Writing section completed successfully!' 
        });
        
        setProgress(100);

        // ✅ NEW: store 100 and notify dashboard
        try {
          const stored = JSON.parse(localStorage.getItem('userData') || '{}');
          localStorage.setItem(
            'userData',
            JSON.stringify({ ...stored, writingProgress: 100 })
          );
          console.log('💾 Stored final writingProgress = 100 in localStorage');
        } catch (e) {
          console.error('Error storing final writingProgress', e);
        }

        window.dispatchEvent(
          new CustomEvent('writingProgressUpdate', {
            detail: { writingProgress: 100 }
          })
        );

        console.log('✅ Writing submitted successfully!');
        console.log('🔄 Redirecting to dashboard in 3 seconds...');
        
        setTimeout(() => {
          navigate('/transfer/dashboard');
        }, 3000);
        
      } else {
        throw new Error(response.data.message || 'Failed to save writing');
      }
      
    } catch (error) {
      console.error('❌ Error submitting writing:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to submit writing. Please try again.';
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
      <div className="writing-loading">
        <div className="loading-spinner"></div>
        <p>Loading your writing information...</p>
      </div>
    );
  }

  // Render the active section component
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'personal-essay':
        return (
          <PersonalEssaySection 
            writingData={writingData} 
            handleInputChange={handleInputChange}
          />
        );
      case 'additional-information':
        return (
          <AdditionalInformationSection 
            writingData={writingData} 
            handleInputChange={handleInputChange}
          />
        );
      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <div className="writing-container">
      {/* Header with Back Button and Centered Title */}
      <div className="writing-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h1>Complete your Writing</h1>
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
      <div className="writing-content">
        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {message.text}
          </div>
        )}

        {showPreview ? (
          <WritingPreview 
            writingData={writingData}
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

export default WritingForm;
