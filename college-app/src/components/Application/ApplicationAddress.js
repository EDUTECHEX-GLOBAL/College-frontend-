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

const ApplicationAddress = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(33);

  // Form data state matching GUS portal structure
  const [formData, setFormData] = useState({
    // Permanent home address
    careOf: "",
    streetAndHouseNumber: "",
    city: "",
    country: "India", // Default as shown in screenshot
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
        setFormData({
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
        });
        setAddressSaved(true);
        
        // Update completion percentage from response if available
        if (res.data.isCompleted) {
          setCompletionPercentage(66); // 33% + 33% for address completion
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

    let totalFields = 5; // Permanent address fields
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

    // Add national ID file
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
      // Clear correspondence fields if toggled to No
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
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================
  const validateForm = () => {
    const missingFields = [];

    // Validate permanent address
    if (!formData.streetAndHouseNumber) missingFields.push('Street and house number');
    if (!formData.city) missingFields.push('City');
    if (!formData.country) missingFields.push('Country');
    if (!formData.stateProvince) missingFields.push('State/Province');
    if (!formData.postcode) missingFields.push('Postcode');

    // Validate correspondence address if different
    if (formData.hasDifferentCorrespondenceAddress) {
      if (!formData.correspondenceStreetAndHouseNumber) missingFields.push('Correspondence street and house number');
      if (!formData.correspondenceCity) missingFields.push('Correspondence city');
      if (!formData.correspondenceCountry) missingFields.push('Correspondence country');
      if (!formData.correspondenceStateProvince) missingFields.push('Correspondence state/province');
      if (!formData.correspondencePostcode) missingFields.push('Correspondence postcode');
    }

    return {
      isValid: missingFields.length === 0,
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
      let errorMessage = 'Please complete all required fields:\n\n';
      validation.missingFields.forEach(field => {
        errorMessage += `• ${field}\n`;
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

      console.log("Saving address data:", requestData);

      const res = await axios.post(
        API_URL,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Address saved successfully!");
      setAddressSaved(true);
      
      const newPercentage = calculateCompletion();
      setCompletionPercentage(33 + Math.round(newPercentage * 0.33));
      
      // Navigate to firsteducation page (Step 4)
      let targetPath;
      if (location.pathname.includes('/address')) {
        // Replace /address with /firsteducation
        targetPath = location.pathname.replace('/address', '/firsteducation');
      } else {
        targetPath = '/firstyear/dashboard/application/firsteducation';
      }
      
      console.log("Navigating to:", targetPath);
      navigate(targetPath);
      
    } catch (error) {
      console.error("Save error:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to save address");
      alert("Failed to save address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // UPLOAD NATIONAL ID (matches backend endpoint)
  // =====================================================
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPG, PNG, and PDF are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const data = new FormData();
    data.append("file", file);

    setUploading(true);

    try {
      // Use the correct endpoint for national ID upload
      const res = await axios.post(`${API_URL}/upload/nationalId`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("National ID uploaded successfully!");

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
      alert(error.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // REMOVE NATIONAL ID (matches backend endpoint)
  // =====================================================
  const removeNationalId = async () => {
    try {
      const res = await axios.delete(`${API_URL}/files/nationalId`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("National ID removed successfully!");

      setFormData((prev) => ({
        ...prev,
        nationalIdFile: null,
      }));
    } catch (error) {
      console.error("Remove error:", error.response?.data || error.message);
      alert("Failed to remove national ID");
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

  const completionPercentageValue = calculateCompletion();

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
  // MAIN UI (GUS PORTAL STYLE)
  // =====================================================
  return (
    <div className="application-address">
      {/* Header with Application ID */}
      <div className="address-header">
        <div className="header-left">
          <h1>BA Communication Design</h1>
          <div className="application-id">APPLICATION ID - UEG0000104849</div>
        </div>
        <div className="progress-badge">{33 + Math.round(completionPercentageValue * 0.33)}% Completed</div>
      </div>

      {/* Navigation Steps */}
      <div className="application-steps">
        <div className="step completed">
          <span className="step-number">✓</span>
          <span className="step-name">Study programme</span>
        </div>
        <div className="step completed">
          <span className="step-number">✓</span>
          <span className="step-name">Applicant Details</span>
        </div>
        <div className="step active">
          <span className="step-number">3</span>
          <span className="step-name">Address</span>
        </div>
        <div className="step">
          <span className="step-number">4</span>
          <span className="step-name">Entrance qualification</span>
        </div>
        <div className="step">
          <span className="step-number">5</span>
          <span className="step-name">Higher Education</span>
        </div>
        <div className="step">
          <span className="step-number">6</span>
          <span className="step-name">Documents</span>
        </div>
        <div className="step">
          <span className="step-number">7</span>
          <span className="step-name">Special Needs</span>
        </div>
        <div className="step">
          <span className="step-number">8</span>
          <span className="step-name">Declaration</span>
        </div>
        <div className="step">
          <span className="step-number">9</span>
          <span className="step-name">Review</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError('')} className="error-close-btn">×</button>
        </div>
      )}

      {/* Main Form Container */}
      <div className="address-form-container">
        <div className="form-header">
          <h2>Permanent Home Address</h2>
          <p className="form-subtitle">
            Please provide your permanent address as it appears on official documents
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); saveAddress(); }}>
          {/* Permanent Address Section */}
          <div className="form-section">
            <div className="form-group">
              <label className="form-label" htmlFor="careOf">C/o</label>
              <input
                type="text"
                id="careOf"
                className="form-input"
                value={formData.careOf}
                onChange={(e) => handleInputChange("careOf", e.target.value)}
                placeholder="Care of (if applicable)"
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
                className="form-input"
                value={formData.streetAndHouseNumber}
                onChange={(e) => handleInputChange("streetAndHouseNumber", e.target.value)}
                placeholder="Enter street name and house number"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required" htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  className="form-input"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Enter city"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="country">Country</label>
                <select
                  id="country"
                  className="form-select"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  required
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
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required" htmlFor="stateProvince">
                  State / province
                </label>
                <select
                  id="stateProvince"
                  className="form-select"
                  value={formData.stateProvince}
                  onChange={(e) => handleInputChange("stateProvince", e.target.value)}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select State</option>
                  {formData.country === 'India' && (
                    <>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="West Bengal">West Bengal</option>
                    </>
                  )}
                  {formData.country === 'USA' && (
                    <>
                      <option value="California">California</option>
                      <option value="New York">New York</option>
                      <option value="Texas">Texas</option>
                      <option value="Florida">Florida</option>
                      <option value="Illinois">Illinois</option>
                    </>
                  )}
                  {formData.country === 'UK' && (
                    <>
                      <option value="England">England</option>
                      <option value="Scotland">Scotland</option>
                      <option value="Wales">Wales</option>
                      <option value="Northern Ireland">Northern Ireland</option>
                    </>
                  )}
                  {!['India', 'USA', 'UK'].includes(formData.country) && (
                    <option value="Other">Other</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="postcode">Postcode</label>
                <input
                  type="text"
                  id="postcode"
                  className="form-input"
                  value={formData.postcode}
                  onChange={(e) => handleInputChange("postcode", e.target.value)}
                  placeholder="Enter postal code"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Correspondence Address Section */}
          <div className="form-section">
            <div className="form-group full-width">
              <label className="form-label required">
                Address for correspondence (if different from home address)?
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="correspondenceAddress"
                    value="yes"
                    checked={formData.hasDifferentCorrespondenceAddress === true}
                    onChange={() => handleCorrespondenceToggle('yes')}
                    disabled={isSubmitting}
                  />
                  <span>Yes</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="correspondenceAddress"
                    value="no"
                    checked={formData.hasDifferentCorrespondenceAddress === false}
                    onChange={() => handleCorrespondenceToggle('no')}
                    disabled={isSubmitting}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {formData.hasDifferentCorrespondenceAddress && (
              <div className="correspondence-address-fields">
                <div className="form-group">
                  <label className="form-label" htmlFor="correspondenceCareOf">C/o</label>
                  <input
                    type="text"
                    id="correspondenceCareOf"
                    className="form-input"
                    value={formData.correspondenceCareOf}
                    onChange={(e) => handleInputChange("correspondenceCareOf", e.target.value)}
                    placeholder="Care of (if applicable)"
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
                    className="form-input"
                    value={formData.correspondenceStreetAndHouseNumber}
                    onChange={(e) => handleInputChange("correspondenceStreetAndHouseNumber", e.target.value)}
                    placeholder="Enter street name and house number"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required" htmlFor="correspondenceCity">City</label>
                    <input
                      type="text"
                      id="correspondenceCity"
                      className="form-input"
                      value={formData.correspondenceCity}
                      onChange={(e) => handleInputChange("correspondenceCity", e.target.value)}
                      placeholder="Enter city"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required" htmlFor="correspondenceCountry">Country</label>
                    <select
                      id="correspondenceCountry"
                      className="form-select"
                      value={formData.correspondenceCountry}
                      onChange={(e) => handleInputChange("correspondenceCountry", e.target.value)}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select Country</option>
                      <option value="India">India</option>
                      <option value="USA">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="Germany">Germany</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required" htmlFor="correspondenceStateProvince">
                      State / province
                    </label>
                    <input
                      type="text"
                      id="correspondenceStateProvince"
                      className="form-input"
                      value={formData.correspondenceStateProvince}
                      onChange={(e) => handleInputChange("correspondenceStateProvince", e.target.value)}
                      placeholder="Enter state/province"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required" htmlFor="correspondencePostcode">Postcode</label>
                    <input
                      type="text"
                      id="correspondencePostcode"
                      className="form-input"
                      value={formData.correspondencePostcode}
                      onChange={(e) => handleInputChange("correspondencePostcode", e.target.value)}
                      placeholder="Enter postal code"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* National ID Upload Section */}
          <div className="form-section">
            <h3 className="section-heading">National ID (Optional)</h3>
            
            <div className="form-group">
              <label className="form-label">Upload National ID</label>
              <div className="upload-area">
                <p className="upload-instruction">Drop file to attach, or browse</p>
                <p className="upload-hint">jpg, jpeg, pdf and png. Please upload a file that is less than 5 MB.</p>
                
                {formData.nationalIdFile ? (
                  <div className="file-info">
                    <i className="fas fa-file-pdf file-icon"></i>
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
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
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
                      {uploading ? 'Uploading...' : 'Browse'}
                    </button>
                  </>
                )}
              </div>
              {!addressSaved && (
                <p className="upload-warning">
                  Please save your address before uploading documents.
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
              ← Back
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Next →'}
            </button>
          </div>

          <div className="language-selector">
            <span>English ▼</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationAddress;