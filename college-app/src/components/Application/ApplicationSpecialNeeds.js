import React, { useState } from 'react';
import './ApplicationSpecialNeeds.css';

const ApplicationSpecialNeeds = ({ formData, onInputChange, onNext, onPrev }) => {
    const [hasSpecialNeeds, setHasSpecialNeeds] = useState(formData.hasSpecialNeeds || 'no');
    const [description, setDescription] = useState(formData.specialNeedsDescription || '');
    const [errors, setErrors] = useState({});

    const handleHasSpecialNeedsChange = (value) => {
        setHasSpecialNeeds(value);
        onInputChange('hasSpecialNeeds', value);
        
        if (value === 'no') {
            setDescription('');
            onInputChange('specialNeedsDescription', '');
            setErrors({});
        }
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setDescription(value);
        onInputChange('specialNeedsDescription', value);
        
        if (errors.description) {
            setErrors(prev => ({ ...prev, description: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (hasSpecialNeeds === 'yes' && !description.trim()) {
            newErrors.description = 'Please describe your condition(s)';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateForm()) {
            onNext();
        }
    };

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

            <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p className="info-text">
                    This information helps us make necessary accommodations for your studies and examinations. 
                    All information provided is confidential and will only be shared with relevant departments 
                    to ensure proper support.
                </p>
            </div>

            <div className="form-group">
                <label className="form-label">
                    Do you have any medical condition that may require special examination arrangements 
                    or may affect your attendance of the programme?
                </label>
                <div className="yes-no-group">
                    <button
                        type="button"
                        className={`yes-no-btn ${hasSpecialNeeds === 'yes' ? 'active' : ''}`}
                        onClick={() => handleHasSpecialNeedsChange('yes')}
                    >
                        Yes
                    </button>
                    <button
                        type="button"
                        className={`yes-no-btn ${hasSpecialNeeds === 'no' ? 'active' : ''}`}
                        onClick={() => handleHasSpecialNeedsChange('no')}
                    >
                        No
                    </button>
                </div>
            </div>

            {hasSpecialNeeds === 'yes' && (
                <div className="form-group description-section">
                    <label className="form-label required" htmlFor="specialNeedsDescription">
                        Please describe your condition(s) *
                    </label>
                    <textarea
                        id="specialNeedsDescription"
                        className={`form-textarea ${errors.description ? 'error' : ''}`}
                        value={description}
                        onChange={handleDescriptionChange}
                        placeholder="Please provide details about your condition, including any specific accommodations you may require for examinations or daily attendance..."
                        rows="5"
                    />
                    {errors.description && (
                        <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{errors.description}</span>
                        </div>
                    )}
                    <p className="field-helper">
                        Include details about any specific accommodations you may need, such as:
                        <br />• Extra time for examinations
                        <br />• Accessible seating arrangements
                        <br />• Assistive technology
                        <br />• Note-taking assistance
                        <br />• Flexible attendance requirements
                    </p>
                </div>
            )}

            {hasSpecialNeeds === 'yes' && description && (
                <div className="confidentiality-note">
                    <i className="fas fa-lock"></i>
                    <p>
                        This information will be kept confidential and shared only with the 
                        Disability Support Services and relevant academic staff to ensure 
                        appropriate accommodations are provided.
                    </p>
                </div>
            )}

            <div className="form-actions">
                <button className="btn btn-secondary" onClick={onPrev}>
                    <i className="fas fa-arrow-left"></i> Back
                </button>
                
                <button className="btn btn-primary" onClick={handleNext}>
                    Next <i className="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    );
};

export default ApplicationSpecialNeeds;