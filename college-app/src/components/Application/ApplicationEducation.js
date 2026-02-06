import React, { useState } from 'react';
import './ApplicationEducation.css';

const ApplicationEducation = ({ formData, onInputChange, onFileUpload }) => {
    const [additionalQualifications, setAdditionalQualifications] = useState([]);
    const [showAdditionalForm, setShowAdditionalForm] = useState(false);
    const [newQualification, setNewQualification] = useState({
        level: '',
        institution: '',
        board: '',
        country: '',
        startYear: '',
        endYear: '',
        status: '',
        system: ''
    });

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(field, file);
        }
    };

    const handleAddQualification = () => {
        if (newQualification.level && newQualification.institution) {
            setAdditionalQualifications([...additionalQualifications, newQualification]);
            setNewQualification({
                level: '',
                institution: '',
                board: '',
                country: '',
                startYear: '',
                endYear: '',
                status: '',
                system: ''
            });
            setShowAdditionalForm(false);
        }
    };

    const handleRemoveQualification = (index) => {
        const updated = [...additionalQualifications];
        updated.splice(index, 1);
        setAdditionalQualifications(updated);
    };

    const yearOptions = [];
    for (let year = 2025; year >= 1980; year--) {
        yearOptions.push(year);
    }

    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-number">3</div>
                <div>
                    <h2 className="section-title">Educational Background</h2>
                    <p className="section-subtitle">Provide details of your highest qualification</p>
                </div>
            </div>

            <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p className="info-text">Start with your highest qualification. You can add additional qualifications below.</p>
            </div>

            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label required" htmlFor="qualificationLevel">Qualification Level</label>
                    <select
                        id="qualificationLevel"
                        className="form-select"
                        value={formData.qualificationLevel}
                        onChange={(e) => onInputChange('qualificationLevel', e.target.value)}
                        required
                    >
                        <option value="">Select Level</option>
                        <option value="high-school">High School (10th)</option>
                        <option value="secondary">Secondary (12th)</option>
                        <option value="diploma">Diploma</option>
                        <option value="bachelor">Bachelor's Degree</option>
                        <option value="master">Master's Degree</option>
                        <option value="phd">PhD</option>
                        <option value="post-doctoral">Post Doctoral</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="institutionName">Institution Name</label>
                    <input
                        type="text"
                        id="institutionName"
                        className="form-input"
                        value={formData.institutionName}
                        onChange={(e) => onInputChange('institutionName', e.target.value)}
                        placeholder="Name of Institution/College"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="boardUniversity">Board/University</label>
                    <input
                        type="text"
                        id="boardUniversity"
                        className="form-input"
                        value={formData.boardUniversity}
                        onChange={(e) => onInputChange('boardUniversity', e.target.value)}
                        placeholder="Board or University Name"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="countryOfStudy">Country of Study</label>
                    <select
                        id="countryOfStudy"
                        className="form-select"
                        value={formData.countryOfStudy}
                        onChange={(e) => onInputChange('countryOfStudy', e.target.value)}
                        required
                    >
                        <option value="">Select Country</option>
                        <option value="usa">United States</option>
                        <option value="uk">United Kingdom</option>
                        <option value="canada">Canada</option>
                        <option value="australia">Australia</option>
                        <option value="india">India</option>
                        <option value="germany">Germany</option>
                        <option value="france">France</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="startYear">Start Year</label>
                    <select
                        id="startYear"
                        className="form-select"
                        value={formData.startYear}
                        onChange={(e) => onInputChange('startYear', e.target.value)}
                        required
                    >
                        <option value="">Select Year</option>
                        {yearOptions.map(year => (
                            <option key={`start-${year}`} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="endYear">End Year</label>
                    <select
                        id="endYear"
                        className="form-select"
                        value={formData.endYear}
                        onChange={(e) => onInputChange('endYear', e.target.value)}
                        required
                    >
                        <option value="">Select Year</option>
                        {yearOptions.map(year => (
                            <option key={`end-${year}`} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="resultStatus">Result Status</label>
                    <select
                        id="resultStatus"
                        className="form-select"
                        value={formData.resultStatus}
                        onChange={(e) => onInputChange('resultStatus', e.target.value)}
                        required
                    >
                        <option value="">Select Status</option>
                        <option value="completed">Completed</option>
                        <option value="pursuing">Pursuing</option>
                        <option value="appearing">Appearing</option>
                        <option value="discontinued">Discontinued</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="gradingSystem">Grading System</label>
                    <div className="radio-group">
                        <div className="radio-option">
                            <input
                                type="radio"
                                id="percentage"
                                name="gradingSystem"
                                value="percentage"
                                checked={formData.gradingSystem === 'percentage'}
                                onChange={(e) => onInputChange('gradingSystem', e.target.value)}
                                required
                            />
                            <label htmlFor="percentage">Percentage</label>
                        </div>
                        <div className="radio-option">
                            <input
                                type="radio"
                                id="gpa"
                                name="gradingSystem"
                                value="gpa"
                                checked={formData.gradingSystem === 'gpa'}
                                onChange={(e) => onInputChange('gradingSystem', e.target.value)}
                            />
                            <label htmlFor="gpa">GPA/CGPA</label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Qualifications */}
            {additionalQualifications.length > 0 && (
                <div className="additional-qualifications">
                    <h3 className="subsection-title">Additional Qualifications</h3>
                    {additionalQualifications.map((qual, index) => (
                        <div key={index} className="qualification-card">
                            <div className="qualification-header">
                                <h4>{qual.level} - {qual.institution}</h4>
                                <button 
                                    className="remove-qual-btn"
                                    onClick={() => handleRemoveQualification(index)}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="qualification-details">
                                <span>{qual.board} • {qual.country}</span>
                                <span>{qual.startYear} - {qual.endYear}</span>
                                <span>{qual.status} • {qual.system}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAdditionalForm ? (
                <div className="additional-form">
                    <h3 className="subsection-title">Add Another Qualification</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Qualification Level</label>
                            <select
                                className="form-select"
                                value={newQualification.level}
                                onChange={(e) => setNewQualification({...newQualification, level: e.target.value})}
                            >
                                <option value="">Select Level</option>
                                <option value="high-school">High School</option>
                                <option value="diploma">Diploma</option>
                                <option value="bachelor">Bachelor's</option>
                                <option value="master">Master's</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Institution Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newQualification.institution}
                                onChange={(e) => setNewQualification({...newQualification, institution: e.target.value})}
                                placeholder="Institution Name"
                            />
                        </div>
                    </div>
                    <div className="form-actions-inline">
                        <button className="btn btn-primary" onClick={handleAddQualification}>
                            <i className="fas fa-plus"></i> Add Qualification
                        </button>
                        <button className="btn btn-secondary" onClick={() => setShowAdditionalForm(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    className="add-qualification-btn"
                    onClick={() => setShowAdditionalForm(true)}
                >
                    <i className="fas fa-plus-circle"></i> Add Another Qualification
                </button>
            )}

            {/* Document Uploads */}
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label required">Academic Transcripts</label>
                    <div className="upload-area">
                        <div className="upload-prompt">
                            <i className="fas fa-file-alt"></i>
                            <p>Upload your academic transcripts/marksheets</p>
                            <p className="text-muted">PDF format (Max: 5MB)</p>
                        </div>
                        <input
                            type="file"
                            id="transcriptsUpload"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e, 'transcripts')}
                            className="file-input"
                            style={{ display: 'none' }}
                        />
                        <button 
                            className="upload-btn"
                            onClick={() => document.getElementById('transcriptsUpload').click()}
                        >
                            <i className="fas fa-cloud-upload-alt"></i> Upload Transcripts
                        </button>
                        {formData.transcripts && (
                            <div className="file-list">
                                <div className="file-item">
                                    <div className="file-info">
                                        <i className="fas fa-file-pdf file-icon"></i>
                                        <div className="file-details">
                                            <span className="file-name">{formData.transcripts.name}</span>
                                            <span className="file-size">{(formData.transcripts.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                    <button 
                                        className="remove-file"
                                        onClick={() => onFileUpload('transcripts', null)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label required">Degree Certificate</label>
                    <div className="upload-area">
                        <div className="upload-prompt">
                            <i className="fas fa-graduation-cap"></i>
                            <p>Upload degree or provisional certificate</p>
                            <p className="text-muted">PDF format (Max: 5MB)</p>
                        </div>
                        <input
                            type="file"
                            id="degreeUpload"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e, 'degreeCertificate')}
                            className="file-input"
                            style={{ display: 'none' }}
                        />
                        <button 
                            className="upload-btn"
                            onClick={() => document.getElementById('degreeUpload').click()}
                        >
                            <i className="fas fa-cloud-upload-alt"></i> Upload Certificate
                        </button>
                        {formData.degreeCertificate && (
                            <div className="file-list">
                                <div className="file-item">
                                    <div className="file-info">
                                        <i className="fas fa-file-pdf file-icon"></i>
                                        <div className="file-details">
                                            <span className="file-name">{formData.degreeCertificate.name}</span>
                                            <span className="file-size">{(formData.degreeCertificate.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                    <button 
                                        className="remove-file"
                                        onClick={() => onFileUpload('degreeCertificate', null)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicationEducation;