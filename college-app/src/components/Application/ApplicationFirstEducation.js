import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./ApplicationFirstEducation.css";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

// ─────────────────────────────────────────────────────────────────
//  NOTE: onInputChange prop ADDED so this component can write
//  education data into the central formData used by Resume.js
// ─────────────────────────────────────────────────────────────────
const ApplicationFirstEducation = ({ onInputChange }) => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const token       = localStorage.getItem("token");

  const [isLoading,            setIsLoading]            = useState(true);
  const [isSubmitting,         setIsSubmitting]         = useState(false);
  const [error,                setError]                = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(66);

  // Was the student enrolled before?
  const [wasEnrolled,          setWasEnrolled]          = useState(null);
  // Is the student currently enrolled elsewhere?
  const [isCurrentlyEnrolled,  setIsCurrentlyEnrolled]  = useState(null);

  // Education entries (supports multiple)
  const [educationEntries, setEducationEntries] = useState([
    {
      id:                            crypto.randomUUID ? crypto.randomUUID() : Date.now() + 1,
      countryOfInitialRegistration:  "",
      semesterOfInitialRegistration: "",
      entryType:                     "",
      degree:                        "",
      specialisation:                "",
      standardStudyPeriod:           "",
      city:                          "",
      remarks:                       "",
      institutionName:               "",
      startDate:                     "",
      endDate:                       "",
      isCurrentEnrollment:           false,
    }
  ]);

  // ─────────────────────────────────────────────────────────────
  // HELPER — Map education fields → Resume.js field names
  // Always uses the FIRST entry as the "primary" qualification.
  //
  //  degree                        → qualificationLevel
  //  institutionName               → institutionName
  //  specialisation                → boardUniversity
  //  countryOfInitialRegistration  → countryOfStudy
  //  startDate (year part)         → startYear
  //  endDate   (year part)         → endYear
  //  remarks                       → score
  //  standardStudyPeriod           → standardStudyPeriod
  //  wasEnrolled                   → wasEnrolled
  //  isCurrentlyEnrolled           → isCurrentlyEnrolled
  // ─────────────────────────────────────────────────────────────
  const mapToResumeFields = (entries, enrolled) => {
    // Only map if onInputChange exists (prop provided by parent)
    if (!onInputChange) return;

    // Use the first entry as the primary education for Resume
    const primary = entries && entries.length > 0 ? entries[0] : {};

    onInputChange("qualificationLevel",  primary.degree                       || "");
    onInputChange("institutionName",     primary.institutionName              || "");
    onInputChange("boardUniversity",     primary.specialisation               || "");
    onInputChange("countryOfStudy",      primary.countryOfInitialRegistration || "");
    onInputChange("startYear",           primary.startDate
                                           ? primary.startDate.split("-")[0]
                                           : "");
    onInputChange("endYear",             primary.endDate
                                           ? primary.endDate.split("-")[0]
                                           : "");
    onInputChange("score",               primary.remarks                      || "");
    onInputChange("standardStudyPeriod", primary.standardStudyPeriod          || "");
    onInputChange("educationCity",       primary.city                         || "");

    // Additional context fields
    onInputChange("wasEnrolled",         enrolled);
    onInputChange("isCurrentlyEnrolled", isCurrentlyEnrolled);

    // Store all entries for reference
    onInputChange("educationEntries",    entries);
  };

  // ─────────────────────────────────────────────────────────────
  // FETCH education data on mount
  // ─────────────────────────────────────────────────────────────
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

          // ── RESUME DATA MAPPING on load ──────────────────────
          mapToResumeFields(entriesWithIds, data.wasEnrolled);
          // ────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // HANDLE ENTRY FIELD CHANGE
  // Also does live Resume mapping on every keystroke/selection
  // ─────────────────────────────────────────────────────────────
  const handleEntryChange = (id, field, value) => {
    setEducationEntries(prev => {
      const updated = prev.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      );

      // ── RESUME DATA MAPPING — live update as student types ──
      mapToResumeFields(updated, wasEnrolled);
      // ────────────────────────────────────────────────────────

      return updated;
    });
  };

  // ─────────────────────────────────────────────────────────────
  // ADD / REMOVE ENTRY
  // ─────────────────────────────────────────────────────────────
  const addNewEntry = () => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random();
    setEducationEntries(prev => [
      ...prev,
      {
        id:                            newId,
        countryOfInitialRegistration:  "",
        semesterOfInitialRegistration: "",
        entryType:                     "",
        degree:                        "",
        specialisation:                "",
        standardStudyPeriod:           "",
        city:                          "",
        remarks:                       "",
        institutionName:               "",
        startDate:                     "",
        endDate:                       "",
        isCurrentEnrollment:           false,
      }
    ]);
  };

  const removeEntry = (id) => {
    if (educationEntries.length > 1) {
      setEducationEntries(prev => {
        const updated = prev.filter(entry => entry.id !== id);
        // Re-map after removal so Resume reflects current first entry
        mapToResumeFields(updated, wasEnrolled);
        return updated;
      });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // VALIDATE
  // ─────────────────────────────────────────────────────────────
  const validateForm = () => {
    const missingFields = [];

    if (wasEnrolled === null) {
      missingFields.push("Please indicate if you were enrolled at an institute of higher education");
      return { isValid: false, missingFields };
    }

    if (wasEnrolled === true) {
      educationEntries.forEach((entry, index) => {
        if (!entry.countryOfInitialRegistration)
          missingFields.push(`Entry ${index + 1}: Country of initial registration`);
        if (!entry.semesterOfInitialRegistration)
          missingFields.push(`Entry ${index + 1}: Semester of initial registration`);
        if (!entry.entryType)
          missingFields.push(`Entry ${index + 1}: Entry type`);
        if (!entry.degree)
          missingFields.push(`Entry ${index + 1}: Degree`);
        if (!entry.specialisation)
          missingFields.push(`Entry ${index + 1}: Specialisation`);
        if (!entry.standardStudyPeriod)
          missingFields.push(`Entry ${index + 1}: Standard study period`);
      });
    }

    if (isCurrentlyEnrolled === null)
      missingFields.push("Please indicate if you are currently enrolled in another university");

    return { isValid: missingFields.length === 0, missingFields };
  };

  // ─────────────────────────────────────────────────────────────
  // SAVE to backend
  // ─────────────────────────────────────────────────────────────
  const saveEducation = async () => {
    if (isSubmitting) return false;

    const validation = validateForm();
    if (!validation.isValid) {
      let errorMessage = "Please complete all required fields:\n\n";
      validation.missingFields.forEach(field => { errorMessage += `• ${field}\n`; });
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

      const res = await axios.post(
        `${BASE_URL}/api/application/education`,
        payload,
        {
          headers: {
            Authorization:  `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        setCompletionPercentage(75);

        // ── RESUME DATA MAPPING after successful save ────────
        mapToResumeFields(educationEntries, wasEnrolled);
        // ────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────
  const handleNext = async () => {
    const saved = await saveEducation();
    if (saved) {
      let targetPath;
      if (location.pathname.includes("/firsteducation")) {
        targetPath = location.pathname.replace("/firsteducation", "/documents");
      } else {
        targetPath = "/firstyear/dashboard/application/documents";
      }
      navigate(targetPath);
    }
  };

  const handleBack = () => {
    let backPath;
    if (location.pathname.includes("/firsteducation")) {
      backPath = location.pathname.replace("/firsteducation", "/address");
    } else {
      backPath = "/firstyear/dashboard/application/address";
    }
    navigate(backPath);
  };

  // ─────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="app-education">

      {/* ── Header ── */}
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

      {/* ── Navigation Steps ── */}
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
          let stepClass = "step-item";
          if (index < 3) stepClass += " completed";
          if (index === 3) stepClass += " active";
          return (
            <div key={step} className={stepClass}>
              <span className="step-marker">{index < 3 ? "✓" : index + 1}</span>
              <span className="step-text">{step}</span>
            </div>
          );
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="error-notice">
          <span className="error-icon">⚠️</span>
          <span className="error-message-text">{error}</span>
          <button onClick={() => setError("")} className="error-dismiss">×</button>
        </div>
      )}

      {/* ── Main Form ── */}
      <div className="form-wrapper">
        <div className="form-header-section">
          <h2 className="form-main-title">Higher Education</h2>
          <p className="form-description">
            Please fill in the details below, if you have studied at university level before —
            with or without graduating. Do not withhold any information, even if you did not
            attend any classes and/or did not pass any exams.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>

          {/* ── Was Enrolled? ── */}
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
                    onChange={() => {
                      setWasEnrolled(true);
                      if (onInputChange) onInputChange("wasEnrolled", true);
                    }}
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
                      if (onInputChange) onInputChange("wasEnrolled", false);

                      const emptyEntry = {
                        id:                            crypto.randomUUID ? crypto.randomUUID() : Date.now() + 1,
                        countryOfInitialRegistration:  "",
                        semesterOfInitialRegistration: "",
                        entryType:                     "",
                        degree:                        "",
                        specialisation:                "",
                        standardStudyPeriod:           "",
                        city:                          "",
                        remarks:                       "",
                        institutionName:               "",
                        startDate:                     "",
                        endDate:                       "",
                        isCurrentEnrollment:           false,
                      };
                      setEducationEntries([emptyEntry]);

                      // Clear Resume education fields when "No" selected
                      if (onInputChange) {
                        onInputChange("qualificationLevel",  "");
                        onInputChange("institutionName",     "");
                        onInputChange("boardUniversity",     "");
                        onInputChange("countryOfStudy",      "");
                        onInputChange("startYear",           "");
                        onInputChange("endYear",             "");
                        onInputChange("score",               "");
                        onInputChange("educationEntries",    []);
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <span className="radio-text">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* ── Education Entries ── */}
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

                    {/* Country of initial registration */}
                    <div className="input-group">
                      <label className="input-label required">Country of initial registration</label>
                      <select
                        className="input-select"
                        value={entry.countryOfInitialRegistration}
                        onChange={(e) => handleEntryChange(entry.id, "countryOfInitialRegistration", e.target.value)}
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

                    {/* Semester of initial registration */}
                    <div className="input-group">
                      <label className="input-label required">Semester of initial registration</label>
                      <select
                        className="input-select"
                        value={entry.semesterOfInitialRegistration}
                        onChange={(e) => handleEntryChange(entry.id, "semesterOfInitialRegistration", e.target.value)}
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

                    {/* Entry type */}
                    <div className="input-group">
                      <label className="input-label required">Entry type</label>
                      <select
                        className="input-select"
                        value={entry.entryType}
                        onChange={(e) => handleEntryChange(entry.id, "entryType", e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select</option>
                        <option value="freshman">Freshman</option>
                        <option value="transfer">Transfer</option>
                        <option value="exchange">Exchange</option>
                        <option value="graduate">Graduate</option>
                      </select>
                    </div>

                    {/* Degree */}
                    <div className="input-group">
                      <label className="input-label required">Degree</label>
                      <select
                        className="input-select"
                        value={entry.degree}
                        onChange={(e) => handleEntryChange(entry.id, "degree", e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select</option>
                        <option value="Bachelor's Degree">Bachelor</option>
                        <option value="Master's Degree">Master</option>
                        <option value="Diploma">Diploma</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>

                    {/* Specialisation */}
                    <div className="input-group">
                      <label className="input-label required">Specialisation</label>
                      <select
                        className="input-select"
                        value={entry.specialisation}
                        onChange={(e) => handleEntryChange(entry.id, "specialisation", e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Business">Business</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Arts">Arts</option>
                        <option value="Design">Design</option>
                      </select>
                    </div>

                    {/* Standard study period */}
                    <div className="input-group">
                      <label className="input-label required">Standard study period</label>
                      <select
                        className="input-select"
                        value={entry.standardStudyPeriod}
                        onChange={(e) => handleEntryChange(entry.id, "standardStudyPeriod", e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select</option>
                        <option value="2 years">2 years</option>
                        <option value="3 years">3 years</option>
                        <option value="4 years">4 years</option>
                        <option value="5 years">5 years</option>
                      </select>
                    </div>

                    {/* Institution Name */}
                    <div className="input-group">
                      <label className="input-label">Institution Name</label>
                      <input
                        type="text"
                        className="input-field"
                        value={entry.institutionName}
                        onChange={(e) => handleEntryChange(entry.id, "institutionName", e.target.value)}
                        placeholder="Enter institution name"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* City */}
                    <div className="input-group">
                      <label className="input-label">City</label>
                      <input
                        type="text"
                        className="input-field"
                        value={entry.city}
                        onChange={(e) => handleEntryChange(entry.id, "city", e.target.value)}
                        placeholder="Enter city"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Start Date */}
                    <div className="input-group">
                      <label className="input-label">Start Date</label>
                      <input
                        type="date"
                        className="input-field"
                        value={entry.startDate}
                        onChange={(e) => handleEntryChange(entry.id, "startDate", e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* End Date */}
                    <div className="input-group">
                      <label className="input-label">End Date</label>
                      <input
                        type="date"
                        className="input-field"
                        value={entry.endDate}
                        onChange={(e) => handleEntryChange(entry.id, "endDate", e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Remarks / Score */}
                    <div className="input-group full-width">
                      <label className="input-label">Remarks / Score</label>
                      <textarea
                        className="input-textarea"
                        value={entry.remarks}
                        onChange={(e) => handleEntryChange(entry.id, "remarks", e.target.value)}
                        placeholder="Enter remarks, score or grade (e.g. 78%, First Class)"
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

          {/* ── Currently Enrolled? ── */}
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
                    onChange={() => {
                      setIsCurrentlyEnrolled(true);
                      if (onInputChange) onInputChange("isCurrentlyEnrolled", true);
                    }}
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
                    onChange={() => {
                      setIsCurrentlyEnrolled(false);
                      if (onInputChange) onInputChange("isCurrentlyEnrolled", false);
                    }}
                    disabled={isSubmitting}
                  />
                  <span className="radio-text">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* ── Navigation Buttons ── */}
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
                <><span className="spinner-small"></span>Saving...</>
              ) : (
                <>Save & Continue<span className="button-icon">→</span></>
              )}
            </button>
          </div>

          <div className="language-selector">
            <button type="button" className="language-button">
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