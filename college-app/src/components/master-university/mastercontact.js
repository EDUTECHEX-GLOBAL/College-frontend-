import React, { useState, useEffect, useRef, useCallback } from 'react';
import './mastercontact.css';

const MasterContact = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    _id: null,
    emailAddress: '',
    mobileNumber: '',
    alternatePhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });

  const [errors, setErrors] = useState({});
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef(null);

  const isInitialMount = useRef(true);
  const debounceRef = useRef(null);
  const isSavingRef = useRef(false);
  const lastSavedRef = useRef(null);
  const lastUpdatedRef = useRef(null);

  const countries = [
    'United States', 'United Kingdom', 'Canada',
    'Australia', 'India', 'Germany', 'France', 'Other'
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load data from parent ONLY once (or when data._id changes)
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const { _isValid, ...rest } = data;
      setFormData(prev => {
        const isSame = Object.keys(rest).every(k => prev[k] === rest[k]);
        if (isSame) return prev;
        return { ...prev, ...rest };
      });
    }
  }, [data?._id]);

  const validateField = useCallback((name, value) => {
    let error = '';
    switch (name) {
      case 'emailAddress':
        if (!value.trim()) error = 'Email address is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          error = 'Enter a valid email address';
        break;
      case 'mobileNumber':
        if (!value.trim()) error = 'Mobile number is required';
        else if (!/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(value))
          error = 'Enter a valid mobile number';
        break;
      case 'addressLine1':
        if (!value.trim()) error = 'Address is required';
        break;
      case 'city':
        if (!value.trim()) error = 'City is required';
        break;
      case 'state':
        if (!value.trim()) error = 'State is required';
        break;
      case 'country':
        if (!value.trim()) error = 'Country is required';
        break;
      case 'postalCode':
        if (!value.trim()) error = 'Postal code is required';
        break;
      default:
        break;
    }
    return error;
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Custom country select handler
  const handleCountrySelect = (country) => {
    setFormData(prev => ({ ...prev, country }));
    const error = validateField('country', country);
    setErrors(prev => ({ ...prev, country: error }));
    setCountryOpen(false);
  };

  const saveDataToBackend = useCallback(async (currentFormData) => {
    try {
      if (isSavingRef.current) return;
      if (JSON.stringify(lastSavedRef.current) === JSON.stringify(currentFormData)) return;
      isSavingRef.current = true;

      const url = currentFormData._id
        ? `http://localhost:5000/api/master-contact/${currentFormData._id}`
        : `http://localhost:5000/api/master-contact`;
      const method = currentFormData._id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentFormData)
      });
      const result = await res.json();

      if (result.success) {
        lastSavedRef.current = result.data;
        if (!currentFormData._id && result.data._id) {
          setFormData(prev => ({ ...prev, _id: result.data._id }));
        }
      }
    } catch (error) {
      console.error('❌ API Error:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const requiredFields = [
      'emailAddress', 'mobileNumber', 'addressLine1',
      'city', 'state', 'country', 'postalCode'
    ];
    const isValid = requiredFields.every(key => !validateField(key, formData[key] || ''));

    const nextUpdate = JSON.stringify({ ...formData, _isValid: isValid });
    if (lastUpdatedRef.current !== nextUpdate) {
      lastUpdatedRef.current = nextUpdate;
      updateData({ ...formData, _isValid: isValid });
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isValid) saveDataToBackend(formData);
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData, validateField, saveDataToBackend, updateData]);

  return (
    <div className="mastercontact-form">
      <div className="mastercontact-header">
        <h2 className="mastercontact-title">Contact Details</h2>
        <p className="mastercontact-subtitle">Please provide your current contact information</p>
      </div>

      <div className="mastercontact-grid">

        <div className="mastercontact-group mastercontact-group-full">
          <label className="mastercontact-label">
            Email Address <span className="mastercontact-required">*</span>
          </label>
          <input
            type="email"
            name="emailAddress"
            value={formData.emailAddress}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="you@example.com"
            className={`mastercontact-input ${errors.emailAddress ? 'mastercontact-error' : ''}`}
          />
          {errors.emailAddress && <span className="mastercontact-error-text">{errors.emailAddress}</span>}
        </div>

        <div className="mastercontact-group">
          <label className="mastercontact-label">
            Mobile Number <span className="mastercontact-required">*</span>
          </label>
          <input
            type="tel"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="+1 234 567 8900"
            className={`mastercontact-input ${errors.mobileNumber ? 'mastercontact-error' : ''}`}
          />
          {errors.mobileNumber && <span className="mastercontact-error-text">{errors.mobileNumber}</span>}
        </div>

        <div className="mastercontact-group">
          <label className="mastercontact-label">Alternate Phone Number</label>
          <input
            type="tel"
            name="alternatePhone"
            value={formData.alternatePhone}
            onChange={handleChange}
            placeholder="Optional"
            className="mastercontact-input"
          />
        </div>

        <div className="mastercontact-group mastercontact-group-full">
          <label className="mastercontact-label">
            Address Line 1 <span className="mastercontact-required">*</span>
          </label>
          <input
            type="text"
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mastercontact-input ${errors.addressLine1 ? 'mastercontact-error' : ''}`}
          />
          {errors.addressLine1 && <span className="mastercontact-error-text">{errors.addressLine1}</span>}
        </div>

        <div className="mastercontact-group mastercontact-group-full">
          <label className="mastercontact-label">Address Line 2</label>
          <input
            type="text"
            name="addressLine2"
            value={formData.addressLine2}
            onChange={handleChange}
            className="mastercontact-input"
          />
        </div>

        <div className="mastercontact-group">
          <label className="mastercontact-label">
            City <span className="mastercontact-required">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mastercontact-input ${errors.city ? 'mastercontact-error' : ''}`}
          />
          {errors.city && <span className="mastercontact-error-text">{errors.city}</span>}
        </div>

        <div className="mastercontact-group">
          <label className="mastercontact-label">
            State <span className="mastercontact-required">*</span>
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mastercontact-input ${errors.state ? 'mastercontact-error' : ''}`}
          />
          {errors.state && <span className="mastercontact-error-text">{errors.state}</span>}
        </div>

        {/* ── Custom Country Dropdown ── */}
        <div className="mastercontact-group" ref={countryRef}>
          <label className="mastercontact-label">
            Country <span className="mastercontact-required">*</span>
          </label>
          <div className="mastercontact-custom-select-wrapper">
            <button
              type="button"
              className={`mastercontact-custom-select-trigger ${errors.country ? 'mastercontact-error' : ''} ${formData.country ? '' : 'mastercontact-placeholder'}`}
              onClick={() => setCountryOpen(prev => !prev)}
              aria-haspopup="listbox"
              aria-expanded={countryOpen}
            >
              <span>{formData.country || 'Select Country'}</span>
              <svg
                className={`mastercontact-chevron ${countryOpen ? 'mastercontact-chevron-open' : ''}`}
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {countryOpen && (
              <ul className="mastercontact-dropdown" role="listbox">
                {countries.map(c => (
                  <li
                    key={c}
                    role="option"
                    aria-selected={formData.country === c}
                    className={`mastercontact-dropdown-item ${formData.country === c ? 'mastercontact-dropdown-item-active' : ''}`}
                    onClick={() => handleCountrySelect(c)}
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.country && <span className="mastercontact-error-text">{errors.country}</span>}
        </div>

        <div className="mastercontact-group">
          <label className="mastercontact-label">
            Postal Code <span className="mastercontact-required">*</span>
          </label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mastercontact-input ${errors.postalCode ? 'mastercontact-error' : ''}`}
          />
          {errors.postalCode && <span className="mastercontact-error-text">{errors.postalCode}</span>}
        </div>

      </div>
    </div>
  );
};

export default MasterContact;