// src/components/ApplicationPersonal.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaFileAlt, FaImage, FaTimes } from 'react-icons/fa';
import axiosInstance from '../../api/axiosInstance';
import { resolveFileUrl } from '../../../../utils/fileUrl';
import './ApplicationPersonal.css';



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

const TITLE_OPTIONS = [
  { value: 'Mr.', label: 'Mr.' },
  { value: 'Mrs.', label: 'Mrs.' },
  { value: 'Ms.', label: 'Ms.' },
  { value: 'Dr.', label: 'Dr.' },
  { value: 'Prof.', label: 'Prof.' },
];

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'passport', label: 'Passport' },
  { value: 'id_card', label: 'National ID Card' },
  { value: 'residence_permit', label: 'Residence Permit' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'german', label: 'German' },
];

const toSelectOptions = (items) => items.map(item => ({ value: item, label: item }));
const COUNTRY_OPTIONS = toSelectOptions(COUNTRIES);
const CITIZENSHIP_OPTIONS = toSelectOptions(CITIZENSHIPS);

const sanitizePhone = (value = '') => {
  let digits = value.replace(/\D/g, '');

  if (digits.length > 10 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  return digits.slice(0, 10);
};

const sanitizePassportNumber = (value = '') =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

const PERSONAL_INFO_FIELDS = [
  'firstName', 'lastName', 'title', 'email', 'dateOfBirth', 'placeOfBirth',
  'countryOfBirth', 'citizenship', 'gender', 'passportNumber',
  'passportIssueDate', 'passportExpiryDate', 'issuingCountry',
  'mobile', 'landline', 'correspondenceLanguage',
  'isEUCitizen', 'documentType', 'needVisa', 'referFriend',
  'passportFileName', 'passportFileKey', 'passportFileUrl', 'passportOriginalName',
  'passportFileType', 'passportFileSize', 'passportUploadedAt', 'passportValidationStatus',
  'photographFileName', 'photographFileKey', 'photographFileUrl', 'photographOriginalName',
  'photographFileType', 'photographFileSize', 'photographUploadedAt'
];

const isValidUploadValue = (value) =>
  typeof value === 'string' && value.trim() !== '' && value !== 'undefined' && value !== 'null';

const isValidFileUrl = (value) =>
  isValidUploadValue(value) && !/\/undefined(?:$|[/?#])/.test(value);

const hasTrimmedValue = (value) =>
  value !== undefined && value !== null && value.toString().trim() !== '';

const normalizeFileType = (value = '') => {
  const v = String(value || '').toLowerCase().trim();
  const mimeMap = {
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  };

  if (mimeMap[v]) return mimeMap[v];
  if (v.includes('/')) return v.split('/').pop();
  return v.replace('.', '');
};

const getFileExtension = (file = {}) =>
  normalizeFileType(file.name?.split('.').pop() || file.type || '');

const pickPersonalInfoFields = (data = {}) =>
  PERSONAL_INFO_FIELDS.reduce((acc, field) => {
    if (data[field] !== undefined && data[field] !== null) acc[field] = data[field];
    return acc;
  }, {});

const ApplicationPersonalSelect = ({
  id,
  value,
  options,
  placeholder,
  onChange,
  disabled,
  required,
  invalid,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectRef = useRef(null);
  const listboxId = `${id}-listbox`;
  const selectedOption = options.find(option => option.value === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter(option => option.label.toLowerCase().includes(normalizedQuery))
    : options;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
    window.requestAnimationFrame(() => document.getElementById(id)?.focus());
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) setIsOpen(true);
    }
  };

  return (
    <div
      ref={selectRef}
      className={`applicationpersonal-custom-select${isOpen ? ' is-open' : ''}${invalid ? ' is-invalid' : ''}`}
    >
      <button
        type="button"
        id={id}
        className={`applicationpersonal-form-select applicationpersonal-custom-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => !disabled && setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-required={required || undefined}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="applicationpersonal-custom-select-arrow" aria-hidden="true">⌄</span>
      </button>

      {isOpen && (
        <div className="applicationpersonal-custom-select-menu" id={listboxId} role="listbox">
          {searchable && (
            <input
              type="text"
              className="applicationpersonal-custom-select-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              autoFocus
            />
          )}

          <div className="applicationpersonal-custom-select-options">
            <button
              type="button"
              className={`applicationpersonal-custom-select-option${value === '' ? ' is-selected' : ''}`}
              role="option"
              aria-selected={value === ''}
              onClick={() => handleSelect('')}
            >
              {placeholder}
            </button>

            {filteredOptions.map(option => (
              <button
                type="button"
                key={option.value}
                className={`applicationpersonal-custom-select-option${value === option.value ? ' is-selected' : ''}`}
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="applicationpersonal-custom-select-empty">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ApplicationPersonal = ({ formData, onInputChange, onFileUpload, basePath, studentId }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [passportPreview,      setPassportPreview]      = useState(null);
  const [photoPreview,         setPhotoPreview]         = useState(null);
  const [failedPreviews,       setFailedPreviews]       = useState({});
  const [isSubmitting,         setIsSubmitting]         = useState(false);
  const [isLoading,            setIsLoading]            = useState(true);
  const [error,                setError]                = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isEUCitizen,          setIsEUCitizen]          = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [needVisa,             setNeedVisa]             = useState('');
  const [referFriend,          setReferFriend]          = useState('');
  const [title,                setTitle]                = useState('');
  const [localFormData,        setLocalFormData]        = useState(formData || {});
  const [validationErrors,     setValidationErrors]     = useState({
    missingFields: [],
    missingFiles: [],
    phoneErrors: [],
    passportErrors: [],
  });
  const hasHydratedPersonalData = useRef(false);
  const latestFormDataRef = useRef(formData || {});

  const setFieldValue = (field, value) => {
    const nextData = {
      ...latestFormDataRef.current,
      ...localFormData,
      [field]: value,
    };

    latestFormDataRef.current = nextData;
    setLocalFormData(nextData);
    setCompletionPercentage(calculateCompletion(nextData));
    onInputChange(field, value);
    persistApplicationDraft(nextData);
  };

  const getAuthToken = () => localStorage.getItem('token');

  const safeGetLocalStorage = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw === 'undefined' || raw === 'null') return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const safeSetLocalStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error writing localStorage["${key}"]:`, e);
      return false;
    }
  };

  const getApplicationStorageKey = (id) =>
    id ? `gusApplicationData_${id}` : 'gusApplicationData';

  const stripFileObjects = (data) => {
    const {
      passport,
      photograph,
      nationalId,
      transcripts,
      degreeCertificate,
      sop,
      lor1,
      lor2,
      portfolio,
      researchProposal,
      ...safeData
    } = data || {};

    return safeData;
  };

  const persistApplicationDraft = (updates = {}) => {
    const scopedKey = getApplicationStorageKey(studentId);
    const legacySaved = safeGetLocalStorage('gusApplicationData') || {};
    const scopedSaved = studentId ? safeGetLocalStorage(scopedKey) || {} : {};
    const nextData = {
      ...legacySaved,
      ...scopedSaved,
      ...stripFileObjects(latestFormDataRef.current),
      ...updates,
      ...(studentId ? { studentId } : {}),
    };

    safeSetLocalStorage('gusApplicationData', nextData);
    if (studentId) safeSetLocalStorage(scopedKey, nextData);

    return nextData;
  };

  const handlePhoneChange = (field) => (e) => {
    setFieldValue(field, sanitizePhone(e.target.value));
  };

  const handlePhonePaste = (field) => (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    setFieldValue(field, sanitizePhone(pasted));
  };

  // COMPLETION CALCULATION
  const calculateCompletion = (data) => {
    const textFields = [
      'firstName', 'lastName', 'email', 'dateOfBirth',
      'placeOfBirth', 'countryOfBirth', 'citizenship',
      'gender', 'passportNumber', 'passportIssueDate', 'passportExpiryDate',
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
    const safeFormData = {};
    Object.entries(formData || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        safeFormData[key] = value;
      }
    });

    if (Object.keys(safeFormData).length > 0) {
      const merged = {
        ...latestFormDataRef.current,
        ...localFormData,
        ...safeFormData,
      };

      latestFormDataRef.current = merged;
      setLocalFormData(merged);
      setCompletionPercentage(calculateCompletion(merged));
    } else {
      setCompletionPercentage(calculateCompletion(latestFormDataRef.current));
    }
  }, [formData]);

  // LOAD DATA
  useEffect(() => {
    const loadPersonalData = async () => {
      if (hasHydratedPersonalData.current) return;

      try {
        setIsLoading(true);
        const token = getAuthToken();
        if (!token) { setIsLoading(false); return; }
const response = await axiosInstance.get('/api/application/personal');
        if (response.data.success && response.data.personalInfo) {
          hasHydratedPersonalData.current = true;
          const d = response.data.personalInfo;
          const safeLoadedData = {};
          Object.entries(d).forEach(([key, value]) => {
            if (value !== undefined && value !== null && String(value).trim() !== '') {
              safeLoadedData[key] = value;
            }
          });
          const safeCurrentData = {};
          Object.entries(latestFormDataRef.current || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && String(value).trim() !== '') {
              safeCurrentData[key] = value;
            }
          });

          const mergedData = {
            ...safeLoadedData,
            ...safeCurrentData,
          };

          latestFormDataRef.current = mergedData;
          setLocalFormData(mergedData);
          persistApplicationDraft(mergedData);

          Object.keys(safeLoadedData).forEach(key => {
            const value = key === 'mobile' || key === 'landline'
              ? sanitizePhone(safeLoadedData[key])
              : key === 'passportNumber'
              ? sanitizePassportNumber(safeLoadedData[key])
              : safeLoadedData[key];
            onInputChange(key, value);
          });

          if (mergedData.isEUCitizen  !== undefined) setIsEUCitizen(mergedData.isEUCitizen);
          if (mergedData.documentType)               setSelectedDocumentType(mergedData.documentType);
          if (mergedData.needVisa)                   setNeedVisa(mergedData.needVisa);
          if (mergedData.referFriend)                setReferFriend(mergedData.referFriend);
          if (mergedData.title)                      setTitle(mergedData.title);
          if (isValidFileUrl(mergedData.passportFileUrl) && normalizeFileType(mergedData.passportFileType) !== 'pdf') {
            setPassportPreview(resolveFileUrl(mergedData.passportFileKey || mergedData.passportFileUrl));
          }
          if (isValidFileUrl(mergedData.photographFileUrl)) {
            setPhotoPreview(resolveFileUrl(mergedData.photographFileKey || mergedData.photographFileUrl));
          }

          setCompletionPercentage(calculateCompletion(mergedData));
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

  // FILE UPLOAD
  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxFileSize = field === 'photograph' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      alert(field === 'photograph' ? 'Photograph must be less than 2 MB.' : 'File size must be less than 5MB');
      return;
    }

    const allowedTypes = field === 'passport'
      ? ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      : ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      alert(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    setFailedPreviews(prev => ({ ...prev, [field]: false }));

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'photograph') setPhotoPreview(reader.result);
        else setPassportPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (field === 'passport') {
      setPassportPreview(null);
    }

    try {
      const token = getAuthToken();
      if (!token) { alert('Please login again.'); return; }

      const currentDataBeforeUpload = {
        ...localFormData,
        ...latestFormDataRef.current,
      };

      latestFormDataRef.current = currentDataBeforeUpload;
      setLocalFormData(currentDataBeforeUpload);
      persistApplicationDraft(currentDataBeforeUpload);

      const uploadUrl = field === 'passport'
        ? '/api/application/personal/upload/passport'
        : '/api/application/personal/upload/photograph';

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('personalData', JSON.stringify(currentDataBeforeUpload));

      const response = await axiosInstance.post(uploadUrl, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        if (!isValidUploadValue(response.data.fileName)) {
          const message = 'Upload failed: server did not return a file name.';
          setError(message);
          if (field === 'photograph') setPhotoPreview(null);
          if (field === 'passport') setPassportPreview(null);
          alert(message);
          e.target.value = '';
          return;
        }

        const uploadedAt = new Date().toISOString();
        const fileExtension = getFileExtension(file);
        const fileUpdates = {
          [`${field}FileName`]: response.data.fileName,
          [`${field}FileKey`]: response.data.fileKey || '',
          [`${field}FileUrl`]: isValidFileUrl(response.data.fileUrl) ? response.data.fileUrl : '',
          [`${field}OriginalName`]: response.data.originalName || file.name,
          [`${field}FileSize`]: response.data.fileSize || file.size,
          [`${field}FileType`]: normalizeFileType(response.data.fileType || fileExtension),
          [`${field}UploadedAt`]: uploadedAt,
        };

        const mergedData = {
          ...currentDataBeforeUpload,
          ...fileUpdates,
        };

        latestFormDataRef.current = mergedData;
        setLocalFormData(mergedData);
        persistApplicationDraft(mergedData);

        Object.entries(fileUpdates).forEach(([key, value]) => {
          onInputChange(key, value);
        });
        onFileUpload(field, file);

        setValidationErrors(prev => ({
          ...prev,
          missingFiles: prev.missingFiles.filter(name => name.toLowerCase() !== field.toLowerCase()),
        }));
        window.dispatchEvent(new Event('applicationUpdated'));
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

  const hasFile = (field, data = latestFormDataRef.current) => {
    return Boolean(
      data?.[`${field}FileName`] ||
      data?.[`${field}OriginalName`] ||
      data?.[`${field}FileKey`] ||
      data?.[`${field}FileUrl`]
    );
  };
  const getFileName = (field) => localFormData[`${field}OriginalName`] || localFormData[`${field}FileName`] || 'Uploaded file';
  const getFileSize = (field) => {
    const size = Number(localFormData[`${field}FileSize`] || 0);
    return size > 0 ? `${(size / 1024 / 1024).toFixed(2)} MB` : '';
  };
  const getPreviewUrl = (field) => {
    const preview = field === 'photograph' ? photoPreview : passportPreview;
    if (isValidFileUrl(preview)) return preview;
    return resolveFileUrl(
      localFormData[`${field}FileKey`] || localFormData[`${field}FileUrl`]
    );
  };
  const canShowPhotoPreview = () => {
    const previewUrl = getPreviewUrl('photograph');
    return hasFile('photograph') && !failedPreviews.photograph && isValidFileUrl(previewUrl);
  };

  const fieldLabels = {
    firstName: 'First name',
    lastName: 'Surname',
    email: 'Email address',
    dateOfBirth: 'Date of birth',
    placeOfBirth: 'Place of birth',
    countryOfBirth: 'Country of birth',
    citizenship: 'Citizenship',
    gender: 'Gender',
    passportNumber: 'Passport number',
    passportIssueDate: 'Passport issue date',
    passportExpiryDate: 'Passport expiry date',
    issuingCountry: 'Issuing country',
    mobile: 'Mobile number',
    correspondenceLanguage: 'Correspondence language',
    visaRequirement: 'Visa requirement',
  };

  const formatValidationSummary = (validation) => {
    const messages = [];
    if (validation.missingFields.length > 0) {
      messages.push(`Missing information: ${validation.missingFields.map(f => fieldLabels[f] || f).join(', ')}`);
    }
    if (validation.missingFiles.length > 0) {
      messages.push(`Missing files: ${validation.missingFiles.join(', ')}`);
    }
    if (validation.phoneErrors.length > 0) messages.push(validation.phoneErrors.join(' '));
    if (validation.passportErrors.length > 0) messages.push(validation.passportErrors.join(' '));
    return messages.join(' ');
  };

  const scrollToFirstMissingField = (validation) => {
    const firstField = validation.missingFields[0]
      || (validation.phoneErrors.length > 0 ? 'mobile' : '')
      || (validation.passportErrors.length > 0 ? 'passportNumber' : '')
      || (validation.missingFiles[0] ? validation.missingFiles[0].toLowerCase() : '');

    if (!firstField) return;

    const target = document.querySelector(`[data-validation-field="${firstField}"]`)
      || document.getElementById(firstField)
      || document.getElementById(firstField === 'photograph' ? 'photoUpload' : `${firstField}Upload`);

    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = target?.matches?.('input, select, textarea, button')
      ? target
      : target?.querySelector?.('input:not([type="hidden"]), select, textarea, button');
    focusable?.focus?.({ preventScroll: true });
  };

  const isFileInvalid = (field) =>
    validationErrors.missingFiles.some(name => name.toLowerCase() === field.toLowerCase());

  const getUploadGroupClass = (field) =>
    `applicationpersonal-form-group${isFileInvalid(field) ? ' is-invalid' : ''}`;

  const hasValidationErrors = validationErrors.missingFields.length > 0
    || validationErrors.missingFiles.length > 0
    || validationErrors.phoneErrors.length > 0
    || validationErrors.passportErrors.length > 0;

  // REMOVE FILE
  const handleRemoveFile = async (field) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      if (localFormData[`${field}FileName`]) {
        try {
         await axiosInstance.delete(`/api/application/personal/files/${field}`);
        } catch { console.log(`API error removing ${field}, continuing locally`); }
      }

      onFileUpload(field, null);
      const clearedFileUpdates = {};
      ['FileName','FileKey','FileUrl','OriginalName','FileSize','FileType','UploadedAt'].forEach(suffix => {
        const value = suffix === 'FileSize' ? 0 : suffix === 'UploadedAt' ? null : '';
        clearedFileUpdates[`${field}${suffix}`] = value;
        setFieldValue(`${field}${suffix}`, value);
      });
      persistApplicationDraft(clearedFileUpdates);
      window.dispatchEvent(new Event('applicationUpdated'));

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

  // VALIDATE
  const validateForm = (data = {}) => {
    const dataToValidate = {
      ...formData,
      ...localFormData,
      ...latestFormDataRef.current,
      ...data,
    };

    const requiredFields = [
      'firstName','lastName','email','dateOfBirth','placeOfBirth',
      'countryOfBirth','citizenship','gender','passportNumber','passportIssueDate',
      'passportExpiryDate','issuingCountry','mobile','correspondenceLanguage'
    ];

    const missingFields = requiredFields.filter(f => {
      const v = f === 'mobile' ? sanitizePhone(dataToValidate[f] || '') : dataToValidate[f];
      return !hasTrimmedValue(v);
    });

    const euCitizenValue = dataToValidate.isEUCitizen !== undefined ? dataToValidate.isEUCitizen : isEUCitizen;
    const needVisaValue = dataToValidate.needVisa !== undefined ? dataToValidate.needVisa : needVisa;
    if (euCitizenValue === false && !hasTrimmedValue(needVisaValue)) missingFields.push('visaRequirement');

    const mobile = sanitizePhone(dataToValidate.mobile || '');
    const landline = sanitizePhone(dataToValidate.landline || '');
    const phoneErrors = [];
    if (mobile && mobile.length !== 10) phoneErrors.push('Mobile number must be exactly 10 digits');
    if (landline && landline.length !== 10) phoneErrors.push('Landline / Home phone must be exactly 10 digits');

    const passportNumber = sanitizePassportNumber(dataToValidate.passportNumber || '');
    const passportErrors = [];
    if (passportNumber && !/^[A-Z0-9]{6,12}$/.test(passportNumber)) {
      passportErrors.push('Passport number must be 6 to 12 letters or numbers');
    }

    const missingFiles = [];
    if (!hasFile('passport', dataToValidate))   missingFiles.push('Passport');
    if (!hasFile('photograph', dataToValidate)) missingFiles.push('Photograph');

    console.log('Validation Data:', dataToValidate);
    console.log('Missing Fields:', missingFields);

    return {
      isValid: missingFields.length === 0 && missingFiles.length === 0 && phoneErrors.length === 0 && passportErrors.length === 0,
      missingFields,
      missingFiles,
      phoneErrors,
      passportErrors,
    };
  };

  // SUBMIT
  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      const currentFormData = {
        ...localFormData,
        ...latestFormDataRef.current,
      };

      console.log("FINAL DATA BEFORE VALIDATION", currentFormData);

      const validation = validateForm(currentFormData);

      if (!validation.isValid) {
        setValidationErrors(validation);
        setError(formatValidationSummary(validation) || 'Please complete all required fields before continuing.');
        scrollToFirstMissingField(validation);
        setIsSubmitting(false);
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
        if (validation.phoneErrors.length > 0) {
          msg += '\nInvalid Phone Numbers:\n';
          validation.phoneErrors.forEach(f => { msg += `- ${f}\n`; });
        }
        if (validation.passportErrors.length > 0) {
          msg += '\nInvalid Passport Number:\n';
          validation.passportErrors.forEach(f => { msg += `- ${f}\n`; });
        }
        alert(msg);
        setIsSubmitting(false);
        return;
      }

      setValidationErrors({
        missingFields: [],
        missingFiles: [],
        phoneErrors: [],
        passportErrors: [],
      });

      const token = getAuthToken();
      if (!token) { alert('Please login to save your application'); setIsSubmitting(false); return; }

      const sanitizedMobile = sanitizePhone(currentFormData.mobile || '');
      const sanitizedLandline = sanitizePhone(currentFormData.landline || '');
      const sanitizedPassportNumber = sanitizePassportNumber(currentFormData.passportNumber || '');

      const saveData = {
        firstName: currentFormData.firstName, lastName: currentFormData.lastName, title: currentFormData.title || title,
        email: currentFormData.email, dateOfBirth: currentFormData.dateOfBirth,
        placeOfBirth: currentFormData.placeOfBirth, countryOfBirth: currentFormData.countryOfBirth,
        citizenship: currentFormData.citizenship, gender: currentFormData.gender || '', passportNumber: sanitizedPassportNumber,
        passportIssueDate: currentFormData.passportIssueDate, passportExpiryDate: currentFormData.passportExpiryDate,
        issuingCountry: currentFormData.issuingCountry, mobile: sanitizedMobile,
        landline: sanitizedLandline, correspondenceLanguage: currentFormData.correspondenceLanguage,
        isEUCitizen: currentFormData.isEUCitizen !== undefined ? currentFormData.isEUCitizen : isEUCitizen,
        documentType: currentFormData.documentType || selectedDocumentType,
        needVisa: currentFormData.needVisa || needVisa,
        referFriend: currentFormData.referFriend || referFriend,
        passportFileName:       currentFormData.passportFileName       || '',
        passportFileKey:        currentFormData.passportFileKey        || '',
        passportFileUrl:        currentFormData.passportFileUrl        || '',
        passportOriginalName:   currentFormData.passportOriginalName   || '',
        passportFileSize:       currentFormData.passportFileSize       || 0,
        passportFileType:       normalizeFileType(currentFormData.passportFileType),
        passportUploadedAt:     currentFormData.passportUploadedAt     || null,
        passportValidationStatus: currentFormData.passportValidationStatus || 'not_checked',
        photographFileName:     currentFormData.photographFileName      || '',
        photographFileKey:      currentFormData.photographFileKey       || '',
        photographFileUrl:      currentFormData.photographFileUrl       || '',
        photographOriginalName: currentFormData.photographOriginalName  || '',
        photographFileSize:     currentFormData.photographFileSize      || 0,
        photographFileType:     normalizeFileType(currentFormData.photographFileType),
        photographUploadedAt:   currentFormData.photographUploadedAt    || null
      };

      console.log('Personal Information Payload', saveData);

     const response = await axiosInstance.post('/api/application/personal', saveData);
      if (response.data.success) {
        if (!response.data.personalInfo) {
          throw new Error('Server did not return saved personal information');
        }

        const latestPersonalData = pickPersonalInfoFields(response.data.personalInfo);

        Object.entries(latestPersonalData).forEach(([key, value]) => setFieldValue(key, value));
        persistApplicationDraft(latestPersonalData);
        window.dispatchEvent(new Event('applicationUpdated'));

        let targetPath = location.pathname.includes('/personal')
          ? location.pathname.replace('/personal', '/address')
          : '/firstyear/dashboard/application/address';
        navigate(targetPath);
      }
    } catch (err) {
      console.error('Error saving:', err);
      const message = err.response?.data?.message || 'Failed to save application';
      setError(message);
      alert(`${message}. Please try again.`);
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

  // LOADING
  if (isLoading) {
    return (
      <div className="applicationpersonal">
        <div className="applicationpersonal-loading-state">
          <div className="applicationpersonal-loading-spinner"></div>
          <p>Loading your personal information...</p>
        </div>
      </div>
    );
  }

  // RENDER
  return (
    <div className="applicationpersonal">

      {/* Header */}
      <header className="applicationpersonal-header">
        <div className="applicationpersonal-header-left">
          <h1>BA Communication Design</h1>
          <div className="applicationpersonal-application-id">APPLICATION ID - UEG0000104849</div>
        </div>
        <div className="applicationpersonal-progress-indicator">
          <div className="applicationpersonal-progress-circle">
            <svg viewBox="0 0 36 36" className="applicationpersonal-circular-chart">
              <path className="applicationpersonal-circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="applicationpersonal-circle"
                strokeDasharray={`${completionPercentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <text x="18" y="20.35" className="applicationpersonal-percentage">{completionPercentage}%</text>
            </svg>
          </div>
          <span className="applicationpersonal-progress-badge">{completionPercentage}% Completed</span>
        </div>
      </header>

      {/* Step Navigation */}
      <nav className="applicationpersonal-steps">
        {[
          'Study programme','Applicant Details','Address',
          'Entrance qualification','Higher Education',
          'Documents','Special Needs','Declaration','Review'
        ].map((step, i) => (
          <div key={step} className={`applicationpersonal-step${i < 1 ? ' completed' : i === 1 ? ' active' : ''}`}>
            <span className="applicationpersonal-step-number">{i < 1 ? '✓' : i + 1}</span>
            <span className="applicationpersonal-step-name">{step}</span>
          </div>
        ))}
      </nav>

      {/* Error Banner */}
      {error && (
        <div className="applicationpersonal-error-banner" role="alert">
          <span className="applicationpersonal-error-icon">⚠</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="applicationpersonal-error-close-btn" aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* Form Container */}
      <main className="applicationpersonal-form-container">
        <div className="applicationpersonal-form-header">
          <h2>Applicant Details</h2>
          <p className="applicationpersonal-form-subtitle">
            Please fill in all information exactly as it appears on your passport or official documents.
            Do not use abbreviations or shortenings.
          </p>
        </div>

        <form
          className={hasValidationErrors ? 'applicationpersonal-form-has-errors' : ''}
          onSubmit={(e) => { e.preventDefault(); handleContinue(); }}
          noValidate
        >

          {/* Citizenship Status Section */}
          <section className="applicationpersonal-form-section">
            <h3 className="applicationpersonal-section-heading">
              Citizenship Status
            </h3>

            <div className="applicationpersonal-form-group full-width">
              <label className="applicationpersonal-form-label required">Are you an EU Citizen?</label>
              <div className="applicationpersonal-radio-group">
                <label className="applicationpersonal-radio-label">
                  <input type="radio" name="euCitizen"
                    checked={isEUCitizen === true}
                    onChange={() => { setIsEUCitizen(true); setFieldValue('isEUCitizen', true); }}
                    disabled={isSubmitting} />
                  <span className="applicationpersonal-radio-text">Yes</span>
                </label>
                <label className="applicationpersonal-radio-label">
                  <input type="radio" name="euCitizen"
                    checked={isEUCitizen === false}
                    onChange={() => { setIsEUCitizen(false); setFieldValue('isEUCitizen', false); }}
                    disabled={isSubmitting} />
                  <span className="applicationpersonal-radio-text">No</span>
                </label>
              </div>
            </div>

            {isEUCitizen === true && (
              <div className="applicationpersonal-form-group full-width">
                <label className="applicationpersonal-form-label required" htmlFor="documentType">
                  Please choose a document to upload
                </label>
                <ApplicationPersonalSelect
                  id="documentType"
                  value={localFormData.documentType || ''}
                  options={DOCUMENT_TYPE_OPTIONS}
                  placeholder="Select document type"
                  onChange={(nextValue) => { setSelectedDocumentType(nextValue); setFieldValue('documentType', nextValue); }}
                  disabled={isSubmitting}
                  required
                />
              </div>
            )}
          </section>

          {/* Personal Information Section */}
          <section className="applicationpersonal-form-section">
            <h3 className="applicationpersonal-section-heading">
              Personal Information
            </h3>
            <div className="applicationpersonal-form-grid">

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label" htmlFor="title">Title</label>
                <ApplicationPersonalSelect
                  id="title"
                  value={localFormData.title || ''}
                  options={TITLE_OPTIONS}
                  placeholder="Select"
                  onChange={(nextValue) => { setTitle(nextValue); setFieldValue('title', nextValue); }}
                  disabled={isSubmitting}
                />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="firstName">
                  First name <span className="applicationpersonal-field-hint">(FNU if missing)</span>
                </label>
                <input type="text" id="firstName" className="applicationpersonal-form-input"
                  value={localFormData.firstName || ''}
                  onChange={(e) => setFieldValue('firstName', e.target.value)}
                  placeholder="As appears on passport"
                  autoComplete="given-name"
                  inputMode="text"
                  required disabled={isSubmitting} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="lastName">
                  Surname <span className="applicationpersonal-field-hint">(LNU if missing)</span>
                </label>
                <input type="text" id="lastName" className="applicationpersonal-form-input"
                  value={localFormData.lastName || ''}
                  onChange={(e) => setFieldValue('lastName', e.target.value)}
                  placeholder="As appears on passport"
                  autoComplete="family-name"
                  inputMode="text"
                  required disabled={isSubmitting} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="email">Email address</label>
                <input type="email" id="email" className="applicationpersonal-form-input"
                  value={localFormData.email || ''}
                  onChange={(e) => setFieldValue('email', e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                  inputMode="email"
                  required disabled={isSubmitting} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="dateOfBirth">Date of birth</label>
                <input type="date" id="dateOfBirth" className="applicationpersonal-form-input"
                  value={localFormData.dateOfBirth || ''}
                  onChange={(e) => setFieldValue('dateOfBirth', e.target.value)}
                  autoComplete="bday"
                  required disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="placeOfBirth">Place of birth</label>
                <input type="text" id="placeOfBirth" className="applicationpersonal-form-input"
                  value={localFormData.placeOfBirth || ''}
                  onChange={(e) => setFieldValue('placeOfBirth', e.target.value)}
                  placeholder="City / Town"
                  inputMode="text"
                  required disabled={isSubmitting} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="countryOfBirth">Country of birth</label>
                <ApplicationPersonalSelect
                  id="countryOfBirth"
                  value={localFormData.countryOfBirth || ''}
                  options={COUNTRY_OPTIONS}
                  placeholder="Select country"
                  onChange={(nextValue) => setFieldValue('countryOfBirth', nextValue)}
                  required
                  disabled={isSubmitting}
                  invalid={validationErrors.missingFields.includes('countryOfBirth')}
                  searchable
                />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="citizenship">Citizenship</label>
                <ApplicationPersonalSelect
                  id="citizenship"
                  value={localFormData.citizenship || ''}
                  options={CITIZENSHIP_OPTIONS}
                  placeholder="Select citizenship"
                  onChange={(nextValue) => setFieldValue('citizenship', nextValue)}
                  required
                  disabled={isSubmitting}
                  invalid={validationErrors.missingFields.includes('citizenship')}
                  searchable
                />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="gender">Gender</label>
                <ApplicationPersonalSelect
                  id="gender"
                  value={localFormData.gender || ''}
                  options={GENDER_OPTIONS}
                  placeholder="Select gender"
                  onChange={(nextValue) => setFieldValue('gender', nextValue)}
                  required
                  disabled={isSubmitting}
                  invalid={validationErrors.missingFields.includes('gender')}
                />
              </div>

            </div>
          </section>

          {/* Passport Details Section */}
          <section className="applicationpersonal-form-section">
            <h3 className="applicationpersonal-section-heading">
              Passport Details
            </h3>
            <div className="applicationpersonal-form-grid">

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="passportNumber">Passport Number</label>
                <input type="text" id="passportNumber" className="applicationpersonal-form-input"
                  value={sanitizePassportNumber(localFormData.passportNumber || '')}
                  onChange={(e) => setFieldValue('passportNumber', sanitizePassportNumber(e.target.value))}
                  placeholder="e.g. A1234567"
                  autoCapitalize="characters"
                  inputMode="text"
                  pattern="[A-Z0-9]{6,12}"
                  maxLength={12}
                  required disabled={isSubmitting} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="passportIssueDate">Issue date</label>
                <input type="date" id="passportIssueDate" className="applicationpersonal-form-input"
                  value={localFormData.passportIssueDate || ''}
                  onChange={(e) => setFieldValue('passportIssueDate', e.target.value)}
                  required disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="passportExpiryDate">Expiry date</label>
                <input type="date" id="passportExpiryDate" className="applicationpersonal-form-input"
                  value={localFormData.passportExpiryDate || ''}
                  onChange={(e) => setFieldValue('passportExpiryDate', e.target.value)}
                  required disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="issuingCountry">Issuing Country</label>
                <ApplicationPersonalSelect
                  id="issuingCountry"
                  value={localFormData.issuingCountry || ''}
                  options={COUNTRY_OPTIONS}
                  placeholder="Select country"
                  onChange={(nextValue) => setFieldValue('issuingCountry', nextValue)}
                  required
                  disabled={isSubmitting}
                  invalid={validationErrors.missingFields.includes('issuingCountry')}
                  searchable
                />
              </div>

            </div>

            {/* Visa requirement (non-EU only) */}
            {isEUCitizen === false && (
              <div className="applicationpersonal-form-group full-width visa-question">
                <label className="applicationpersonal-form-label required">Do you need a visa for this course?</label>
                <div className="applicationpersonal-radio-group">
                  <label className="applicationpersonal-radio-label">
                    <input type="radio" name="needVisa" value="yes"
                      checked={localFormData.needVisa === 'yes'}
                      onChange={(e) => { setNeedVisa(e.target.value); setFieldValue('needVisa', e.target.value); }}
                      disabled={isSubmitting} />
                    <span className="applicationpersonal-radio-text">Yes</span>
                  </label>
                  <label className="applicationpersonal-radio-label">
                    <input type="radio" name="needVisa" value="no"
                      checked={localFormData.needVisa === 'no'}
                      onChange={(e) => { setNeedVisa(e.target.value); setFieldValue('needVisa', e.target.value); }}
                      disabled={isSubmitting} />
                    <span className="applicationpersonal-radio-text">No</span>
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* Contact Information Section */}
          <section className="applicationpersonal-form-section">
            <h3 className="applicationpersonal-section-heading">
              Contact Information
            </h3>
            <div className="applicationpersonal-form-grid">

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label" htmlFor="landline">Landline / Home phone</label>
                <div className="applicationpersonal-phone-input">
                  <span className="applicationpersonal-country-code">+1</span>
                  <input type="tel" id="landline" className="applicationpersonal-form-input applicationpersonal-phone-number"
                    value={sanitizePhone(localFormData.landline || '')}
                    onChange={handlePhoneChange('landline')}
                    onPaste={handlePhonePaste('landline')}
                    placeholder="Home phone number"
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    disabled={isSubmitting} />
                </div>
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="mobile">Mobile number</label>
                <div className="applicationpersonal-phone-input">
                  <span className="applicationpersonal-country-code">+91</span>
                  <input type="tel" id="mobile" className="applicationpersonal-form-input applicationpersonal-phone-number"
                    value={sanitizePhone(localFormData.mobile || '')}
                    onChange={handlePhoneChange('mobile')}
                    onPaste={handlePhonePaste('mobile')}
                    placeholder="Mobile number"
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    required disabled={isSubmitting} />
                </div>
              </div>

              <div className="applicationpersonal-form-group">
                <label className="applicationpersonal-form-label required" htmlFor="correspondenceLanguage">
                  Correspondence language
                </label>
                <ApplicationPersonalSelect
                  id="correspondenceLanguage"
                  value={localFormData.correspondenceLanguage || ''}
                  options={LANGUAGE_OPTIONS}
                  placeholder="Select language"
                  onChange={(nextValue) => setFieldValue('correspondenceLanguage', nextValue)}
                  required
                  disabled={isSubmitting}
                  invalid={validationErrors.missingFields.includes('correspondenceLanguage')}
                />
              </div>

            </div>
          </section>

          {/* Document Upload Section */}
          <section className="applicationpersonal-form-section">
            <h3 className="applicationpersonal-section-heading">
              Document Upload
            </h3>
            <div className="applicationpersonal-form-grid applicationpersonal-document-grid">

              {/* Passport */}
              <div className={getUploadGroupClass('passport')} data-validation-field="passport">
                <label className="applicationpersonal-form-label required">Upload Passport</label>
                <div className="applicationpersonal-upload-area applicationpersonal-upload-box">
                  {hasFile('passport') ? (
                    <>
                      <p className="applicationpersonal-upload-instruction">Passport already uploaded</p>
                      <p className="applicationpersonal-upload-hint">Using the passport from your Create Account details</p>
                    </>
                  ) : (
                    <>
                      <p className="applicationpersonal-upload-instruction">Drop file to attach, or browse</p>
                      <p className="applicationpersonal-upload-hint">JPG, JPEG, PNG or PDF · Max 5 MB</p>
                    </>
                  )}

                  {hasFile('passport') ? (
                    <div className="applicationpersonal-file-info applicationpersonal-uploaded-file-card">
                      <div className="applicationpersonal-file-icon" aria-hidden="true">
                        <FaFileAlt />
                      </div>
                      <div className="applicationpersonal-file-details">
                        <span className="applicationpersonal-file-name">{getFileName('passport')}</span>
                        {getFileSize('passport') && (
                          <span className="applicationpersonal-file-size">{getFileSize('passport')}</span>
                        )}
                      </div>
                      <button type="button" className="applicationpersonal-remove-file-btn"
                        aria-label="Remove passport file"
                        onClick={() => handleRemoveFile('passport')}
                        disabled={isSubmitting}>
                        <FaTimes />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : null}

                  <input type="file" id="passportUpload" accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange(e, 'passport')}
                    className="applicationpersonal-file-input-hidden"
                    disabled={isSubmitting} />
                  <button type="button" className="applicationpersonal-upload-button"
                    onClick={() => document.getElementById('passportUpload').click()}
                    disabled={isSubmitting}>
                    {hasFile('passport') ? ' Change File' : ' Browse'}
                  </button>
                </div>
                {isFileInvalid('passport') && (
                  <div className="applicationpersonal-field-error">Passport upload is required.</div>
                )}
              </div>

              {/* Photograph */}
              <div className={getUploadGroupClass('photograph')} data-validation-field="photograph">
                <label className="applicationpersonal-form-label required">Photograph</label>
                <div className="applicationpersonal-upload-area applicationpersonal-upload-box">
                  <p className="applicationpersonal-upload-instruction">Drop files to attach, or browse</p>
                  <p className="applicationpersonal-upload-hint">
                    JPG, JPEG or PNG • Max 2 MB • Recommended passport-size photo (35mm × 45mm) • White background • Clear front-facing photograph
                  </p>

                  {canShowPhotoPreview() ? (
                    <div className="applicationpersonal-image-preview">
                      <img
                        src={getPreviewUrl('photograph')}
                        alt=""
                        onError={() => setFailedPreviews(prev => ({ ...prev, photograph: true }))}
                      />
                      <div className="applicationpersonal-preview-file-details">
                        <span className="applicationpersonal-file-name">{getFileName('photograph')}</span>
                        {getFileSize('photograph') && (
                          <span className="applicationpersonal-file-size">{getFileSize('photograph')}</span>
                        )}
                      </div>
                      <button type="button" className="applicationpersonal-remove-image-btn"
                        aria-label="Remove photo"
                        onClick={() => handleRemoveFile('photograph')}
                        disabled={isSubmitting}>
                        <FaTimes />
                      </button>
                    </div>
                  ) : hasFile('photograph') ? (
                    <div className="applicationpersonal-file-info applicationpersonal-uploaded-file-card">
                      <div className="applicationpersonal-file-icon" aria-hidden="true">
                        <FaImage />
                      </div>
                      <div className="applicationpersonal-file-details">
                        <span className="applicationpersonal-file-name">{getFileName('photograph')}</span>
                        {getFileSize('photograph') && (
                          <span className="applicationpersonal-file-size">{getFileSize('photograph')}</span>
                        )}
                      </div>
                      <button type="button" className="applicationpersonal-remove-file-btn"
                        aria-label="Remove photo file"
                        onClick={() => handleRemoveFile('photograph')}
                        disabled={isSubmitting}>
                        <FaTimes />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : null}

                  <input type="file" id="photoUpload" accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'photograph')}
                    className="applicationpersonal-file-input-hidden"
                    disabled={isSubmitting} />
                  <button type="button" className="applicationpersonal-upload-button"
                    onClick={() => document.getElementById('photoUpload').click()}
                    disabled={isSubmitting}>
                    {hasFile('photograph') ? ' Change Photo' : ' Browse'}
                  </button>
                  <div className="applicationpersonal-photo-requirements">
                    <strong>Passport Photo Requirements:</strong>
                    <ul>
                      <li>Recommended size: 35mm × 45mm</li>
                      <li>White/light background</li>
                      <li>Face centered and clear</li>
                      <li>JPG/JPEG/PNG only</li>
                      <li>Max file size: 2 MB</li>
                    </ul>
                  </div>
                </div>
                {isFileInvalid('photograph') && (
                  <div className="applicationpersonal-field-error">Photograph upload is required.</div>
                )}
              </div>

            </div>
          </section>

          {/* Refer a Friend Section */}
          <section className="applicationpersonal-form-section">
            <h3 className="applicationpersonal-section-heading">
              Refer a Friend Scheme
            </h3>
            <div className="applicationpersonal-form-group full-width">
              <label className="applicationpersonal-form-label">Are you applying for a Refer a Friend Scheme?</label>
              <div className="applicationpersonal-radio-group">
                <label className="applicationpersonal-radio-label">
                  <input type="radio" name="referFriend" value="no"
                    checked={localFormData.referFriend === 'no'}
                    onChange={(e) => { setReferFriend(e.target.value); setFieldValue('referFriend', e.target.value); }}
                    disabled={isSubmitting} />
                  <span className="applicationpersonal-radio-text">No</span>
                </label>
                <label className="applicationpersonal-radio-label">
                  <input type="radio" name="referFriend" value="yes"
                    checked={localFormData.referFriend === 'yes'}
                    onChange={(e) => { setReferFriend(e.target.value); setFieldValue('referFriend', e.target.value); }}
                    disabled={isSubmitting} />
                  <span className="applicationpersonal-radio-text">Yes</span>
                </label>
              </div>
            </div>
          </section>

          {/* Navigation Buttons */}
          <div className="applicationpersonal-form-actions">
            <button type="button" className="applicationpersonal-btn-secondary"
              onClick={handleBack} disabled={isSubmitting}>
              Back
            </button>
            <button type="submit" className="applicationpersonal-btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? <> Saving...</>
                : <>Next </>
              }
            </button>
          </div>

        

        </form>
      </main>
    </div>
  );
};

export default ApplicationPersonal;
