import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './Profile.css';

// Import all section components
import PersonalInfoSection from './profilesection/PersonalInfo';
import ContactDetailsSection from './profilesection/ContactDetails';
import AddressSection from './profilesection/Address';
import DemographicsSection from './profilesection/Demographics';
import LanguageSection from './profilesection/Language';
import GeographySection from './profilesection/Geography';

import ProfilePreview from './ProfilePre';

const ProfileForm = () => {
  const navigate = useNavigate();
  const { '*': section } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('personal');
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Define all sections in order (fee waiver removed)
  const sections = ['personal', 'contact', 'address', 'demographics', 'language', 'geography'];

  // Main form state - Initialize with empty values (fee waiver fields removed)
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    useDifferentFirstName: 'no',
    preferredFirstName: '',
    birthDate: '',
    
    // Contact Details
    phone: '',
    countryCode: '+1',
    preferredPhoneType: 'mobile',
    alternatePhone: '',
    alternatePhoneType: 'none',
    alternateCountryCode: '+1', // Added for alternate phone country code
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    
    // Demographics
    gender: '',
    additionalGender: '',
    legalSex: '',
    pronouns: '',
    additionalPronouns: '',
    armedForcesStatus: '',
    hispanicOrLatino: '',
    ethnicity: [],
    
    // Language
    languagesProficient: 1,
    languages: [{ 
      language: '', 
      proficiency: { 
        firstLanguage: false, 
        speak: true, 
        read: true, 
        write: true, 
        spokenAtHome: false 
      } 
    }],
    
    // Geography & Nationality
    birthCountry: '',
    cityOfBirth: '',
    yearsInUS: '',
    citizenshipStatus: '',
    
    // Profile Completion Tracking (fee waiver removed)
    profileCompletion: {
      personalInfo: false,
      contactDetails: false,
      demographics: false,
      language: false,
      geography: false
    }
  });

  // Helper function to get available phone types
  const getAvailablePhoneTypes = (preferredType) => {
    const allTypes = ['home', 'mobile', 'work'];
    return allTypes.filter(type => type !== preferredType);
  };

  // ✅ FIXED: Set active section based on URL with correct path
  useEffect(() => {
    if (section) {
      setActiveSection(section);
    } else {
      navigate('/transfer/dashboard/profile/personal', { replace: true });
    }
  }, [section, navigate]);

  // Fetch existing profile data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        navigate('/sign-in');
        return;
      }

      // Add token validation - check if expired
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (isExpired) {
          console.warn('⚠️ Token expired, clearing and redirecting');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          localStorage.removeItem('studentType');
          navigate('/sign-in');
          return;
        }
      } catch (tokenError) {
        console.error('❌ Invalid token format:', tokenError);
        localStorage.removeItem('token');
        navigate('/sign-in');
        return;
      }

      console.log('📥 Fetching profile data...');
      console.log('🔑 Token present and valid');
      
      const response = await axiosInstance.get('/api/transfer/profile');

      console.log('✅ Profile data received:', response.data);

      if (response.data.success && response.data.account) {
        const profileData = response.data.account;
        
        // Merge fetched data with our form structure (fee waiver fields excluded)
        const mergedData = {
          // Personal Information
          firstName: profileData.firstName || '',
          middleName: profileData.middleName || '',
          lastName: profileData.lastName || '',
          suffix: profileData.suffix || '',
          useDifferentFirstName: profileData.useDifferentFirstName || 'no',
          preferredFirstName: profileData.preferredFirstName || '',
          birthDate: profileData.birthDate || '',
          
          // Contact Details
          phone: profileData.phone || '',
          countryCode: profileData.countryCode || '+1',
          preferredPhoneType: profileData.preferredPhoneType || 'mobile',
          alternatePhone: profileData.alternatePhone || '',
          alternatePhoneType: profileData.alternatePhoneType || 'none',
          alternateCountryCode: profileData.alternateCountryCode || '+1', // Added this line
          addressLine1: profileData.addressLine1 || '',
          addressLine2: profileData.addressLine2 || '',
          city: profileData.city || '',
          state: profileData.state || '',
          zipCode: profileData.zipCode || '',
          country: profileData.country || '',
          
          // Demographics
          gender: profileData.gender || '',
          additionalGender: profileData.additionalGender || '',
          legalSex: profileData.legalSex || '',
          pronouns: profileData.pronouns || '',
          additionalPronouns: profileData.additionalPronouns || '',
          armedForcesStatus: profileData.armedForcesStatus || '',
          hispanicOrLatino: profileData.hispanicOrLatino || '',
          ethnicity: profileData.ethnicity || [],
          
          // Language
          languagesProficient: profileData.languagesProficient || 1,
          languages: profileData.languages || [{ 
            language: '', 
            proficiency: { 
              firstLanguage: false, 
              speak: true, 
              read: true, 
              write: true, 
              spokenAtHome: false 
            } 
          }],
          
          // Geography & Nationality
          birthCountry: profileData.birthCountry || '',
          cityOfBirth: profileData.cityOfBirth || '',
          yearsInUS: profileData.yearsInUS || '',
          citizenshipStatus: profileData.citizenshipStatus || '',
          
          // Profile Completion (fee waiver removed)
          profileCompletion: profileData.profileCompletion || {
            personalInfo: false,
            contactDetails: false,
            demographics: false,
            language: false,
            geography: false
          }
        };

        // Remove any fee waiver data that might come from backend
        delete mergedData.feeWaiverEligible;
        delete mergedData.feeWaiverCriteria;
        delete mergedData.ustriveMentor;
        
        // Ensure profileCompletion doesn't have feeWaiver property
        if (mergedData.profileCompletion && mergedData.profileCompletion.feeWaiver) {
          delete mergedData.profileCompletion.feeWaiver;
        }

        setFormData(mergedData);
        setProgress(response.data.profileProgress || 0);
        
        console.log('📊 Profile progress:', response.data.profileProgress);
      }
    } catch (error) {
      console.error('❌ Error fetching profile:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      
      // If 401, redirect to sign-in
      if (error.response?.status === 401) {
        console.error('❌ Unauthorized - redirecting to sign-in');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('studentType');
        navigate('/sign-in');
        return;
      }
      
      setMessage({ 
        type: 'error', 
        text: 'Failed to load profile data. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Handler functions
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle alternate phone toggle
    if (name === 'alternatePhoneType') {
      if (value === 'no') {
        // Reset alternate phone fields when "No" is selected
        setFormData((prev) => ({
          ...prev,
          alternatePhoneType: 'none',
          alternatePhone: '',
          alternateCountryCode: '+1'
        }));
        return;
      } else if (value === 'yes') {
        // When "Yes" is selected, set to first available phone type
        setFormData((prev) => {
          const availableTypes = getAvailablePhoneTypes(prev.preferredPhoneType);
          const currentType = prev.alternatePhoneType !== 'none' && prev.alternatePhoneType !== '' 
            ? prev.alternatePhoneType 
            : availableTypes[0] || 'home';
          
          return {
            ...prev,
            alternatePhoneType: currentType
          };
        });
        return;
      }
    }
    
    // Handle regular input changes
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleLanguageChange = (index, field, value) => {
    setFormData(prev => {
      const updatedLanguages = [...prev.languages];
      if (field.startsWith('proficiency.')) {
        const proficiencyField = field.split('.')[1];
        updatedLanguages[index] = {
          ...updatedLanguages[index],
          proficiency: {
            ...updatedLanguages[index].proficiency,
            [proficiencyField]: value
          }
        };
      } else {
        updatedLanguages[index] = {
          ...updatedLanguages[index],
          [field]: value
        };
      }
      return { ...prev, languages: updatedLanguages };
    });
  };

  const addLanguage = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, { 
        language: '', 
        proficiency: { firstLanguage: false, speak: true, read: true, write: true, spokenAtHome: false } 
      }]
    }));
  };

  const removeLanguage = (index) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  // Save profile function
  const saveProfile = async (section = null) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        navigate('/sign-in');
        return;
      }

      console.log('💾 Saving profile data...');

      // Mark section as completed based on validation
      const updatedCompletion = { ...formData.profileCompletion };
      
      if (section === 'personal') {
        // Validate personal info completion
        updatedCompletion.personalInfo = !!(formData.firstName && formData.lastName && formData.birthDate);
      } else if (section === 'contact') {
        // Validate contact details completion including alternate phone if enabled
        const hasAlternatePhone = formData.alternatePhoneType !== 'none' && formData.alternatePhoneType !== '';
        const alternatePhoneValid = !hasAlternatePhone || (hasAlternatePhone && formData.alternatePhone.trim() !== '');
        updatedCompletion.contactDetails = !!(formData.phone && alternatePhoneValid);
      }

      const dataToSave = {
        ...formData,
        profileCompletion: updatedCompletion
      };

      // Ensure no fee waiver data is sent
      delete dataToSave.feeWaiverEligible;
      delete dataToSave.feeWaiverCriteria;
      delete dataToSave.ustriveMentor;

      console.log('📤 Sending data to backend...');

      const response = await axiosInstance.put('/api/transfer/profile', dataToSave);

      console.log('✅ Backend response:', response.data);

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Profile saved successfully!' 
        });
        
        setProgress(response.data.progress?.profile || 0);
        
        // Update localStorage with fresh data
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        localStorage.setItem('userData', JSON.stringify({
          ...userData,
          applicationProgress: response.data.progress
        }));

        console.log('✅ Profile saved and localStorage updated');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('❌ Error saving profile:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save profile. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  // ✅ FIXED: Save and Continue with correct navigation path
  const handleSaveAndContinue = () => {
    saveProfile(activeSection);
    
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex < sections.length - 1) {
      // Navigate to next section after a short delay to allow save to complete
      setTimeout(() => {
        navigate(`/transfer/dashboard/profile/${sections[currentIndex + 1]}`);
      }, 500);
    } else {
      // Last section - show preview instead of continuing
      setShowPreview(true);
    }
  };

  const handleSaveOnly = () => {
    saveProfile(activeSection);
  };

  // ✅ FIXED: Back to Dashboard with correct path
  const handleBackToDashboard = () => {
    navigate('/transfer/dashboard');
  };

  // ✅ FIXED: Edit Section with correct navigation path
  const handleEditSection = (section) => {
    setShowPreview(false);
    navigate(`/transfer/dashboard/profile/${section}`);
  };

  // ✅ FIXED: Final Submit with correct redirect path
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

      console.log('🎯 Final profile submission...');

      // Final save with all sections marked as complete
      const finalCompletion = {
        personalInfo: true,
        contactDetails: true,
        demographics: true,
        language: true,
        geography: true
      };

      const finalData = {
        ...formData,
        profileCompletion: finalCompletion
      };

      // Ensure no fee waiver data is sent
      delete finalData.feeWaiverEligible;
      delete finalData.feeWaiverCriteria;
      delete finalData.ustriveMentor;

      console.log('📤 Sending final submission...');

      const response = await axiosInstance.put('/api/transfer/profile', finalData);

      console.log('✅ Final submission response:', response.data);

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: '🎉 Profile completed successfully! Your information has been saved.' 
        });
        
        setProgress(100);
        
        // Update localStorage with fresh data
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        localStorage.setItem('userData', JSON.stringify({
          ...userData,
          applicationProgress: {
            ...userData.applicationProgress,
            profile: 100
          }
        }));

        console.log('✅ Profile submitted successfully!');
        console.log('🔄 Redirecting to dashboard in 3 seconds...');
        
        // Redirect to transfer dashboard after 3 seconds
        setTimeout(() => {
          navigate('/transfer/dashboard');
        }, 3000);
        
      } else {
        throw new Error(response.data.message || 'Failed to save profile');
      }
      
    } catch (error) {
      console.error('❌ Error submitting profile:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      console.error('   Full error:', error);
      
      // Don't redirect on error - just show the message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit profile. Please try again.';
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });

      console.warn('❌ Profile submission failed. User will see error message.');
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
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header with Back Button and Centered Title */}
      <div className="profile-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h1>Complete your Common Application</h1>
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
      <div className="profile-content">
        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {message.text}
          </div>
        )}

        {showPreview ? (
          <ProfilePreview 
            formData={formData}
            onEditSection={handleEditSection}
            onBackToForm={handleBackToForm}
            onFinalSubmit={handleFinalSubmit}
            saving={saving}
            message={message}
          />
        ) : (
          <>
            {/* Render the active section component */}
            {activeSection === 'personal' && (
              <PersonalInfoSection 
                formData={formData} 
                handleInputChange={handleInputChange} 
              />
            )}

            {activeSection === 'contact' && (
              <ContactDetailsSection 
                formData={formData} 
                handleInputChange={handleInputChange} 
              />
            )}

            {activeSection === 'address' && (
              <AddressSection 
                formData={formData} 
                handleInputChange={handleInputChange} 
              />
            )}

            {activeSection === 'demographics' && (
              <DemographicsSection 
                formData={formData} 
                handleInputChange={handleInputChange}
                handleArrayChange={handleArrayChange}
              />
            )}

            {activeSection === 'language' && (
              <LanguageSection 
                formData={formData} 
                handleInputChange={handleInputChange}
                handleLanguageChange={handleLanguageChange}
                addLanguage={addLanguage}
                removeLanguage={removeLanguage}
              />
            )}

            {activeSection === 'geography' && (
              <GeographySection 
                formData={formData} 
                handleInputChange={handleInputChange} 
              />
            )}

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

export default ProfileForm;