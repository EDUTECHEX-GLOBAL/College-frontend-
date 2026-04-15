import React, { useState, useEffect } from "react";
import "./ApplicationSpecialNeeds.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// SVG Icon Components
const Icon = {
  Check: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Close: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ArrowLeft: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  ArrowRight: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ThumbsUp: ({ size = 40, color = "#0891b2" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  Loader: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  ),
  Info: ({ size = 20, color = "#0891b2" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  CheckCircle: ({ size = 20, color = "#10b981" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

const ApplicationSpecialNeeds = ({ formData, onInputChange, onNext, onPrev }) => {
    const token = localStorage.getItem("token");

    const [hasSpecialNeeds, setHasSpecialNeeds] = useState(
        formData.hasSpecialNeeds || "no"
    );
    const [description, setDescription] = useState(
        formData.specialNeedsDescription || ""
    );
    const [needs, setNeeds] = useState(
        formData.specialNeeds || []
    );
    const [otherDescription, setOtherDescription] = useState(
        formData.otherNeedsDescription || ""
    );
    const [errors, setErrors]               = useState({});
    const [loading, setLoading]             = useState(false);
    const [fetchLoading, setFetchLoading]   = useState(false);
    const [showSuccess, setShowSuccess]     = useState(false);
    const [saveSuccess, setSaveSuccess]     = useState(false);

    const [selectedArrangements, setSelectedArrangements] = useState(
        formData.requiredArrangements || []
    );

    // Special needs categories
    const specialNeedsCategories = [
        { id: "physical",  label: "Physical Disability" },
        { id: "visual",    label: "Visual Impairment" },
        { id: "hearing",   label: "Hearing Impairment" },
        { id: "learning",  label: "Learning Disability" },
        { id: "medical",   label: "Medical Condition" },
        { id: "mental",    label: "Mental Health" },
        { id: "temporary", label: "Temporary Condition" },
        { id: "other",     label: "Other" }
    ];

    // Examination arrangements
    const arrangements = [
        { id: "extraTime",    label: "Extra Time" },
        { id: "separateRoom", label: "Separate Room" },
        { id: "reader",       label: "Reader/Assistant" },
        { id: "scribe",       label: "Scribe" },
        { id: "largePrint",   label: "Large Print Papers" },
        { id: "braille",      label: "Braille Papers" },
        { id: "computer",     label: "Computer Access" },
        { id: "breaks",       label: "Rest Breaks" }
    ];

    const mapToResumeFields = ({
        hasSpecialNeedsVal,
        descriptionVal,
        arrangementsVal,
        needsVal,
        otherDescVal,
    }) => {
        onInputChange("hasDisability",      hasSpecialNeedsVal === "yes");
        onInputChange("disabilityType",     hasSpecialNeedsVal === "yes" ? descriptionVal : "");
        onInputChange("requiresAssistance", hasSpecialNeedsVal === "yes" && arrangementsVal.length > 0);
        onInputChange("specialNeedsList",   hasSpecialNeedsVal === "yes" ? needsVal : []);
        onInputChange("otherNeedsDescription", hasSpecialNeedsVal === "yes" ? otherDescVal : "");
    };

    useEffect(() => {
        if (!token) return;

        const loadSpecialNeedsData = async () => {
            try {
                setFetchLoading(true);
                const res = await axios.get(`${API_URL}/api/application/special-needs`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data?.data) {
                    const data = res.data.data;

                    const loadedHasNeeds   = data.hasSpecialNeeds        || "no";
                    const loadedDesc       = data.specialNeedsDescription || "";
                    const loadedNeeds      = data.specialNeeds            || [];
                    const loadedArrange    = data.requiredArrangements    || [];
                    const loadedOtherDesc  = data.otherNeedsDescription   || "";

                    setHasSpecialNeeds(loadedHasNeeds);
                    setDescription(loadedDesc);
                    setNeeds(loadedNeeds);
                    setSelectedArrangements(loadedArrange);
                    setOtherDescription(loadedOtherDesc);

                    onInputChange("hasSpecialNeeds",          loadedHasNeeds);
                    onInputChange("specialNeedsDescription",  loadedDesc);
                    onInputChange("specialNeeds",             loadedNeeds);
                    onInputChange("requiredArrangements",     loadedArrange);
                    onInputChange("otherNeedsDescription",    loadedOtherDesc);

                    mapToResumeFields({
                        hasSpecialNeedsVal: loadedHasNeeds,
                        descriptionVal:     loadedDesc,
                        arrangementsVal:    loadedArrange,
                        needsVal:           loadedNeeds,
                        otherDescVal:       loadedOtherDesc,
                    });
                }
            } catch (err) {
                console.error("Failed to load special needs data", err);
            } finally {
                setFetchLoading(false);
            }
        };

        loadSpecialNeedsData();
    }, [token]);

    const handleHasSpecialNeedsChange = (value) => {
        setHasSpecialNeeds(value);
        onInputChange("hasSpecialNeeds", value);

        if (value === "no") {
            setDescription("");
            setNeeds([]);
            setSelectedArrangements([]);
            setOtherDescription("");
            onInputChange("specialNeedsDescription", "");
            onInputChange("specialNeeds",            []);
            onInputChange("requiredArrangements",    []);
            onInputChange("otherNeedsDescription",   "");
            setErrors({});

            mapToResumeFields({
                hasSpecialNeedsVal: "no",
                descriptionVal:     "",
                arrangementsVal:    [],
                needsVal:           [],
                otherDescVal:       "",
            });
        } else {
            onInputChange("hasDisability", true);
        }
    };

    const toggleNeed = (needId) => {
        const updatedNeeds = needs.includes(needId)
            ? needs.filter(id => id !== needId)
            : [...needs, needId];

        setNeeds(updatedNeeds);
        onInputChange("specialNeeds",    updatedNeeds);
        onInputChange("specialNeedsList", updatedNeeds);

        if (needId === "other" && needs.includes("other")) {
            setOtherDescription("");
            onInputChange("otherNeedsDescription", "");
        }

        if (errors.needs) setErrors(prev => ({ ...prev, needs: "" }));
    };

    const toggleArrangement = (arrangementId) => {
        const updated = selectedArrangements.includes(arrangementId)
            ? selectedArrangements.filter(id => id !== arrangementId)
            : [...selectedArrangements, arrangementId];

        setSelectedArrangements(updated);
        onInputChange("requiredArrangements", updated);
        onInputChange("requiresAssistance", updated.length > 0);
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setDescription(value);
        onInputChange("specialNeedsDescription", value);
        onInputChange("disabilityType", value);

        if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
    };

    const handleOtherDescriptionChange = (e) => {
        const value = e.target.value;
        setOtherDescription(value);
        onInputChange("otherNeedsDescription", value);
    };

    const validateForm = () => {
        const newErrors = {};

        if (hasSpecialNeeds === "yes") {
            if (needs.length === 0)
                newErrors.needs = "Please select at least one category";
            if (!description.trim())
                newErrors.description = "Please provide details about your condition(s)";
            if (needs.includes("other") && !otherDescription.trim())
                newErrors.other = "Please specify your other needs";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveSpecialNeeds = async () => {
        if (!token) {
            alert("Student session expired. Please login again.");
            return false;
        }

        setLoading(true);

        const payload = {
            hasSpecialNeeds,
            specialNeeds:             hasSpecialNeeds === "yes" ? needs            : [],
            specialNeedsDescription:  hasSpecialNeeds === "yes" ? description      : "",
            requiredArrangements:     hasSpecialNeeds === "yes" ? selectedArrangements : [],
            otherNeedsDescription:    hasSpecialNeeds === "yes" && needs.includes("other") ? otherDescription : ""
        };

        try {
            const response = await axios.post(
                `${API_URL}/api/application/special-needs`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.success) {
                setLoading(false);
                setSaveSuccess(true);
                setShowSuccess(true);

                mapToResumeFields({
                    hasSpecialNeedsVal: hasSpecialNeeds,
                    descriptionVal:     description,
                    arrangementsVal:    selectedArrangements,
                    needsVal:           needs,
                    otherDescVal:       otherDescription,
                });

                localStorage.setItem("specialNeedsData", JSON.stringify(payload));
                window.dispatchEvent(new Event("applicationUpdated"));

                setTimeout(() => setShowSuccess(false), 3000);
                return true;
            }
        } catch (error) {
            console.error("Save error:", error);
            setLoading(false);
            alert(error.response?.data?.message || "Failed to save special needs details.");
            return false;
        }
    };

    const handleNext = async () => {
        if (!validateForm()) return;
        const saved = await saveSpecialNeeds();
        if (saved) onNext();
    };

    if (fetchLoading) {
        return (
            <div className="applicationspecialneeds-container">
                <div className="applicationspecialneeds-loading-state">
                    <div className="applicationspecialneeds-loading-spinner"></div>
                    <p>Loading your information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="applicationspecialneeds-container">

            {/* Success Toast */}
            {showSuccess && (
                <div className="applicationspecialneeds-success-toast">
                    <Icon.CheckCircle size={20} color="white" />
                    <span>Special needs information saved successfully!</span>
                </div>
            )}

            {/* Loading Overlay */}
            {loading && (
                <div className="applicationspecialneeds-loading-overlay">
                    <div className="applicationspecialneeds-loading-spinner"></div>
                    <p>Saving your information...</p>
                </div>
            )}

            <div className="applicationspecialneeds-content">

                {/* Header */}
                <div className="applicationspecialneeds-section-header">
                    <div className="applicationspecialneeds-header-left">
                        <div className="applicationspecialneeds-section-number">4</div>
                        <div>
                            <h2 className="applicationspecialneeds-section-title">Students With Special Needs</h2>
                            <p className="applicationspecialneeds-section-subtitle">
                                Please let us know if you have any medical conditions or special requirements
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="applicationspecialneeds-form-card">

                    {/* Yes / No Question */}
                    <div className="applicationspecialneeds-question-section">
                        <label className="applicationspecialneeds-question-label">
                            Do you have any medical condition that may require special examination arrangements?
                        </label>

                        <div className="applicationspecialneeds-yes-no-group">
                            <button
                                type="button"
                                className={`applicationspecialneeds-yes-no-btn ${hasSpecialNeeds === "yes" ? "active" : ""}`}
                                onClick={() => handleHasSpecialNeedsChange("yes")}
                            >
                                <Icon.Check size={14} color={hasSpecialNeeds === "yes" ? "white" : "#0891b2"} />
                                Yes
                            </button>

                            <button
                                type="button"
                                className={`applicationspecialneeds-yes-no-btn ${hasSpecialNeeds === "no" ? "active" : ""}`}
                                onClick={() => handleHasSpecialNeedsChange("no")}
                            >
                                <Icon.Close size={14} color={hasSpecialNeeds === "no" ? "white" : "#0891b2"} />
                                No
                            </button>
                        </div>
                    </div>

                    {/* Special Needs Details */}
                    {hasSpecialNeeds === "yes" && (
                        <div className="applicationspecialneeds-form">

                            {/* Categories */}
                            <div className="applicationspecialneeds-form-section">
                                <h3 className="applicationspecialneeds-section-heading">Select Categories</h3>
                                <p className="applicationspecialneeds-section-description">
                                    Please select all categories that apply to you
                                </p>

                                <div className="applicationspecialneeds-categories-grid">
                                    {specialNeedsCategories.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            className={`applicationspecialneeds-category-card ${needs.includes(category.id) ? "selected" : ""}`}
                                            onClick={() => toggleNeed(category.id)}
                                        >
                                            <span className="applicationspecialneeds-category-label">{category.label}</span>
                                            {needs.includes(category.id) && (
                                                <span className="applicationspecialneeds-check-mark">
                                                    <Icon.Check size={12} color="white" />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {errors.needs && (
                                    <div className="applicationspecialneeds-error-message">{errors.needs}</div>
                                )}
                            </div>

                            {/* Other Description */}
                            {needs.includes("other") && (
                                <div className="applicationspecialneeds-form-section">
                                    <h3 className="applicationspecialneeds-section-heading">Specify Other Needs</h3>
                                    <textarea
                                        className={`applicationspecialneeds-form-textarea ${errors.other ? "error" : ""}`}
                                        value={otherDescription}
                                        onChange={handleOtherDescriptionChange}
                                        rows="3"
                                        placeholder="Please specify your other needs or conditions..."
                                    />
                                    {errors.other && (
                                        <div className="applicationspecialneeds-error-message">{errors.other}</div>
                                    )}
                                </div>
                            )}

                            {/* Detailed Description */}
                            <div className="applicationspecialneeds-form-section">
                                <h3 className="applicationspecialneeds-section-heading">Detailed Description</h3>
                                <p className="applicationspecialneeds-section-description">
                                    Please provide detailed information about your condition(s) and how it may affect your studies
                                </p>
                                <textarea
                                    className={`applicationspecialneeds-form-textarea ${errors.description ? "error" : ""}`}
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    rows="5"
                                    placeholder="Describe your condition(s), any medications, treatments, or support you currently receive..."
                                />
                                {errors.description && (
                                    <div className="applicationspecialneeds-error-message">{errors.description}</div>
                                )}
                            </div>

                            {/* Required Arrangements */}
                            <div className="applicationspecialneeds-form-section">
                                <h3 className="applicationspecialneeds-section-heading">Required Arrangements</h3>
                                <p className="applicationspecialneeds-section-description">
                                    Select any special arrangements you may need during examinations
                                </p>

                                <div className="applicationspecialneeds-arrangements-grid">
                                    {arrangements.map((arrangement) => (
                                        <button
                                            key={arrangement.id}
                                            type="button"
                                            className={`applicationspecialneeds-arrangement-card ${selectedArrangements.includes(arrangement.id) ? "selected" : ""}`}
                                            onClick={() => toggleArrangement(arrangement.id)}
                                        >
                                            <span className="applicationspecialneeds-arrangement-label">{arrangement.label}</span>
                                            {selectedArrangements.includes(arrangement.id) && (
                                                <span className="applicationspecialneeds-check-mark">
                                                    <Icon.Check size={12} color="white" />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Confidentiality Note */}
                            <div className="applicationspecialneeds-info-box">
                                <div className="applicationspecialneeds-info-icon">
                                    <Icon.Info size={24} color="#0891b2" />
                                </div>
                                <div className="applicationspecialneeds-info-content">
                                    <h4>Confidentiality</h4>
                                    <p>
                                        All information provided will be kept confidential and only shared with relevant
                                        disability services and examination offices to ensure appropriate accommodations.
                                    </p>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* No Needs Message */}
                    {hasSpecialNeeds === "no" && (
                        <div className="applicationspecialneeds-no-needs-message">
                            <div className="applicationspecialneeds-message-icon">
                                <Icon.ThumbsUp size={48} color="#0891b2" />
                            </div>
                            <h3>No Special Needs Selected</h3>
                            <p>You've indicated that you don't require any special arrangements.</p>
                            <p className="applicationspecialneeds-note">
                                You can always update this information later by contacting the disability support office.
                            </p>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="applicationspecialneeds-form-actions">
                        <button
                            className="applicationspecialneeds-btn-secondary"
                            onClick={onPrev}
                            disabled={loading}
                        >
                            <Icon.ArrowLeft size={16} color="#334155" />
                            Back
                        </button>

                        {saveSuccess ? (
                            <div className="applicationspecialneeds-save-success">
                                <Icon.CheckCircle size={16} color="#10b981" />
                                Saved Successfully
                            </div>
                        ) : (
                            <button
                                className="applicationspecialneeds-btn-primary"
                                onClick={handleNext}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="applicationspecialneeds-spinner-small"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Next Step
                                        <Icon.ArrowRight size={16} color="white" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                </div>

                {/* Progress Indicator */}
                <div className="applicationspecialneeds-progress-steps">
                    <div className="applicationspecialneeds-progress-step completed">
                        <span className="applicationspecialneeds-step-number">1</span>
                        <span className="applicationspecialneeds-step-label">Personal</span>
                    </div>
                    <div className="applicationspecialneeds-progress-step completed">
                        <span className="applicationspecialneeds-step-number">2</span>
                        <span className="applicationspecialneeds-step-label">Education</span>
                    </div>
                    <div className="applicationspecialneeds-progress-step completed">
                        <span className="applicationspecialneeds-step-number">3</span>
                        <span className="applicationspecialneeds-step-label">Program</span>
                    </div>
                    <div className="applicationspecialneeds-progress-step active">
                        <span className="applicationspecialneeds-step-number">4</span>
                        <span className="applicationspecialneeds-step-label">Special Needs</span>
                    </div>
                    <div className="applicationspecialneeds-progress-step">
                        <span className="applicationspecialneeds-step-number">5</span>
                        <span className="applicationspecialneeds-step-label">Review</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ApplicationSpecialNeeds;