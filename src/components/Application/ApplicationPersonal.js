// src/components/ApplicationPersonal.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ApplicationPersonal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bangladesh','Belarus','Belgium','Bolivia','Bosnia and Herzegovina',
  'Brazil','Bulgaria','Cambodia','Cameroon','Canada','Chile','China','Colombia',
  'Croatia','Cuba','Cyprus','Czech Republic','Denmark','Ecuador','Egypt',
  'El Salvador','Estonia','Ethiopia','Finland','France','Georgia','Germany',
  'Ghana','Greece','Guatemala','Honduras','Hungary','India','Indonesia','Iran',
  'Iraq','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan','Kenya',
  'Kosovo','Kuwait','Kyrgyzstan','Latvia','Lebanon','Libya','Lithuania',
  'Luxembourg','Malaysia','Mexico','Moldova','Mongolia','Montenegro','Morocco',
  'Myanmar','Nepal','Netherlands','New Zealand','Nigeria','North Korea','Norway',
  'Pakistan','Palestine','Panama','Paraguay','Peru','Philippines','Poland',
  'Portugal','Qatar','Romania','Russia','Saudi Arabia','Serbia','Singapore',
  'Slovakia','Slovenia','Somalia','South Africa','South Korea','Spain',
  'Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan',
  'Tanzania','Thailand','Tunisia','Turkey','Turkmenistan','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
  'Venezuela','Vietnam','Yemen','Zimbabwe'
];

const CITIZENSHIPS = [
  'Afghan','Albanian','Algerian','Argentine','Armenian','Australian','Austrian',
  'Azerbaijani','Bangladeshi','Belarusian','Belgian','Bolivian','Brazilian',
  'Bulgarian','Cambodian','Cameroonian','Canadian','Chilean','Chinese',
  'Colombian','Croatian','Cuban','Cypriot','Czech','Danish','Ecuadorian',
  'Egyptian','Estonian','Ethiopian','Finnish','French','Georgian','German',
  'Ghanaian','Greek','Guatemalan','Honduran','Hungarian','Indian','Indonesian',
  'Iranian','Iraqi','Irish','Israeli','Italian','Japanese','Jordanian',
  'Kazakhstani','Kenyan','Kuwaiti','Latvian','Lebanese','Libyan','Lithuanian',
  'Malaysian','Mexican','Moldovan','Mongolian','Moroccan','Nepalese','Dutch',
  'New Zealander','Nigerian','Norwegian','Pakistani','Panamanian','Paraguayan',
  'Peruvian','Filipino','Polish','Portuguese','Qatari','Romanian','Russian',
  'Saudi Arabian','Serbian','Singaporean','Slovak','Slovenian','Somali',
  'South African','South Korean','Spanish','Sri Lankan','Sudanese','Swedish',
  'Swiss','Syrian','Taiwanese','Tajik','Thai','Tunisian','Turkish','Ugandan',
  'Ukrainian','Emirati','British','American','Uruguayan','Uzbek','Venezuelan',
  'Vietnamese','Yemeni','Zimbabwean'
];

const ApplicationPersonal = ({ formData, onInputChange, onFileUpload, basePath }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [passportPreview,      setPassportPreview]      = useState(null);
  const [photoPreview,         setPhotoPreview]         = useState(null);
  const [isSubmitting,         setIsSubmitting]         = useState(false);
  const [isLoading,            setIsLoading]            = useState(true);
  const [error,                setError]                = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isEUCitizen,          setIsEUCitizen]          = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [needVisa,             setNeedVisa]             = useState('');
  const [referFriend,          setReferFriend]          = useState('');
  const [title,                setTitle]                = useState('');

  const getAuthToken = () => localStorage.getItem('token');

  // ─────────────────────────────────────────────
  // COMPLETION CALCULATION
  // ─────────────────────────────────────────────
  const calculateCompletion = (data) => {
    const textFields = [
      'firstName', 'lastName', 'email', 'dateOfBirth',
      'placeOfBirth', 'countryOfBirth', 'citizenship',
      'passportNumber', 'passportIssueDate', 'passportExpiryDate',
      'issuingCountry', 'mobile', 'correspondenceLanguage'
    ];

    const euCitizenValue = data.isEUCitizen !== undefined ? data.isEUCitizen : isEUCitizen;
    if (euCitizenValue === false) textFields.push('needVisa');

    const completedText = textFields.filter(field => {
      const value = field === 'needVisa' ? needVisa : data[field];
      return value && value.toString().trim() !== '';
    }).length;

    let fileCount = 0;
    if (data.passportFileName    || data.passportOriginalName)    fileCount++;
    if (data.photographFileName  || data.photographOriginalName)  fileCount++;

    return Math.round(((completedText + fileCount) / (textFields.length + 2)) * 100);
  };

  useEffect(() => {
    setCompletionPercentage(calculateCompletion(formData));
  }, [formData, isEUCitizen, needVisa]);

  // ─────────────────────────────────────────────
  // LOAD DATA
  // ─────────────────────────────────────────────
  useEffect(() => {
    const loadPersonalData = async () => {
      try {
        setIsLoading(true);
        const token = getAuthToken();
        if (!token) { setIsLoading(false); return; }

        const response = await axios.get(`${API_URL}/api/application/personal`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (response.data.success && response.data.personalInfo) {
          const d = response.data.personalInfo;

          Object.keys(d).forEach(key => {
            if (d[key] !== null && d[key] !== undefined) onInputChange(key, d[key]);
          });

          if (d.isEUCitizen  !== undefined) setIsEUCitizen(d.isEUCitizen);
          if (d.documentType)               setSelectedDocumentType(d.documentType);
          if (d.needVisa)                   setNeedVisa(d.needVisa);
          if (d.referFriend)                setReferFriend(d.referFriend);
          if (d.title)                      setTitle(d.title);
          if (d.passportFileUrl)            setPassportPreview(d.passportFileUrl);
          if (d.photographFileUrl)          setPhotoPreview(d.photographFileUrl);

          // Resume field mapping
          const resumeFields = [
            'title','firstName','lastName','email','mobile','dateOfBirth',
            'placeOfBirth','countryOfBirth','citizenship','passportNumber',
            'passportIssueDate','passportExpiryDate','issuingCountry',
            'isEUCitizen','needVisa','correspondenceLanguage'
          ];
          resumeFields.forEach(key => onInputChange(key, d[key] || (key === 'isEUCitizen' ? null : '')));

          setCompletionPercentage(calculateCompletion(d));
        }
      } catch (err) {
        console.error('Error loading personal data:', err);
        if (err.response?.status !== 404) setError('Failed to load personal data from server');
      } finally {
        setIsLoading(false);
      }
    };
    loadPersonalData();
  }, []);

  // ─────────────────────────────────────────────
  // FILE UPLOAD
  // ─────────────────────────────────────────────
  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }

    const allowedTypes = field === 'passport'
      ? ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      : ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      alert(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'photograph') setPhotoPreview(reader.result);
        else setPassportPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }

    try {
      const token = getAuthToken();
      if (!token) { alert('Please login again.'); return; }

      const uploadUrl = field === 'passport'
        ? `${API_URL}/api/application/personal/upload/passport`
        : `${API_URL}/api/application/personal/upload/photograph`;

      const uploadData = new FormData();
      uploadData.append('file', file);

      const response = await axios.post(uploadUrl, uploadData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        onFileUpload(field, file);
        onInputChange(`${field}FileName`,     response.data.fileName);
        onInputChange(`${field}FileUrl`,      response.data.fileUrl);
        onInputChange(`${field}OriginalName`, file.name);
        onInputChange(`${field}FileSize`,     file.size);
        onInputChange(`${field}FileType`,     file.type.split('/')[1]);
        onInputChange(`${field}UploadedAt`,   new Date().toISOString());
        alert(field === 'passport' ? 'Passport uploaded successfully!' : 'Photograph uploaded successfully!');
      }
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      if (field === 'photograph') setPhotoPreview(null);
      if (field === 'passport')   setPassportPreview(null);
      alert(err.response?.data?.message || 'Upload failed. Please try again.');
      e.target.value = '';
    }
  };

  const hasFile    = (field) => formData[`${field}FileName`] || formData[`${field}OriginalName`];
  const getFileName = (field) => formData[`${field}OriginalName`] || formData[`${field}FileName`] || 'Uploaded file';

  // ─────────────────────────────────────────────
  // REMOVE FILE
  // ─────────────────────────────────────────────
  const handleRemoveFile = async (field) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      if (formData[`${field}FileName`]) {
        try {
          await axios.delete(
            `${API_URL}/api/application/personal/files/${field}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch { console.log(`API error removing ${field}, continuing locally`); }
      }

      onFileUpload(field, null);
      ['FileName','FileUrl','OriginalName','FileSize','FileType','UploadedAt'].forEach(suffix => {
        onInputChange(`${field}${suffix}`, suffix === 'FileSize' ? 0 : suffix === 'UploadedAt' ? null : '');
      });

      if (field === 'photograph') {
        setPhotoPreview(null);
        const el = document.getElementById('photoUpload');
        if (el) el.value = '';
      }
      if (field === 'passport') {
        setPassportPreview(null);
        const el = document.getElementById('passportUpload');
        if (el) el.value = '';
      }

      alert(`${field === 'passport' ? 'Passport' : 'Photograph'} removed successfully!`);
    } catch (err) {
      console.error(`Error removing ${field}:`, err);
      alert(`Failed to remove ${field}. Please try again.`);
    }
  };

  // ─────────────────────────────────────────────
  // VALIDATE
  // ─────────────────────────────────────────────
  const validateForm = () => {
    const requiredFields = [
      'firstName','lastName','email','dateOfBirth','placeOfBirth',
      'countryOfBirth','citizenship','passportNumber','passportIssueDate',
      'passportExpiryDate','issuingCountry','mobile','correspondenceLanguage'
    ];

    const missingFields = requiredFields.filter(f => {
      const v = formData[f];
      return !v || v.toString().trim() === '';
    });

    if (isEUCitizen === false && (!needVisa || needVisa === '')) missingFields.push('visaRequirement');

    const missingFiles = [];
    if (!hasFile('passport'))   missingFiles.push('Passport');
    if (!hasFile('photograph')) missingFiles.push('Photograph');

    return { isValid: missingFields.length === 0 && missingFiles.length === 0, missingFields, missingFiles };
  };

  // ─────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────
  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      const validation = validateForm();

      if (!validation.isValid) {
        let msg = 'Please complete all required fields:\n\n';
        if (validation.missingFields.length > 0) {
          msg += 'Missing Information:\n';
          validation.missingFields.forEach(f => {
            msg += `• ${f.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace('visaRequirement', 'Visa Requirement')}\n`;
          });
        }
        if (validation.missingFiles.length > 0) {
          msg += '\nMissing Files:\n';
          validation.missingFiles.forEach(f => { msg += `• ${f}\n`; });
        }
        alert(msg);
        setIsSubmitting(false);
        return;
      }

      const token = getAuthToken();
      if (!token) { alert('Please login to save your application'); setIsSubmitting(false); return; }

      const saveData = {
        firstName: formData.firstName, lastName: formData.lastName, title,
        email: formData.email, dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth, countryOfBirth: formData.countryOfBirth,
        citizenship: formData.citizenship, passportNumber: formData.passportNumber,
        passportIssueDate: formData.passportIssueDate, passportExpiryDate: formData.passportExpiryDate,
        issuingCountry: formData.issuingCountry, mobile: formData.mobile,
        landline: formData.landline || '', correspondenceLanguage: formData.correspondenceLanguage,
        isEUCitizen, documentType: selectedDocumentType, needVisa, referFriend,
        passportFileName:       formData.passportFileName       || '',
        passportFileUrl:        formData.passportFileUrl        || '',
        passportOriginalName:   formData.passportOriginalName   || '',
        photographFileName:     formData.photographFileName      || '',
        photographFileUrl:      formData.photographFileUrl       || '',
        photographOriginalName: formData.photographOriginalName  || ''
      };

      const response = await axios.post(`${API_URL}/api/application/personal`, saveData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        // Resume field mapping
        const resumeMap = { title, firstName: formData.firstName, lastName: formData.lastName,
          email: formData.email, mobile: formData.mobile, dateOfBirth: formData.dateOfBirth,
          placeOfBirth: formData.placeOfBirth, countryOfBirth: formData.countryOfBirth,
          citizenship: formData.citizenship, passportNumber: formData.passportNumber,
          passportIssueDate: formData.passportIssueDate, passportExpiryDate: formData.passportExpiryDate,
          issuingCountry: formData.issuingCountry, isEUCitizen, needVisa,
          correspondenceLanguage: formData.correspondenceLanguage
        };
        Object.entries(resumeMap).forEach(([k, v]) => onInputChange(k, v));

        let targetPath = location.pathname.includes('/personal')
          ? location.pathname.replace('/personal', '/address')
          : '/firstyear/dashboard/application/address';
        navigate(targetPath);
      }
    } catch (err) {
      console.error('Error saving:', err);
      setError('Failed to save application');
      alert('Failed to save your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    let backPath = location.pathname.includes('/personal')
      ? location.pathname.replace('/personal', '')
      : '/firstyear/dashboard/application';
    navigate(backPath);
  };

  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="application-personal">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your personal information...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="application-personal">

      {/* ── Header ── */}
      <header className="personal-header">
        <div className="header-left">
          <h1>BA Communication Design</h1>
          <div className="application-id">APPLICATION ID - UEG0000104849</div>
        </div>
        <div className="applicationpersonal-progress-indicator">
          <div className="progress-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="circle"
                strokeDasharray={`${completionPercentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <text x="18" y="20.35" className="percentage">{completionPercentage}%</text>
            </svg>
          </div>
          <span className="applicationpersonal-progress-badge">{completionPercentage}% Completed</span>
        </div>
      </header>

      {/* ── Step Navigation ── */}
      <nav className="application-steps">
        {[
          'Study programme','Applicant Details','Address',
          'Entrance qualification','Higher Education',
          'Documents','Special Needs','Declaration','Review'
        ].map((step, i) => (
          <div key={step} className={`step${i < 1 ? ' completed' : i === 1 ? ' active' : ''}`}>
            <span className="step-number">{i < 1 ? '✓' : i + 1}</span>
            <span className="step-name">{step}</span>
          </div>
        ))}
      </nav>

      {/* ── Error Banner ── */}
      {error && (
        <div className="error-banner" role="alert">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError('')} className="error-close-btn" aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* ── Form Container ── */}
      <main className="personal-form-container">
        <div className="form-header">
          <h2>Applicant Details</h2>
          <p className="form-subtitle">
            Please fill in all information exactly as it appears on your passport or official documents.
            Do not use abbreviations or shortenings.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} noValidate>

          {/* ── Citizenship Status Section ── */}
          <section className="applicationpersonal-form-section">
            <h3 className="section-heading">
              <span className="section-icon">🌍</span> Citizenship Status
            </h3>

            <div className="applicationpersonal-form-group full-width">
              <label className="form-label required">Are you an EU Citizen?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="euCitizen"
                    checked={isEUCitizen === true}
                    onChange={() => { setIsEUCitizen(true); onInputChange('isEUCitizen', true); }}
                    disabled={isSubmitting} />
                  <span className="radio-text">Yes</span>
                </label>
                <label className="radio-label">
                  <input type="radio" name="euCitizen"
                    checked={isEUCitizen === false}
                    onChange={() => { setIsEUCitizen(false); onInputChange('isEUCitizen', false); }}
                    disabled={isSubmitting} />
                  <span className="radio-text">No</span>
                </label>
              </div>
            </div>

            {isEUCitizen === true && (
              <div className="applicationpersonal-form-group full-width">
                <label className="form-label required" htmlFor="documentType">
                  Please choose a document to upload
                </label>
                <select id="documentType" className="form-select"
                  value={selectedDocumentType}
                  onChange={(e) => { setSelectedDocumentType(e.target.value); onInputChange('documentType', e.target.value); }}
                  disabled={isSubmitting}>
                  <option value="">Select document type</option>
                  <option value="passport">Passport</option>
                  <option value="id_card">National ID Card</option>
                  <option value="residence_permit">Residence Permit</option>
                </select>
              </div>
            )}
          </section>

          {/* ── Personal Information Section ── */}
          <section className="applicationpersonal-form-section">
            <h3 className="section-heading">
              <span className="section-icon">👤</span> Personal Information
            </h3>
            <div className="applicationpersonal-form-grid">

              <div className="applicationpersonal-form-group">
                <label className="form-label" htmlFor="title">Title</label>
                <select id="title" className="form-select" value={title}
                  onChange={(e) => { setTitle(e.target.value); onInputChange('title', e.target.value); }}
                  disabled={isSubmitting}>
                  <option value="">Select</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                </select>
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="firstName">
                  First name <span className="field-hint">(FNU if missing)</span>
                </label>
                <input type="text" id="firstName" className="form-input"
                  value={formData.firstName || ''}
                  onChange={(e) => onInputChange('firstName', e.target.value)}
                  placeholder="As appears on passport"
                  autoComplete="given-name"
                  inputMode="text"
                  required disabled={isSubmitting} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="lastName">
                  Surname <span className="field-hint">(LNU if missing)</span>
                </label>
                <input type="text" id="lastName" className="form-input"
                  value={formData.lastName || ''}
                  onChange={(e) => onInputChange('lastName', e.target.value)}
                  placeholder="As appears on passport"
                  autoComplete="family-name"
                  inputMode="text"
                  required disabled={isSubmitting} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="email">Email address</label>
                <input type="email" id="email" className="form-input"
                  value={formData.email || ''}
                  onChange={(e) => onInputChange('email', e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                  inputMode="email"
                  required disabled={isSubmitting} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="dateOfBirth">Date of birth</label>
                <input type="date" id="dateOfBirth" className="form-input"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => onInputChange('dateOfBirth', e.target.value)}
                  autoComplete="bday"
                  required disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="placeOfBirth">Place of birth</label>
                <input type="text" id="placeOfBirth" className="form-input"
                  value={formData.placeOfBirth || ''}
                  onChange={(e) => onInputChange('placeOfBirth', e.target.value)}
                  placeholder="City / Town"
                  inputMode="text"
                  required disabled={isSubmitting} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="countryOfBirth">Country of birth</label>
                <select id="countryOfBirth" className="form-select"
                  value={formData.countryOfBirth || ''}
                  onChange={(e) => onInputChange('countryOfBirth', e.target.value)}
                  required disabled={isSubmitting}>
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="citizenship">Citizenship</label>
                <select id="citizenship" className="form-select"
                  value={formData.citizenship || ''}
                  onChange={(e) => onInputChange('citizenship', e.target.value)}
                  required disabled={isSubmitting}>
                  <option value="">Select citizenship</option>
                  {CITIZENSHIPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

            </div>
          </section>

          {/* ── Passport Details Section ── */}
          <section className="applicationpersonal-form-section">
            <h3 className="section-heading">
              <span className="section-icon">🛂</span> Passport Details
            </h3>
            <div className="applicationpersonal-form-grid">

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="passportNumber">Passport Number</label>
                <input type="text" id="passportNumber" className="form-input"
                  value={formData.passportNumber || ''}
                  onChange={(e) => onInputChange('passportNumber', e.target.value.toUpperCase())}
                  placeholder="e.g. A1234567"
                  autoCapitalize="characters"
                  inputMode="text"
                  required disabled={isSubmitting} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="passportIssueDate">Issue date</label>
                <input type="date" id="passportIssueDate" className="form-input"
                  value={formData.passportIssueDate || ''}
                  onChange={(e) => onInputChange('passportIssueDate', e.target.value)}
                  required disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="passportExpiryDate">Expiry date</label>
                <input type="date" id="passportExpiryDate" className="form-input"
                  value={formData.passportExpiryDate || ''}
                  onChange={(e) => onInputChange('passportExpiryDate', e.target.value)}
                  required disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="issuingCountry">Issuing Country</label>
                <select id="issuingCountry" className="form-select"
                  value={formData.issuingCountry || ''}
                  onChange={(e) => onInputChange('issuingCountry', e.target.value)}
                  required disabled={isSubmitting}>
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

            </div>

            {/* Visa requirement (non-EU only) */}
            {isEUCitizen === false && (
              <div className="applicationpersonal-form-group full-width visa-question">
                <label className="form-label required">Do you need a visa for this course?</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="needVisa" value="yes"
                      checked={needVisa === 'yes'}
                      onChange={(e) => { setNeedVisa(e.target.value); onInputChange('needVisa', e.target.value); }}
                      disabled={isSubmitting} />
                    <span className="radio-text">Yes</span>
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="needVisa" value="no"
                      checked={needVisa === 'no'}
                      onChange={(e) => { setNeedVisa(e.target.value); onInputChange('needVisa', e.target.value); }}
                      disabled={isSubmitting} />
                    <span className="radio-text">No</span>
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* ── Contact Information Section ── */}
          <section className="applicationpersonal-form-section">
            <h3 className="section-heading">
              <span className="section-icon">📞</span> Contact Information
            </h3>
            <div className="applicationpersonal-form-grid">

              <div className="applicationpersonal-form-group">
                <label className="form-label" htmlFor="landline">Landline / Home phone</label>
                <div className="phone-input">
                  <span className="country-code">+1</span>
                  <input type="tel" id="landline" className="form-input phone-number"
                    value={formData.landline || ''}
                    onChange={(e) => onInputChange('landline', e.target.value)}
                    placeholder="Home phone number"
                    autoComplete="tel"
                    inputMode="tel"
                    disabled={isSubmitting} />
                </div>
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="mobile">Mobile number</label>
                <div className="phone-input">
                  <span className="country-code">+91</span>
                  <input type="tel" id="mobile" className="form-input phone-number"
                    value={formData.mobile || ''}
                    onChange={(e) => onInputChange('mobile', e.target.value)}
                    placeholder="Mobile number"
                    autoComplete="tel"
                    inputMode="tel"
                    required disabled={isSubmitting} />
                </div>
              </div>

              <div className="applicationpersonal-form-group">
                <label className="form-label required" htmlFor="correspondenceLanguage">
                  Correspondence language
                </label>
                <select id="correspondenceLanguage" className="form-select"
                  value={formData.correspondenceLanguage || ''}
                  onChange={(e) => onInputChange('correspondenceLanguage', e.target.value)}
                  required disabled={isSubmitting}>
                  <option value="">Select language</option>
                  <option value="english">English</option>
                  <option value="german">German</option>
                </select>
              </div>

            </div>
          </section>

          {/* ── Document Upload Section ── */}
          <section className="applicationpersonal-form-section">
            <h3 className="section-heading">
              <span className="section-icon">📎</span> Document Upload
            </h3>
            <div className="applicationpersonal-form-grid">

              {/* Passport */}
              <div className="applicationpersonal-form-group">
                <label className="form-label required">Upload Passport</label>
                <div className="upload-area">
                  <i className="fas fa-cloud-upload-alt upload-prompt"></i>
                  <p className="upload-instruction">Drop file to attach, or browse</p>
                  <p className="upload-hint">JPG, JPEG, PNG or PDF · Max 5 MB</p>

                  {passportPreview ? (
                    <div className="image-preview">
                      <img src={passportPreview} alt="Passport preview" />
                      <button type="button" className="remove-image-btn"
                        aria-label="Remove passport"
                        onClick={() => handleRemoveFile('passport')}
                        disabled={isSubmitting}>×</button>
                    </div>
                  ) : hasFile('passport') ? (
                    <div className="file-info">
                      <i className="fas fa-file-pdf file-icon"></i>
                      <div className="file-details">
                        <span className="file-name">{getFileName('passport')}</span>
                        {formData.passportFileSize > 0 && (
                          <span className="file-size">
                            {(formData.passportFileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                      <button type="button" className="remove-file-btn"
                        aria-label="Remove passport file"
                        onClick={() => handleRemoveFile('passport')}
                        disabled={isSubmitting}>×</button>
                    </div>
                  ) : null}

                  <input type="file" id="passportUpload" accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange(e, 'passport')}
                    className="file-input-hidden"
                    disabled={isSubmitting} />
                  <button type="button" className="upload-button"
                    onClick={() => document.getElementById('passportUpload').click()}
                    disabled={isSubmitting}>
                    <i className="fas fa-upload"></i>
                    {hasFile('passport') ? ' Change File' : ' Browse'}
                  </button>
                </div>
              </div>

              {/* Photograph */}
              <div className="applicationpersonal-form-group">
                <label className="form-label required">Photograph</label>
                <div className="upload-area">
                  <i className="fas fa-camera upload-prompt"></i>
                  <p className="upload-instruction">Drop files to attach, or browse</p>
                  <p className="upload-hint">JPG, JPEG or PNG · Max 5 MB · Passport-size</p>

                  {photoPreview ? (
                    <div className="image-preview">
                      <img src={photoPreview} alt="Photo preview" />
                      <button type="button" className="remove-image-btn"
                        aria-label="Remove photo"
                        onClick={() => handleRemoveFile('photograph')}
                        disabled={isSubmitting}>×</button>
                    </div>
                  ) : hasFile('photograph') ? (
                    <div className="file-info">
                      <i className="fas fa-image file-icon"></i>
                      <div className="file-details">
                        <span className="file-name">{getFileName('photograph')}</span>
                        {formData.photographFileSize > 0 && (
                          <span className="file-size">
                            {(formData.photographFileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                      <button type="button" className="remove-file-btn"
                        aria-label="Remove photo file"
                        onClick={() => handleRemoveFile('photograph')}
                        disabled={isSubmitting}>×</button>
                    </div>
                  ) : null}

                  <input type="file" id="photoUpload" accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'photograph')}
                    className="file-input-hidden"
                    disabled={isSubmitting} />
                  <button type="button" className="upload-button"
                    onClick={() => document.getElementById('photoUpload').click()}
                    disabled={isSubmitting}>
                    <i className="fas fa-upload"></i>
                    {hasFile('photograph') ? ' Change Photo' : ' Browse'}
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* ── Refer a Friend Section ── */}
          <section className="applicationpersonal-form-section">
            <h3 className="section-heading">
              <span className="section-icon">🤝</span> Refer a Friend Scheme
            </h3>
            <div className="applicationpersonal-form-group full-width">
              <label className="form-label">Are you applying for a Refer a Friend Scheme?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="referFriend" value="no"
                    checked={referFriend === 'no'}
                    onChange={(e) => { setReferFriend(e.target.value); onInputChange('referFriend', e.target.value); }}
                    disabled={isSubmitting} />
                  <span className="radio-text">No</span>
                </label>
                <label className="radio-label">
                  <input type="radio" name="referFriend" value="yes"
                    checked={referFriend === 'yes'}
                    onChange={(e) => { setReferFriend(e.target.value); onInputChange('referFriend', e.target.value); }}
                    disabled={isSubmitting} />
                  <span className="radio-text">Yes</span>
                </label>
              </div>
            </div>
          </section>

          {/* ── Navigation Buttons ── */}
          <div className="applicationpersonal-form-actions">
            <button type="button" className="btn-secondary"
              onClick={handleBack} disabled={isSubmitting}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <button type="submit" className="applicationpersonal-btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? <><span className="loading-spinner"></span> Saving...</>
                : <>Next <i className="fas fa-arrow-right"></i></>
              }
            </button>
          </div>

          <div className="language-selector">
            <i className="fas fa-globe"></i>
            <span>English</span>
            <i className="fas fa-chevron-down"></i>
          </div>

        </form>
      </main>
    </div>
  );
};

export default ApplicationPersonal;