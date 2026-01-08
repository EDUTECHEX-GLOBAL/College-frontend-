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
import ProfilePreview from './ProfilePreview';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const ProfileForm = () => {
  const navigate = useNavigate();
  const { '*': section } = useParams();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('personal');
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // ❌ Removed feewaiver here
  const sections = ['personal', 'contact', 'address', 'demographics', 'language', 'geography'];

  const [formData, setFormData] = useState({
    // Personal
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    useDifferentFirstName: 'no',
    preferredFirstName: '',
    birthDate: '',

    // Contact
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

    // Geography
    birthCountry: '',
    cityOfBirth: '',
    yearsInUS: '',
    citizenshipStatus: '',

    // Profile completion
    profileCompletion: {
  personalInfo: false,
  contactDetails: false,
  address: false, // ✅ ADD THIS
  demographics: false,
  language: false,
  geography: false
}

  });

  useEffect(() => {
    if (section) {
      setActiveSection(section);
    } else {
      navigate('/dashboard/profile/personal', { replace: true });
    }
  }, [section, navigate]);

  // Helper function to get available phone types
  const getAvailablePhoneTypes = (preferredType) => {
    const allTypes = ['home', 'mobile', 'work'];
    return allTypes.filter(type => type !== preferredType);
  };

  // Fetch Profile
  const fetchProfileData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) return navigate('/sign-in');

      const response = await axios.get(`${API_URL}/api/students/profile/detailed`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.account) {
        const p = response.data.account;

        const mergedData = {
          firstName: p.firstName || '',
          middleName: p.middleName || '',
          lastName: p.lastName || '',
          suffix: p.suffix || '',
          useDifferentFirstName: p.useDifferentFirstName || 'no',
          preferredFirstName: p.preferredFirstName || '',
          birthDate: p.birthDate || '',

          phone: p.phone || '',
          countryCode: p.countryCode || '+1',
          preferredPhoneType: p.preferredPhoneType || 'mobile',
          alternatePhone: p.alternatePhone || '',
          alternatePhoneType: p.alternatePhoneType || 'none',
          alternateCountryCode: p.alternateCountryCode || '+1', // Added this line
          addressLine1: p.addressLine1 || '',
          addressLine2: p.addressLine2 || '',
          city: p.city || '',
          state: p.state || '',
          zipCode: p.zipCode || '',
          country: p.country || '',

          gender: p.gender || '',
          additionalGender: p.additionalGender || '',
          legalSex: p.legalSex || '',
          pronouns: p.pronouns || '',
          additionalPronouns: p.additionalPronouns || '',
          armedForcesStatus: p.armedForcesStatus || '',
          hispanicOrLatino: p.hispanicOrLatino || '',
          ethnicity: p.ethnicity || [],

          languagesProficient: p.languagesProficient || 1,
          languages: p.languages || [{
            language: '',
            proficiency: {
              firstLanguage: false,
              speak: true,
              read: true,
              write: true,
              spokenAtHome: false
            }
          }],

          birthCountry: p.birthCountry || '',
          cityOfBirth: p.cityOfBirth || '',
          yearsInUS: p.yearsInUS || '',
          citizenshipStatus: p.citizenshipStatus || '',

          profileCompletion: p.profileCompletion || {
            personalInfo: false,
            contactDetails: false,
            demographics: false,
            language: false,
            geography: false
          }
        };

        setFormData(mergedData);
        setProgress(response.data.profileProgress || 0);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load profile.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Input handlers
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
        ? prev[field].filter(i => i !== value)
        : [...prev[field], value]
    }));
  };

  const handleLanguageChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.languages];
      if (field.startsWith('proficiency.')) {
        const key = field.split('.')[1];
        updated[index].proficiency[key] = value;
      } else {
        updated[index][field] = value;
      }
      return { ...prev, languages: updated };
    });
  };

  const addLanguage = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, {
        language: '',
        proficiency: {
          firstLanguage: false,
          speak: true,
          read: true,
          write: true,
          spokenAtHome: false
        }
      }]
    }));
  };

  const removeLanguage = (i) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, idx) => idx !== i)
    }));
  };

  // SAVE PROFILE
  const saveProfile = async (section = null) => {
    try {
      setSaving(true);

      const updatedCompletion = { ...formData.profileCompletion };

      if (section === 'personal') {
        updatedCompletion.personalInfo = !!(
          formData.firstName && formData.lastName && formData.birthDate
        );
      } else if (section === 'contact') {
        // Validate contact details including alternate phone if enabled
        const hasAlternatePhone = formData.alternatePhoneType !== 'none' && formData.alternatePhoneType !== '';
        const alternatePhoneValid = !hasAlternatePhone || (hasAlternatePhone && formData.alternatePhone.trim() !== '');
        updatedCompletion.contactDetails = !!(formData.phone && alternatePhoneValid);
      } else if (section === 'address') {
        updatedCompletion.address = !!(
          formData.addressLine1 &&
          formData.city &&
          formData.state &&
          formData.zipCode &&
          formData.country
        );
      } else if (section === 'demographics') {
        updatedCompletion.demographics = !!(formData.legalSex && formData.hispanicOrLatino);
      } else if (section === 'language') {
  // ✅ Backend-exact validation: ALL languages must have names
  updatedCompletion.language =
    formData.languages.length > 0 &&
    formData.languages.every(lang => lang.language && lang.language.trim() !== '');
      } else if (section === 'geography') {
        updatedCompletion.geography = !!formData.citizenshipStatus;
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/students/profile`,
        { ...formData, profileCompletion: updatedCompletion },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setProgress(response.data.profileProgress || 0);

        setFormData(prev => ({ ...prev, profileCompletion: updatedCompletion }));

        setMessage({
          type: 'success',
          text: `Section saved successfully!`
        });

        setTimeout(() => setMessage({ text: '' }), 5000);
        return true;
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to save profile.' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    const success = await saveProfile(activeSection);

    if (!success) return;

    const index = sections.indexOf(activeSection);
    if (index < sections.length - 1) {
      navigate(`/firstyear/dashboard/profile/${sections[index + 1]}`);
    } else {
      setShowPreview(true);
    }
  };

  // ✅ ADDED: handleEditSection function for ProfilePreview
  const handleEditSection = (section) => {
    setShowPreview(false);
    navigate(`/firstyear/dashboard/profile/${section}`);
  };

  // ✅ ADDED: handleBackToForm function for ProfilePreview
  const handleBackToForm = () => {
    setShowPreview(false);
  };

  const handleFinalSubmit = async () => {
    try {
      setSaving(true);

     const finalCompletion = {
  personalInfo: true,
  contactDetails: true,
  address: true,      // ✅ ADD THIS
  demographics: true,
  language: true,
  geography: true
};


      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/students/profile`,
        { ...formData, profileCompletion: finalCompletion },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setProgress(100);
        setMessage({
          type: 'success',
          text: 'Profile complete! Redirecting...'
        });

        setTimeout(() => navigate('/firstyear/dashboard'), 3000);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Final submission failed.' });
    } finally {
      setSaving(false);
    }
  };

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
      <div className="profile-header">
        <button className="back-button" onClick={() => navigate('/firstyear/dashboard')}>
          ← Back to Dashboard
        </button>

        <h1>Complete your Common Application</h1>

        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-text">{progress}% Complete</span>
        </div>
      </div>

      <div className="profile-content">
        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {message.text}
          </div>
        )}

        {showPreview ? (
          <ProfilePreview
            formData={formData}
            onEditSection={handleEditSection} // ✅ ADDED: Pass onEditSection prop
            onBackToForm={handleBackToForm} // ✅ CHANGED: Use handleBackToForm function
            onFinalSubmit={handleFinalSubmit}
            saving={saving}
            // ❌ REMOVED: message prop since ProfilePreview doesn't expect it
          />
        ) : (
          <>
            {activeSection === 'personal' && (
              <PersonalInfoSection formData={formData} handleInputChange={handleInputChange} />
            )}

            {activeSection === 'contact' && (
              <ContactDetailsSection 
                formData={formData} 
                handleInputChange={handleInputChange} 
              />
            )}

            {activeSection === 'address' && (
              <AddressSection formData={formData} handleInputChange={handleInputChange} />
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
              <GeographySection formData={formData} handleInputChange={handleInputChange} />
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => saveProfile(activeSection)}
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