// src/components/FamilyForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './Family.css';

// Import all family section components
import HouseholdSection from './familysection/Household';
import Parent1Section from './familysection/Parent1';
import Parent2Section from './familysection/Parent2';
import SiblingSection from './familysection/Sibling';
import FamilyPreview from './FamilyPre';

const FamilyForm = () => {
  const navigate = useNavigate();
  const { '*': section } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('household');
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Define all family sections in order
  const sections = [
    'household',
    'parent1',
    'parent2',
    'sibling'
  ];

  // Main family form state
  const [familyData, setFamilyData] = useState({
    // Household Information
    household: {
      parentsMaritalStatus: '',
      permanentHome: '',
      hasChildren: '',
      numberOfChildren: 0
    },

    // Parent 1 Information
    parent1: {
      isDeceased: false,
      prefix: '',
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      relationshipToYou: '',
      email: '',
      phoneCountryCode: '+1',
      phoneNumber: '',
      address: {
        sameAsStudent: false,
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      occupation: '',
      employer: '',
      jobTitle: '',
      highestEducationLevel: '',
      collegeAttended: '',
      collegeCEEBCode: '',
      degreeEarned: '',
      graduationYear: ''
    },

    // Parent 2 Information
    parent2: {
      hasParent2: '',
      isDeceased: false,
      prefix: '',
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      relationshipToYou: '',
      email: '',
      phoneCountryCode: '+1',
      phoneNumber: '',
      address: {
        sameAsStudent: false,
        sameAsParent1: false,
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      occupation: '',
      employer: '',
      jobTitle: '',
      highestEducationLevel: '',
      collegeAttended: '',
      collegeCEEBCode: '',
      degreeEarned: '',
      graduationYear: ''
    },

    // Siblings Information
    siblings: {
      hasSiblings: '',
      numberOfSiblings: 0,
      siblingsList: []
    },

    // Family Completion Tracking
    familyCompletion: {
      household: false,
      parent1: false,
      parent2: false,
      sibling: false
    }
  });

  // Set active section based on URL
  useEffect(() => {
    if (section) {
      setActiveSection(section);
    } else {
      navigate('/transfer/dashboard/family/household', { replace: true });
    }
  }, [section, navigate]);

  // Fetch existing family data
  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        navigate('/sign-in');
        return;
      }

      console.log('📥 Fetching family data...');
      
      const response = await axiosInstance.get('/api/family-background');

      console.log('✅ Family data received:', response.data);

      if (response.data.success && response.data.family) {
        setFamilyData(response.data.family);
        setProgress(response.data.familyProgress || 0);
        console.log('📊 Family progress:', response.data.familyProgress);
      }
    } catch (error) {
      console.error('❌ Error fetching family:');
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
        text: 'Failed to load family data. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch family data on component mount
  useEffect(() => {
    fetchFamilyData();
  }, []);

  // Handler functions
  const handleInputChange = (section, field, value) => {
    setFamilyData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedChange = (section, subSection, field, value) => {
    setFamilyData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...prev[section][subSection],
          [field]: value
        }
      }
    }));
  };

  const handleArrayChange = (section, arrayField, index, field, value) => {
    setFamilyData(prev => {
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
    setFamilyData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [arrayField]: [...prev[section][arrayField], newItem]
      }
    }));
  };

  const removeArrayItem = (section, arrayField, index) => {
    setFamilyData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [arrayField]: prev[section][arrayField].filter((_, i) => i !== index)
      }
    }));
  };

  // Save family function
  const saveFamily = async (section = null) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        navigate('/sign-in');
        return;
      }

      console.log('💾 Saving family data...');

      const response = await axiosInstance.put('/api/family-background', familyData);

      console.log('✅ Backend response:', response.data);

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Family data saved successfully!' 
        });
        
        setProgress(response.data.progress?.family || 0);

        console.log('✅ Family saved');
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save family');
      }
    } catch (error) {
      console.error('❌ Error saving family:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save family. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Save and Continue with correct navigation
  const handleSaveAndContinue = () => {
    saveFamily(activeSection);
    
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex < sections.length - 1) {
      setTimeout(() => {
        navigate(`/transfer/dashboard/family/${sections[currentIndex + 1]}`);
      }, 500);
    } else {
      setShowPreview(true);
    }
  };

  const handleSaveOnly = () => {
    saveFamily(activeSection);
  };

  // Back to Dashboard with correct path
  const handleBackToDashboard = () => {
    navigate('/transfer/dashboard');
  };

  // Edit Section with correct path
  const handleEditSection = (section) => {
    setShowPreview(false);
    navigate(`/transfer/dashboard/family/${section}`);
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

      console.log('🎯 Final family submission...');

      const finalCompletion = {
        household: true,
        parent1: true,
        parent2: true,
        sibling: true
      };

      const finalData = {
        ...familyData,
        familyCompletion: finalCompletion
      };

      const response = await axiosInstance.put('/api/family-background', finalData);

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: '🎉 Family information completed successfully!' 
        });
        
        setProgress(100);

        console.log('✅ Family submitted successfully!');
        console.log('🔄 Redirecting to dashboard in 3 seconds...');
        
        setTimeout(() => {
          navigate('/transfer/dashboard');
        }, 3000);
        
      } else {
        throw new Error(response.data.message || 'Failed to save family');
      }
      
    } catch (error) {
      console.error('❌ Error submitting family:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit family. Please try again.';
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
      <div className="family-loading">
        <div className="loading-spinner"></div>
        <p>Loading your family information...</p>
      </div>
    );
  }

  // Render the active section component
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'household':
        return (
          <HouseholdSection 
            familyData={familyData} 
            handleInputChange={handleInputChange}
          />
        );
      case 'parent1':
        return (
          <Parent1Section 
            familyData={familyData} 
            handleInputChange={handleInputChange}
            handleNestedChange={handleNestedChange}
          />
        );
      case 'parent2':
        return (
          <Parent2Section 
            familyData={familyData} 
            handleInputChange={handleInputChange}
            handleNestedChange={handleNestedChange}
          />
        );
      case 'sibling':
        return (
          <SiblingSection 
            familyData={familyData} 
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
          />
        );
      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <div className="family-container">
      {/* Header with Back Button and Centered Title */}
      <div className="family-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h1>Complete your Family Information</h1>
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
      <div className="family-content">
        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {message.text}
          </div>
        )}

        {showPreview ? (
          <FamilyPreview 
            familyData={familyData}
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

export default FamilyForm;
