import React, { useState, useEffect } from "react";
import "./ApplicationSpecialNeeds.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL ;

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
        { id: "physical",  label: "Physical Disability",  icon: "🦽" },
        { id: "visual",    label: "Visual Impairment",    icon: "👁️" },
        { id: "hearing",   label: "Hearing Impairment",   icon: "👂" },
        { id: "learning",  label: "Learning Disability",  icon: "📚" },
        { id: "medical",   label: "Medical Condition",    icon: "🏥" },
        { id: "mental",    label: "Mental Health",        icon: "🧠" },
        { id: "temporary", label: "Temporary Condition",  icon: "⏱️" },
        { id: "other",     label: "Other",                icon: "📝" }
    ];

    // Examination arrangements
    const arrangements = [
        { id: "extraTime",    label: "Extra Time",          icon: "⏰" },
        { id: "separateRoom", label: "Separate Room",       icon: "🚪" },
        { id: "reader",       label: "Reader/Assistant",    icon: "👤" },
        { id: "scribe",       label: "Scribe",              icon: "✍️" },
        { id: "largePrint",   label: "Large Print Papers",  icon: "🔍" },
        { id: "braille",      label: "Braille Papers",      icon: "⠃"  },
        { id: "computer",     label: "Computer Access",     icon: "💻" },
        { id: "breaks",       label: "Rest Breaks",         icon: "☕" }
    ];

    // ─────────────────────────────────────────────────────────────
    // HELPER — map SpecialNeeds fields → Resume.js field names
    // Called after every successful load/save so Resume always
    // has the latest values in central formData.
    //
    //  hasSpecialNeeds ("yes"/"no")  → hasDisability      (bool)
    //  specialNeedsDescription       → disabilityType     (string)
    //  requiredArrangements.length   → requiresAssistance (bool)
    //  specialNeeds array            → specialNeedsList   (array)
    // ─────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────
    // LOAD existing data on mount
    // ─────────────────────────────────────────────────────────────
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

                    // Update local state
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

                    // Sync original field names to formData
                    onInputChange("hasSpecialNeeds",          loadedHasNeeds);
                    onInputChange("specialNeedsDescription",  loadedDesc);
                    onInputChange("specialNeeds",             loadedNeeds);
                    onInputChange("requiredArrangements",     loadedArrange);
                    onInputChange("otherNeedsDescription",    loadedOtherDesc);

                    // ── RESUME DATA MAPPING on load ──────────────────────
                    mapToResumeFields({
                        hasSpecialNeedsVal: loadedHasNeeds,
                        descriptionVal:     loadedDesc,
                        arrangementsVal:    loadedArrange,
                        needsVal:           loadedNeeds,
                        otherDescVal:       loadedOtherDesc,
                    });
                    // ────────────────────────────────────────────────────
                }
            } catch (err) {
                console.error("Failed to load special needs data", err);
            } finally {
                setFetchLoading(false);
            }
        };

        loadSpecialNeedsData();
    }, [token]);

    // ─────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────
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

            // ── RESUME DATA MAPPING — clear when "No" selected ──
            mapToResumeFields({
                hasSpecialNeedsVal: "no",
                descriptionVal:     "",
                arrangementsVal:    [],
                needsVal:           [],
                otherDescVal:       "",
            });
            // ────────────────────────────────────────────────────
        } else {
            // ── RESUME DATA MAPPING — set hasDisability true ────
            onInputChange("hasDisability", true);
            // ────────────────────────────────────────────────────
        }
    };

    const toggleNeed = (needId) => {
        const updatedNeeds = needs.includes(needId)
            ? needs.filter(id => id !== needId)
            : [...needs, needId];

        setNeeds(updatedNeeds);
        onInputChange("specialNeeds",    updatedNeeds);
        onInputChange("specialNeedsList", updatedNeeds);  // ← Resume field

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

        // ── RESUME DATA MAPPING — live update requiresAssistance ──
        onInputChange("requiresAssistance", updated.length > 0);
        // ──────────────────────────────────────────────────────────
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setDescription(value);
        onInputChange("specialNeedsDescription", value);

        // ── RESUME DATA MAPPING — live update disabilityType ──
        onInputChange("disabilityType", value);
        // ──────────────────────────────────────────────────────

        if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
    };

    const handleOtherDescriptionChange = (e) => {
        const value = e.target.value;
        setOtherDescription(value);
        onInputChange("otherNeedsDescription", value);
    };

    // ─────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────
    // SAVE TO API
    // ─────────────────────────────────────────────────────────────
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

                // ── RESUME DATA MAPPING after successful save ────────
                mapToResumeFields({
                    hasSpecialNeedsVal: hasSpecialNeeds,
                    descriptionVal:     description,
                    arrangementsVal:    selectedArrangements,
                    needsVal:           needs,
                    otherDescVal:       otherDescription,
                });
                // ────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────
    // NEXT STEP
    // ─────────────────────────────────────────────────────────────
    const handleNext = async () => {
        if (!validateForm()) return;
        const saved = await saveSpecialNeeds();
        if (saved) onNext();
    };

    // ─────────────────────────────────────────────────────────────
    // LOADING STATE
    // ─────────────────────────────────────────────────────────────
    if (fetchLoading) {
        return (
            <div className="special-needs-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading your information...</p>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="special-needs-container">

            {/* Success Toast */}
            {showSuccess && (
                <div className="success-toast">
                    <span className="success-icon">✓</span>
                    <span>Special needs information saved successfully!</span>
                </div>
            )}

            {/* Loading Overlay */}
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Saving your information...</p>
                </div>
            )}

            <div className="special-needs-content">

                {/* ── Header ── */}
                <div className="section-header">
                    <div className="header-left">
                        <div className="section-number">4</div>
                        <div>
                            <h2 className="section-title">Students With Special Needs</h2>
                            <p className="section-subtitle">
                                Please let us know if you have any medical conditions or special requirements
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Main Form Card ── */}
                <div className="form-card">

                    {/* Yes / No Question */}
                    <div className="question-section">
                        <label className="question-label">
                            Do you have any medical condition that may require special examination arrangements?
                        </label>

                        <div className="yes-no-group">
                            <button
                                type="button"
                                className={`yes-no-btn ${hasSpecialNeeds === "yes" ? "active" : ""}`}
                                onClick={() => handleHasSpecialNeedsChange("yes")}
                            >
                                <span className="btn-icon">✓</span>
                                Yes
                            </button>

                            <button
                                type="button"
                                className={`yes-no-btn ${hasSpecialNeeds === "no" ? "active" : ""}`}
                                onClick={() => handleHasSpecialNeedsChange("no")}
                            >
                                <span className="btn-icon">✗</span>
                                No
                            </button>
                        </div>
                    </div>

                    {/* ── Special Needs Details (shown only when "yes") ── */}
                    {hasSpecialNeeds === "yes" && (
                        <div className="special-needs-form">

                            {/* Categories */}
                            <div className="form-section">
                                <h3 className="section-heading">Select Categories</h3>
                                <p className="section-description">
                                    Please select all categories that apply to you
                                </p>

                                <div className="categories-grid">
                                    {specialNeedsCategories.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            className={`category-card ${needs.includes(category.id) ? "selected" : ""}`}
                                            onClick={() => toggleNeed(category.id)}
                                        >
                                            <span className="category-icon">{category.icon}</span>
                                            <span className="category-label">{category.label}</span>
                                            {needs.includes(category.id) && (
                                                <span className="check-mark">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {errors.needs && (
                                    <div className="error-message">{errors.needs}</div>
                                )}
                            </div>

                            {/* Other Description */}
                            {needs.includes("other") && (
                                <div className="form-section">
                                    <h3 className="section-heading">Specify Other Needs</h3>
                                    <textarea
                                        className={`form-textarea ${errors.other ? "error" : ""}`}
                                        value={otherDescription}
                                        onChange={handleOtherDescriptionChange}
                                        rows="3"
                                        placeholder="Please specify your other needs or conditions..."
                                    />
                                    {errors.other && (
                                        <div className="error-message">{errors.other}</div>
                                    )}
                                </div>
                            )}

                            {/* Detailed Description */}
                            <div className="form-section">
                                <h3 className="section-heading">Detailed Description</h3>
                                <p className="section-description">
                                    Please provide detailed information about your condition(s) and how it may affect your studies
                                </p>
                                <textarea
                                    className={`form-textarea ${errors.description ? "error" : ""}`}
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    rows="5"
                                    placeholder="Describe your condition(s), any medications, treatments, or support you currently receive..."
                                />
                                {errors.description && (
                                    <div className="error-message">{errors.description}</div>
                                )}
                            </div>

                            {/* Required Arrangements */}
                            <div className="form-section">
                                <h3 className="section-heading">Required Arrangements</h3>
                                <p className="section-description">
                                    Select any special arrangements you may need during examinations
                                </p>

                                <div className="arrangements-grid">
                                    {arrangements.map((arrangement) => (
                                        <button
                                            key={arrangement.id}
                                            type="button"
                                            className={`arrangement-card ${selectedArrangements.includes(arrangement.id) ? "selected" : ""}`}
                                            onClick={() => toggleArrangement(arrangement.id)}
                                        >
                                            <span className="arrangement-icon">{arrangement.icon}</span>
                                            <span className="arrangement-label">{arrangement.label}</span>
                                            {selectedArrangements.includes(arrangement.id) && (
                                                <span className="check-mark">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Confidentiality Note */}
                            <div className="info-box">
                                <div className="info-content">
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
                        <div className="no-needs-message">
                            <div className="message-icon">👍</div>
                            <h3>No Special Needs Selected</h3>
                            <p>You've indicated that you don't require any special arrangements.</p>
                            <p className="note">
                                You can always update this information later by contacting the disability support office.
                            </p>
                        </div>
                    )}

                    {/* ── Form Actions ── */}
                    <div className="form-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={onPrev}
                            disabled={loading}
                        >
                            <span className="btn-icon">←</span>
                            Back
                        </button>

                        {saveSuccess ? (
                            <div className="save-success">
                                <span className="success-icon">✓</span>
                                Saved Successfully
                            </div>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={handleNext}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="loading-spinner-small"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Next Step
                                        <span className="btn-icon">→</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                </div>
                {/* end form-card */}

                {/* ── Progress Indicator ── */}
                <div className="progress-indicator">
                    <div className="progress-step completed"><span className="step-number">1</span><span className="step-label">Personal</span></div>
                    <div className="progress-step completed"><span className="step-number">2</span><span className="step-label">Education</span></div>
                    <div className="progress-step completed"><span className="step-number">3</span><span className="step-label">Program</span></div>
                    <div className="progress-step active">   <span className="step-number">4</span><span className="step-label">Special Needs</span></div>
                    <div className="progress-step">          <span className="step-number">5</span><span className="step-label">Review</span></div>
                </div>

            </div>
        </div>
    );
};

export default ApplicationSpecialNeeds;