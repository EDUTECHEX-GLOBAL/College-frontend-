import React, { useState, useEffect, useCallback } from 'react';
import './ApplicationLanguage.css';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ApplicationLanguage = ({ formData, onInputChange, onFileUpload, studentId, onNext }) => {
    const [showAnotherEQHE, setShowAnotherEQHE] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showUploadProgress, setShowUploadProgress] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [fetchedData, setFetchedData] = useState(null);

    // ─────────────────────────────────────────────────────────────
    // DEBUG: Confirm studentId is arriving (remove after testing)
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        console.log('🔍 ApplicationLanguage studentId:', studentId);
    }, [studentId]);

    // ─────────────────────────────────────────────────────────────
    // HELPER: Map EQHE fields → Resume field names
    // ✅ FIX: useCallback gives stable reference for useEffect deps
    // ─────────────────────────────────────────────────────────────
    const mapToResumeFields = useCallback((data) => {
        onInputChange('englishTestType', data.eqheOriginalTitle || '');
        onInputChange('testDate',        data.eqheDate         || '');
        onInputChange('eqheCountry',     data.eqheCountry      || '');
        onInputChange('eqheCity',        data.eqheCity         || '');

        if (data.hasAnotherEQHE) {
            onInputChange('anotherEqheOriginalTitle', data.anotherEqheOriginalTitle || '');
            onInputChange('anotherEqheCountry',      data.anotherEqheCountry       || '');
            onInputChange('anotherEqheDate',         data.anotherEqheDate          || '');
            onInputChange('anotherEqheCity',         data.anotherEqheCity          || '');
        }
    }, [onInputChange]);

    // ─────────────────────────────────────────────────────────────
    // LOAD existing data on mount
    // ✅ FIX: Guard against undefined/invalid studentId
    // ✅ FIX: dep array is always the same size
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchExistingData = async () => {
            // Guard: don't call API if studentId is missing or invalid
            if (!studentId || studentId === 'undefined') {
                console.warn('⚠️ Skipping EQHE fetch — studentId not ready:', studentId);
                return;
            }

            setIsLoading(true);
            try {
                const response = await axios.get(
                    `${API_URL}/api/application/language/student/${studentId}/eqhe`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                if (response.data.success && response.data.data) {
                    const data = response.data.data;
                    setFetchedData(data);

                    if (data.eqheDate)          onInputChange('eqheDate',          data.eqheDate);
                    if (data.eqheCity)          onInputChange('eqheCity',          data.eqheCity);
                    if (data.eqheCountry)       onInputChange('eqheCountry',       data.eqheCountry);
                    if (data.eqheOriginalTitle) onInputChange('eqheOriginalTitle', data.eqheOriginalTitle);

                    const hasAnother = data.hasAnotherEQHE || false;
                    setShowAnotherEQHE(hasAnother);

                    if (hasAnother) {
                        if (data.anotherEqheDate)          onInputChange('anotherEqheDate',          data.anotherEqheDate);
                        if (data.anotherEqheCity)          onInputChange('anotherEqheCity',          data.anotherEqheCity);
                        if (data.anotherEqheCountry)       onInputChange('anotherEqheCountry',       data.anotherEqheCountry);
                        if (data.anotherEqheOriginalTitle) onInputChange('anotherEqheOriginalTitle', data.anotherEqheOriginalTitle);
                    }

                    mapToResumeFields(data);
                }
            } catch (error) {
                // 404 = no saved data yet — perfectly normal, not an error
                if (error.response?.status !== 404) {
                    console.error('Error fetching EQHE data:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchExistingData();
    }, [studentId, mapToResumeFields, onInputChange]);

    // ─────────────────────────────────────────────────────────────
    // FILE CHANGE
    // ─────────────────────────────────────────────────────────────
    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                setSaveError('Only PDF files are allowed');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setSaveError('File size must be less than 2MB');
                return;
            }
            onFileUpload(field, file);
            setSaveError('');
        }
    };

    const handleAnotherEQHEChange = (e) => {
        const value = e.target.checked;
        onInputChange('hasAnotherEQHE', value);
        setShowAnotherEQHE(value);

        if (!value) {
            onInputChange('anotherEqheDate',          '');
            onInputChange('anotherEqheCity',          '');
            onInputChange('anotherEqheCountry',       '');
            onInputChange('anotherEqheOriginalTitle', '');
        }
    };

    // ─────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────
    const validateForm = (forContinue = false) => {
        const errors = {};

        if (forContinue) {
            if (!formData.eqheCountry)       errors.eqheCountry       = 'Country of EQHE is required';
            if (!formData.eqheOriginalTitle) errors.eqheOriginalTitle = 'EQHE title is required';

            if (showAnotherEQHE) {
                if (!formData.anotherEqheCountry)       errors.anotherEqheCountry       = 'Country is required for additional EQHE';
                if (!formData.anotherEqheOriginalTitle) errors.anotherEqheOriginalTitle = 'Title is required for additional EQHE';
            }
        }

        if (formData.eqheDate && !isValidDate(formData.eqheDate)) {
            errors.eqheDate = 'Please enter a valid date';
        }

        if (showAnotherEQHE && formData.anotherEqheDate && !isValidDate(formData.anotherEqheDate)) {
            errors.anotherEqheDate = 'Please enter a valid date';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const isValidDate = (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    };

    // ─────────────────────────────────────────────────────────────
    // SAVE (without navigate)
    // ✅ FIX: Guard against missing studentId
    // ─────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!studentId || studentId === 'undefined') {
            setSaveError('Unable to save — student session not found. Please refresh and try again.');
            return;
        }

        if (!validateForm(false)) return;

        setIsSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            const dataToSave = {
                studentId,
                eqheDate:                 formData.eqheDate                || null,
                eqheCity:                 formData.eqheCity                || '',
                eqheCountry:              formData.eqheCountry             || '',
                eqheOriginalTitle:        formData.eqheOriginalTitle       || '',
                hasAnotherEQHE:           formData.hasAnotherEQHE          || false,
                anotherEqheDate:          formData.anotherEqheDate         || null,
                anotherEqheCity:          formData.anotherEqheCity         || '',
                anotherEqheCountry:       formData.anotherEqheCountry      || '',
                anotherEqheOriginalTitle: formData.anotherEqheOriginalTitle || ''
            };

            const response = await axios.post(
                `${API_URL}/api/application/language/student/${studentId}/eqhe`,
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
                mapToResumeFields(dataToSave);

                localStorage.setItem('gusApplicationData', JSON.stringify({
                    ...formData,
                    ...dataToSave
                }));
                window.dispatchEvent(new Event('applicationUpdated'));

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

    // ─────────────────────────────────────────────────────────────
    // SAVE & CONTINUE
    // ✅ FIX: Guard against missing studentId
    // ─────────────────────────────────────────────────────────────
    const handleSaveAndContinue = async () => {
        if (!studentId || studentId === 'undefined') {
            setSaveError('Unable to save — student session not found. Please refresh and try again.');
            return;
        }

        if (!validateForm(true)) return;

        setIsSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            const dataToSave = {
                studentId,
                eqheDate:                 formData.eqheDate                || null,
                eqheCity:                 formData.eqheCity                || '',
                eqheCountry:              formData.eqheCountry             || '',
                eqheOriginalTitle:        formData.eqheOriginalTitle       || '',
                hasAnotherEQHE:           formData.hasAnotherEQHE          || false,
                anotherEqheDate:          formData.anotherEqheDate         || null,
                anotherEqheCity:          formData.anotherEqheCity         || '',
                anotherEqheCountry:       formData.anotherEqheCountry      || '',
                anotherEqheOriginalTitle: formData.anotherEqheOriginalTitle || ''
            };

            const response = await axios.post(
                `${API_URL}/api/application/language/student/${studentId}/eqhe`,
                dataToSave,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                mapToResumeFields(dataToSave);

                localStorage.setItem('gusApplicationData', JSON.stringify({
                    ...formData,
                    ...dataToSave
                }));
                window.dispatchEvent(new Event('applicationUpdated'));

                if (onNext) onNext();
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

    // ─────────────────────────────────────────────────────────────
    // CERTIFICATE UPLOAD
    // ─────────────────────────────────────────────────────────────
    const handleUploadCertificate = async (file) => {
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('eqheCertificate', file);
        uploadFormData.append('studentId', studentId);
        uploadFormData.append('certificateType', 'eqheCertificate');

        setShowUploadProgress(true);
        setUploadProgress(0);

        try {
            const response = await axios.post(
                `${API_URL}/api/application/language/student/${studentId}/eqhe/certificate`,
                uploadFormData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
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
        } finally {
            setShowUploadProgress(false);
            setUploadProgress(0);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // STATIC DATA
    // ─────────────────────────────────────────────────────────────
    const countries = [
        { value: 'usa',       label: 'United States' },
        { value: 'uk',        label: 'United Kingdom' },
        { value: 'canada',    label: 'Canada' },
        { value: 'australia', label: 'Australia' },
        { value: 'india',     label: 'India' },
        { value: 'china',     label: 'China' },
        { value: 'germany',   label: 'Germany' },
        { value: 'france',    label: 'France' },
        { value: 'japan',     label: 'Japan' },
        { value: 'skorea',    label: 'South Korea' },
        { value: 'russia',    label: 'Russia' },
        { value: 'mexico',    label: 'Mexico' },
        { value: 'colombia',  label: 'Colombia' },
        { value: 'italy',     label: 'Italy' },
        { value: 'spain',     label: 'Spain' },
        { value: 'brazil',    label: 'Brazil' },
        { value: 'nigeria',   label: 'Nigeria' },
        { value: 'thailand',  label: 'Thailand' }
    ];

    const eqheTitles = [
        { value: 'senior_secondary_india',  label: 'Senior Secondary School Certificate (India)' },
        { value: 'high_school_diploma_usa', label: 'American High School Diploma (USA)' },
        { value: 'mathayom_thailand',       label: 'Mathayom VI (Thailand)' },
        { value: 'attestat_russia',         label: 'Attestat o srednem (polnom) obsecm obrazovanii (Russia)' },
        { value: 'bachillerato_mexico',     label: 'Bachillerato General (Mexico)' },
        { value: 'west_african_nigeria',    label: 'West African Senior School Certificate (Nigeria)' },
        { value: 'diploma_italy',           label: "Diploma di superamento dell'esame di stato conclusive dei corsi di studio di... (Italy)" },
        { value: 'high_school_china',       label: 'Secondary School Certificate and Gaokao (China)' },
        { value: 'bachiller_colombia',      label: 'Titulo di Bachiller and Examen de Estado (Colombia)' },
        { value: 'high_school_skorea',      label: 'High School Certificate and College Scholastic Aptitude Test (South Korea)' }
    ];

    // ─────────────────────────────────────────────────────────────
    // LOADING STATE
    // ─────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="applicationlanguage-container">
                <div className="applicationlanguage-loading-state">
                    <div className="applicationlanguage-loading-spinner"></div>
                    <p>Loading your EQHE information...</p>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="applicationlanguage-container">

            {/* Success Toast */}
            {saveSuccess && (
                <div className="applicationlanguage-success-toast">
                    <span className="applicationlanguage-success-icon">✓</span>
                    <span>EQHE information saved successfully!</span>
                </div>
            )}

            {/* Error Toast */}
            {saveError && (
                <div className="applicationlanguage-error-toast">
                    <span className="applicationlanguage-error-icon">⚠</span>
                    <span>{saveError}</span>
                    <button className="applicationlanguage-toast-close" onClick={() => setSaveError('')}>×</button>
                </div>
            )}

            {/* Upload Progress */}
            {showUploadProgress && (
                <div className="applicationlanguage-upload-progress">
                    <div className="applicationlanguage-progress-bar-container">
                        <div className="applicationlanguage-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p>Uploading: {uploadProgress}%</p>
                </div>
            )}

            <div className="applicationlanguage-content">

                {/* Header */}
                <div className="applicationlanguage-section-header">
                    <div className="applicationlanguage-header-left">
                        <div className="applicationlanguage-section-number">3</div>
                        <div>
                            <h2 className="applicationlanguage-section-title">Entrance Qualification of Higher Education</h2>
                            <p className="applicationlanguage-section-subtitle">Provide your educational qualification that allows you to study at a university</p>
                        </div>
                    </div>
                </div>

                
                {/* Main Form Card */}
                <div className="applicationlanguage-form-card">

                    {/* Primary EQHE Section */}
                    <div className="applicationlanguage-form-section">
                        <h3 className="applicationlanguage-section-heading">
                            Primary EQHE Information
                        </h3>

                        <div className="applicationlanguage-form-grid">

                            {/* Date of EQHE */}
                            <div className="applicationlanguage-form-group">
                                <label className="applicationlanguage-form-label" htmlFor="eqheDate">
                                    Date of EQHE
                                    {validationErrors.eqheDate && <span className="applicationlanguage-error-star">*</span>}
                                </label>
                                <input
                                    type="date"
                                    id="eqheDate"
                                    className={`applicationlanguage-form-input ${validationErrors.eqheDate ? 'error' : ''}`}
                                    value={formData.eqheDate || ''}
                                    onChange={(e) => {
                                        onInputChange('eqheDate', e.target.value);
                                        onInputChange('testDate', e.target.value);
                                        if (validationErrors.eqheDate) {
                                            setValidationErrors({ ...validationErrors, eqheDate: null });
                                        }
                                    }}
                                />
                                {validationErrors.eqheDate && (
                                    <div className="applicationlanguage-field-error">{validationErrors.eqheDate}</div>
                                )}
                                <p className="applicationlanguage-field-helper">
                                    If you have not yet finished school, please select the expected completion date
                                </p>
                            </div>

                            {/* City of EQHE */}
                            <div className="applicationlanguage-form-group">
                                <label className="applicationlanguage-form-label" htmlFor="eqheCity">City of EQHE</label>
                                <input
                                    type="text"
                                    id="eqheCity"
                                    className="applicationlanguage-form-input"
                                    value={formData.eqheCity || ''}
                                    onChange={(e) => onInputChange('eqheCity', e.target.value)}
                                    placeholder="Enter city"
                                />
                            </div>

                            {/* Country of EQHE */}
                            <div className="applicationlanguage-form-group">
                                <label className="applicationlanguage-form-label required" htmlFor="eqheCountry">
                                    Country of EQHE *
                                    {validationErrors.eqheCountry && <span className="applicationlanguage-error-star">*</span>}
                                </label>
                                <select
                                    id="eqheCountry"
                                    className={`applicationlanguage-form-select ${validationErrors.eqheCountry ? 'error' : ''}`}
                                    value={formData.eqheCountry || ''}
                                    onChange={(e) => {
                                        onInputChange('eqheCountry', e.target.value);
                                        onInputChange('countryOfStudy', e.target.value);
                                        if (validationErrors.eqheCountry) {
                                            setValidationErrors({ ...validationErrors, eqheCountry: null });
                                        }
                                    }}
                                    required
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(country => (
                                        <option key={country.value} value={country.value}>{country.label}</option>
                                    ))}
                                </select>
                                {validationErrors.eqheCountry && (
                                    <div className="applicationlanguage-field-error">{validationErrors.eqheCountry}</div>
                                )}
                            </div>

                        </div>

                        {/* Original Title of EQHE */}
                        <div className="applicationlanguage-form-group full-width">
                            <label className="applicationlanguage-form-label required" htmlFor="eqheOriginalTitle">
                                Original title of EQHE *
                                {validationErrors.eqheOriginalTitle && <span className="applicationlanguage-error-star">*</span>}
                            </label>
                            <select
                                id="eqheOriginalTitle"
                                className={`applicationlanguage-form-select ${validationErrors.eqheOriginalTitle ? 'error' : ''}`}
                                value={formData.eqheOriginalTitle || ''}
                                onChange={(e) => {
                                    onInputChange('eqheOriginalTitle', e.target.value);
                                    onInputChange('englishTestType', e.target.value);
                                    if (validationErrors.eqheOriginalTitle) {
                                        setValidationErrors({ ...validationErrors, eqheOriginalTitle: null });
                                    }
                                }}
                                required
                            >
                                <option value="">Select EQHE Title</option>
                                {eqheTitles.map(title => (
                                    <option key={title.value} value={title.value}>{title.label}</option>
                                ))}
                            </select>
                            {validationErrors.eqheOriginalTitle && (
                                <div className="applicationlanguage-field-error">{validationErrors.eqheOriginalTitle}</div>
                            )}
                            <p className="applicationlanguage-field-helper">
                                Please do not translate the title, but use Latin script. Select the option that matches your qualification.
                            </p>
                        </div>
                    </div>

                    {/* Another EQHE Checkbox */}
                    <div className="applicationlanguage-checkbox-section">
                        <label className="applicationlanguage-checkbox-wrapper">
                            <input
                                type="checkbox"
                                className="applicationlanguage-checkbox-input"
                                checked={showAnotherEQHE}
                                onChange={handleAnotherEQHEChange}
                            />
                            <span className="applicationlanguage-checkbox-custom"></span>
                            <span className="applicationlanguage-checkbox-label">
                                I have another EQHE that I obtained at an earlier date
                            </span>
                        </label>
                    </div>

                    {/* Another EQHE Section */}
                    {showAnotherEQHE && (
                        <div className="applicationlanguage-form-section another-section">
                            <h3 className="applicationlanguage-section-heading">
                                Additional EQHE Details
                            </h3>

                            <div className="applicationlanguage-form-grid">

                                <div className="applicationlanguage-form-group">
                                    <label className="applicationlanguage-form-label" htmlFor="anotherEqheDate">
                                        Date of EQHE
                                        {validationErrors.anotherEqheDate && <span className="applicationlanguage-error-star">*</span>}
                                    </label>
                                    <input
                                        type="date"
                                        id="anotherEqheDate"
                                        className={`applicationlanguage-form-input ${validationErrors.anotherEqheDate ? 'error' : ''}`}
                                        value={formData.anotherEqheDate || ''}
                                        onChange={(e) => {
                                            onInputChange('anotherEqheDate', e.target.value);
                                            if (validationErrors.anotherEqheDate) {
                                                setValidationErrors({ ...validationErrors, anotherEqheDate: null });
                                            }
                                        }}
                                    />
                                    {validationErrors.anotherEqheDate && (
                                        <div className="applicationlanguage-field-error">{validationErrors.anotherEqheDate}</div>
                                    )}
                                </div>

                                <div className="applicationlanguage-form-group">
                                    <label className="applicationlanguage-form-label" htmlFor="anotherEqheCity">City of EQHE</label>
                                    <input
                                        type="text"
                                        id="anotherEqheCity"
                                        className="applicationlanguage-form-input"
                                        value={formData.anotherEqheCity || ''}
                                        onChange={(e) => onInputChange('anotherEqheCity', e.target.value)}
                                        placeholder="Enter city"
                                    />
                                </div>

                                <div className="applicationlanguage-form-group">
                                    <label className="applicationlanguage-form-label required" htmlFor="anotherEqheCountry">
                                        Country of EQHE *
                                        {validationErrors.anotherEqheCountry && <span className="applicationlanguage-error-star">*</span>}
                                    </label>
                                    <select
                                        id="anotherEqheCountry"
                                        className={`applicationlanguage-form-select ${validationErrors.anotherEqheCountry ? 'error' : ''}`}
                                        value={formData.anotherEqheCountry || ''}
                                        onChange={(e) => {
                                            onInputChange('anotherEqheCountry', e.target.value);
                                            if (validationErrors.anotherEqheCountry) {
                                                setValidationErrors({ ...validationErrors, anotherEqheCountry: null });
                                            }
                                        }}
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map(country => (
                                            <option key={country.value} value={country.value}>{country.label}</option>
                                        ))}
                                    </select>
                                    {validationErrors.anotherEqheCountry && (
                                        <div className="applicationlanguage-field-error">{validationErrors.anotherEqheCountry}</div>
                                    )}
                                </div>

                                <div className="applicationlanguage-form-group full-width">
                                    <label className="applicationlanguage-form-label required" htmlFor="anotherEqheOriginalTitle">
                                        Original title of EQHE *
                                        {validationErrors.anotherEqheOriginalTitle && <span className="applicationlanguage-error-star">*</span>}
                                    </label>
                                    <select
                                        id="anotherEqheOriginalTitle"
                                        className={`applicationlanguage-form-select ${validationErrors.anotherEqheOriginalTitle ? 'error' : ''}`}
                                        value={formData.anotherEqheOriginalTitle || ''}
                                        onChange={(e) => {
                                            onInputChange('anotherEqheOriginalTitle', e.target.value);
                                            if (validationErrors.anotherEqheOriginalTitle) {
                                                setValidationErrors({ ...validationErrors, anotherEqheOriginalTitle: null });
                                            }
                                        }}
                                    >
                                        <option value="">Select EQHE Title</option>
                                        {eqheTitles.map(title => (
                                            <option key={title.value} value={title.value}>{title.label}</option>
                                        ))}
                                    </select>
                                    {validationErrors.anotherEqheOriginalTitle && (
                                        <div className="applicationlanguage-field-error">{validationErrors.anotherEqheOriginalTitle}</div>
                                    )}
                                </div>

                            </div>
                        </div>
                    )}

                    {/* Certificate Upload */}
                    {showAnotherEQHE && (
                        <div className="applicationlanguage-form-section upload-section">
                            <h3 className="applicationlanguage-section-heading">
                                EQHE Certificate
                            </h3>

                            <div className="applicationlanguage-upload-area">
                                {!formData.eqheCertificate ? (
                                    <div className="applicationlanguage-upload-prompt">
                                        <h4>Upload EQHE Certificate</h4>
                                        <p>PDF format (Max: 2MB)</p>
                                        <button
                                            className="applicationlanguage-upload-btn"
                                            onClick={() => document.getElementById('eqheCertificateUpload').click()}
                                            disabled={isSaving}
                                        >
                                            Choose File
                                        </button>
                                        <input
                                            type="file"
                                            id="eqheCertificateUpload"
                                            accept=".pdf"
                                            onChange={(e) => handleFileChange(e, 'eqheCertificate')}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="applicationlanguage-file-preview">
                                        <div className="applicationlanguage-file-info">
                                            <div className="applicationlanguage-file-details">
                                                <span className="applicationlanguage-file-name">{formData.eqheCertificate.name}</span>
                                                <span className="applicationlanguage-file-size">
                                                    {(formData.eqheCertificate.size / 1024 / 1024).toFixed(2)} MB
                                                </span>
                                            </div>
                                        </div>
                                        <div className="applicationlanguage-file-actions">
                                            <button
                                                className="applicationlanguage-file-action-btn view"
                                                onClick={() => window.open(URL.createObjectURL(formData.eqheCertificate))}
                                            >
                                                View
                                            </button>
                                            <button
                                                className="applicationlanguage-file-action-btn remove"
                                                onClick={() => onFileUpload('eqheCertificate', null)}
                                                disabled={isSaving}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Requirements Box */}
                    {!showAnotherEQHE && (
                        <div className="applicationlanguage-requirements-box">
                            <h4>Document Requirements</h4>
                            <ul className="applicationlanguage-requirements-list">
                                <li>
                                    <span>Official EQHE certificate/transcript</span>
                                </li>
                                <li>
                                    <span>If not in English/German, provide certified translation</span>
                                </li>
                                <li>
                                    <span>PDF format, max 2MB</span>
                                </li>
                            </ul>
                        </div>
                    )}

                </div>

                {/* Progress Steps */}
                <div className="applicationlanguage-progress-steps">
                    <div className="applicationlanguage-progress-step completed">
                        <span className="applicationlanguage-step-number">1</span>
                        <span className="applicationlanguage-step-label">Personal</span>
                    </div>
                    <div className="applicationlanguage-progress-step completed">
                        <span className="applicationlanguage-step-number">2</span>
                        <span className="applicationlanguage-step-label">Education</span>
                    </div>
                    <div className="applicationlanguage-progress-step active">
                        <span className="applicationlanguage-step-number">3</span>
                        <span className="applicationlanguage-step-label">EQHE</span>
                    </div>
                    <div className="applicationlanguage-progress-step">
                        <span className="applicationlanguage-step-number">4</span>
                        <span className="applicationlanguage-step-label">Special Needs</span>
                    </div>
                    <div className="applicationlanguage-progress-step">
                        <span className="applicationlanguage-step-number">5</span>
                        <span className="applicationlanguage-step-label">Review</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="applicationlanguage-form-actions">
                    <button className="applicationlanguage-btn-secondary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>Saving...</>
                        ) : (
                            <>Save</>
                        )}
                    </button>

                    <button className="applicationlanguage-btn-primary" onClick={handleSaveAndContinue} disabled={isSaving}>
                        {isSaving ? (
                            <>Saving...</>
                        ) : (
                            <>Save & Continue</>
                        )}
                    </button>
                </div>

            </div>

        </div>
    );
};

export default ApplicationLanguage;