// src/components/ProfileForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ProfileForm.css';

// Import all section components
import PersonalInfoSection from './profile-sections/PersonalInfoSection';
import ContactDetailsSection from './profile-sections/ContactDetailsSection';
import AddressSection from './profile-sections/AddressSection';
import DemographicsSection from './profile-sections/DemographicsSection';
import LanguageSection from './profile-sections/LanguageSection';
import GeographySection from './profile-sections/GeographySection';
import FeeWaiverSection from './profile-sections/FeeWaiverSection';
import ProfilePreview from './ProfilePreview';

const API_URL = process.env.REACT_APP_API_URL;

const ProfileForm = () => {
  const navigate = useNavigate();
  const { '*': section } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('personal');
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Define all sections in order
  const sections = ['personal', 'contact', 'address', 'demographics', 'language', 'geography', 'feewaiver'];

  // Main form state - Initialize with empty values
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
    
    // Fee Waiver
    feeWaiverEligible: false,
    feeWaiverCriteria: [],
    ustriveMentor: false,
    
    // Profile Completion Tracking
    profileCompletion: {
      personalInfo: false,
      contactDetails: false,
      demographics: false,
      language: false,
      geography: false,
      feeWaiver: false
    }
  });

  // Set active section based on URL
  useEffect(() => {
    if (section) {
      setActiveSection(section);
    } else {
      navigate('/dashboard/profile/personal', { replace: true });
    }
  }, [section, navigate]);

  // Fetch existing profile data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/sign-in');
        return;
      }

      console.log('📥 Fetching profile data...');
      const response = await axios.get(`${API_URL}/api/students/profile/detailed`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Profile data received:', response.data);

      if (response.data.success && response.data.account) {
        const profileData = response.data.account;
        
        // Merge fetched data with our form structure
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
          
          // Fee Waiver
          feeWaiverEligible: profileData.feeWaiverEligible || false,
          feeWaiverCriteria: profileData.feeWaiverCriteria || [],
          ustriveMentor: profileData.ustriveMentor || false,
          
          // Profile Completion
          profileCompletion: profileData.profileCompletion || {
            personalInfo: false,
            contactDetails: false,
            demographics: false,
            language: false,
            geography: false,
            feeWaiver: false
          }
        };

        setFormData(mergedData);
        setProgress(response.data.profileProgress || 0);
        
        console.log('📊 Profile progress:', response.data.profileProgress);
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
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
    setFormData(prev => ({
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

  // Save profile function - FIXED
  const saveProfile = async (section = null) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/sign-in');
        return;
      }

      console.log('💾 Saving profile data for section:', section, formData);

      // Enhanced section validation
      const updatedCompletion = { ...formData.profileCompletion };
      
      // Validate each section properly
      if (section === 'personal') {
        updatedCompletion.personalInfo = !!(formData.firstName && formData.lastName && formData.birthDate);
      } else if (section === 'contact') {
        updatedCompletion.contactDetails = !!(formData.phone && formData.preferredPhoneType);
      } else if (section === 'address') {
        updatedCompletion.address = !!(formData.addressLine1 && formData.city && formData.state && formData.zipCode && formData.country);
      } else if (section === 'demographics') {
        updatedCompletion.demographics = !!(formData.legalSex && formData.legalSex !== '' && formData.hispanicOrLatino && formData.hispanicOrLatino !== '');
      } else if (section === 'language') {
        updatedCompletion.language = !!(formData.languagesProficient && 
                  formData.languages && 
                  formData.languages.length > 0 && 
                  formData.languages[0].language &&
                  formData.languages[0].language.trim() !== '');
      } else if (section === 'geography') {
        updatedCompletion.geography = !!(formData.citizenshipStatus && formData.citizenshipStatus !== '');
      } else if (section === 'feewaiver') {
        updatedCompletion.feeWaiver = true; // Optional section
      }

      const dataToSave = {
        ...formData,
        profileCompletion: updatedCompletion
      };

      console.log('📤 Sending data to server:', dataToSave);

      const response = await axios.put(`${API_URL}/api/students/profile`, dataToSave, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Server response:', response.data);

      if (response.data.success) {
        const newProfileProgress = response.data.profileProgress || response.data.progress?.profile || 0;
        
        setMessage({ 
          type: 'success', 
          text: `✅ ${section.charAt(0).toUpperCase() + section.slice(1)} section saved successfully! Progress: ${newProfileProgress}%` 
        });
        
        setProgress(newProfileProgress);
        
        // Update localStorage with fresh data
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const updatedUserData = {
          ...userData,
          profileProgress: newProfileProgress,
          applicationProgress: {
            ...userData.applicationProgress,
            profile: newProfileProgress
          }
        };
        
        localStorage.setItem('userData', JSON.stringify(updatedUserData));

        console.log('✅ Profile saved successfully! Progress:', newProfileProgress);
        
        // Update form data with completion status
        setFormData(prev => ({
          ...prev,
          profileCompletion: updatedCompletion
        }));
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 5000);

        return true; // Success
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      setMessage({ 
        type: 'error', 
        text: '❌ Failed to save profile. Please try again.' 
      });
      return false; // Failure
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    const success = await saveProfile(activeSection);
    
    if (success) {
      const currentIndex = sections.indexOf(activeSection);
      if (currentIndex < sections.length - 1) {
        // Navigate to next section
        navigate(`/firstyear/dashboard/profile/${sections[currentIndex + 1]}`);
      } else {
        // Last section - show preview instead of continuing
        setShowPreview(true);
      }
    }
  };

  const handleSaveOnly = async () => {
    await saveProfile(activeSection);
  };

  const handleBackToDashboard = () => {
    navigate('/firstyear/dashboard');
  };

  const handleEditSection = (section) => {
    setShowPreview(false);
    navigate(`/dashboard/profile/${section}`);
  };

  const handleFinalSubmit = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/sign-in');
        return;
      }

      console.log('🎯 Final profile submission...');

      // Final save with all sections marked as complete
      const finalCompletion = {
        personalInfo: true,
        contactDetails: true,
        demographics: true,
        language: true,
        geography: true,
        feeWaiver: true
      };

      const finalData = {
        ...formData,
        profileCompletion: finalCompletion,
        applicationProgress: {
          ...formData.applicationProgress,
          profile: 100 // Set to 100% complete
        }
      };

      const response = await axios.put(`${API_URL}/api/students/profile`, finalData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Final submission response:', response.data);

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: '🎉 Profile completed successfully! Your information has been saved. Redirecting to dashboard...' 
        });
        
        // Update progress
        setProgress(100);
        
        // Update localStorage with fresh data
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        localStorage.setItem('userData', JSON.stringify({
          ...userData,
          profileProgress: 100,
          applicationProgress: {
            ...userData.applicationProgress,
            profile: 100
          }
        }));

        console.log('✅ Profile submitted successfully!');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/firstyear/dashboard');
        }, 3000);
        
      } else {
        throw new Error('Failed to save profile');
      }
      
    } catch (error) {
      console.error('❌ Error submitting profile:', error);
      setMessage({ 
        type: 'error', 
        text: '❌ Failed to submit profile. Please try again.' 
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

            {activeSection === 'feewaiver' && (
              <FeeWaiverSection 
                formData={formData} 
                handleInputChange={handleInputChange}
                handleArrayChange={handleArrayChange}
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