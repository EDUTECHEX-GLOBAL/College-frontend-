import React from 'react';
import './ApplicationAddress.css';

const ApplicationAddress = ({ formData, onInputChange, onFileUpload }) => {
    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(field, file);
        }
    };

    const handleSameAsCurrent = () => {
        onInputChange('permanentAddress', formData.currentAddress);
    };

    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-number">2</div>
                <div>
                    <h2 className="section-title">Address & Identification</h2>
                    <p className="section-subtitle">Provide your current and permanent address details</p>
                </div>
            </div>

            <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p className="info-text">Permanent address should match your official documents. Use the button to copy current address to permanent.</p>
            </div>

            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label required" htmlFor="currentAddress">Current Address</label>
                    <textarea
                        id="currentAddress"
                        className="form-textarea"
                        value={formData.currentAddress}
                        onChange={(e) => onInputChange('currentAddress', e.target.value)}
                        placeholder="Enter your complete current address"
                        rows="3"
                        required
                    />
                </div>

                <div className="form-group">
                    <div className="address-header">
                        <label className="form-label required" htmlFor="permanentAddress">Permanent Address</label>
                        <button 
                            type="button" 
                            className="copy-address-btn"
                            onClick={handleSameAsCurrent}
                        >
                            <i className="fas fa-copy"></i> Same as Current
                        </button>
                    </div>
                    <textarea
                        id="permanentAddress"
                        className="form-textarea"
                        value={formData.permanentAddress}
                        onChange={(e) => onInputChange('permanentAddress', e.target.value)}
                        placeholder="Enter your permanent address"
                        rows="3"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="city">City</label>
                    <input
                        type="text"
                        id="city"
                        className="form-input"
                        value={formData.city}
                        onChange={(e) => onInputChange('city', e.target.value)}
                        placeholder="City"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="state">State/Province</label>
                    <input
                        type="text"
                        id="state"
                        className="form-input"
                        value={formData.state}
                        onChange={(e) => onInputChange('state', e.target.value)}
                        placeholder="State or Province"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="country">Country</label>
                    <select
                        id="country"
                        className="form-select"
                        value={formData.country}
                        onChange={(e) => onInputChange('country', e.target.value)}
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
                    <label className="form-label required" htmlFor="postalCode">Postal Code</label>
                    <input
                        type="text"
                        id="postalCode"
                        className="form-input"
                        value={formData.postalCode}
                        onChange={(e) => onInputChange('postalCode', e.target.value)}
                        placeholder="Postal/ZIP Code"
                        required
                    />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">National ID (Alternative to Passport)</label>
                <div className="upload-area">
                    <div className="upload-prompt">
                        <i className="fas fa-id-card"></i>
                        <p>Upload National ID if passport is unavailable</p>
                        <p className="text-muted">Aadhar, Driver's License, etc. (Max: 2MB)</p>
                    </div>
                    <input
                        type="file"
                        id="nationalIdUpload"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'nationalId')}
                        className="file-input"
                        style={{ display: 'none' }}
                    />
                    <button 
                        className="upload-btn"
                        onClick={() => document.getElementById('nationalIdUpload').click()}
                    >
                        <i className="fas fa-cloud-upload-alt"></i> Upload National ID
                    </button>
                    {formData.nationalId && (
                        <div className="file-list">
                            <div className="file-item">
                                <div className="file-info">
                                    <i className="fas fa-file-pdf file-icon"></i>
                                    <div className="file-details">
                                        <span className="file-name">{formData.nationalId.name}</span>
                                        <span className="file-size">{(formData.nationalId.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                </div>
                                <button 
                                    className="remove-file"
                                    onClick={() => onFileUpload('nationalId', null)}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <p className="helper-text">
                    <i className="fas fa-exclamation-circle"></i> Only required if you don't have a passport
                </p>
            </div>
        </div>
    );
};

export default ApplicationAddress;