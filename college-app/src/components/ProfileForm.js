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

// Import EDUTECH Logo (adjust path as needed)
import EdutechLogo from './../assets/Edutech-logo.svg';

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
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');

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
    alternateCountryCode: '+1',
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
      address: false,
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

      // Get user info from localStorage
      const storedUserEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
      const storedUserName = localStorage.getItem('userName') || localStorage.getItem('fullName') || '';
      const storedUserId = localStorage.getItem('studentId') || localStorage.getItem('userId') || '';

      setUserEmail(storedUserEmail);
      setUserName(storedUserName);
      setUserId(storedUserId);

      const response = await axios.get(`${API_URL}/api/students/profile/detailed`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.account) {
        const p = response.data.account;

        // Update userName if available from API
        if (p.firstName || p.lastName) {
          setUserName(`${p.firstName || ''} ${p.lastName || ''}`.trim());
        }
        if (p.email) setUserEmail(p.email);
        if (p.studentId) setUserId(p.studentId);

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
          alternateCountryCode: p.alternateCountryCode || '+1',
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
            address: false,
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
    
    if (name === 'alternatePhoneType') {
      if (value === 'no') {
        setFormData((prev) => ({
          ...prev,
          alternatePhoneType: 'none',
          alternatePhone: '',
          alternateCountryCode: '+1'
        }));
        return;
      } else if (value === 'yes') {
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

  const handleEditSection = (section) => {
    setShowPreview(false);
    navigate(`/firstyear/dashboard/profile/${section}`);
  };

  const handleBackToForm = () => {
    setShowPreview(false);
  };

  const handleFinalSubmit = async () => {
    try {
      setSaving(true);

      const finalCompletion = {
        personalInfo: true,
        contactDetails: true,
        address: true,
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

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/sign-in');
  };

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
      {/* Header Section - EDUTECH Style */}
      <div className="profile-header">
        <div className="header-container">
          {/* Left Section - Logo and Back Button */}
          <div className="header-left">
            <div className="header-logo">
              <img src={EdutechLogo} alt="EDUTECH" />
            </div>
            <button className="back-button" onClick={() => navigate('/firstyear/dashboard')}>
              ← Back to Dashboard
            </button>
          </div>

          {/* Center Section - Title */}
          <div className="header-center">
            <h1>Complete your Common Application</h1>
          </div>

          {/* Right Section - Progress and Sign Out */}
          <div className="header-right">
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="progress-text">{progress}% Complete</span>
            </div>
           
          </div>
        </div>
      </div>

      {/* User Info Card - EDUTECH Style */}
     

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

      {/* Footer Section */}
      <div className="profile-footer">
        <p className="copyright">© 2026 EDUTECH. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ProfileForm;