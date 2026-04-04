import React, { useState, useEffect, useCallback } from 'react';
import './ApplicationLanguage.css';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL ;

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
    }, [studentId, mapToResumeFields, onInputChange]); // ✅ stable, always same size

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
            <div className="language-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading your EQHE information...</p>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="language-container">

            {/* Success Toast */}
            {saveSuccess && (
                <div className="success-toast">
                    <span className="success-icon">✓</span>
                    <span>EQHE information saved successfully!</span>
                </div>
            )}

            {/* Error Toast */}
            {saveError && (
                <div className="error-toast">
                    <span className="error-icon">⚠️</span>
                    <span>{saveError}</span>
                    <button className="toast-close" onClick={() => setSaveError('')}>×</button>
                </div>
            )}

            {/* Upload Progress */}
            {showUploadProgress && (
                <div className="upload-progress">
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p>Uploading: {uploadProgress}%</p>
                </div>
            )}

            <div className="language-content">

                {/* ── Header ── */}
                <div className="section-header">
                    <div className="header-left">
                        <div className="section-number">3</div>
                        <div>
                            <h2 className="section-title">Entrance Qualification of Higher Education</h2>
                            <p className="section-subtitle">Provide your educational qualification that allows you to study at a university</p>
                        </div>
                    </div>
                    <div className="header-icon">🎓</div>
                </div>

                {/* ── Info Box ── */}
                <div className="info-card">
                    <div className="info-icon">ℹ️</div>
                    <div className="info-content">
                        <p>The entrance qualification of higher education (EQHE) is an educational qualification that allows you to study at a university. In some countries a university exam is required in addition to the secondary school certificate.</p>
                        <p className="info-examples">Examples: High School Diploma and SAT/ACT (USA), secondary de-registration certificate and Gaokao (China), Titulo di Bachiller and Examen de Estado (Colombia), Bachiller and Prueba di Acceso (Mexico), Attestat and Unified State Exam (Russia), High School Certificate and College Scholastic Aptitude Test (South Korea), etc.</p>
                    </div>
                </div>

                {/* ── Main Form Card ── */}
                <div className="form-card">

                    {/* Primary EQHE Section */}
                    <div className="form-section">
                        <h3 className="section-heading">
                            <span className="heading-icon">📋</span>
                            Primary EQHE Information
                        </h3>

                        <div className="form-grid">

                            {/* Date of EQHE */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="eqheDate">
                                    Date of EQHE
                                    {validationErrors.eqheDate && <span className="error-star">*</span>}
                                </label>
                                <input
                                    type="date"
                                    id="eqheDate"
                                    className={`form-input ${validationErrors.eqheDate ? 'error' : ''}`}
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
                                    <div className="field-error">{validationErrors.eqheDate}</div>
                                )}
                                <p className="field-helper">
                                    If you have not yet finished school, please select the expected completion date
                                </p>
                            </div>

                            {/* City of EQHE */}
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

                            {/* Country of EQHE */}
                            <div className="form-group">
                                <label className="form-label required" htmlFor="eqheCountry">
                                    Country of EQHE *
                                    {validationErrors.eqheCountry && <span className="error-star">*</span>}
                                </label>
                                <select
                                    id="eqheCountry"
                                    className={`form-select ${validationErrors.eqheCountry ? 'error' : ''}`}
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
                                    <div className="field-error">{validationErrors.eqheCountry}</div>
                                )}
                            </div>

                        </div>

                        {/* Original Title of EQHE */}
                        <div className="form-group full-width">
                            <label className="form-label required" htmlFor="eqheOriginalTitle">
                                Original title of EQHE *
                                {validationErrors.eqheOriginalTitle && <span className="error-star">*</span>}
                            </label>
                            <select
                                id="eqheOriginalTitle"
                                className={`form-select ${validationErrors.eqheOriginalTitle ? 'error' : ''}`}
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
                                <div className="field-error">{validationErrors.eqheOriginalTitle}</div>
                            )}
                            <p className="field-helper">
                                Please do not translate the title, but use Latin script. Select the option that matches your qualification.
                            </p>
                        </div>
                    </div>

                    {/* ── Another EQHE Checkbox ── */}
                    <div className="checkbox-section">
                        <label className="checkbox-wrapper">
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                checked={showAnotherEQHE}
                                onChange={handleAnotherEQHEChange}
                            />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label">
                                I have another EQHE that I obtained at an earlier date
                            </span>
                        </label>
                    </div>

                    {/* ── Another EQHE Section ── */}
                    {showAnotherEQHE && (
                        <div className="form-section another-section">
                            <h3 className="section-heading">
                                <span className="heading-icon">📋</span>
                                Additional EQHE Details
                            </h3>

                            <div className="form-grid">

                                <div className="form-group">
                                    <label className="form-label" htmlFor="anotherEqheDate">
                                        Date of EQHE
                                        {validationErrors.anotherEqheDate && <span className="error-star">*</span>}
                                    </label>
                                    <input
                                        type="date"
                                        id="anotherEqheDate"
                                        className={`form-input ${validationErrors.anotherEqheDate ? 'error' : ''}`}
                                        value={formData.anotherEqheDate || ''}
                                        onChange={(e) => {
                                            onInputChange('anotherEqheDate', e.target.value);
                                            if (validationErrors.anotherEqheDate) {
                                                setValidationErrors({ ...validationErrors, anotherEqheDate: null });
                                            }
                                        }}
                                    />
                                    {validationErrors.anotherEqheDate && (
                                        <div className="field-error">{validationErrors.anotherEqheDate}</div>
                                    )}
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
                                    <label className="form-label required" htmlFor="anotherEqheCountry">
                                        Country of EQHE *
                                        {validationErrors.anotherEqheCountry && <span className="error-star">*</span>}
                                    </label>
                                    <select
                                        id="anotherEqheCountry"
                                        className={`form-select ${validationErrors.anotherEqheCountry ? 'error' : ''}`}
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
                                        <div className="field-error">{validationErrors.anotherEqheCountry}</div>
                                    )}
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label required" htmlFor="anotherEqheOriginalTitle">
                                        Original title of EQHE *
                                        {validationErrors.anotherEqheOriginalTitle && <span className="error-star">*</span>}
                                    </label>
                                    <select
                                        id="anotherEqheOriginalTitle"
                                        className={`form-select ${validationErrors.anotherEqheOriginalTitle ? 'error' : ''}`}
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
                                        <div className="field-error">{validationErrors.anotherEqheOriginalTitle}</div>
                                    )}
                                </div>

                            </div>
                        </div>
                    )}

                    {/* ── Certificate Upload ── */}
                    {showAnotherEQHE && (
                        <div className="form-section upload-section">
                            <h3 className="section-heading">
                                <span className="heading-icon">📎</span>
                                EQHE Certificate
                            </h3>

                            <div className="upload-area">
                                {!formData.eqheCertificate ? (
                                    <div className="upload-prompt">
                                        <div className="upload-icon">📄</div>
                                        <h4>Upload EQHE Certificate</h4>
                                        <p>PDF format (Max: 2MB)</p>
                                        <button
                                            className="upload-btn"
                                            onClick={() => document.getElementById('eqheCertificateUpload').click()}
                                            disabled={isSaving}
                                        >
                                            <span className="btn-icon">📎</span>
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
                                    <div className="file-preview">
                                        <div className="file-info">
                                            <div className="file-icon">📄</div>
                                            <div className="file-details">
                                                <span className="file-name">{formData.eqheCertificate.name}</span>
                                                <span className="file-size">
                                                    {(formData.eqheCertificate.size / 1024 / 1024).toFixed(2)} MB
                                                </span>
                                            </div>
                                        </div>
                                        <div className="file-actions">
                                            <button
                                                className="file-action-btn view"
                                                onClick={() => window.open(URL.createObjectURL(formData.eqheCertificate))}
                                            >
                                                <span className="btn-icon">👁️</span>
                                                View
                                            </button>
                                            <button
                                                className="file-action-btn remove"
                                                onClick={() => onFileUpload('eqheCertificate', null)}
                                                disabled={isSaving}
                                            >
                                                <span className="btn-icon">🗑️</span>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Requirements Box ── */}
                    {!showAnotherEQHE && (
                        <div className="requirements-box">
                            <h4>Document Requirements</h4>
                            <ul className="requirements-list">
                                <li>
                                    <span className="requirement-icon">📄</span>
                                    <span>Official EQHE certificate/transcript</span>
                                </li>
                                <li>
                                    <span className="requirement-icon">🌐</span>
                                    <span>If not in English/German, provide certified translation</span>
                                </li>
                                <li>
                                    <span className="requirement-icon">📎</span>
                                    <span>PDF format, max 2MB</span>
                                </li>
                            </ul>
                        </div>
                    )}

                </div>
                {/* end form-card */}

                {/* ── Progress Steps ── */}
                <div className="progress-steps">
                    <div className="progress-step completed"><span className="step-number">1</span><span className="step-label">Personal</span></div>
                    <div className="progress-step completed"><span className="step-number">2</span><span className="step-label">Education</span></div>
                    <div className="progress-step active">   <span className="step-number">3</span><span className="step-label">EQHE</span></div>
                    <div className="progress-step">          <span className="step-number">4</span><span className="step-label">Special Needs</span></div>
                    <div className="progress-step">          <span className="step-number">5</span><span className="step-label">Review</span></div>
                </div>

                {/* ── Action Buttons ── */}
                <div className="form-actions">
                    <button className="btn btn-secondary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <><span className="spinner-small"></span>Saving...</>
                        ) : (
                            <><span className="btn-icon">💾</span>Save</>
                        )}
                    </button>

                    <button className="btn btn-primary" onClick={handleSaveAndContinue} disabled={isSaving}>
                        {isSaving ? (
                            <><span className="spinner-small"></span>Saving...</>
                        ) : (
                            <>Save & Continue<span className="btn-icon">→</span></>
                        )}
                    </button>
                </div>

            </div>
            {/* end language-content */}

        </div>
    );
};

export default ApplicationLanguage;