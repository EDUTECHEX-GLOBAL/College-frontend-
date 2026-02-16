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
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now() + 1, // Unique ID
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
          // Ensure each entry has a unique ID
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
      // Remove IDs before sending to backend
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
      // Navigate to Application Documents
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
      <div className="application-education">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your education information...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI (GUS PORTAL STYLE)
  // =====================================================
  return (
    <div className="application-education">
      {/* Header with Application ID */}
      <div className="education-header">
        <div className="header-left">
          <h1>BA Communication Design</h1>
          <div className="application-id">APPLICATION ID - UEG0000104849</div>
        </div>
        <div className="progress-badge">{completionPercentage}% Completed</div>
      </div>

      {/* Navigation Steps */}
      <div className="application-steps">
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
          let stepClass = "step";
          if (index < 3) stepClass += " completed";
          if (index === 3) stepClass += " active";
          
          return (
            <div key={step} className={stepClass}>
              <span className="step-number">
                {index < 3 ? "✓" : stepNumber}
              </span>
              <span className="step-name">{step}</span>
            </div>
          );
        })}
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
      <div className="education-form-container">
        <div className="form-header">
          <h2>Higher Education</h2>
          <p className="form-subtitle">
            Please fill in the details below, if you have studied at university level before - 
            with or without graduating. Do not withhold any information, even if you did not 
            attend any classes and/or did not pass any exams.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
          {/* Enrollment Question */}
          <div className="form-section">
            <h3 className="section-heading">University/College education 1</h3>
            
            <div className="form-group full-width">
              <label className="form-label required">
                I was enrolled at an institute of higher education at an earlier date
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="wasEnrolled"
                    value="yes"
                    checked={wasEnrolled === true}
                    onChange={() => setWasEnrolled(true)}
                    disabled={isSubmitting}
                  />
                  <span>Yes</span>
                </label>
                <label className="radio-label">
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
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Education Entries - Show only if wasEnrolled is true */}
          {wasEnrolled === true && (
            <>
              {educationEntries.map((entry, index) => (
                <div key={entry.id} className="form-section education-entry">
                  <div className="entry-header">
                    <h3 className="section-heading">University/College education {index + 1}</h3>
                    {educationEntries.length > 1 && (
                      <button
                        type="button"
                        className="remove-entry-btn"
                        onClick={() => removeEntry(entry.id)}
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label required">Country of initial registration</label>
                      <select
                        className="form-select"
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

                    <div className="form-group">
                      <label className="form-label required">Semester of initial registration</label>
                      <select
                        className="form-select"
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

                    <div className="form-group">
                      <label className="form-label required">Entry type</label>
                      <select
                        className="form-select"
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

                    <div className="form-group">
                      <label className="form-label required">Degree</label>
                      <select
                        className="form-select"
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

                    <div className="form-group">
                      <label className="form-label required">Specialisation</label>
                      <select
                        className="form-select"
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

                    <div className="form-group">
                      <label className="form-label required">Standard study period</label>
                      <select
                        className="form-select"
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

                    <div className="form-group">
                      <label className="form-label" htmlFor={`city-${entry.id}`}>City</label>
                      <input
                        type="text"
                        id={`city-${entry.id}`}
                        className="form-input"
                        value={entry.city}
                        onChange={(e) => handleEntryChange(entry.id, 'city', e.target.value)}
                        placeholder="Enter city"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label" htmlFor={`remarks-${entry.id}`}>Remark</label>
                      <textarea
                        id={`remarks-${entry.id}`}
                        className="form-textarea"
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

              {/* Add Another Entry Button */}
              <div className="add-entry-section">
                <button
                  type="button"
                  className="add-entry-btn"
                  onClick={addNewEntry}
                  disabled={isSubmitting}
                >
                  + Add Another Entry
                </button>
              </div>
            </>
          )}

          {/* Further Information */}
          <div className="form-section">
            <h3 className="section-heading">Further information</h3>
            
            <div className="form-group full-width">
              <label className="form-label required">
                Are you currently enrolled in another university?
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="currentlyEnrolled"
                    value="yes"
                    checked={isCurrentlyEnrolled === true}
                    onChange={() => setIsCurrentlyEnrolled(true)}
                    disabled={isSubmitting}
                  />
                  <span>Yes</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="currentlyEnrolled"
                    value="no"
                    checked={isCurrentlyEnrolled === false}
                    onChange={() => setIsCurrentlyEnrolled(false)}
                    disabled={isSubmitting}
                  />
                  <span>No</span>
                </label>
              </div>
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

export default ApplicationFirstEducation;