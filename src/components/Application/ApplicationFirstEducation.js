import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from '../../api/axiosInstance';
import { useNavigate, useLocation } from "react-router-dom";
import "./ApplicationFirstEducation.css";



const ApplicationFirstEducation = ({ onInputChange }) => {
  const navigate   = useNavigate();
  const location   = useLocation();


  const [isLoading,            setIsLoading]            = useState(true);
  const [isSubmitting,         setIsSubmitting]         = useState(false);
  const [error,                setError]                = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(66);

  const [wasEnrolled,         setWasEnrolled]         = useState(null);
  const [isCurrentlyEnrolled, setIsCurrentlyEnrolled] = useState(null);

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
    },
  ]);

  // ─────────────────────────────────────────────────────────────
  // FIX 3: useEffect-based resume mapping instead of calling
  // onInputChange inside setState callbacks (avoids the
  // "Cannot update a component while rendering" warning)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!onInputChange) return;

    const primary = educationEntries.length > 0 ? educationEntries[0] : {};

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
    onInputChange("score",               primary.remarks           || "");
    onInputChange("standardStudyPeriod", primary.standardStudyPeriod || "");
    onInputChange("educationCity",       primary.city              || "");
    onInputChange("wasEnrolled",         wasEnrolled);
    onInputChange("isCurrentlyEnrolled", isCurrentlyEnrolled);
    onInputChange("educationEntries",    educationEntries);
  }, [educationEntries, wasEnrolled, isCurrentlyEnrolled]);

  // ─────────────────────────────────────────────────────────────
  // FETCH education data on mount
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    fetchEducationData();
  } else {
    setError("No authentication token found");
    setIsLoading(false);
  }
}, []);

  const fetchEducationData = async () => {
    try {
      setIsLoading(true);
    const res = await axiosInstance.get('/api/application/education');

      if (res.data.success && res.data.educationInfo) {
        const data = res.data.educationInfo;

        setWasEnrolled(data.wasEnrolled);
        setIsCurrentlyEnrolled(data.isCurrentlyEnrolled);

        if (data.educationEntries && data.educationEntries.length > 0) {
          const entriesWithIds = data.educationEntries.map((entry, index) => ({
            ...entry,
            startDate: entry.startDate
              ? new Date(entry.startDate).toISOString().split("T")[0]
              : "",
            endDate: entry.endDate
              ? new Date(entry.endDate).toISOString().split("T")[0]
              : "",
            id: entry.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now() + index),
          }));
          setEducationEntries(entriesWithIds);
        }

        if (data.completionPercentage) {
          setCompletionPercentage(data.completionPercentage);
        }
      }
    } catch (err) {
      console.error("Fetch education error:", err);
      if (err.response?.status !== 404) {
        setError("Failed to load education data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLE ENTRY FIELD CHANGE
  // ─────────────────────────────────────────────────────────────
  const handleEntryChange = useCallback((id, field, value) => {
    setEducationEntries(prev =>
      prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry)
    );
  }, []);

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
      },
    ]);
  };

  const removeEntry = (id) => {
    if (educationEntries.length > 1) {
      setEducationEntries(prev => prev.filter(entry => entry.id !== id));
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
      validation.missingFields.forEach(field => { errorMessage += `- ${field}\n`; });
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

      const res = await axiosInstance.post('/api/application/education', payload);

      if (res.data.success) {
        setCompletionPercentage(75);
        return true;
      }
    } catch (err) {
      console.error("Save education error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to save education data");
      alert("Failed to save education information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
    return false;
  };

  // ─────────────────────────────────────────────────────────────
  // NAVIGATION - UPDATED to go to /scores instead of /documents
  // ─────────────────────────────────────────────────────────────
  const handleNext = async () => {
    const saved = await saveEducation();
    if (saved) {
      let targetPath;
      if (location.pathname.includes("/firsteducation")) {
        targetPath = location.pathname.replace("/firsteducation", "/scores");
      } else {
        targetPath = "/firstyear/dashboard/application/scores";
      }
      navigate(targetPath);
    }
  };

  const handleBack = () => {
    let backPath;
    if (location.pathname.includes("/firsteducation")) {
      backPath = location.pathname.replace("/firsteducation", "/specialneeds");
    } else {
      backPath = "/firstyear/dashboard/application/specialneeds";
    }
    navigate(backPath);
  };

  // ─────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="applicationfirsteducation">
        <div className="applicationfirsteducation-loading-container">
          <div className="applicationfirsteducation-loading-spinner"></div>
          <p className="applicationfirsteducation-loading-text">Loading your education information...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="applicationfirsteducation">

      {/* Header */}
      <div className="applicationfirsteducation-page-header">
        <div className="applicationfirsteducation-header-content">
          <h1 className="applicationfirsteducation-page-title">BA Communication Design</h1>
          <div className="applicationfirsteducation-application-id">APPLICATION ID - UEG0000104849</div>
        </div>
        <div className="applicationfirsteducation-progress-indicator">
          <span className="applicationfirsteducation-progress-value">{completionPercentage}%</span>
          <span className="applicationfirsteducation-progress-label">Completed</span>
        </div>
      </div>

      {/* Navigation Steps */}
      <div className="applicationfirsteducation-steps-container">
        {[
          "Study programme",
          "Applicant Details",
          "Address",
          "Entrance qualification",
          "Special Needs",
          "Higher Education",
          "Test Scores",
          "Documents",
          "Declaration",
          "Review",
        ].map((step, index) => {
          let stepClass = "applicationfirsteducation-step-item";
          if (index < 5) stepClass += " completed";
          if (index === 5) stepClass += " active";
          return (
            <div key={step} className={stepClass}>
              <span className="applicationfirsteducation-step-marker">{index < 5 ? "✓" : index + 1}</span>
              <span className="applicationfirsteducation-step-text">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="applicationfirsteducation-error-notice">
          <span className="applicationfirsteducation-error-message-text">{error}</span>
          <button onClick={() => setError("")} className="applicationfirsteducation-error-dismiss">×</button>
        </div>
      )}

      {/* Main Form */}
      <div className="applicationfirsteducation-form-wrapper">
        <div className="applicationfirsteducation-form-header-section">
          <h2 className="applicationfirsteducation-form-main-title">Higher Education</h2>
          <p className="applicationfirsteducation-form-description">
            Please fill in the details below, if you have studied at university level before —
            with or without graduating. Do not withhold any information, even if you did not
            attend any classes and/or did not pass any exams.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>

          {/* Was Enrolled? */}
          <div className="applicationfirsteducation-form-card">
            <h3 className="applicationfirsteducation-card-title">University/College education 1</h3>

            <div className="applicationfirsteducation-field-group">
              <label className="applicationfirsteducation-field-label required">
                I was enrolled at an institute of higher education at an earlier date
              </label>
              <div className="applicationfirsteducation-radio-options">
                <label className="applicationfirsteducation-radio-choice">
                  <input
                    type="radio"
                    name="wasEnrolled"
                    value="yes"
                    checked={wasEnrolled === true}
                    onChange={() => setWasEnrolled(true)}
                    disabled={isSubmitting}
                  />
                  <span className="applicationfirsteducation-radio-text">Yes</span>
                </label>
                <label className="applicationfirsteducation-radio-choice">
                  <input
                    type="radio"
                    name="wasEnrolled"
                    value="no"
                    checked={wasEnrolled === false}
                    onChange={() => {
                      setWasEnrolled(false);
                      setEducationEntries([{
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
                      }]);
                    }}
                    disabled={isSubmitting}
                  />
                  <span className="applicationfirsteducation-radio-text">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Education Entries */}
          {wasEnrolled === true && (
            <>
              {educationEntries.map((entry, index) => (
                <div key={entry.id} className="applicationfirsteducation-form-card applicationfirsteducation-education-card">
                  <div className="applicationfirsteducation-card-header">
                    <h3 className="applicationfirsteducation-card-title">University/College education {index + 1}</h3>
                    {educationEntries.length > 1 && (
                      <button
                        type="button"
                        className="applicationfirsteducation-remove-button"
                        onClick={() => removeEntry(entry.id)}
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="applicationfirsteducation-form-grid">

                    {/* Country of initial registration */}
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label required">Country of initial registration</label>
                      <select
                        className="applicationfirsteducation-input-select"
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
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label required">Semester of initial registration</label>
                      <select
                        className="applicationfirsteducation-input-select"
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
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label required">Entry type</label>
                      <select
                        className="applicationfirsteducation-input-select"
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
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label required">Degree</label>
                      <select
                        className="applicationfirsteducation-input-select"
                        value={entry.degree}
                        onChange={(e) => handleEntryChange(entry.id, "degree", e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select</option>
                        <option value="bachelor">Bachelor</option>
                        <option value="master">Master</option>
                        <option value="diploma">Diploma</option>
                        <option value="phd">PhD</option>
                      </select>
                    </div>

                    {/* Specialisation */}
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label required">Specialisation</label>
                      <select
                        className="applicationfirsteducation-input-select"
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
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label required">Standard study period</label>
                      <select
                        className="applicationfirsteducation-input-select"
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
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label">Institution Name</label>
                      <input
                        type="text"
                        className="applicationfirsteducation-input-field"
                        value={entry.institutionName || ""}
                        onChange={(e) => handleEntryChange(entry.id, "institutionName", e.target.value)}
                        placeholder="Enter institution name"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* City */}
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label">City</label>
                      <input
                        type="text"
                        className="applicationfirsteducation-input-field"
                        value={entry.city || ""}
                        onChange={(e) => handleEntryChange(entry.id, "city", e.target.value)}
                        placeholder="Enter city"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Start Date */}
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label">Start Date</label>
                      <input
                        type="date"
                        className="applicationfirsteducation-input-field"
                        value={entry.startDate || ""}
                        onChange={(e) => handleEntryChange(entry.id, "startDate", e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* End Date */}
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label">End Date</label>
                      <input
                        type="date"
                        className="applicationfirsteducation-input-field"
                        value={entry.endDate || ""}
                        onChange={(e) => handleEntryChange(entry.id, "endDate", e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Remarks / Score */}
                    <div className="applicationfirsteducation-input-group full-width">
                      <label className="applicationfirsteducation-input-label">Remarks / Score</label>
                      <textarea
                        className="applicationfirsteducation-input-textarea"
                        value={entry.remarks || ""}
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
              <div className="applicationfirsteducation-add-entry-container">
                <button
                  type="button"
                  className="applicationfirsteducation-add-button"
                  onClick={addNewEntry}
                  disabled={isSubmitting}
                >
                  + Add Another Entry
                </button>
              </div>
            </>
          )}

          {/* Currently Enrolled? */}
          <div className="applicationfirsteducation-form-card">
            <h3 className="applicationfirsteducation-card-title">Further information</h3>

            <div className="applicationfirsteducation-field-group">
              <label className="applicationfirsteducation-field-label required">
                Are you currently enrolled in another university?
              </label>
              <div className="applicationfirsteducation-radio-options">
                <label className="applicationfirsteducation-radio-choice">
                  <input
                    type="radio"
                    name="currentlyEnrolled"
                    value="yes"
                    checked={isCurrentlyEnrolled === true}
                    onChange={() => setIsCurrentlyEnrolled(true)}
                    disabled={isSubmitting}
                  />
                  <span className="applicationfirsteducation-radio-text">Yes</span>
                </label>
                <label className="applicationfirsteducation-radio-choice">
                  <input
                    type="radio"
                    name="currentlyEnrolled"
                    value="no"
                    checked={isCurrentlyEnrolled === false}
                    onChange={() => setIsCurrentlyEnrolled(false)}
                    disabled={isSubmitting}
                  />
                  <span className="applicationfirsteducation-radio-text">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="applicationfirsteducation-action-buttons">
            <button
              type="button"
              className="applicationfirsteducation-button button-secondary"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </button>

            <button
              type="submit"
              className="applicationfirsteducation-button button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>Save and Continue</>
              )}
            </button>
          </div>

          <div className="applicationfirsteducation-language-selector">
            <button type="button" className="applicationfirsteducation-language-button">
              <span>English</span>
              <span className="applicationfirsteducation-dropdown-arrow">▼</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ApplicationFirstEducation;