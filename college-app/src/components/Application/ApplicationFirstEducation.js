import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./ApplicationFirstEducation.css";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const ApplicationFirstEducation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(66);
  
  // State for higher education enrollment
  const [wasEnrolled, setWasEnrolled] = useState(null);
  
  // State for multiple education entries with unique IDs
  const [educationEntries, setEducationEntries] = useState([
    {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now() + 1,
      countryOfInitialRegistration: "",
      semesterOfInitialRegistration: "",
      entryType: "",
      degree: "",
      specialisation: "",
      standardStudyPeriod: "",
      city: "",
      remarks: "",
      institutionName: "",
      startDate: "",
      endDate: "",
      isCurrentEnrollment: false,
    }
  ]);

  // State for current enrollment
  const [isCurrentlyEnrolled, setIsCurrentlyEnrolled] = useState(null);

  // =====================================================
  // FETCH EDUCATION DATA ON LOAD
  // =====================================================
  useEffect(() => {
    if (token) {
      fetchEducationData();
    } else {
      setError("No authentication token found");
      setIsLoading(false);
    }
  }, [token]);

  const fetchEducationData = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${BASE_URL}/api/application/education`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.educationInfo) {
        const data = res.data.educationInfo;
        
        setWasEnrolled(data.wasEnrolled);
        setIsCurrentlyEnrolled(data.isCurrentlyEnrolled);
        
        if (data.educationEntries && data.educationEntries.length > 0) {
          const entriesWithIds = data.educationEntries.map((entry, index) => ({
            ...entry,
            id: entry.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now() + index)
          }));
          setEducationEntries(entriesWithIds);
        }
        
        if (data.completionPercentage) {
          setCompletionPercentage(data.completionPercentage);
        }
      }
    } catch (error) {
      console.error("Fetch education error:", error);
      if (error.response?.status !== 404) {
        setError("Failed to load education data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // HANDLE ENTRY CHANGE
  // =====================================================
  const handleEntryChange = (id, field, value) => {
    setEducationEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  // =====================================================
  // ADD NEW EDUCATION ENTRY
  // =====================================================
  const addNewEntry = () => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random();
    setEducationEntries(prev => [
      ...prev,
      {
        id: newId,
        countryOfInitialRegistration: "",
        semesterOfInitialRegistration: "",
        entryType: "",
        degree: "",
        specialisation: "",
        standardStudyPeriod: "",
        city: "",
        remarks: "",
        institutionName: "",
        startDate: "",
        endDate: "",
        isCurrentEnrollment: false,
      }
    ]);
  };

  // =====================================================
  // REMOVE EDUCATION ENTRY
  // =====================================================
  const removeEntry = (id) => {
    if (educationEntries.length > 1) {
      setEducationEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================
  const validateForm = () => {
    const missingFields = [];

    if (wasEnrolled === null) {
      missingFields.push("Please indicate if you were enrolled at an institute of higher education");
      return { isValid: false, missingFields };
    }

    if (wasEnrolled === true) {
      educationEntries.forEach((entry, index) => {
        if (!entry.countryOfInitialRegistration) {
          missingFields.push(`Entry ${index + 1}: Country of initial registration`);
        }
        if (!entry.semesterOfInitialRegistration) {
          missingFields.push(`Entry ${index + 1}: Semester of initial registration`);
        }
        if (!entry.entryType) {
          missingFields.push(`Entry ${index + 1}: Entry type`);
        }
        if (!entry.degree) {
          missingFields.push(`Entry ${index + 1}: Degree`);
        }
        if (!entry.specialisation) {
          missingFields.push(`Entry ${index + 1}: Specialisation`);
        }
        if (!entry.standardStudyPeriod) {
          missingFields.push(`Entry ${index + 1}: Standard study period`);
        }
      });
    }

    if (isCurrentlyEnrolled === null) {
      missingFields.push("Please indicate if you are currently enrolled in another university");
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  // =====================================================
  // SAVE EDUCATION DATA
  // =====================================================
  const saveEducation = async () => {
    if (isSubmitting) return;

    const validation = validateForm();
    if (!validation.isValid) {
      let errorMessage = 'Please complete all required fields:\n\n';
      validation.missingFields.forEach(field => {
        errorMessage += `• ${field}\n`;
      });
      alert(errorMessage);
      return false;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const entriesToSave = educationEntries.map(({ id, ...rest }) => rest);

      const payload = {
        wasEnrolled,
        isCurrentlyEnrolled,
        educationEntries: wasEnrolled ? entriesToSave : [],
      };

      console.log("📤 Sending payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/api/application/education`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        setCompletionPercentage(75);
        return true;
      }
    } catch (error) {
      console.error("❌ Save education error:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to save education data");
      alert("Failed to save education information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
    return false;
  };

  // =====================================================
  // HANDLE NEXT
  // =====================================================
  const handleNext = async () => {
    const saved = await saveEducation();
    if (saved) {
      let targetPath;
      if (location.pathname.includes('/firsteducation')) {
        targetPath = location.pathname.replace('/firsteducation', '/documents');
      } else {
        targetPath = '/firstyear/dashboard/application/documents';
      }
      navigate(targetPath);
    }
  };

  // =====================================================
  // HANDLE BACK
  // =====================================================
  const handleBack = () => {
    let backPath;
    if (location.pathname.includes('/firsteducation')) {
      backPath = location.pathname.replace('/firsteducation', '/address');
    } else {
      backPath = '/firstyear/dashboard/application/address';
    }
    navigate(backPath);
  };

  // =====================================================
  // LOADING STATE
  // =====================================================
  if (isLoading) {
    return (
      <div className="app-education">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your education information...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <div className="app-education">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">BA Communication Design</h1>
          <div className="application-id">APPLICATION ID - UEG0000104849</div>
        </div>
        <div className="progress-indicator">
          <span className="progress-value">{completionPercentage}%</span>
          <span className="progress-label">Completed</span>
        </div>
      </div>

      {/* Navigation Steps */}
      <div className="steps-container">
        {[
          "Study programme",
          "Applicant Details",
          "Address",
          "Entrance qualification",
          "Higher Education",
          "Documents",
          "Special Needs",
          "Declaration",
          "Review"
        ].map((step, index) => {
          const stepNumber = index + 1;
          let stepClass = "step-item";
          if (index < 3) stepClass += " completed";
          if (index === 3) stepClass += " active";
          
          return (
            <div key={step} className={stepClass}>
              <span className="step-marker">
                {index < 3 ? "✓" : stepNumber}
              </span>
              <span className="step-text">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-notice">
          <span className="error-icon">⚠️</span>
          <span className="error-message-text">{error}</span>
          <button onClick={() => setError('')} className="error-dismiss">×</button>
        </div>
      )}

      {/* Main Form */}
      <div className="form-wrapper">
        <div className="form-header-section">
          <h2 className="form-main-title">Higher Education</h2>
          <p className="form-description">
            Please fill in the details below, if you have studied at university level before - 
            with or without graduating. Do not withhold any information, even if you did not 
            attend any classes and/or did not pass any exams.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
          {/* Enrollment Question */}
          <div className="form-card">
            <h3 className="card-title">University/College education 1</h3>
            
            <div className="field-group">
              <label className="field-label required">
                I was enrolled at an institute of higher education at an earlier date
              </label>
              <div className="radio-options">
                <label className="radio-choice">
                  <input
                    type="radio"
                    name="wasEnrolled"
                    value="yes"
                    checked={wasEnrolled === true}
                    onChange={() => setWasEnrolled(true)}
                    disabled={isSubmitting}
                  />
                  <span className="radio-text">Yes</span>
                </label>
                <label className="radio-choice">
                  <input
                    type="radio"
                    name="wasEnrolled"
                    value="no"
                    checked={wasEnrolled === false}
                    onChange={() => {
                      setWasEnrolled(false);
                      setEducationEntries([{
                        id: crypto.randomUUID ? crypto.randomUUID() : Date.now() + 1,
                        countryOfInitialRegistration: "",
                        semesterOfInitialRegistration: "",
                        entryType: "",
                        degree: "",
                        specialisation: "",
                        standardStudyPeriod: "",
                        city: "",
                        remarks: "",
                        institutionName: "",
                        startDate: "",
                        endDate: "",
                        isCurrentEnrollment: false,
                      }]);
                    }}
                    disabled={isSubmitting}
                  />
                  <span className="radio-text">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Education Entries */}
          {wasEnrolled === true && (
            <>
              {educationEntries.map((entry, index) => (
                <div key={entry.id} className="form-card education-card">
                  <div className="card-header">
                    <h3 className="card-title">University/College education {index + 1}</h3>
                    {educationEntries.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeEntry(entry.id)}
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-grid">
                    <div className="input-group">
                      <label className="input-label required">Country of initial registration</label>
                      <select
                        className="input-select"
                        value={entry.countryOfInitialRegistration}
                        onChange={(e) => handleEntryChange(entry.id, 'countryOfInitialRegistration', e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select</option>
                        <option value="India">India</option>
                        <option value="USA">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label required">Semester of initial registration</label>
                      <select
                        className="input-select"
                        value={entry.semesterOfInitialRegistration}
                        onChange={(e) => handleEntryChange(entry.id, 'semesterOfInitialRegistration', e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select</option>
                        <option value="Winter 2020">Winter 2020</option>
                        <option value="Summer 2021">Summer 2021</option>
                        <option value="Winter 2021">Winter 2021</option>
                        <option value="Summer 2022">Summer 2022</option>
                        <option value="Winter 2022">Winter 2022</option>
                        <option value="Summer 2023">Summer 2023</option>
                        <option value="Winter 2023">Winter 2023</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label required">Entry type</label>
                      <select
                        className="input-select"
                        value={entry.entryType}
                        onChange={(e) => handleEntryChange(entry.id, 'entryType', e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select</option>
                        <option value="freshman">Freshman</option>
                        <option value="transfer">Transfer</option>
                        <option value="exchange">Exchange</option>
                        <option value="graduate">Graduate</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label required">Degree</label>
                      <select
                        className="input-select"
                        value={entry.degree}
                        onChange={(e) => handleEntryChange(entry.id, 'degree', e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select</option>
                        <option value="bachelor">Bachelor</option>
                        <option value="master">Master</option>
                        <option value="diploma">Diploma</option>
                        <option value="phd">PhD</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label required">Specialisation</label>
                      <select
                        className="input-select"
                        value={entry.specialisation}
                        onChange={(e) => handleEntryChange(entry.id, 'specialisation', e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select</option>
                        <option value="computer-science">Computer Science</option>
                        <option value="business">Business</option>
                        <option value="engineering">Engineering</option>
                        <option value="arts">Arts</option>
                        <option value="design">Design</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label required">Standard study period</label>
                      <select
                        className="input-select"
                        value={entry.standardStudyPeriod}
                        onChange={(e) => handleEntryChange(entry.id, 'standardStudyPeriod', e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select</option>
                        <option value="2 years">2 years</option>
                        <option value="3 years">3 years</option>
                        <option value="4 years">4 years</option>
                        <option value="5 years">5 years</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">City</label>
                      <input
                        type="text"
                        className="input-field"
                        value={entry.city}
                        onChange={(e) => handleEntryChange(entry.id, 'city', e.target.value)}
                        placeholder="Enter city"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="input-group full-width">
                      <label className="input-label">Remark</label>
                      <textarea
                        className="input-textarea"
                        value={entry.remarks}
                        onChange={(e) => handleEntryChange(entry.id, 'remarks', e.target.value)}
                        placeholder="Enter the remarks if any"
                        rows="3"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Another Entry */}
              <div className="add-entry-container">
                <button
                  type="button"
                  className="add-button"
                  onClick={addNewEntry}
                  disabled={isSubmitting}
                >
                  <span className="add-icon">+</span>
                  Add Another Entry
                </button>
              </div>
            </>
          )}

          {/* Further Information */}
          <div className="form-card">
            <h3 className="card-title">Further information</h3>
            
            <div className="field-group">
              <label className="field-label required">
                Are you currently enrolled in another university?
              </label>
              <div className="radio-options">
                <label className="radio-choice">
                  <input
                    type="radio"
                    name="currentlyEnrolled"
                    value="yes"
                    checked={isCurrentlyEnrolled === true}
                    onChange={() => setIsCurrentlyEnrolled(true)}
                    disabled={isSubmitting}
                  />
                  <span className="radio-text">Yes</span>
                </label>
                <label className="radio-choice">
                  <input
                    type="radio"
                    name="currentlyEnrolled"
                    value="no"
                    checked={isCurrentlyEnrolled === false}
                    onChange={() => setIsCurrentlyEnrolled(false)}
                    disabled={isSubmitting}
                  />
                  <span className="radio-text">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="action-buttons">
            <button
              type="button"
              className="button button-secondary"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <span className="button-icon">←</span>
              Back
            </button>

            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small"></span>
                  Saving...
                </>
              ) : (
                <>
                  Save & Continue
                  <span className="button-icon">→</span>
                </>
              )}
            </button>
          </div>

          <div className="language-selector">
            <button className="language-button">
              <span>English</span>
              <span className="dropdown-arrow">▼</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationFirstEducation;