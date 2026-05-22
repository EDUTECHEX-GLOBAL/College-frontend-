import React, { useState } from 'react';
import './ApplicationWork.css';

const ApplicationWork = ({ formData, onInputChange, onFileUpload }) => {
    const [showExperienceFields, setShowExperienceFields] = useState(formData.isEmployed === 'yes');
    const [experiences, setExperiences] = useState([]);
    const [newExperience, setNewExperience] = useState({
        organization: '',
        jobTitle: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        responsibilities: ''
    });

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(field, file);
        }
    };

    const handleEmploymentChange = (value) => {
        onInputChange('isEmployed', value);
        setShowExperienceFields(value === 'yes');
    };

    const handleAddExperience = () => {
        if (newExperience.organization && newExperience.jobTitle) {
            const experienceToAdd = {
                ...newExperience,
                id: Date.now()
            };
            setExperiences([...experiences, experienceToAdd]);
            setNewExperience({
                organization: '',
                jobTitle: '',
                startDate: '',
                endDate: '',
                currentlyWorking: false,
                responsibilities: ''
            });
        }
    };

    const handleRemoveExperience = (id) => {
        setExperiences(experiences.filter(exp => exp.id !== id));
    };

    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-number">5</div>
                <div>
                    <h2 className="section-title">Work Experience</h2>
                    <p className="section-subtitle">Provide details of your professional experience (if applicable)</p>
                </div>
            </div>

            <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p className="info-text">Work experience is optional but recommended for graduate programs.</p>
            </div>

            <div className="form-group">
                <label className="form-label required">Are you currently employed?</label>
                <div className="radio-group">
                    <div className="radio-option">
                        <input
                            type="radio"
                            id="employed-yes"
                            name="isEmployed"
                            value="yes"
                            checked={formData.isEmployed === 'yes'}
                            onChange={(e) => handleEmploymentChange(e.target.value)}
                        />
                        <label htmlFor="employed-yes">Yes</label>
                    </div>
                    <div className="radio-option">
                        <input
                            type="radio"
                            id="employed-no"
                            name="isEmployed"
                            value="no"
                            checked={formData.isEmployed === 'no'}
                            onChange={(e) => handleEmploymentChange(e.target.value)}
                        />
                        <label htmlFor="employed-no">No</label>
                    </div>
                </div>
            </div>

            {showExperienceFields && (
                <>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label required" htmlFor="organizationName">Organization Name</label>
                            <input
                                type="text"
                                id="organizationName"
                                className="form-input"
                                value={formData.organizationName}
                                onChange={(e) => onInputChange('organizationName', e.target.value)}
                                placeholder="Company/Organization name"
                                required={showExperienceFields}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required" htmlFor="jobTitle">Job Title</label>
                            <input
                                type="text"
                                id="jobTitle"
                                className="form-input"
                                value={formData.jobTitle}
                                onChange={(e) => onInputChange('jobTitle', e.target.value)}
                                placeholder="Your position/designation"
                                required={showExperienceFields}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required" htmlFor="workDuration">Duration (in months)</label>
                            <input
                                type="number"
                                id="workDuration"
                                className="form-input"
                                value={formData.workDuration}
                                onChange={(e) => onInputChange('workDuration', e.target.value)}
                                placeholder="e.g., 24"
                                min="1"
                                required={showExperienceFields}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="responsibilities">Key Responsibilities</label>
                        <textarea
                            id="responsibilities"
                            className="form-textarea"
                            value={formData.responsibilities}
                            onChange={(e) => onInputChange('responsibilities', e.target.value)}
                            placeholder="Briefly describe your main responsibilities and achievements..."
                            rows="4"
                        />
                        <p className="helper-text">Keep it concise, maximum 250 words</p>
                    </div>

                    {/* Add Multiple Experiences */}
                    <div className="additional-experiences">
                        <h3 className="subsection-title">Add Another Experience</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Organization</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newExperience.organization}
                                    onChange={(e) => setNewExperience({...newExperience, organization: e.target.value})}
                                    placeholder="Company name"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Job Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newExperience.jobTitle}
                                    onChange={(e) => setNewExperience({...newExperience, jobTitle: e.target.value})}
                                    placeholder="Position"
                                />
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={newExperience.startDate}
                                    onChange={(e) => setNewExperience({...newExperience, startDate: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date</label>
                                <div className="end-date-container">
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={newExperience.endDate}
                                        onChange={(e) => setNewExperience({...newExperience, endDate: e.target.value})}
                                        disabled={newExperience.currentlyWorking}
                                    />
                                    <div className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            id="currentlyWorking"
                                            checked={newExperience.currentlyWorking}
                                            onChange={(e) => {
                                                setNewExperience({
                                                    ...newExperience, 
                                                    currentlyWorking: e.target.checked,
                                                    endDate: e.target.checked ? '' : newExperience.endDate
                                                });
                                            }}
                                        />
                                        <label htmlFor="currentlyWorking">Currently Working Here</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Responsibilities</label>
                            <textarea
                                className="form-textarea"
                                value={newExperience.responsibilities}
                                onChange={(e) => setNewExperience({...newExperience, responsibilities: e.target.value})}
                                placeholder="Brief description of responsibilities..."
                                rows="3"
                            />
                        </div>
                        <button className="add-experience-btn" onClick={handleAddExperience}>
                            <i className="fas fa-plus"></i> Add Experience
                        </button>
                    </div>

                    {/* Display Added Experiences */}
                    {experiences.length > 0 && (
                        <div className="experience-list">
                            <h3 className="subsection-title">Added Experiences</h3>
                            {experiences.map((exp) => (
                                <div key={exp.id} className="experience-card">
                                    <div className="experience-header">
                                        <div>
                                            <h4>{exp.jobTitle}</h4>
                                            <p className="company-name">{exp.organization}</p>
                                        </div>
                                        <button 
                                            className="remove-exp-btn"
                                            onClick={() => handleRemoveExperience(exp.id)}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <div className="experience-duration">
                                        {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}
                                    </div>
                                    {exp.responsibilities && (
                                        <p className="experience-desc">{exp.responsibilities}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Document Uploads */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label required">Resume/CV</label>
                            <div className="upload-area">
                                <div className="upload-prompt">
                                    <i className="fas fa-file-contract"></i>
                                    <p>Upload your updated resume or CV</p>
                                    <p className="text-muted">PDF format (Max: 5MB)</p>
                                </div>
                                <input
                                    type="file"
                                    id="resumeUpload"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => handleFileChange(e, 'resume')}
                                    className="file-input"
                                    style={{ display: 'none' }}
                                />
                                <button 
                                    className="upload-btn"
                                    onClick={() => document.getElementById('resumeUpload').click()}
                                >
                                    <i className="fas fa-cloud-upload-alt"></i> Upload Resume
                                </button>
                                {formData.resume && (
                                    <div className="file-list">
                                        <div className="file-item">
                                            <div className="file-info">
                                                <i className="fas fa-file-pdf file-icon"></i>
                                                <div className="file-details">
                                                    <span className="file-name">{formData.resume.name}</span>
                                                    <span className="file-size">{(formData.resume.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                            </div>
                                            <button 
                                                className="remove-file"
                                                onClick={() => onFileUpload('resume', null)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Experience Letters (Optional)</label>
                            <div className="upload-area">
                                <div className="upload-prompt">
                                    <i className="fas fa-briefcase"></i>
                                    <p>Upload experience/appointment letters</p>
                                    <p className="text-muted">PDF format (Max: 10MB total)</p>
                                </div>
                                <input
                                    type="file"
                                    id="expLettersUpload"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    multiple
                                    onChange={(e) => handleFileChange(e, 'experienceLetters')}
                                    className="file-input"
                                    style={{ display: 'none' }}
                                />
                                <button 
                                    className="upload-btn"
                                    onClick={() => document.getElementById('expLettersUpload').click()}
                                >
                                    <i className="fas fa-cloud-upload-alt"></i> Upload Letters
                                </button>
                                {formData.experienceLetters && (
                                    <div className="file-list">
                                        <div className="file-item">
                                            <div className="file-info">
                                                <i className="fas fa-file-pdf file-icon"></i>
                                                <div className="file-details">
                                                    <span className="file-name">{formData.experienceLetters.name}</span>
                                                    <span className="file-size">{(formData.experienceLetters.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                            </div>
                                            <button 
                                                className="remove-file"
                                                onClick={() => onFileUpload('experienceLetters', null)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ApplicationWork;