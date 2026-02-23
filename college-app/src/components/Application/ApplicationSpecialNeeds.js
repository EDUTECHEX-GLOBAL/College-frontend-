import React, { useState, useEffect } from "react";
import "./ApplicationSpecialNeeds.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ApplicationSpecialNeeds = ({ formData, onInputChange, onNext, onPrev }) => {
    const studentId = localStorage.getItem("studentId");
    const token = localStorage.getItem("token");

    const [hasSpecialNeeds, setHasSpecialNeeds] = useState(
        formData.hasSpecialNeeds || "no"
    );
    const [description, setDescription] = useState(
        formData.specialNeedsDescription || ""
    );
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    /* =========================
       LOAD EXISTING DATA
    ========================== */
    useEffect(() => {
        if (!studentId || !token) return;

        axios
            .get(
                `${API_URL}/api/application/special-needs/student/${studentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .then((res) => {
                if (res.data?.data) {
                    setHasSpecialNeeds(res.data.data.hasSpecialNeeds || "no");
                    setDescription(res.data.data.specialNeedsDescription || "");

                    onInputChange(
                        "hasSpecialNeeds",
                        res.data.data.hasSpecialNeeds || "no"
                    );
                    onInputChange(
                        "specialNeedsDescription",
                        res.data.data.specialNeedsDescription || ""
                    );
                }
            })
            .catch(() => {
                // no existing data
            });
    }, [studentId, token]);

    /* =========================
       HANDLERS
    ========================== */
    const handleHasSpecialNeedsChange = (value) => {
        setHasSpecialNeeds(value);
        onInputChange("hasSpecialNeeds", value);

        if (value === "no") {
            setDescription("");
            onInputChange("specialNeedsDescription", "");
            setErrors({});
        }
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setDescription(value);
        onInputChange("specialNeedsDescription", value);

        if (errors.description) {
            setErrors((prev) => ({ ...prev, description: "" }));
        }
    };

    /* =========================
       VALIDATION
    ========================== */
    const validateForm = () => {
        const newErrors = {};

        if (hasSpecialNeeds === "yes" && !description.trim()) {
            newErrors.description = "Please describe your condition(s)";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /* =========================
       SAVE TO API
    ========================== */
    const saveSpecialNeeds = async () => {
        if (!studentId) {
            alert("Student session expired. Please login again.");
            return false;
        }

        setLoading(true);

        try {
            await axios.post(
                `${API_URL}/api/application/special-needs/student/${studentId}`,
                {
                    hasSpecialNeeds,
                    specialNeedsDescription:
                        hasSpecialNeeds === "yes" ? description : "",
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setLoading(false);
            return true;
        } catch (error) {
            setLoading(false);
            alert("Failed to save special needs details.");
            return false;
        }
    };

    /* =========================
       NEXT STEP
    ========================== */
    const handleNext = async () => {
        if (!validateForm()) return;

        const saved = await saveSpecialNeeds();
        if (saved) onNext();
    };

    /* =========================
       UI
    ========================== */
    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-number">4</div>
                <div>
                    <h2 className="section-title">Students With Special Needs</h2>
                    <p className="section-subtitle">
                        Please let us know if you have any medical conditions or special requirements
                    </p>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">
                    Do you have any medical condition that may require special examination arrangements?
                </label>

                <div className="yes-no-group">
                    <button
                        type="button"
                        className={`yes-no-btn ${hasSpecialNeeds === "yes" ? "active" : ""}`}
                        onClick={() => handleHasSpecialNeedsChange("yes")}
                    >
                        Yes
                    </button>

                    <button
                        type="button"
                        className={`yes-no-btn ${hasSpecialNeeds === "no" ? "active" : ""}`}
                        onClick={() => handleHasSpecialNeedsChange("no")}
                    >
                        No
                    </button>
                </div>
            </div>

            {hasSpecialNeeds === "yes" && (
                <div className="form-group">
                    <textarea
                        className={`form-textarea ${errors.description ? "error" : ""}`}
                        value={description}
                        onChange={handleDescriptionChange}
                        rows="5"
                    />
                    {errors.description && (
                        <div className="error-message">{errors.description}</div>
                    )}
                </div>
            )}

            <div className="form-actions">
                <button className="btn btn-secondary" onClick={onPrev}>
                    Back
                </button>
                <button className="btn btn-primary" onClick={handleNext} disabled={loading}>
                    {loading ? "Saving..." : "Next"}
                </button>
            </div>
        </div>
    );
};

export default ApplicationSpecialNeeds;