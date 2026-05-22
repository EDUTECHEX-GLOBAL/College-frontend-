import React, { useState, useEffect, useCallback } from 'react';
import './ApplicationLanguage.css';
import axiosInstance from '../../api/axiosInstance';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: converts a MongoDB ISO date string → "yyyy-MM-dd" for input[type=date]
// Uses UTC to avoid timezone-shift bugs (e.g. "2003-09-09T00:00:00Z" → "2003-09-08")
// ─────────────────────────────────────────────────────────────────────────────
const isoToDateInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getUTCFullYear();
    const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd   = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const getApplicationStorageKey = (studentId) =>
    studentId ? `gusApplicationData_${studentId}` : 'gusApplicationData';

const ApplicationLanguage = ({ formData, onInputChange, onFileUpload, studentId, onNext }) => {
    const [showAnotherEQHE, setShowAnotherEQHE] = useState(false);
    const [isSaving, setIsSaving]               = useState(false);
    const [isLoading, setIsLoading]             = useState(false);
    const [saveError, setSaveError]             = useState('');
    const [saveSuccess, setSaveSuccess]         = useState(false);
    const [uploadProgress, setUploadProgress]   = useState(0);
    const [showUploadProgress, setShowUploadProgress] = useState(false);
    const [validationErrors, setValidationErrors]     = useState({});

    // ─────────────────────────────────────────────────────────────
    // HELPER: Map EQHE fields → Resume field names
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
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchExistingData = async () => {
            if (!studentId || studentId === 'undefined') {
                console.warn('⚠️ Skipping EQHE fetch — studentId not ready:', studentId);
                return;
            }

            setIsLoading(true);
            try {
                const response = await axiosInstance.get(
                    `/api/application/language/student/${studentId}/eqhe`
                );

                const data = response.data?.data;
                if (!data) return;

                if (response.data.success) {
                    // FIX: use isoToDateInput() for both dates to avoid UTC timezone shift
                    if (data.eqheDate) {
                        onInputChange('eqheDate', isoToDateInput(data.eqheDate));
                    }
                    if (data.eqheCity)          onInputChange('eqheCity',          data.eqheCity);
                    if (data.eqheCountry)       onInputChange('eqheCountry',       data.eqheCountry);
                    if (data.eqheOriginalTitle) onInputChange('eqheOriginalTitle', data.eqheOriginalTitle);

                    // FIX: use Boolean() to ensure it's always a proper boolean
                    const hasAnother = Boolean(data.hasAnotherEQHE);
                    setShowAnotherEQHE(hasAnother);
                    onInputChange('hasAnotherEQHE', hasAnother);

                    if (hasAnother) {
                        if (data.anotherEqheDate) {
                            onInputChange('anotherEqheDate', isoToDateInput(data.anotherEqheDate));
                        }
                        if (data.anotherEqheCity)          onInputChange('anotherEqheCity',          data.anotherEqheCity);
                        if (data.anotherEqheCountry)       onInputChange('anotherEqheCountry',       data.anotherEqheCountry);
                        if (data.anotherEqheOriginalTitle) onInputChange('anotherEqheOriginalTitle', data.anotherEqheOriginalTitle);
                    }

                    mapToResumeFields(data);
                }
            } catch (error) {
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
    // CERTIFICATE UPLOAD — POSTs file to backend immediately
    // ─────────────────────────────────────────────────────────────
    const handleUploadCertificate = async (file, certificateType = 'eqheCertificate') => {
        if (!file) return;

        // FIX: guard — don't attempt upload if studentId isn't ready
        if (!studentId || studentId === 'undefined') {
            setSaveError('Cannot upload — student session not found. Please refresh and try again.');
            return;
        }

        const uploadFormData = new FormData();
        uploadFormData.append('eqheCertificate', file);
        uploadFormData.append('studentId', studentId);
        uploadFormData.append('certificateType', certificateType);

        setShowUploadProgress(true);
        setUploadProgress(0);
        setSaveError('');

        try {
            const response = await axiosInstance.post(
                `/api/application/language/student/${studentId}/eqhe/certificate`,
                uploadFormData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percent);
                    }
                }
            );

            if (response.data.success) {
                // FIX: only update React state AFTER confirmed backend success
                onFileUpload(certificateType, file);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                setSaveError('Upload failed — server returned an error. Please try again.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setSaveError(
                error.response?.data?.message ||
                'Failed to upload certificate. Please try again.'
            );
        } finally {
            setShowUploadProgress(false);
            setUploadProgress(0);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // FILE CHANGE — validates then triggers actual upload
    // ─────────────────────────────────────────────────────────────
    const handleFileChange = async (e, field) => {
        const file = e.target.files[0];
        // Reset so the same file can be re-selected after an error
        e.target.value = '';

        if (!file) return;

        if (file.type !== 'application/pdf') {
            setSaveError('Only PDF files are allowed');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setSaveError('File size must be less than 2MB');
            return;
        }

        setSaveError('');
        await handleUploadCertificate(file, field);
    };

    // ─────────────────────────────────────────────────────────────
    // CHECKBOX — another EQHE toggle
    // ─────────────────────────────────────────────────────────────
    const handleAnotherEQHEChange = (e) => {
        const checked = e.target.checked;
        // FIX: keep local state and formData in sync at the same time
        setShowAnotherEQHE(checked);
        onInputChange('hasAnotherEQHE', checked);

        if (!checked) {
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
        if (!dateString || dateString.trim() === '') return true;
        const d = new Date(dateString);
        return d instanceof Date && !isNaN(d);
    };

    // ─────────────────────────────────────────────────────────────
    // BUILD PAYLOAD — shared by save and saveAndContinue
    // FIX: use showAnotherEQHE (local state) as the reliable flag
    // because formData.hasAnotherEQHE can lag behind parent state flush
    // ─────────────────────────────────────────────────────────────
    const buildPayload = () => ({
        studentId,
        eqheDate:
            formData.eqheDate && formData.eqheDate.trim() !== ''
                ? formData.eqheDate
                : null,
        eqheCity:          formData.eqheCity          || '',
        eqheCountry:       formData.eqheCountry       || '',
        eqheOriginalTitle: formData.eqheOriginalTitle || '',
        hasAnotherEQHE:    showAnotherEQHE,
        anotherEqheDate:
            showAnotherEQHE && formData.anotherEqheDate && formData.anotherEqheDate.trim() !== ''
                ? formData.anotherEqheDate
                : null,
        anotherEqheCity:
            showAnotherEQHE ? (formData.anotherEqheCity          || '') : '',
        anotherEqheCountry:
            showAnotherEQHE ? (formData.anotherEqheCountry       || '') : '',
        anotherEqheOriginalTitle:
            showAnotherEQHE ? (formData.anotherEqheOriginalTitle || '') : '',
    });

    // ─────────────────────────────────────────────────────────────
    // SAVE (without navigate)
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
            const dataToSave = buildPayload();
            console.log('📤 Saving EQHE:', dataToSave);

            const response = await axiosInstance.post(
                `/api/application/language/student/${studentId}/eqhe`,
                dataToSave
            );

            if (response.data.success) {
                setSaveSuccess(true);
                mapToResumeFields(dataToSave);
                const draftData = { ...formData, ...dataToSave, studentId };
                localStorage.setItem(getApplicationStorageKey(studentId), JSON.stringify(draftData));
                localStorage.setItem('gusApplicationData', JSON.stringify(draftData));
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
            const dataToSave = buildPayload();
            console.log('📤 Saving & continuing EQHE:', dataToSave);

            const response = await axiosInstance.post(
                `/api/application/language/student/${studentId}/eqhe`,
                dataToSave
            );

            if (response.data.success) {
                mapToResumeFields(dataToSave);
                const draftData = { ...formData, ...dataToSave, studentId };
                localStorage.setItem(getApplicationStorageKey(studentId), JSON.stringify(draftData));
                localStorage.setItem('gusApplicationData', JSON.stringify(draftData));
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
                        <div
                            className="applicationlanguage-progress-bar"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
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
                            <h2 className="applicationlanguage-section-title">
                                Entrance Qualification of Higher Education
                            </h2>
                            <p className="applicationlanguage-section-subtitle">
                                Provide your educational qualification that allows you to study at a university
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="applicationlanguage-form-card">

                    {/* ── Primary EQHE Section ── */}
                    <div className="applicationlanguage-form-section">
                        <h3 className="applicationlanguage-section-heading">Primary EQHE Information</h3>

                        <div className="applicationlanguage-form-grid">

                            {/* Date of EQHE */}
                            <div className="applicationlanguage-form-group">
                                <label className="applicationlanguage-form-label" htmlFor="eqheDate">
                                    Date of EQHE
                                    {validationErrors.eqheDate && (
                                        <span className="applicationlanguage-error-star">*</span>
                                    )}
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
                                            setValidationErrors(prev => ({ ...prev, eqheDate: null }));
                                        }
                                    }}
                                />
                                {validationErrors.eqheDate && (
                                    <div className="applicationlanguage-field-error">
                                        {validationErrors.eqheDate}
                                    </div>
                                )}
                                <p className="applicationlanguage-field-helper">
                                    If you have not yet finished school, please select the expected completion date
                                </p>
                            </div>

                            {/* City of EQHE */}
                            <div className="applicationlanguage-form-group">
                                <label className="applicationlanguage-form-label" htmlFor="eqheCity">
                                    City of EQHE
                                </label>
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
                                    {validationErrors.eqheCountry && (
                                        <span className="applicationlanguage-error-star">*</span>
                                    )}
                                </label>
                                <select
                                    id="eqheCountry"
                                    className={`applicationlanguage-form-select ${validationErrors.eqheCountry ? 'error' : ''}`}
                                    value={formData.eqheCountry || ''}
                                    onChange={(e) => {
                                        onInputChange('eqheCountry', e.target.value);
                                        onInputChange('countryOfStudy', e.target.value);
                                        if (validationErrors.eqheCountry) {
                                            setValidationErrors(prev => ({ ...prev, eqheCountry: null }));
                                        }
                                    }}
                                    required
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                                {validationErrors.eqheCountry && (
                                    <div className="applicationlanguage-field-error">
                                        {validationErrors.eqheCountry}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Original Title of EQHE */}
                        <div className="applicationlanguage-form-group full-width">
                            <label className="applicationlanguage-form-label required" htmlFor="eqheOriginalTitle">
                                Original title of EQHE *
                                {validationErrors.eqheOriginalTitle && (
                                    <span className="applicationlanguage-error-star">*</span>
                                )}
                            </label>
                            <select
                                id="eqheOriginalTitle"
                                className={`applicationlanguage-form-select ${validationErrors.eqheOriginalTitle ? 'error' : ''}`}
                                value={formData.eqheOriginalTitle || ''}
                                onChange={(e) => {
                                    onInputChange('eqheOriginalTitle', e.target.value);
                                    onInputChange('englishTestType', e.target.value);
                                    if (validationErrors.eqheOriginalTitle) {
                                        setValidationErrors(prev => ({ ...prev, eqheOriginalTitle: null }));
                                    }
                                }}
                                required
                            >
                                <option value="">Select EQHE Title</option>
                                {eqheTitles.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            {validationErrors.eqheOriginalTitle && (
                                <div className="applicationlanguage-field-error">
                                    {validationErrors.eqheOriginalTitle}
                                </div>
                            )}
                            <p className="applicationlanguage-field-helper">
                                Please do not translate the title, but use Latin script.
                                Select the option that matches your qualification.
                            </p>
                        </div>
                    </div>

                    {/* ── Another EQHE Checkbox ── */}
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

                    {/* ── Additional EQHE Section ── */}
                    {showAnotherEQHE && (
                        <div className="applicationlanguage-form-section another-section">
                            <h3 className="applicationlanguage-section-heading">Additional EQHE Details</h3>

                            <div className="applicationlanguage-form-grid">

                                <div className="applicationlanguage-form-group">
                                    <label className="applicationlanguage-form-label" htmlFor="anotherEqheDate">
                                        Date of EQHE
                                        {validationErrors.anotherEqheDate && (
                                            <span className="applicationlanguage-error-star">*</span>
                                        )}
                                    </label>
                                    <input
                                        type="date"
                                        id="anotherEqheDate"
                                        className={`applicationlanguage-form-input ${validationErrors.anotherEqheDate ? 'error' : ''}`}
                                        value={formData.anotherEqheDate || ''}
                                        onChange={(e) => {
                                            onInputChange('anotherEqheDate', e.target.value);
                                            if (validationErrors.anotherEqheDate) {
                                                setValidationErrors(prev => ({ ...prev, anotherEqheDate: null }));
                                            }
                                        }}
                                    />
                                    {validationErrors.anotherEqheDate && (
                                        <div className="applicationlanguage-field-error">
                                            {validationErrors.anotherEqheDate}
                                        </div>
                                    )}
                                </div>

                                <div className="applicationlanguage-form-group">
                                    <label className="applicationlanguage-form-label" htmlFor="anotherEqheCity">
                                        City of EQHE
                                    </label>
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
                                        {validationErrors.anotherEqheCountry && (
                                            <span className="applicationlanguage-error-star">*</span>
                                        )}
                                    </label>
                                    <select
                                        id="anotherEqheCountry"
                                        className={`applicationlanguage-form-select ${validationErrors.anotherEqheCountry ? 'error' : ''}`}
                                        value={formData.anotherEqheCountry || ''}
                                        onChange={(e) => {
                                            onInputChange('anotherEqheCountry', e.target.value);
                                            if (validationErrors.anotherEqheCountry) {
                                                setValidationErrors(prev => ({ ...prev, anotherEqheCountry: null }));
                                            }
                                        }}
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                    {validationErrors.anotherEqheCountry && (
                                        <div className="applicationlanguage-field-error">
                                            {validationErrors.anotherEqheCountry}
                                        </div>
                                    )}
                                </div>

                                <div className="applicationlanguage-form-group full-width">
                                    <label className="applicationlanguage-form-label required" htmlFor="anotherEqheOriginalTitle">
                                        Original title of EQHE *
                                        {validationErrors.anotherEqheOriginalTitle && (
                                            <span className="applicationlanguage-error-star">*</span>
                                        )}
                                    </label>
                                    <select
                                        id="anotherEqheOriginalTitle"
                                        className={`applicationlanguage-form-select ${validationErrors.anotherEqheOriginalTitle ? 'error' : ''}`}
                                        value={formData.anotherEqheOriginalTitle || ''}
                                        onChange={(e) => {
                                            onInputChange('anotherEqheOriginalTitle', e.target.value);
                                            if (validationErrors.anotherEqheOriginalTitle) {
                                                setValidationErrors(prev => ({ ...prev, anotherEqheOriginalTitle: null }));
                                            }
                                        }}
                                    >
                                        <option value="">Select EQHE Title</option>
                                        {eqheTitles.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    {validationErrors.anotherEqheOriginalTitle && (
                                        <div className="applicationlanguage-field-error">
                                            {validationErrors.anotherEqheOriginalTitle}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    )}

                    {/* ── Certificate Upload (only when hasAnotherEQHE) ── */}
                    {showAnotherEQHE && (
                        <div className="applicationlanguage-form-section upload-section">
                            <h3 className="applicationlanguage-section-heading">EQHE Certificate</h3>

                            <div className="applicationlanguage-upload-area">
                                {!formData.eqheCertificate ? (
                                    <div className="applicationlanguage-upload-prompt">
                                        <h4>Upload EQHE Certificate</h4>
                                        <p>PDF format (Max: 2MB)</p>
                                        <button
                                            className="applicationlanguage-upload-btn"
                                            onClick={() =>
                                                document.getElementById('eqheCertificateUpload').click()
                                            }
                                            disabled={isSaving || showUploadProgress}
                                        >
                                            {showUploadProgress
                                                ? `Uploading ${uploadProgress}%...`
                                                : 'Choose File'}
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
                                                <span className="applicationlanguage-file-name">
                                                    {formData.eqheCertificate.name}
                                                </span>
                                                <span className="applicationlanguage-file-size">
                                                    {(formData.eqheCertificate.size / 1024 / 1024).toFixed(2)} MB
                                                </span>
                                            </div>
                                        </div>
                                        <div className="applicationlanguage-file-actions">
                                            <button
                                                className="applicationlanguage-file-action-btn view"
                                                onClick={() =>
                                                    window.open(URL.createObjectURL(formData.eqheCertificate))
                                                }
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

                    {/* ── Document Requirements (when no additional EQHE) ── */}
                    {!showAnotherEQHE && (
                        <div className="applicationlanguage-requirements-box">
                            <h4>Document Requirements</h4>
                            <ul className="applicationlanguage-requirements-list">
                                <li><span>Official EQHE certificate/transcript</span></li>
                                <li><span>If not in English/German, provide certified translation</span></li>
                                <li><span>PDF format, max 2MB</span></li>
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
                    <button
                        className="applicationlanguage-btn-secondary"
                        onClick={handleSave}
                        disabled={isSaving || showUploadProgress}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        className="applicationlanguage-btn-primary"
                        onClick={handleSaveAndContinue}
                        disabled={isSaving || showUploadProgress}
                    >
                        {isSaving ? 'Saving...' : 'Save & Continue'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ApplicationLanguage;
