import React, { useState } from 'react';
import './ApplicationLanguage.css';
import axios from 'axios';

const ApplicationLanguage = ({ formData, onInputChange, onFileUpload, studentId, onNext }) => {
    const [showAnotherEQHE, setShowAnotherEQHE] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(field, file);
        }
    };

    const handleAnotherEQHEChange = (e) => {
        const value = e.target.checked;
        onInputChange('hasAnotherEQHE', value);
        setShowAnotherEQHE(value);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            // Prepare data for API
            const dataToSave = {
                studentId: studentId,
                eqheDate: formData.eqheDate || null,
                eqheCity: formData.eqheCity || '',
                eqheCountry: formData.eqheCountry || '',
                eqheOriginalTitle: formData.eqheOriginalTitle || '',
                hasAnotherEQHE: formData.hasAnotherEQHE || false,
                anotherEqheDate: formData.anotherEqheDate || null,
                anotherEqheCity: formData.anotherEqheCity || '',
                anotherEqheCountry: formData.anotherEqheCountry || '',
                anotherEqheOriginalTitle: formData.anotherEqheOriginalTitle || ''
            };

            // Make API call to save data
            const response = await axios.post(
                `http://localhost:5000/api/application/language/student/${studentId}/eqhe`,
                dataToSave,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setSaveSuccess(true);
                
                // Trigger storage event for sidebar update
                localStorage.setItem('gusApplicationData', JSON.stringify({
                    ...formData,
                    ...dataToSave
                }));
                window.dispatchEvent(new Event('applicationUpdated'));
                
                // Auto-hide success message after 3 seconds
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Save error:', error);
            setSaveError(
                error.response?.data?.message || 
                'Failed to save data. Please check your connection and try again.'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAndContinue = async () => {
        setIsSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            // Validate required fields
            if (!formData.eqheCountry) {
                throw new Error('Please select your country of EQHE');
            }
            if (!formData.eqheOriginalTitle) {
                throw new Error('Please select your EQHE title');
            }

            // Prepare data for API
            const dataToSave = {
                studentId: studentId,
                eqheDate: formData.eqheDate || null,
                eqheCity: formData.eqheCity || '',
                eqheCountry: formData.eqheCountry || '',
                eqheOriginalTitle: formData.eqheOriginalTitle || '',
                hasAnotherEQHE: formData.hasAnotherEQHE || false,
                anotherEqheDate: formData.anotherEqheDate || null,
                anotherEqheCity: formData.anotherEqheCity || '',
                anotherEqheCountry: formData.anotherEqheCountry || '',
                anotherEqheOriginalTitle: formData.anotherEqheOriginalTitle || ''
            };

            // Make API call to save data
            const response = await axios.post(
                `http://localhost:5000/api/application/language/student/${studentId}/eqhe`,
                dataToSave,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                // Update local storage
                localStorage.setItem('gusApplicationData', JSON.stringify({
                    ...formData,
                    ...dataToSave
                }));
                
                // Trigger storage event for sidebar update
                window.dispatchEvent(new Event('applicationUpdated'));
                
                // Navigate to next step
                if (onNext) {
                    onNext();
                }
            }
        } catch (error) {
            console.error('Save error:', error);
            setSaveError(
                error.response?.data?.message || 
                error.message ||
                'Failed to save data. Please check your connection and try again.'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleUploadCertificate = async (file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('eqheCertificate', file);
        formData.append('studentId', studentId);
        formData.append('certificateType', 'eqheCertificate');

        try {
            const response = await axios.post(
                `http://localhost:5000/api/application/language/student/${studentId}/eqhe/certificate`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                onFileUpload('eqheCertificate', file);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setSaveError('Failed to upload certificate. Please try again.');
        }
    };

    const countries = [
        { value: 'usa', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'canada', label: 'Canada' },
        { value: 'australia', label: 'Australia' },
        { value: 'india', label: 'India' },
        { value: 'china', label: 'China' },
        { value: 'germany', label: 'Germany' },
        { value: 'france', label: 'France' },
        { value: 'japan', label: 'Japan' },
        { value: 'skorea', label: 'South Korea' },
        { value: 'russia', label: 'Russia' },
        { value: 'mexico', label: 'Mexico' },
        { value: 'colombia', label: 'Colombia' },
        { value: 'italy', label: 'Italy' },
        { value: 'spain', label: 'Spain' },
        { value: 'brazil', label: 'Brazil' },
        { value: 'nigeria', label: 'Nigeria' },
        { value: 'thailand', label: 'Thailand' }
    ];

    const eqheTitles = [
        { value: 'senior_secondary_india', label: 'Senior Secondary School Certificate (India)' },
        { value: 'high_school_diploma_usa', label: 'American High School Diploma (USA)' },
        { value: 'mathayom_thailand', label: 'Mathayom VI (Thailand)' },
        { value: 'attestat_russia', label: 'Attestat o srednem (polnom) obsecm obrazovanii (Russia)' },
        { value: 'bachillerato_mexico', label: 'Bachillerato General (Mexico)' },
        { value: 'west_african_nigeria', label: 'West African Senior School Certificate (Nigeria)' },
        { value: 'diploma_italy', label: 'Diploma di superamento dell’esame di stato conclusive dei corsi di studio di... (Italy)' },
        { value: 'high_school_china', label: 'Secondary School Certificate and Gaokao (China)' },
        { value: 'bachiller_colombia', label: 'Titulo di Bachiller and Examen de Estado (Colombia)' },
        { value: 'high_school_skorea', label: 'High School Certificate and College Scholastic Aptitude Test (South Korea)' }
    ];

    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-number">3</div>
                <div>
                    <h2 className="section-title">Entrance qualification of higher education</h2>
                    <p className="section-subtitle">Provide your educational qualification that allows you to study at a university</p>
                </div>
            </div>

            <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p className="info-text">The entrance qualification of higher education (EQHE) is an educational qualification that allows you to study at a university. In some countries a university exam is required in addition to the secondary school certificate. E.g.: High School Diploma and SAT/ACT (USA), secondary de-registration certificate and Gaokao (China), Titulo di Bachiller and Examen de Estado (Colombia), Bachiller and Prueba di Acceso (Mexico), Attestat and Unified State Exam (Russia), High School Certificate and College Scholastic Aptitude Test (South Korea), etc.</p>
            </div>

            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label" htmlFor="eqheDate">Date of EQHE</label>
                    <input
                        type="date"
                        id="eqheDate"
                        className="form-input"
                        value={formData.eqheDate || ''}
                        onChange={(e) => onInputChange('eqheDate', e.target.value)}
                    />
                    <p className="field-helper">If you have not yet finished school yet, please select the expected date to finish school.</p>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="eqheCity">City of EQHE</label>
                    <input
                        type="text"
                        id="eqheCity"
                        className="form-input"
                        value={formData.eqheCity || ''}
                        onChange={(e) => onInputChange('eqheCity', e.target.value)}
                        placeholder="Enter city"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="eqheCountry">Country of EQHE *</label>
                    <select
                        id="eqheCountry"
                        className="form-select"
                        value={formData.eqheCountry || ''}
                        onChange={(e) => onInputChange('eqheCountry', e.target.value)}
                        required
                    >
                        <option value="">Select Country</option>
                        {countries.map(country => (
                            <option key={country.value} value={country.value}>{country.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-group full-width">
                <label className="form-label required" htmlFor="eqheOriginalTitle">Original title of EQHE</label>
                <select
                    id="eqheOriginalTitle"
                    className="form-select"
                    value={formData.eqheOriginalTitle || ''}
                    onChange={(e) => onInputChange('eqheOriginalTitle', e.target.value)}
                    required
                >
                    <option value="">Select EQHE Title</option>
                    {eqheTitles.map(title => (
                        <option key={title.value} value={title.value}>{title.label}</option>
                    ))}
                </select>
                <p className="field-helper">Please do not translate the title, but use Latin script. For example: Senior Secondary School Certificate (India), American High School Diploma (USA), Mathayom VI (Thailand), Attestat o srednem (polnom) obsecm obrazovanii (Russia), Bachillerato General (Mexico), West African Senior School Certificate (Nigeria), Diploma di superamento dell'esame di stato conclusive dei corsi di studio di... (Italy), etc.</p>
            </div>

            <div className="checkbox-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={showAnotherEQHE}
                        onChange={handleAnotherEQHEChange}
                    />
                    <span className="checkbox-text">+ I have another EQHE that I obtained at an earlier date</span>
                </label>
            </div>

            {showAnotherEQHE && (
                <div className="another-eqhe-section">
                    <h3 className="subsection-title">Additional EQHE Details</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label" htmlFor="anotherEqheDate">Date of EQHE</label>
                            <input
                                type="date"
                                id="anotherEqheDate"
                                className="form-input"
                                value={formData.anotherEqheDate || ''}
                                onChange={(e) => onInputChange('anotherEqheDate', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="anotherEqheCity">City of EQHE</label>
                            <input
                                type="text"
                                id="anotherEqheCity"
                                className="form-input"
                                value={formData.anotherEqheCity || ''}
                                onChange={(e) => onInputChange('anotherEqheCity', e.target.value)}
                                placeholder="Enter city"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="anotherEqheCountry">Country of EQHE</label>
                            <select
                                id="anotherEqheCountry"
                                className="form-select"
                                value={formData.anotherEqheCountry || ''}
                                onChange={(e) => onInputChange('anotherEqheCountry', e.target.value)}
                            >
                                <option value="">Select Country</option>
                                {countries.map(country => (
                                    <option key={country.value} value={country.value}>{country.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label" htmlFor="anotherEqheOriginalTitle">Original title of EQHE</label>
                            <select
                                id="anotherEqheOriginalTitle"
                                className="form-select"
                                value={formData.anotherEqheOriginalTitle || ''}
                                onChange={(e) => onInputChange('anotherEqheOriginalTitle', e.target.value)}
                            >
                                <option value="">Select EQHE Title</option>
                                {eqheTitles.map(title => (
                                    <option key={title.value} value={title.value}>{title.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">EQHE Certificate</label>
                        <div className="upload-area">
                            <div className="upload-prompt">
                                <i className="fas fa-file-certificate"></i>
                                <p>Upload your EQHE certificate</p>
                                <p className="text-muted">PDF format (Max: 2MB)</p>
                            </div>
                            <input
                                type="file"
                                id="eqheCertificateUpload"
                                accept=".pdf"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        handleUploadCertificate(file);
                                    }
                                }}
                                className="file-input"
                                style={{ display: 'none' }}
                            />
                            <button 
                                className="upload-btn"
                                onClick={() => document.getElementById('eqheCertificateUpload').click()}
                                disabled={isSaving}
                            >
                                <i className="fas fa-cloud-upload-alt"></i> Upload Certificate
                            </button>
                            {formData.eqheCertificate && (
                                <div className="file-list">
                                    <div className="file-item">
                                        <div className="file-info">
                                            <i className="fas fa-file-pdf file-icon"></i>
                                            <div className="file-details">
                                                <span className="file-name">{formData.eqheCertificate.name}</span>
                                                <span className="file-size">{(formData.eqheCertificate.size / 1024 / 1024).toFixed(2)} MB</span>
                                            </div>
                                        </div>
                                        <button 
                                            className="remove-file"
                                            onClick={() => onFileUpload('eqheCertificate', null)}
                                            disabled={isSaving}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!showAnotherEQHE && (
                <div className="test-info">
                    <h3 className="subsection-title">EQHE Information</h3>
                    <div className="test-details">
                        <div className="test-detail">
                            <span className="detail-label">Document Required:</span>
                            <span className="detail-value">Official EQHE certificate/transcript</span>
                        </div>
                        <div className="test-detail">
                            <span className="detail-label">Translation:</span>
                            <span className="detail-value">If not in English/German, provide certified translation</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {saveSuccess && (
                <div className="success-message">
                    <i className="fas fa-check-circle"></i>
                    <span>Data saved successfully!</span>
                </div>
            )}

            {/* Error Message */}
            {saveError && (
                <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{saveError}</span>
                </div>
            )}

            {/* Action Buttons */}
            <div className="form-actions">
                <button 
                    className="btn btn-secondary"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Saving...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-save"></i> Save
                        </>
                    )}
                </button>
                
                <button 
                    className="btn btn-primary"
                    onClick={handleSaveAndContinue}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Saving...
                        </>
                    ) : (
                        <>
                            Save & Continue <i className="fas fa-arrow-right"></i>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ApplicationLanguage;