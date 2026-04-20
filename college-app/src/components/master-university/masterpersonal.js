import React, { useState, useEffect, useRef } from 'react';
import './masterpersonal.css';

const MasterPersonal = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    _id: null,
    fullName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    passportNumber: '',
    maritalStatus: ''
  });

  const [errors, setErrors] = useState({});
  const isInitialMount = useRef(true);
  const debounceRef = useRef(null);

  // Load data from parent (edit mode)
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const { _isValid, ...rest } = data;
      setFormData(prev => {
        if (JSON.stringify(prev) === JSON.stringify(rest)) return prev;
        return { ...prev, ...rest };
      });
    }
  }, [data]);

  // Validation
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'fullName':
        if (!value.trim()) error = 'Full name is required';
        else if (value.trim().length < 2) error = 'Name must be at least 2 characters';
        break;

      case 'dateOfBirth':
        if (!value) error = 'Date of birth is required';
        else {
          const age = new Date().getFullYear() - new Date(value).getFullYear();
          if (age < 16) error = 'Must be at least 16 years old';
          if (age > 100) error = 'Invalid date of birth';
        }
        break;

      case 'gender':
        if (!value) error = 'Gender is required';
        break;

      case 'nationality':
        if (!value.trim()) error = 'Nationality is required';
        break;

      case 'passportNumber':
        if (!value.trim()) error = 'Passport number is required';
        else if (value.trim().length < 6) error = 'Valid passport number required';
        break;

      case 'maritalStatus':
        if (!value) error = 'Marital status is required';
        break;

      default:
        break;
    }

    return error;
  };

  // Handle Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle Blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

// 🔒 Prevent multiple simultaneous saves
const isSavingRef = useRef(false);

// 🧠 Track last saved data (avoid unnecessary API calls)
const lastSavedRef = useRef(null);

// API CALL (Create / Update)
const saveDataToBackend = async () => {
  try {
    if (isSavingRef.current) return;

    // ❌ Remove _id before sending
    const cleanData = { ...formData };
    delete cleanData._id;

    if (JSON.stringify(lastSavedRef.current) === JSON.stringify(cleanData)) {
      return;
    }

    isSavingRef.current = true;

    console.log("🚀 POST API Call", cleanData);

    const res = await fetch("http://localhost:5000/api/master-personal", {
      method: "POST", // ✅ ALWAYS POST
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanData),
    });

    const result = await res.json();

    if (result.success) {
      console.log("✅ Saved:", result.data);

      lastSavedRef.current = cleanData;

      // ✅ Store _id once
      if (!formData._id && result.data._id) {
        setFormData(prev => ({
          ...prev,
          _id: result.data._id
        }));
      }

    } else {
      console.error("❌ Save failed:", result.message);
    }

  } catch (error) {
    console.error("❌ API Error:", error);
  } finally {
    isSavingRef.current = false;
  }
};

  // Auto-save with debounce
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const isValid = Object.keys(formData).every(key => {
      if (key === '_id') return true;
      return !validateField(key, formData[key] || '');
    });

    updateData({ ...formData, _isValid: isValid });

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (isValid) {
        saveDataToBackend();
      }
    }, 800);

  }, [formData]);

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];

  return (
    <div className="masterpersonal-form">
      <div className="masterpersonal-header">
        <h2 className="masterpersonal-title">Personal Information</h2>
        <p className="masterpersonal-subtitle">
          Please provide your personal details as per your passport
        </p>
      </div>

      <div className="masterpersonal-grid">

        {/* Full Name */}
        <div className="masterpersonal-group masterpersonal-group-full">
          <label className="masterpersonal-label">
            Full Name <span className="masterpersonal-required">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter your full name as shown on passport"
            className={`masterpersonal-input ${errors.fullName ? 'masterpersonal-error' : ''}`}
          />
          {errors.fullName && <span className="masterpersonal-error-text">{errors.fullName}</span>}
        </div>

        {/* Date of Birth */}
        <div className="masterpersonal-group">
          <label className="masterpersonal-label">
            Date of Birth <span className="masterpersonal-required">*</span>
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`masterpersonal-input ${errors.dateOfBirth ? 'masterpersonal-error' : ''}`}
          />
          {errors.dateOfBirth && <span className="masterpersonal-error-text">{errors.dateOfBirth}</span>}
        </div>

        {/* Gender */}
        <div className="masterpersonal-group">
          <label className="masterpersonal-label">
            Gender <span className="masterpersonal-required">*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`masterpersonal-select ${errors.gender ? 'masterpersonal-error' : ''}`}
          >
            <option value="">Select Gender</option>
            {genderOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.gender && <span className="masterpersonal-error-text">{errors.gender}</span>}
        </div>

        {/* Nationality */}
        <div className="masterpersonal-group">
          <label className="masterpersonal-label">
            Nationality <span className="masterpersonal-required">*</span>
          </label>
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter your nationality"
            className={`masterpersonal-input ${errors.nationality ? 'masterpersonal-error' : ''}`}
          />
          {errors.nationality && <span className="masterpersonal-error-text">{errors.nationality}</span>}
        </div>

        {/* Passport Number */}
        <div className="masterpersonal-group">
          <label className="masterpersonal-label">
            Passport Number <span className="masterpersonal-required">*</span>
          </label>
          <input
            type="text"
            name="passportNumber"
            value={formData.passportNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter your passport number"
            className={`masterpersonal-input ${errors.passportNumber ? 'masterpersonal-error' : ''}`}
          />
          {errors.passportNumber && <span className="masterpersonal-error-text">{errors.passportNumber}</span>}
        </div>

        {/* Marital Status */}
        <div className="masterpersonal-group">
          <label className="masterpersonal-label">
            Marital Status <span className="masterpersonal-required">*</span>
          </label>
          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`masterpersonal-select ${errors.maritalStatus ? 'masterpersonal-error' : ''}`}
          >
            <option value="">Select Marital Status</option>
            {maritalStatusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.maritalStatus && <span className="masterpersonal-error-text">{errors.maritalStatus}</span>}
        </div>

      </div>
    </div>
  );
};

export default MasterPersonal;