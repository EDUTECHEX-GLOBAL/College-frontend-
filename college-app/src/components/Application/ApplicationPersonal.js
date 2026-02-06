import React from 'react';
import './ApplicationPersonal.css';

const ApplicationPersonal = ({ formData, onInputChange, onFileUpload }) => {
    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(field, file);
        }
    };

    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-number">1</div>
                <div>
                    <h2 className="section-title">Personal Information</h2>
                    <p className="section-subtitle">Please provide your personal details accurately</p>
                </div>
            </div>

            <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p className="info-text">All fields marked with * are mandatory. Ensure information matches your passport.</p>
            </div>

            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label required" htmlFor="firstName">First Name</label>
                    <input
                        type="text"
                        id="firstName"
                        className="form-input"
                        value={formData.firstName}
                        onChange={(e) => onInputChange('firstName', e.target.value)}
                        placeholder="Enter your first name"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="lastName">Last Name</label>
                    <input
                        type="text"
                        id="lastName"
                        className="form-input"
                        value={formData.lastName}
                        onChange={(e) => onInputChange('lastName', e.target.value)}
                        placeholder="Enter your last name"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="dob">Date of Birth</label>
                    <input
                        type="date"
                        id="dob"
                        className="form-input"
                        value={formData.dob}
                        onChange={(e) => onInputChange('dob', e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="gender">Gender</label>
                    <select
                        id="gender"
                        className="form-select"
                        value={formData.gender}
                        onChange={(e) => onInputChange('gender', e.target.value)}
                        required
                    >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="nationality">Nationality</label>
                    <input
                        type="text"
                        id="nationality"
                        className="form-input"
                        value={formData.nationality}
                        onChange={(e) => onInputChange('nationality', e.target.value)}
                        placeholder="Your nationality"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="countryOfResidence">Country of Residence</label>
                    <select
                        id="countryOfResidence"
                        className="form-select"
                        value={formData.countryOfResidence}
                        onChange={(e) => onInputChange('countryOfResidence', e.target.value)}
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
                    <label className="form-label required" htmlFor="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        className="form-input"
                        value={formData.email}
                        onChange={(e) => onInputChange('email', e.target.value)}
                        placeholder="example@domain.com"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="mobile">Mobile Number</label>
                    <input
                        type="tel"
                        id="mobile"
                        className="form-input"
                        value={formData.mobile}
                        onChange={(e) => onInputChange('mobile', e.target.value)}
                        placeholder="+91 9876543210"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="alternateContact">Alternate Contact (Optional)</label>
                    <input
                        type="tel"
                        id="alternateContact"
                        className="form-input"
                        value={formData.alternateContact}
                        onChange={(e) => onInputChange('alternateContact', e.target.value)}
                        placeholder="Alternate phone number"
                    />
                </div>
            </div>

            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label required">Passport Upload</label>
                    <div className="upload-area">
                        <div className="upload-prompt">
                            <i className="fas fa-passport"></i>
                            <p>Upload a clear scanned copy of your passport</p>
                            <p className="text-muted">PDF, JPG, or PNG (Max: 2MB)</p>
                        </div>
                        <input
                            type="file"
                            id="passportUpload"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, 'passport')}
                            className="file-input"
                            style={{ display: 'none' }}
                        />
                        <button 
                            className="upload-btn"
                            onClick={() => document.getElementById('passportUpload').click()}
                        >
                            <i className="fas fa-cloud-upload-alt"></i> Upload Passport
                        </button>
                        {formData.passport && (
                            <div className="file-list">
                                <div className="file-item">
                                    <div className="file-info">
                                        <i className="fas fa-file-pdf file-icon"></i>
                                        <div className="file-details">
                                            <span className="file-name">{formData.passport.name}</span>
                                            <span className="file-size">{(formData.passport.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                    <button 
                                        className="remove-file"
                                        onClick={() => onFileUpload('passport', null)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label required">Passport-size Photograph</label>
                    <div className="upload-area">
                        <div className="upload-prompt">
                            <i className="fas fa-camera"></i>
                            <p>Upload recent passport-size photograph</p>
                            <p className="text-muted">White background, JPG or PNG (Max: 1MB)</p>
                        </div>
                        <input
                            type="file"
                            id="photoUpload"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, 'photograph')}
                            className="file-input"
                            style={{ display: 'none' }}
                        />
                        <button 
                            className="upload-btn"
                            onClick={() => document.getElementById('photoUpload').click()}
                        >
                            <i className="fas fa-cloud-upload-alt"></i> Upload Photo
                        </button>
                        {formData.photograph && (
                            <div className="file-list">
                                <div className="file-item">
                                    <div className="file-info">
                                        <i className="fas fa-image file-icon"></i>
                                        <div className="file-details">
                                            <span className="file-name">{formData.photograph.name}</span>
                                            <span className="file-size">{(formData.photograph.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                    <button 
                                        className="remove-file"
                                        onClick={() => onFileUpload('photograph', null)}
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

export default ApplicationPersonal;