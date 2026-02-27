import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./ApplicationAddress.css";

// =====================================================
// API BASE URL
// =====================================================
const API_URL = process.env.REACT_APP_API_BASE_URL 
  ? `${process.env.REACT_APP_API_BASE_URL}/api/application/address`
  : "http://localhost:5000/api/application/address";

// =====================================================
// PROPS:
//   onAddressChange (optional) — called whenever address
//   is saved successfully. Pushes mapped fields up to the
//   parent (App.js) so Resume.js can read them.
//   All other logic is completely unchanged.
// =====================================================
const ApplicationAddress = ({ onAddressChange }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(33);

  // Form data state
  const [formData, setFormData] = useState({
    // Permanent home address
    careOf: "",
    streetAndHouseNumber: "",
    city: "",
    country: "India",
    stateProvince: "",
    postcode: "",
    
    // Correspondence address
    hasDifferentCorrespondenceAddress: false,
    correspondenceCareOf: "",
    correspondenceStreetAndHouseNumber: "",
    correspondenceCity: "",
    correspondenceCountry: "India",
    correspondenceStateProvince: "",
    correspondencePostcode: "",
    
    // National ID file
    nationalIdFile: null,
  });

  // =====================================================
  // ── RESUME ADAPTER ──────────────────────────────────
  // Maps local address fields → Resume.js field names
  // and pushes them to the parent via onAddressChange.
  // Called after every successful save.
  // =====================================================
  const pushAddressToResume = (data) => {
    if (typeof onAddressChange !== 'function') return;

    onAddressChange({
      // Resume.js field name  ← Address form field
      currentAddress : data.streetAndHouseNumber || '',
      city           : data.city                 || '',
      state          : data.stateProvince        || '',
      country        : data.country              || '',
      postalCode     : data.postcode             || '',
    });
  };

  // =====================================================
  // FETCH ADDRESS DATA ON LOAD
  // =====================================================
  useEffect(() => {
    if (token) {
      fetchAddress();
    } else {
      setError("No authentication token found");
      setIsLoading(false);
    }
  }, [token]);

  const fetchAddress = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.addressInfo) {
        const addr = res.data.addressInfo;
        const loadedData = {
          careOf: addr.careOf || "",
          streetAndHouseNumber: addr.streetAndHouseNumber || "",
          city: addr.city || "",
          country: addr.country || "India",
          stateProvince: addr.stateProvince || "",
          postcode: addr.postcode || "",
          hasDifferentCorrespondenceAddress: addr.hasDifferentCorrespondenceAddress || false,
          correspondenceCareOf: addr.correspondenceCareOf || "",
          correspondenceStreetAndHouseNumber: addr.correspondenceStreetAndHouseNumber || "",
          correspondenceCity: addr.correspondenceCity || "",
          correspondenceCountry: addr.correspondenceCountry || "India",
          correspondenceStateProvince: addr.correspondenceStateProvince || "",
          correspondencePostcode: addr.correspondencePostcode || "",
          nationalIdFile: addr.nationalIdFileName
            ? {
                fileName: addr.nationalIdFileName,
                fileUrl: addr.nationalIdFileUrl,
                fileType: addr.nationalIdFileType,
                fileSize: addr.nationalIdFileSize,
                originalName: addr.nationalIdOriginalName,
              }
            : null,
        };

        setFormData(loadedData);
        setAddressSaved(true);

        // ── Push loaded address to Resume on mount ──
        pushAddressToResume(loadedData);
        
        if (res.data.isCompleted) {
          setCompletionPercentage(66);
        }
      }
    } catch (error) {
      console.error("Error fetching address:", error.response?.data || error.message);
      if (error.response?.status !== 404) {
        setError("Failed to load address data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // CALCULATE COMPLETION PERCENTAGE
  // =====================================================
  const calculateCompletion = () => {
    const permanentFields = [
      'streetAndHouseNumber', 'city', 'country', 'stateProvince', 'postcode'
    ];
    
    const completedPermanent = permanentFields.filter(field => {
      const value = formData[field];
      return value && value.toString().trim() !== '';
    }).length;

    let totalFields = 5;
    let completedFields = completedPermanent;

    if (formData.hasDifferentCorrespondenceAddress) {
      const correspondenceFields = [
        'correspondenceStreetAndHouseNumber', 'correspondenceCity', 
        'correspondenceCountry', 'correspondenceStateProvince', 'correspondencePostcode'
      ];
      const completedCorrespondence = correspondenceFields.filter(field => {
        const value = formData[field];
        return value && value.toString().trim() !== '';
      }).length;
      
      totalFields += 5;
      completedFields += completedCorrespondence;
    }

    if (formData.nationalIdFile) {
      completedFields += 1;
    }
    totalFields += 1;

    return Math.round((completedFields / totalFields) * 100);
  };

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
    
    setAddressSaved(false);
  };

  // =====================================================
  // HANDLE CORRESPONDENCE ADDRESS TOGGLE
  // =====================================================
  const handleCorrespondenceToggle = (value) => {
    const hasDifferent = value === 'yes';
    setFormData((prev) => ({
      ...prev,
      hasDifferentCorrespondenceAddress: hasDifferent,
      ...(hasDifferent ? {} : {
        correspondenceCareOf: "",
        correspondenceStreetAndHouseNumber: "",
        correspondenceCity: "",
        correspondenceCountry: "India",
        correspondenceStateProvince: "",
        correspondencePostcode: "",
      })
    }));
    setAddressSaved(false);
    
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      if (!hasDifferent) {
        delete newErrors.correspondenceStreetAndHouseNumber;
        delete newErrors.correspondenceCity;
        delete newErrors.correspondenceCountry;
        delete newErrors.correspondenceStateProvince;
        delete newErrors.correspondencePostcode;
      }
      return newErrors;
    });
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================
  const validateForm = () => {
    const errors = {};
    const missingFields = [];

    if (!formData.streetAndHouseNumber?.trim()) {
      errors.streetAndHouseNumber = 'Street and house number is required';
      missingFields.push('Street and house number');
    }
    
    if (!formData.city?.trim()) {
      errors.city = 'City is required';
      missingFields.push('City');
    }
    
    if (!formData.country?.trim()) {
      errors.country = 'Country is required';
      missingFields.push('Country');
    }
    
    if (!formData.stateProvince?.trim()) {
      errors.stateProvince = 'State/Province is required';
      missingFields.push('State/Province');
    }
    
    if (!formData.postcode?.trim()) {
      errors.postcode = 'Postcode is required';
      missingFields.push('Postcode');
    }

    if (formData.postcode?.trim() && formData.postcode.length < 3) {
      errors.postcode = 'Please enter a valid postcode';
    }

    if (formData.hasDifferentCorrespondenceAddress) {
      if (!formData.correspondenceStreetAndHouseNumber?.trim()) {
        errors.correspondenceStreetAndHouseNumber = 'Correspondence street and house number is required';
        missingFields.push('Correspondence street and house number');
      }
      if (!formData.correspondenceCity?.trim()) {
        errors.correspondenceCity = 'Correspondence city is required';
        missingFields.push('Correspondence city');
      }
      if (!formData.correspondenceCountry?.trim()) {
        errors.correspondenceCountry = 'Correspondence country is required';
        missingFields.push('Correspondence country');
      }
      if (!formData.correspondenceStateProvince?.trim()) {
        errors.correspondenceStateProvince = 'Correspondence state/province is required';
        missingFields.push('Correspondence state/province');
      }
      if (!formData.correspondencePostcode?.trim()) {
        errors.correspondencePostcode = 'Correspondence postcode is required';
        missingFields.push('Correspondence postcode');
      }
      if (formData.correspondencePostcode?.trim() && formData.correspondencePostcode.length < 3) {
        errors.correspondencePostcode = 'Please enter a valid postcode';
      }
    }

    setValidationErrors(errors);
    return {
      isValid: Object.keys(errors).length === 0,
      missingFields
    };
  };

  // =====================================================
  // SAVE ADDRESS
  // =====================================================
  const saveAddress = async () => {
    if (isSubmitting) return;

    const validation = validateForm();
    if (!validation.isValid) {
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      
      let errorMessage = 'Please fix the following errors:\n\n';
      Object.values(validationErrors).forEach(error => {
        errorMessage += `• ${error}\n`;
      });
      alert(errorMessage);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const requestData = {
        careOf: formData.careOf,
        streetAndHouseNumber: formData.streetAndHouseNumber,
        city: formData.city,
        country: formData.country,
        stateProvince: formData.stateProvince,
        postcode: formData.postcode,
        hasDifferentCorrespondenceAddress: formData.hasDifferentCorrespondenceAddress,
        correspondenceCareOf: formData.correspondenceCareOf,
        correspondenceStreetAndHouseNumber: formData.correspondenceStreetAndHouseNumber,
        correspondenceCity: formData.correspondenceCity,
        correspondenceCountry: formData.correspondenceCountry,
        correspondenceStateProvince: formData.correspondenceStateProvince,
        correspondencePostcode: formData.correspondencePostcode,
      };

      await axios.post(API_URL, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // ── Push saved address to Resume ──────────────────
      pushAddressToResume(formData);

      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'success-toast';
      toast.textContent = 'Address saved successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      setAddressSaved(true);
      
      const newPercentage = calculateCompletion();
      setCompletionPercentage(33 + Math.round(newPercentage * 0.33));
      
      // Navigate to next page
      setTimeout(() => {
        let targetPath;
        if (location.pathname.includes('/address')) {
          targetPath = location.pathname.replace('/address', '/language');
        } else {
          targetPath = '/firstyear/dashboard/application/language';
        }
        navigate(targetPath);
      }, 1000);
      
    } catch (error) {
      console.error("Save error:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to save address");
      
      const toast = document.createElement('div');
      toast.className = 'error-toast';
      toast.textContent = error.response?.data?.message || "Failed to save address. Please try again.";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // UPLOAD NATIONAL ID
  // =====================================================
  const handleFileUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPG, PNG, and PDF are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const data = new FormData();
    data.append("file", file);

    setUploading(true);

    try {
      const res = await axios.post(`${API_URL}/upload/nationalId`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const toast = document.createElement('div');
      toast.className = 'success-toast';
      toast.textContent = 'National ID uploaded successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      setFormData((prev) => ({
        ...prev,
        nationalIdFile: {
          fileName: res.data.fileName,
          fileUrl: res.data.fileUrl,
          fileType: res.data.fileType,
          fileSize: res.data.fileSize,
          originalName: res.data.originalName,
        },
      }));
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      
      const toast = document.createElement('div');
      toast.className = 'error-toast';
      toast.textContent = error.response?.data?.message || "Upload failed. Please try again.";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // REMOVE NATIONAL ID
  // =====================================================
  const removeNationalId = async () => {
    try {
      await axios.delete(`${API_URL}/files/nationalId`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const toast = document.createElement('div');
      toast.className = 'success-toast';
      toast.textContent = 'National ID removed successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      setFormData((prev) => ({
        ...prev,
        nationalIdFile: null,
      }));
    } catch (error) {
      console.error("Remove error:", error.response?.data || error.message);
      
      const toast = document.createElement('div');
      toast.className = 'error-toast';
      toast.textContent = "Failed to remove national ID";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  // =====================================================
  // HANDLE BACK NAVIGATION
  // =====================================================
  const handleBack = () => {
    let backPath;
    if (location.pathname.includes('/address')) {
      backPath = location.pathname.replace('/address', '/personal');
    } else {
      backPath = '/firstyear/dashboard/application/personal';
    }
    navigate(backPath);
  };

  // =====================================================
  // HANDLE SAVE AND CONTINUE LATER
  // =====================================================
  const handleSaveLater = async () => {
    try {
      await saveAddress();
      const toast = document.createElement('div');
      toast.className = 'success-toast';
      toast.textContent = 'Progress saved! You can continue later.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error) {
      // Error handling is done in saveAddress
    }
  };

  const completionPercentageValue = calculateCompletion();
  const overallPercentage = 33 + Math.round(completionPercentageValue * 0.33);

  // =====================================================
  // LOADING STATE
  // =====================================================
  if (isLoading) {
    return (
      <div className="application-address">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your address information...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <div className="application-address">
      {/* Header with Progress */}
      <div className="address-header">
        <div className="header-left">
          <h1>BA Communication Design</h1>
          <div className="application-id">
            <span className="id-label">APPLICATION ID</span>
            <span className="id-value">UEG0000104849</span>
          </div>
        </div>
        <div className="progress-indicator">
          <div className="progress-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                className="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="circle"
                strokeDasharray={`${overallPercentage}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">{overallPercentage}%</text>
            </svg>
          </div>
          <span className="progress-text">Completed</span>
        </div>
      </div>

      {/* Navigation Steps */}
      <div className="application-steps">
        <div className="step completed">
          <span className="step-number">1</span>
          <span className="step-name">Study Programme</span>
        </div>
        <div className="step completed">
          <span className="step-number">2</span>
          <span className="step-name">Applicant Details</span>
        </div>
        <div className="step active">
          <span className="step-number">3</span>
          <span className="step-name">Address</span>
        </div>
        <div className="step">
          <span className="step-number">4</span>
          <span className="step-name">Language</span>
        </div>
        <div className="step">
          <span className="step-number">5</span>
          <span className="step-name">Education</span>
        </div>
        <div className="step">
          <span className="step-number">6</span>
          <span className="step-name">Documents</span>
        </div>
        <div className="step">
          <span className="step-number">7</span>
          <span className="step-name">Review</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <svg className="error-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>{error}</span>
          <button onClick={() => setError('')} className="error-close-btn">×</button>
        </div>
      )}

      {/* Main Form */}
      <div className="address-form-container">
        <div className="form-header">
          <h2>Address Information</h2>
          <p className="form-subtitle">
            Please provide your permanent address as it appears on official documents
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); saveAddress(); }}>
          {/* Permanent Address Section */}
          <div className="form-section">
            <div className="section-title">
              <h3>Permanent Home Address</h3>
              <span className="required-badge">Required</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="careOf">
                Care of (C/o)
                <span className="label-hint">Optional</span>
              </label>
              <input
                type="text"
                id="careOf"
                className={`form-input ${validationErrors.careOf ? 'error' : ''}`}
                value={formData.careOf}
                onChange={(e) => handleInputChange("careOf", e.target.value)}
                placeholder="e.g., John Doe, c/o Jane Smith"
                disabled={isSubmitting}
              />
              <small className="field-hint">Leave blank if not applicable</small>
            </div>

            <div className="form-group">
              <label className="form-label required" htmlFor="streetAndHouseNumber">
                Street and house number
              </label>
              <input
                type="text"
                id="streetAndHouseNumber"
                className={`form-input ${validationErrors.streetAndHouseNumber ? 'error' : ''}`}
                value={formData.streetAndHouseNumber}
                onChange={(e) => handleInputChange("streetAndHouseNumber", e.target.value)}
                placeholder="Enter street name and house number"
                disabled={isSubmitting}
              />
              {validationErrors.streetAndHouseNumber && (
                <span className="error-message">{validationErrors.streetAndHouseNumber}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required" htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  className={`form-input ${validationErrors.city ? 'error' : ''}`}
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Enter city"
                  disabled={isSubmitting}
                />
                {validationErrors.city && (
                  <span className="error-message">{validationErrors.city}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="country">Country</label>
                <select
                  id="country"
                  className={`form-select ${validationErrors.country ? 'error' : ''}`}
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Select Country</option>
                  <option value="India">India</option>
                  <option value="USA">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
                {validationErrors.country && (
                  <span className="error-message">{validationErrors.country}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required" htmlFor="stateProvince">
                  State / Province
                </label>
                {formData.country === 'India' ? (
                  <select
                    id="stateProvince"
                    className={`form-select ${validationErrors.stateProvince ? 'error' : ''}`}
                    value={formData.stateProvince}
                    onChange={(e) => handleInputChange("stateProvince", e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Select State</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    id="stateProvince"
                    className={`form-input ${validationErrors.stateProvince ? 'error' : ''}`}
                    value={formData.stateProvince}
                    onChange={(e) => handleInputChange("stateProvince", e.target.value)}
                    placeholder="Enter state/province"
                    disabled={isSubmitting}
                  />
                )}
                {validationErrors.stateProvince && (
                  <span className="error-message">{validationErrors.stateProvince}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="postcode">Postcode</label>
                <input
                  type="text"
                  id="postcode"
                  className={`form-input ${validationErrors.postcode ? 'error' : ''}`}
                  value={formData.postcode}
                  onChange={(e) => handleInputChange("postcode", e.target.value)}
                  placeholder="Enter postal code"
                  disabled={isSubmitting}
                />
                {validationErrors.postcode && (
                  <span className="error-message">{validationErrors.postcode}</span>
                )}
              </div>
            </div>
          </div>

          {/* Correspondence Address Section */}
          <div className="form-section">
            <div className="section-title">
              <h3>Correspondence Address</h3>
            </div>

            <div className="form-group full-width">
              <label className="form-label">
                Do you have a different address for correspondence?
              </label>
              <div className="radio-group">
                <label className={`radio-option ${formData.hasDifferentCorrespondenceAddress === true ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="correspondenceAddress"
                    value="yes"
                    checked={formData.hasDifferentCorrespondenceAddress === true}
                    onChange={() => handleCorrespondenceToggle('yes')}
                    disabled={isSubmitting}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label-text">Yes</span>
                </label>
                <label className={`radio-option ${formData.hasDifferentCorrespondenceAddress === false ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="correspondenceAddress"
                    value="no"
                    checked={formData.hasDifferentCorrespondenceAddress === false}
                    onChange={() => handleCorrespondenceToggle('no')}
                    disabled={isSubmitting}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label-text">No, same as permanent address</span>
                </label>
              </div>
            </div>

            {formData.hasDifferentCorrespondenceAddress && (
              <div className="correspondence-address-fields slide-in">
                <div className="form-group">
                  <label className="form-label" htmlFor="correspondenceCareOf">
                    Care of (C/o)
                    <span className="label-hint">Optional</span>
                  </label>
                  <input
                    type="text"
                    id="correspondenceCareOf"
                    className={`form-input ${validationErrors.correspondenceCareOf ? 'error' : ''}`}
                    value={formData.correspondenceCareOf}
                    onChange={(e) => handleInputChange("correspondenceCareOf", e.target.value)}
                    placeholder="e.g., John Doe, c/o Jane Smith"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required" htmlFor="correspondenceStreetAndHouseNumber">
                    Street and house number
                  </label>
                  <input
                    type="text"
                    id="correspondenceStreetAndHouseNumber"
                    className={`form-input ${validationErrors.correspondenceStreetAndHouseNumber ? 'error' : ''}`}
                    value={formData.correspondenceStreetAndHouseNumber}
                    onChange={(e) => handleInputChange("correspondenceStreetAndHouseNumber", e.target.value)}
                    placeholder="Enter street name and house number"
                    disabled={isSubmitting}
                  />
                  {validationErrors.correspondenceStreetAndHouseNumber && (
                    <span className="error-message">{validationErrors.correspondenceStreetAndHouseNumber}</span>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required" htmlFor="correspondenceCity">City</label>
                    <input
                      type="text"
                      id="correspondenceCity"
                      className={`form-input ${validationErrors.correspondenceCity ? 'error' : ''}`}
                      value={formData.correspondenceCity}
                      onChange={(e) => handleInputChange("correspondenceCity", e.target.value)}
                      placeholder="Enter city"
                      disabled={isSubmitting}
                    />
                    {validationErrors.correspondenceCity && (
                      <span className="error-message">{validationErrors.correspondenceCity}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label required" htmlFor="correspondenceCountry">Country</label>
                    <select
                      id="correspondenceCountry"
                      className={`form-select ${validationErrors.correspondenceCountry ? 'error' : ''}`}
                      value={formData.correspondenceCountry}
                      onChange={(e) => handleInputChange("correspondenceCountry", e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">Select Country</option>
                      <option value="India">India</option>
                      <option value="USA">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                    </select>
                    {validationErrors.correspondenceCountry && (
                      <span className="error-message">{validationErrors.correspondenceCountry}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required" htmlFor="correspondenceStateProvince">
                      State / Province
                    </label>
                    <input
                      type="text"
                      id="correspondenceStateProvince"
                      className={`form-input ${validationErrors.correspondenceStateProvince ? 'error' : ''}`}
                      value={formData.correspondenceStateProvince}
                      onChange={(e) => handleInputChange("correspondenceStateProvince", e.target.value)}
                      placeholder="Enter state/province"
                      disabled={isSubmitting}
                    />
                    {validationErrors.correspondenceStateProvince && (
                      <span className="error-message">{validationErrors.correspondenceStateProvince}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label required" htmlFor="correspondencePostcode">Postcode</label>
                    <input
                      type="text"
                      id="correspondencePostcode"
                      className={`form-input ${validationErrors.correspondencePostcode ? 'error' : ''}`}
                      value={formData.correspondencePostcode}
                      onChange={(e) => handleInputChange("correspondencePostcode", e.target.value)}
                      placeholder="Enter postal code"
                      disabled={isSubmitting}
                    />
                    {validationErrors.correspondencePostcode && (
                      <span className="error-message">{validationErrors.correspondencePostcode}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* National ID Upload Section */}
          <div className="form-section">
            <div className="section-title">
              <h3>National ID Document</h3>
              <span className="optional-badge">Optional</span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Upload National ID (Aadhaar, Passport, etc.)</label>
              <div className={`upload-area ${uploading ? 'uploading' : ''}`}>
                {uploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div>
                    <span>Uploading...</span>
                  </div>
                )}
                
                {formData.nationalIdFile ? (
                  <div className="file-info">
                    <div className="file-icon-container">
                      {formData.nationalIdFile.fileType?.includes('pdf') ? (
                        <svg className="file-icon pdf" viewBox="0 0 24 24" width="32" height="32">
                          <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 14H6v-4h2v4zm3-4h2v4h-2v-4zm8 4h-2v-4h2v4z"/>
                        </svg>
                      ) : (
                        <svg className="file-icon image" viewBox="0 0 24 24" width="32" height="32">
                          <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                      )}
                    </div>
                    <div className="file-details">
                      <span className="file-name">{formData.nationalIdFile.originalName || formData.nationalIdFile.fileName}</span>
                      {formData.nationalIdFile.fileSize && (
                        <span className="file-size">
                          {(formData.nationalIdFile.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={removeNationalId}
                      disabled={uploading || isSubmitting}
                      title="Remove file"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <svg className="upload-icon" viewBox="0 0 24 24" width="48" height="48">
                      <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                    </svg>
                    <p className="upload-instruction">Drag and drop your file here, or click to browse</p>
                    <p className="upload-hint">Supported formats: JPG, PNG, PDF (Max size: 5MB)</p>
                    <input
                      type="file"
                      id="nationalIdUpload"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                      style={{ display: 'none' }}
                      disabled={uploading || isSubmitting}
                    />
                    <button
                      type="button"
                      className="upload-button"
                      onClick={() => document.getElementById('nationalIdUpload').click()}
                      disabled={uploading || isSubmitting}
                    >
                      {uploading ? 'Uploading...' : 'Browse Files'}
                    </button>
                  </div>
                )}
              </div>
              {!addressSaved && (
                <p className="upload-warning">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  Please save your address before uploading documents
                </p>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Back
            </button>

            <div className="action-group">
              <button
                type="button"
                className="btn-outline"
                onClick={handleSaveLater}
                disabled={isSubmitting}
              >
                Save & Continue Later
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    Next Step
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationAddress;