import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select'; // ADD THIS
import './FirstFamily.css';
import { US_STATES } from '../../constants/states';
import { COUNTRIES } from '../../constants/countries';

const API_URL = process.env.REACT_APP_API_URL;

// Initialize empty address object
const emptyAddress = {
  street1: '',
  street2: '',
  street3: '',
  city: '',
  state: '',
  country: '',
  zip: ''
};

// Format options for react-select
const formatOptions = (options) => {
  return options.map(option => ({
    value: option.value || option,
    label: option.label || option
  }));
};

const FirstFamily = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    parentGuardianAddress: '',
    parent1Address: { ...emptyAddress },
    parent2Address: { ...emptyAddress },
    kuGraduates: [],
    kuEmployeeDependent: '',
    kuEmployeeName: '',
    kuEmployeeLocation: '',
    militaryDependent: '',
    militaryStatus: '',
    vaBenefitsIntent: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showParent2Address, setShowParent2Address] = useState(false);

  // Family member options for KU graduates
  const familyMemberOptions = [
    'Grandparent/Step-Grandparent',
    'Great-Grandparent/Step-Great-Grandparent', 
    'Parent/Step-Parent',
    'Sibling/Step-Sibling'
  ];

  // KU location options
  const kuLocationOptions = [
    'KU Med Center - Kansas City',
    'KU Lawrence Campus',
    'KU Edwards Campus',
    'Other KU Location'
  ];

  // Military status options
  const militaryStatusOptions = [
    'Active Duty',
    'Veteran',
    'Reserve',
    'National Guard',
    'Retired'
  ];

  // Parent/Guardian options
  const parentGuardianOptions = [
    { value: 'parent1', label: 'Parent 1' },
    { value: 'parent2', label: 'Parent 2' },
    { value: 'legal-guardian', label: 'Legal Guardian' }
  ];

  // Format options for react-select
  const formattedUSStates = formatOptions(US_STATES);
  const formattedCountries = formatOptions(COUNTRIES);
  const formattedKuLocations = formatOptions(kuLocationOptions);
  const formattedMilitaryStatus = formatOptions(militaryStatusOptions);
  const formattedParentGuardian = formatOptions(parentGuardianOptions);

  // Fetch family application data from backend
  const fetchFamilyApplication = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/family/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { familyApplication } = response.data;
        setFormData({
          parentGuardianAddress: familyApplication.parentGuardianAddress || '',
          parent1Address: familyApplication.parent1Address || { ...emptyAddress },
          parent2Address: familyApplication.parent2Address || { ...emptyAddress },
          kuGraduates: familyApplication.kuGraduates || [],
          kuEmployeeDependent: familyApplication.kuEmployeeDependent || '',
          kuEmployeeName: familyApplication.kuEmployeeName || '',
          kuEmployeeLocation: familyApplication.kuEmployeeLocation || '',
          militaryDependent: familyApplication.militaryDependent || '',
          militaryStatus: familyApplication.militaryStatus || '',
          vaBenefitsIntent: familyApplication.vaBenefitsIntent || ''
        });
        setProgress(familyApplication.progress || 0);
        setShowParent2Address(familyApplication.showParent2Address || false);
      }
    } catch (error) {
      console.error('Error fetching family application:', error);
      // Fallback to localStorage if backend fails
      const savedData = localStorage.getItem(`college_${collegeId}_family`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData({
            parentGuardianAddress: parsedData.parentGuardianAddress || '',
            parent1Address: parsedData.parent1Address || { ...emptyAddress },
            parent2Address: parsedData.parent2Address || { ...emptyAddress },
            kuGraduates: parsedData.kuGraduates || [],
            kuEmployeeDependent: parsedData.kuEmployeeDependent || '',
            kuEmployeeName: parsedData.kuEmployeeName || '',
            kuEmployeeLocation: parsedData.kuEmployeeLocation || '',
            militaryDependent: parsedData.militaryDependent || '',
            militaryStatus: parsedData.militaryStatus || '',
            vaBenefitsIntent: parsedData.vaBenefitsIntent || ''
          });
        } catch (parseError) {
          console.error('Error parsing stored family data:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Save family application data to backend
  const saveFamilyApplication = async (data) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/family/${collegeId}`, {
        ...data,
        showParent2Address
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { familyApplication } = response.data;
        setProgress(familyApplication.progress);
        return familyApplication;
      }
    } catch (error) {
      console.error('Error saving family application:', error);
      // Fallback to localStorage if backend fails
      localStorage.setItem(`college_${collegeId}_family`, JSON.stringify({
        ...data,
        showParent2Address
      }));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Clear specific field in backend
  const clearField = async (field) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/family/${collegeId}/clear/${field}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { familyApplication } = response.data;
        setFormData({
          ...formData,
          [field]: field === 'kuGraduates' ? [] : ''
        });
        setProgress(familyApplication.progress);
      }
    } catch (error) {
      console.error('Error clearing field:', error);
      // Fallback to localStorage if backend fails
      const updatedData = {
        ...formData,
        [field]: field === 'kuGraduates' ? [] : ''
      };
      setFormData(updatedData);
      localStorage.setItem(`college_${collegeId}_family`, JSON.stringify(updatedData));
    }
  };

  useEffect(() => {
    fetchFamilyApplication();
  }, [collegeId]);

  const handleInputChange = async (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    // Auto-save to backend
    try {
      await saveFamilyApplication(updatedData);
    } catch (error) {
      // If backend save fails, fallback to localStorage
      localStorage.setItem(`college_${collegeId}_family`, JSON.stringify(updatedData));
    }
  };

  const handleAddressChange = async (parent, field, value) => {
    const updatedData = {
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: value
      }
    };
    setFormData(updatedData);

    // Auto-save to backend
    try {
      await saveFamilyApplication(updatedData);
    } catch (error) {
      // If backend save fails, fallback to localStorage
      localStorage.setItem(`college_${collegeId}_family`, JSON.stringify(updatedData));
    }
  };

  const handleParent2AddressToggle = async (value) => {
    setShowParent2Address(value);
    
    // If setting to false, clear Parent 2 address data
    if (!value) {
      const updatedData = {
        ...formData,
        parent2Address: { ...emptyAddress }
      };
      setFormData(updatedData);

      // Auto-save to backend
      try {
        await saveFamilyApplication(updatedData);
      } catch (error) {
        localStorage.setItem(`college_${collegeId}_family`, JSON.stringify(updatedData));
      }
    } else {
      // Auto-save the showParent2Address change
      try {
        await saveFamilyApplication(formData);
      } catch (error) {
        localStorage.setItem(`college_${collegeId}_family`, JSON.stringify(formData));
      }
    }
  };

  const handleCheckboxChange = async (familyMember) => {
    const currentGraduates = [...formData.kuGraduates];
    const updatedGraduates = currentGraduates.includes(familyMember)
      ? currentGraduates.filter(member => member !== familyMember)
      : [...currentGraduates, familyMember];
    
    await handleInputChange('kuGraduates', updatedGraduates);
  };

  const handleClearAnswer = async (field) => {
    await clearField(field);
  };

  const handleSave = async () => {
    try {
      await saveFamilyApplication(formData);
      alert('Family information saved successfully!');
    } catch (error) {
      alert('Failed to save family information. Please try again.');
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await saveFamilyApplication(formData);
      // FIXED: Add firstyear/dashboard prefix
      navigate(`/firstyear/dashboard/colleges/${collegeId}/residency`);
    } catch (error) {
      alert('Failed to save family information. Please try again.');
    }
  };

  const handleBack = () => {
    // FIXED: Add firstyear/dashboard prefix
    navigate(`/firstyear/dashboard/colleges/${collegeId}`);
  };

  const handleSaveAndClose = () => {
    handleBack();
  };

  // Safe value getter for address fields
  const getAddressValue = (parent, field) => {
    return formData[parent]?.[field] || '';
  };

  // Helper function to find react-select value
  const findSelectValue = (options, currentValue) => {
    return options.find(option => option.value === currentValue) || null;
  };

  if (loading) {
    return (
      <div className="family-form-container">
        <div className="family-loading">
          <div className="family-loading-spinner"></div>
          <p>Loading family information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="family-form-container">
      {/* Header Section */}
      <div className="family-form-header">
        <div className="family-header-nav">
          <button className="family-back-button" onClick={handleBack}>
            ← Back to College Details
          </button>
        </div>
        
        <div className="family-header-info">
          <h1 className="family-title">Apply to University of Kansas</h1>
          <div className="family-status">
            {/* <span className="status-indicator">In progress</span> */}
          </div>
          <p className="family-description">
            The questions on this page are being asked by University of Kansas.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="family-form-content">
        <div className="family-progress">
          <span className="family-progress-text">Section Progress: {progress}%</span>
          <div className="family-progress-bar">
            <div className="family-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Main Form Content */}
        <section className="family-form-section">
          <h2 className="family-section-title">Family</h2>
          
          {/* Parent/Guardian Address Question */}
          <div className="family-question-card">
            <div className="family-question-header">
              <h3 className="family-question-title">
                Based on the parent/guardian information that you listed in the Family section of the Common App, 
                please provide an address for your parent/guardian below*
              </h3>
              <span className="family-question-required">Required</span>
            </div>
            
            <div className="parent-address-section">
              <div className="parent-address-selector">
                <Select
                  value={findSelectValue(formattedParentGuardian, formData.parentGuardianAddress)}
                  onChange={(selectedOption) => handleInputChange('parentGuardianAddress', selectedOption?.value || '')}
                  options={formattedParentGuardian}
                  placeholder="Choose an option"
                  isDisabled={saving}
                  isClearable={true}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: '#d1d5db',
                      '&:hover': { borderColor: '#9ca3af' },
                      borderRadius: '6px',
                      minHeight: '42px',
                      fontSize: '14px',
                      maxWidth: '400px'
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999
                    })
                  }}
                />
              </div>
              
              {formData.parentGuardianAddress && (
                <div className="address-form-fields">
                  <h4 className="address-form-title">
                    Address for {formData.parentGuardianAddress === 'parent1' ? 'Parent 1' : 
                    formData.parentGuardianAddress === 'parent2' ? 'Parent 2' : 'Legal Guardian'}
                  </h4>
                  
                  <div className="address-field-group">
                    <label className="address-label">Street Address (line 1)*</label>
                    <input 
                      type="text" 
                      className="family-form-input"
                      placeholder="Enter street address"
                      value={getAddressValue(
                        formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                        'street1'
                      )}
                      onChange={(e) => handleAddressChange(
                        formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                        'street1', 
                        e.target.value
                      )}
                    />
                  </div>
                  
                  <div className="address-field-group">
                    <label className="address-label">Street Address (Line 2)</label>
                    <input 
                      type="text" 
                      className="family-form-input"
                      placeholder="Apartment, suite, unit, etc."
                      value={getAddressValue(
                        formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                        'street2'
                      )}
                      onChange={(e) => handleAddressChange(
                        formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                        'street2', 
                        e.target.value
                      )}
                    />
                  </div>
                  
                  <div className="address-field-group">
                    <label className="address-label">Street Address (line 3)</label>
                    <input 
                      type="text" 
                      className="family-form-input"
                      placeholder="Additional address information"
                      value={getAddressValue(
                        formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                        'street3'
                      )}
                      onChange={(e) => handleAddressChange(
                        formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                        'street3', 
                        e.target.value
                      )}
                    />
                  </div>
                  
                  <div className="address-row">
                    <div className="address-field-group">
                      <label className="address-label">City*</label>
                      <input 
                        type="text" 
                        className="family-form-input"
                        placeholder="Enter city"
                        value={getAddressValue(
                          formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                          'city'
                        )}
                        onChange={(e) => handleAddressChange(
                          formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                          'city', 
                          e.target.value
                        )}
                      />
                    </div>
                    
                    <div className="address-field-group">
                      <label className="address-label">State/Province*</label>
                      <Select
                        value={findSelectValue(formattedUSStates, getAddressValue(
                          formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                          'state'
                        ))}
                        onChange={(selectedOption) => handleAddressChange(
                          formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                          'state', 
                          selectedOption?.value || ''
                        )}
                        options={formattedUSStates}
                        placeholder="Select state"
                        isDisabled={saving}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: '#d1d5db',
                            '&:hover': { borderColor: '#9ca3af' },
                            borderRadius: '6px',
                            minHeight: '42px',
                            fontSize: '14px'
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 9999
                          })
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="address-row">
                    <div className="address-field-group">
                      <label className="address-label">Country*</label>
                      <Select
                        value={findSelectValue(formattedCountries, getAddressValue(
                          formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                          'country'
                        ))}
                        onChange={(selectedOption) => handleAddressChange(
                          formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                          'country', 
                          selectedOption?.value || ''
                        )}
                        options={formattedCountries}
                        placeholder="Select country"
                        isDisabled={saving}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: '#d1d5db',
                            '&:hover': { borderColor: '#9ca3af' },
                            borderRadius: '6px',
                            minHeight: '42px',
                            fontSize: '14px'
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 9999
                          })
                        }}
                      />
                    </div>
                    
                    <div className="address-field-group">
                      <label className="address-label">ZIP/Postal Code*</label>
                      <input 
                        type="text" 
                        className="family-form-input"
                        placeholder="Enter ZIP code"
                        value={getAddressValue(
                          formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                          'zip'
                        )}
                        onChange={(e) => handleAddressChange(
                          formData.parentGuardianAddress === 'parent1' ? 'parent1Address' : 'parent2Address', 
                          'zip', 
                          e.target.value
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {formData.parentGuardianAddress && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('parentGuardianAddress')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Parent 2 Address Question */}
          <div className="family-question-card">
            <div className="family-question-header">
              <h3 className="family-question-title">Would you like to provide an address for Parent 2?*</h3>
              <span className="family-question-required">Required</span>
            </div>
            <div className="family-radio-group">
              <label className="family-radio-option">
                <input
                  type="radio"
                  name="parent2Address"
                  value="yes"
                  checked={showParent2Address}
                  onChange={() => handleParent2AddressToggle(true)}
                  className="family-radio-input"
                  disabled={saving}
                />
                <span className="family-radio-label">Yes</span>
              </label>
              <label className="family-radio-option">
                <input
                  type="radio"
                  name="parent2Address"
                  value="no"
                  checked={!showParent2Address}
                  onChange={() => handleParent2AddressToggle(false)}
                  className="family-radio-input"
                  disabled={saving}
                />
                <span className="family-radio-label">No</span>
              </label>
            </div>
            
            {/* Parent 2 Address Fields - Conditionally Shown */}
            {showParent2Address && (
              <div className="parent2-address-section">
                <h4 className="address-form-title">Parent 2 Address</h4>
                
                <div className="address-field-group">
                  <label className="address-label">Parent 2 Street Address (line 1)*</label>
                  <input 
                    type="text" 
                    className="family-form-input"
                    placeholder="Enter street address"
                    value={getAddressValue('parent2Address', 'street1')}
                    onChange={(e) => handleAddressChange('parent2Address', 'street1', e.target.value)}
                  />
                </div>
                
                <div className="address-field-group">
                  <label className="address-label">Parent 2 Street Address (Line 2)</label>
                  <input 
                    type="text" 
                    className="family-form-input"
                    placeholder="Apartment, suite, unit, etc."
                    value={getAddressValue('parent2Address', 'street2')}
                    onChange={(e) => handleAddressChange('parent2Address', 'street2', e.target.value)}
                  />
                </div>
                
                <div className="address-field-group">
                  <label className="address-label">Parent 2 Street Address (line 3)</label>
                  <input 
                    type="text" 
                    className="family-form-input"
                    placeholder="Additional address information"
                    value={getAddressValue('parent2Address', 'street3')}
                    onChange={(e) => handleAddressChange('parent2Address', 'street3', e.target.value)}
                  />
                </div>
                
                <div className="address-row">
                  <div className="address-field-group">
                    <label className="address-label">Parent 2 City*</label>
                    <input 
                      type="text" 
                      className="family-form-input"
                      placeholder="Enter city"
                      value={getAddressValue('parent2Address', 'city')}
                      onChange={(e) => handleAddressChange('parent2Address', 'city', e.target.value)}
                    />
                  </div>
                  
                  <div className="address-field-group">
                    <label className="address-label">Parent 2 State/Province*</label>
                    <Select
                      value={findSelectValue(formattedUSStates, getAddressValue('parent2Address', 'state'))}
                      onChange={(selectedOption) => handleAddressChange('parent2Address', 'state', selectedOption?.value || '')}
                      options={formattedUSStates}
                      placeholder="Select state"
                      isDisabled={saving}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#d1d5db',
                          '&:hover': { borderColor: '#9ca3af' },
                          borderRadius: '6px',
                          minHeight: '42px',
                          fontSize: '14px'
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 9999
                        })
                      }}
                    />
                  </div>
                </div>
                
                <div className="address-row">
                  <div className="address-field-group">
                    <label className="address-label">Parent 2 Country*</label>
                    <Select
                      value={findSelectValue(formattedCountries, getAddressValue('parent2Address', 'country'))}
                      onChange={(selectedOption) => handleAddressChange('parent2Address', 'country', selectedOption?.value || '')}
                      options={formattedCountries}
                      placeholder="Select country"
                      isDisabled={saving}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#d1d5db',
                          '&:hover': { borderColor: '#9ca3af' },
                          borderRadius: '6px',
                          minHeight: '42px',
                          fontSize: '14px'
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 9999
                        })
                      }}
                    />
                  </div>
                  
                  <div className="address-field-group">
                    <label className="address-label">Parent 2 ZIP/Postal Code*</label>
                    <input 
                      type="text" 
                      className="family-form-input"
                      placeholder="Enter ZIP code"
                      value={getAddressValue('parent2Address', 'zip')}
                      onChange={(e) => handleAddressChange('parent2Address', 'zip', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <button 
              className="clear-answer-button"
              onClick={() => handleParent2AddressToggle(false)}
              disabled={saving}
            >
              {saving ? 'Clearing...' : 'Clear answer'}
            </button>
          </div>

          {/* KU Graduates Question */}
          <div className="family-question-card">
            <div className="family-question-header">
              <h3 className="family-question-title">
                Please select all family members who have graduated from KU with a bachelor's, master's, 
                first professional (law, medical or pharmacy) or doctoral degree.
              </h3>
            </div>
            <div className="family-checkbox-grid">
              {familyMemberOptions.map((member, index) => (
                <label key={index} className="family-checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData.kuGraduates.includes(member)}
                    onChange={() => handleCheckboxChange(member)}
                    className="family-checkbox-input"
                    disabled={saving}
                  />
                  <span className="family-checkbox-label">{member}</span>
                </label>
              ))}
            </div>
            {formData.kuGraduates.length > 0 && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('kuGraduates')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* KU Employee Dependent Question */}
          <div className="family-question-card">
            <div className="family-question-header">
              <h3 className="family-question-title">Are you the dependent of a current University of Kansas employee?</h3>
            </div>
            <div className="family-radio-group">
              <label className="family-radio-option">
                <input
                  type="radio"
                  name="kuEmployeeDependent"
                  value="yes"
                  checked={formData.kuEmployeeDependent === 'yes'}
                  onChange={(e) => handleInputChange('kuEmployeeDependent', e.target.value)}
                  className="family-radio-input"
                  disabled={saving}
                />
                <span className="family-radio-label">Yes</span>
              </label>
              <label className="family-radio-option">
                <input
                  type="radio"
                  name="kuEmployeeDependent"
                  value="no"
                  checked={formData.kuEmployeeDependent === 'no'}
                  onChange={(e) => handleInputChange('kuEmployeeDependent', e.target.value)}
                  className="family-radio-input"
                  disabled={saving}
                />
                <span className="family-radio-label">No</span>
              </label>
            </div>
            
            {formData.kuEmployeeDependent === 'yes' && (
              <div className="dependent-followup">
                <div className="address-field-group">
                  <label className="address-label">Please list the name of the parent/guardian employed at KU.</label>
                  <input 
                    type="text" 
                    className="family-form-input"
                    value={formData.kuEmployeeName}
                    onChange={(e) => handleInputChange('kuEmployeeName', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="address-field-group">
                  <label className="address-label">At which KU location is this person employed?</label>
                  <Select
                    value={findSelectValue(formattedKuLocations, formData.kuEmployeeLocation)}
                    onChange={(selectedOption) => handleInputChange('kuEmployeeLocation', selectedOption?.value || '')}
                    options={formattedKuLocations}
                    placeholder="Choose an option"
                    isDisabled={saving}
                    isClearable={true}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#d1d5db',
                        '&:hover': { borderColor: '#9ca3af' },
                        borderRadius: '6px',
                        minHeight: '42px',
                        fontSize: '14px',
                        maxWidth: '400px'
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 9999
                      })
                    }}
                  />
                </div>
              </div>
            )}
            
            {(formData.kuEmployeeDependent === 'yes' || formData.kuEmployeeDependent === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('kuEmployeeDependent')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Military Dependent Question - Always shown after KU employee question */}
          <div className="family-question-card">
            <div className="family-question-header">
              <h3 className="family-question-title">Are you currently a dependent of a military service member?*</h3>
              <span className="family-question-required">Required</span>
            </div>
            <div className="family-radio-group">
              <label className="family-radio-option">
                <input
                  type="radio"
                  name="militaryDependent"
                  value="yes"
                  checked={formData.militaryDependent === 'yes'}
                  onChange={(e) => handleInputChange('militaryDependent', e.target.value)}
                  className="family-radio-input"
                  disabled={saving}
                />
                <span className="family-radio-label">Yes</span>
              </label>
              <label className="family-radio-option">
                <input
                  type="radio"
                  name="militaryDependent"
                  value="no"
                  checked={formData.militaryDependent === 'no'}
                  onChange={(e) => handleInputChange('militaryDependent', e.target.value)}
                  className="family-radio-input"
                  disabled={saving}
                />
                <span className="family-radio-label">No</span>
              </label>
            </div>
            
            {formData.militaryDependent === 'yes' && (
              <div className="dependent-followup">
                <div className="address-field-group">
                  <label className="address-label">Which category best describes the military status of your parent/guardian?*</label>
                  <Select
                    value={findSelectValue(formattedMilitaryStatus, formData.militaryStatus)}
                    onChange={(selectedOption) => handleInputChange('militaryStatus', selectedOption?.value || '')}
                    options={formattedMilitaryStatus}
                    placeholder="Choose an option"
                    isDisabled={saving}
                    isClearable={true}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#d1d5db',
                        '&:hover': { borderColor: '#9ca3af' },
                        borderRadius: '6px',
                        minHeight: '42px',
                        fontSize: '14px',
                        maxWidth: '400px'
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 9999
                      })
                    }}
                  />
                </div>
                
                <div className="address-field-group">
                  <label className="address-label">
                    Do you intend to use VA Educational Benefits at KU? 
                    <span className="field-note">Please note that by responding "yes," you are not applying to use VA Benefits; rather, you are simply notifying us that you intend to use them.</span>
                  </label>
                  <div className="family-radio-group">
                    <label className="family-radio-option">
                      <input
                        type="radio"
                        name="vaBenefitsIntent"
                        value="yes"
                        checked={formData.vaBenefitsIntent === 'yes'}
                        onChange={(e) => handleInputChange('vaBenefitsIntent', e.target.value)}
                        className="family-radio-input"
                      />
                      <span className="family-radio-label">Yes</span>
                    </label>
                    <label className="family-radio-option">
                      <input
                        type="radio"
                        name="vaBenefitsIntent"
                        value="no"
                        checked={formData.vaBenefitsIntent === 'no'}
                        onChange={(e) => handleInputChange('vaBenefitsIntent', e.target.value)}
                        className="family-radio-input"
                      />
                      <span className="family-radio-label">No</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {(formData.militaryDependent === 'yes' || formData.militaryDependent === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('militaryDependent')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="family-actions">
            <button 
              className="family-secondary-button" 
              onClick={handleSaveAndClose}
              disabled={saving}
            >
              Save and Close
            </button>
            <button 
              className="family-primary-button" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="family-primary-button" 
              onClick={handleSaveAndContinue}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save and Continue'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FirstFamily;