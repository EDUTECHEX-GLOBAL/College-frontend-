import React, { useEffect, useRef, useState } from "react";
import axiosInstance from '../../api/axiosInstance';
import { useNavigate, useLocation } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import "./ApplicationAddress.css";

// =====================================================
// API BASE URL
// =====================================================

const COUNTRY_OPTIONS = [
  { value: "India", label: "India" },
  { value: "USA", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
];

const INDIA_STATE_OPTIONS = [
  { value: "Andhra Pradesh", label: "Andhra Pradesh" },
  { value: "Delhi", label: "Delhi" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Telangana", label: "Telangana" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "West Bengal", label: "West Bengal" },
];

const ApplicationAddressSelect = ({
  id,
  value,
  options,
  placeholder,
  onChange,
  disabled,
  invalid,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
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
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
    window.requestAnimationFrame(() => document.getElementById(id)?.focus());
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!disabled) setIsOpen(true);
    }
  };

  return (
    <div
      ref={selectRef}
      className={`applicationaddress-custom-select${isOpen ? " is-open" : ""}${invalid ? " is-invalid" : ""}`}
    >
      <button
        type="button"
        id={id}
        className={`applicationaddress-form-select applicationaddress-custom-select-trigger${!selectedOption ? " is-placeholder" : ""}`}
        onClick={() => !disabled && setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="applicationaddress-custom-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="applicationaddress-custom-select-menu" id={listboxId} role="listbox">
          {searchable && (
            <input
              type="text"
              className="applicationaddress-custom-select-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              autoFocus
            />
          )}

          <div className="applicationaddress-custom-select-options">
            <button
              type="button"
              className={`applicationaddress-custom-select-option${value === "" ? " is-selected" : ""}`}
              role="option"
              aria-selected={value === ""}
              onClick={() => handleSelect("")}
            >
              {placeholder}
            </button>

            {filteredOptions.map(option => (
              <button
                type="button"
                key={option.value}
                className={`applicationaddress-custom-select-option${value === option.value ? " is-selected" : ""}`}
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="applicationaddress-custom-select-empty">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// =====================================================
// PROPS:
//   onAddressChange (optional)  called whenever address
//   is saved successfully. Pushes mapped fields up to the
//   parent (App.js) so Resume.js can read them.
//   All other logic is completely unchanged.
// =====================================================
const ApplicationAddress = ({ formData: parentFormData, onInputChange, onAddressChange, studentId }) => {

  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(33);

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

  // Form data state
  const [formData, setFormData] = useState({
    // Permanent home address
    careOf: "",
    streetAndHouseNumber: "",
    city: "",
    country: "India",
    stateProvince: "",
    postcode: "",

    // Correspondence address
    hasDifferentCorrespondenceAddress: false,
    correspondenceCareOf: "",
    correspondenceStreetAndHouseNumber: "",
    correspondenceCity: "",
    correspondenceCountry: "India",
    correspondenceStateProvince: "",
    correspondencePostcode: "",

    // National ID file
    nationalIdFile: null,
  });

  // =====================================================
  //  RESUME ADAPTER
  // Maps local address fields  Resume.js field names
  // and pushes them to the parent via onAddressChange.
  // Called after every successful save.
  // =====================================================
  const pushAddressToResume = (data) => {
    if (typeof onAddressChange !== 'function') return;

    onAddressChange({
      // Resume.js field name   Address form field
      currentAddress : data.streetAndHouseNumber || '',
      city           : data.city                 || '',
      state          : data.stateProvince        || '',
      country        : data.country              || '',
      postalCode     : data.postcode             || '',
    });
  };

  const mapAddressForApplication = (data = {}) => ({
    currentAddress: data.streetAndHouseNumber || '',
    permanentAddress: data.currentAddress || data.permanentAddress || data.streetAndHouseNumber || '',
    city: data.city || '',
    state: data.stateProvince || '',
    country: data.country || '',
    postalCode: data.postcode || '',
    careOf: data.careOf || '',
    streetAndHouseNumber: data.streetAndHouseNumber || '',
    stateProvince: data.stateProvince || '',
    postcode: data.postcode || '',
    hasDifferentCorrespondenceAddress: !!data.hasDifferentCorrespondenceAddress,
    correspondenceCareOf: data.correspondenceCareOf || '',
    correspondenceStreetAndHouseNumber: data.correspondenceStreetAndHouseNumber || '',
    correspondenceCity: data.correspondenceCity || '',
    correspondenceCountry: data.correspondenceCountry || '',
    correspondenceStateProvince: data.correspondenceStateProvince || '',
    correspondencePostcode: data.correspondencePostcode || '',
    nationalIdFileName: data.nationalIdFileName || data.nationalIdFile?.fileName || '',
    nationalIdFileUrl: data.nationalIdFileUrl || data.nationalIdFile?.fileUrl || '',
    nationalIdOriginalName: data.nationalIdOriginalName || data.nationalIdFile?.originalName || '',
    nationalIdFileSize: data.nationalIdFileSize || data.nationalIdFile?.fileSize || 0,
    nationalIdFileType: data.nationalIdFileType || data.nationalIdFile?.fileType || '',
    nationalIdUploadedAt: data.nationalIdUploadedAt || null,
  });

  const persistAddressDraft = (addressData = {}) => {
    const mappedAddress = mapAddressForApplication(addressData);

    if (typeof onAddressChange === 'function') onAddressChange(mappedAddress);
    if (typeof onInputChange === 'function') {
      Object.entries(mappedAddress).forEach(([key, value]) => onInputChange(key, value));
    }

    const scopedKey = getApplicationStorageKey(studentId);
    const legacySaved = safeGetLocalStorage('gusApplicationData') || {};
    const scopedSaved = studentId ? safeGetLocalStorage(scopedKey) || {} : {};
    const nextData = {
      ...legacySaved,
      ...scopedSaved,
      ...(parentFormData || {}),
      ...mappedAddress,
      ...(studentId ? { studentId } : {}),
    };

    safeSetLocalStorage('gusApplicationData', nextData);
    if (studentId) safeSetLocalStorage(scopedKey, nextData);
    window.dispatchEvent(new Event('applicationUpdated'));

    return nextData;
  };

  const isMissingAddressFallbackFields = (addressData = {}) =>
    !addressData.streetAndHouseNumber?.trim() ||
    !addressData.city?.trim() ||
    !addressData.postcode?.trim();

  const mapProfileAddressToApplication = (profile = {}) => ({
    streetAndHouseNumber: profile.addressLine1 || "",
    city: profile.city || "",
    stateProvince: profile.state || "",
    country: profile.country || "India",
    postcode: profile.zipCode || "",
  });

  const hasProfileAddress = (profileAddress = {}) =>
    !!(
      profileAddress.streetAndHouseNumber?.trim() ||
      profileAddress.city?.trim() ||
      profileAddress.postcode?.trim()
    );

  const mergeMissingAddressFields = (applicationAddress = {}, profileAddress = {}) => ({
    ...applicationAddress,
    streetAndHouseNumber:
      applicationAddress.streetAndHouseNumber?.trim() || profileAddress.streetAndHouseNumber || "",
    city: applicationAddress.city?.trim() || profileAddress.city || "",
    stateProvince: applicationAddress.stateProvince?.trim() || profileAddress.stateProvince || "",
    country: applicationAddress.country?.trim() || profileAddress.country || "India",
    postcode: applicationAddress.postcode?.trim() || profileAddress.postcode || "",
  });

  // =====================================================
  // FETCH ADDRESS DATA ON LOAD
  // =====================================================
 useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    fetchAddress();
  } else {
    setError("No authentication token found");
    setIsLoading(false);
  }
}, []);

  const fetchAddress = async () => {
    try {
      setIsLoading(true);
     const res = await axiosInstance.get('/api/application/address');
      let loadedData = null;
      if (res.data?.addressInfo) {
        const addr = res.data.addressInfo;
        loadedData = {
          careOf: addr.careOf || "",
          streetAndHouseNumber: addr.streetAndHouseNumber || "",
          city: addr.city || "",
          country: addr.country || "India",
          stateProvince: addr.stateProvince || "",
          postcode: addr.postcode || "",
          hasDifferentCorrespondenceAddress: addr.hasDifferentCorrespondenceAddress || false,
          correspondenceCareOf: addr.correspondenceCareOf || "",
          correspondenceStreetAndHouseNumber: addr.correspondenceStreetAndHouseNumber || "",
          correspondenceCity: addr.correspondenceCity || "",
          correspondenceCountry: addr.correspondenceCountry || "India",
          correspondenceStateProvince: addr.correspondenceStateProvince || "",
          correspondencePostcode: addr.correspondencePostcode || "",
          nationalIdFile: addr.nationalIdFileName
            ? {
                fileName: addr.nationalIdFileName,
                fileUrl: addr.nationalIdFileUrl,
                fileType: addr.nationalIdFileType,
                fileSize: addr.nationalIdFileSize,
                originalName: addr.nationalIdOriginalName,
              }
            : null,
        };
        console.log("Loaded application address");
      }

      if (loadedData && !isMissingAddressFallbackFields(loadedData)) {
        setFormData(loadedData);
        setAddressSaved(true);

        // Keep initial load local; save/upload actions persist to dashboard progress.
        pushAddressToResume(loadedData);

        if (res.data.isCompleted) {
          setCompletionPercentage(66);
        }
        return;
      }

      try {
        const profileRes = await axiosInstance.get('/api/students/profile');
        const profile = profileRes.data?.account || profileRes.data?.profile || {};
        const profileAddress = mapProfileAddressToApplication(profile);

        if (hasProfileAddress(profileAddress)) {
          const nextAddress = mergeMissingAddressFields(loadedData || formData, profileAddress);
          console.log("Loaded profile address fallback");
          setFormData(prev => ({
            ...prev,
            ...nextAddress
          }));
          setAddressSaved(true);
          persistAddressDraft(nextAddress);
          pushAddressToResume(nextAddress);

          if (!isMissingAddressFallbackFields(nextAddress)) {
            setCompletionPercentage(66);
          }
        } else if (loadedData) {
          setFormData(loadedData);
          pushAddressToResume(loadedData);
          if (res.data.isCompleted) {
            setCompletionPercentage(66);
          }
        }
      } catch (profileError) {
        console.error("Error fetching profile address fallback:", profileError.response?.data || profileError.message);
        if (loadedData) {
          setFormData(loadedData);
          pushAddressToResume(loadedData);
          if (res.data.isCompleted) {
            setCompletionPercentage(66);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching address:", error.response?.data || error.message);
      if (error.response?.status !== 404) {
        setError("Failed to load address data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // CALCULATE COMPLETION PERCENTAGE
  // =====================================================
  const calculateCompletion = () => {
    const permanentFields = [
      'streetAndHouseNumber', 'city', 'country', 'stateProvince', 'postcode'
    ];

    const completedPermanent = permanentFields.filter(field => {
      const value = formData[field];
      return value && value.toString().trim() !== '';
    }).length;

    let totalFields = 5;
    let completedFields = completedPermanent;

    if (formData.hasDifferentCorrespondenceAddress) {
      const correspondenceFields = [
        'correspondenceStreetAndHouseNumber', 'correspondenceCity',
        'correspondenceCountry', 'correspondenceStateProvince', 'correspondencePostcode'
      ];
      const completedCorrespondence = correspondenceFields.filter(field => {
        const value = formData[field];
        return value && value.toString().trim() !== '';
      }).length;

      totalFields += 5;
      completedFields += completedCorrespondence;
    }

    return Math.round((completedFields / totalFields) * 100);
  };

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================
  const handleInputChange = (field, value) => {
  // Fields that should only allow letters, spaces, hyphens, dots, commas
  const textOnlyFields = [
    'city',
    'correspondenceCity',
    'careOf',
    'correspondenceCareOf',
    'stateProvince',
    'correspondenceStateProvince'
  ];

  // Fields that should only allow numbers
  const numberOnlyFields = [
    'postcode',
    'correspondencePostcode'
  ];

  if (textOnlyFields.includes(field)) {
    value = value.replace(/[^a-zA-Z\s\-\.,]/g, '');
  }

  if (numberOnlyFields.includes(field)) {
    value = value.replace(/[^0-9]/g, '');
  }

  setFormData((prev) => ({
    ...prev,
    [field]: value,
  }));

  // Clear validation error for this field
  if (validationErrors[field]) {
    setValidationErrors((prev) => ({
      ...prev,
      [field]: null,
    }));
  }

  setAddressSaved(false);
};

  // =====================================================
  // HANDLE CORRESPONDENCE ADDRESS TOGGLE
  // =====================================================
  const handleCorrespondenceToggle = (value) => {
    const hasDifferent = value === 'yes';
    setFormData((prev) => ({
      ...prev,
      hasDifferentCorrespondenceAddress: hasDifferent,
      ...(hasDifferent ? {} : {
        correspondenceCareOf: "",
        correspondenceStreetAndHouseNumber: "",
        correspondenceCity: "",
        correspondenceCountry: "India",
        correspondenceStateProvince: "",
        correspondencePostcode: "",
      })
    }));
    setAddressSaved(false);

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      if (!hasDifferent) {
        delete newErrors.correspondenceStreetAndHouseNumber;
        delete newErrors.correspondenceCity;
        delete newErrors.correspondenceCountry;
        delete newErrors.correspondenceStateProvince;
        delete newErrors.correspondencePostcode;
      }
      return newErrors;
    });
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================
  const validateForm = () => {
    const errors = {};
    const missingFields = [];

    if (!formData.streetAndHouseNumber?.trim()) {
      errors.streetAndHouseNumber = 'Street and house number is required';
      missingFields.push('Street and house number');
    }

    if (!formData.city?.trim()) {
      errors.city = 'City is required';
      missingFields.push('City');
    }

    if (!formData.country?.trim()) {
      errors.country = 'Country is required';
      missingFields.push('Country');
    }

    if (!formData.stateProvince?.trim()) {
      errors.stateProvince = 'State/Province is required';
      missingFields.push('State/Province');
    }

    if (!formData.postcode?.trim()) {
      errors.postcode = 'Postcode is required';
      missingFields.push('Postcode');
    }

    if (formData.postcode?.trim() && formData.postcode.length < 3) {
      errors.postcode = 'Please enter a valid postcode';
    }

    if (formData.hasDifferentCorrespondenceAddress) {
      if (!formData.correspondenceStreetAndHouseNumber?.trim()) {
        errors.correspondenceStreetAndHouseNumber = 'Correspondence street and house number is required';
        missingFields.push('Correspondence street and house number');
      }
      if (!formData.correspondenceCity?.trim()) {
        errors.correspondenceCity = 'Correspondence city is required';
        missingFields.push('Correspondence city');
      }
      if (!formData.correspondenceCountry?.trim()) {
        errors.correspondenceCountry = 'Correspondence country is required';
        missingFields.push('Correspondence country');
      }
      if (!formData.correspondenceStateProvince?.trim()) {
        errors.correspondenceStateProvince = 'Correspondence state/province is required';
        missingFields.push('Correspondence state/province');
      }
      if (!formData.correspondencePostcode?.trim()) {
        errors.correspondencePostcode = 'Correspondence postcode is required';
        missingFields.push('Correspondence postcode');
      }
      if (formData.correspondencePostcode?.trim() && formData.correspondencePostcode.length < 3) {
        errors.correspondencePostcode = 'Please enter a valid postcode';
      }
    }

    setValidationErrors(errors);
    return {
      isValid: Object.keys(errors).length === 0,
      missingFields
    };
  };

  // =====================================================
  // SAVE ADDRESS
  // =====================================================
  const saveAddress = async () => {
    if (isSubmitting) return;

    const validation = validateForm();
    if (!validation.isValid) {
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }

      let errorMessage = 'Please fix the following errors:\n\n';
      Object.values(validationErrors).forEach(error => {
        errorMessage += `- ${error}\n`;
      });
      alert(errorMessage);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const requestData = {
        careOf: formData.careOf,
        streetAndHouseNumber: formData.streetAndHouseNumber,
        city: formData.city,
        country: formData.country,
        stateProvince: formData.stateProvince,
        postcode: formData.postcode,
        hasDifferentCorrespondenceAddress: formData.hasDifferentCorrespondenceAddress,
        correspondenceCareOf: formData.correspondenceCareOf,
        correspondenceStreetAndHouseNumber: formData.correspondenceStreetAndHouseNumber,
        correspondenceCity: formData.correspondenceCity,
        correspondenceCountry: formData.correspondenceCountry,
        correspondenceStateProvince: formData.correspondenceStateProvince,
        correspondencePostcode: formData.correspondencePostcode,
      };

     const response = await axiosInstance.post('/api/application/address', requestData);
      const savedAddress = response.data?.addressInfo || requestData;

      //  Push saved address to Resume
      pushAddressToResume(formData);
      persistAddressDraft({ ...savedAddress, ...formData });

      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'success-toast';
      toast.textContent = 'Address saved successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      setAddressSaved(true);

      const newPercentage = calculateCompletion();
      setCompletionPercentage(33 + Math.round(newPercentage * 0.33));

      // Navigate to next page
      setTimeout(() => {
        let targetPath;
        if (location.pathname.includes('/address')) {
          targetPath = location.pathname.replace('/address', '/specialneeds');
        } else {
          targetPath = '/firstyear/dashboard/application/specialneeds';
        }
        navigate(targetPath);
      }, 1000);

    } catch (error) {
      console.error("Save error:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to save address");

      const toast = document.createElement('div');
      toast.className = 'error-toast';
      toast.textContent = error.response?.data?.message || "Failed to save address. Please try again.";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // UPLOAD NATIONAL ID
  // =====================================================
  const handleFileUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPG, PNG, and PDF are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const data = new FormData();
    data.append("file", file);
    data.append("careOf", formData.careOf || "");
    data.append("streetAndHouseNumber", formData.streetAndHouseNumber || "");
    data.append("city", formData.city || "");
    data.append("country", formData.country || "India");
    data.append("stateProvince", formData.stateProvince || "");
    data.append("postcode", formData.postcode || "");

    setUploading(true);
    setError("");

    try {
      const res = await axiosInstance.post('/api/application/address/upload/nationalId', data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const toast = document.createElement('div');
      toast.className = 'success-toast';
      toast.textContent = 'National ID uploaded successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      const uploadedNationalIdFile = {
        fileName: res.data.fileName,
        fileUrl: res.data.fileUrl,
        fileType: res.data.fileType,
        fileSize: res.data.fileSize,
        originalName: res.data.originalName,
        uploadedAt: res.data.nationalIdUploadedAt || new Date().toISOString(),
      };

      const nextFormData = {
        ...formData,
        ...(res.data.addressInfo || {}),
        nationalIdFile: uploadedNationalIdFile,
        nationalIdFileName: res.data.fileName,
        nationalIdFileUrl: res.data.fileUrl,
        nationalIdOriginalName: res.data.originalName,
        nationalIdFileSize: res.data.fileSize,
        nationalIdFileType: res.data.fileType,
        nationalIdUploadedAt: uploadedNationalIdFile.uploadedAt,
      };

      setFormData(nextFormData);
      persistAddressDraft(nextFormData);
      setAddressSaved(!!res.data.addressInfo?.isAddressComplete);
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      const message = error.response?.data?.message || "Upload failed. Please try again.";
      setError(message);

      const toast = document.createElement('div');
      toast.className = 'error-toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // REMOVE NATIONAL ID
  // =====================================================
  const removeNationalId = async () => {
    try {
     await axiosInstance.delete('/api/application/address/files/nationalId');

      const toast = document.createElement('div');
      toast.className = 'success-toast';
      toast.textContent = 'National ID removed successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      setFormData((prev) => ({
        ...prev,
        nationalIdFile: null,
      }));
      persistAddressDraft({
        ...formData,
        nationalIdFileName: '',
        nationalIdFileUrl: '',
        nationalIdOriginalName: '',
        nationalIdFileSize: 0,
        nationalIdFileType: '',
        nationalIdUploadedAt: null,
      });
    } catch (error) {
      console.error("Remove error:", error.response?.data || error.message);

      const toast = document.createElement('div');
      toast.className = 'error-toast';
      toast.textContent = "Failed to remove national ID";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  // =====================================================
  // HANDLE BACK NAVIGATION
  // =====================================================
  const handleBack = () => {
    let backPath;
    if (location.pathname.includes('/address')) {
      backPath = location.pathname.replace('/address', '/personal');
    } else {
      backPath = '/firstyear/dashboard/application/personal';
    }
    navigate(backPath);
  };

  // =====================================================
  // HANDLE SAVE AND CONTINUE LATER
  // =====================================================
  const handleSaveLater = async () => {
    try {
      await saveAddress();
      const toast = document.createElement('div');
      toast.className = 'success-toast';
      toast.textContent = 'Progress saved! You can continue later.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error) {
      // Error handling is done in saveAddress
    }
  };

  const completionPercentageValue = calculateCompletion();
  const overallPercentage = 33 + Math.round(completionPercentageValue * 0.33);

  // =====================================================
  // LOADING STATE
  // =====================================================
  if (isLoading) {
    return (
      <div className="applicationaddress">
        <div className="applicationaddress-loading-state">
          <div className="applicationaddress-loading-spinner"></div>
          <p>Loading your address information...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <div className="applicationaddress">
      {/* Header with Progress */}
      <div className="applicationaddress-header">
        <div className="applicationaddress-header-left">
          <h1>BA Communication Design</h1>
          <div className="applicationaddress-application-id">
            <span className="applicationaddress-id-label">APPLICATION ID</span>
            <span className="applicationaddress-id-value">UEG0000104849</span>
          </div>
        </div>
        <div className="applicationaddress-progress-indicator">
          <div className="applicationaddress-progress-circle">
            <svg viewBox="0 0 36 36" className="applicationaddress-circular-chart">
              <path
                className="applicationaddress-circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="applicationaddress-circle"
                strokeDasharray={`${overallPercentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="applicationaddress-percentage">{overallPercentage}%</text>
            </svg>
          </div>
          <span className="applicationaddress-progress-text">Completed</span>
        </div>
      </div>

      {/* Navigation Steps */}
      <div className="applicationaddress-steps">
        <div className="applicationaddress-step completed">
          <span className="applicationaddress-step-number">1</span>
          <span className="applicationaddress-step-name">Study Programme</span>
        </div>
        <div className="applicationaddress-step completed">
          <span className="applicationaddress-step-number">2</span>
          <span className="applicationaddress-step-name">Applicant Details</span>
        </div>
        <div className="applicationaddress-step active">
          <span className="applicationaddress-step-number">3</span>
          <span className="applicationaddress-step-name">Address</span>
        </div>
        <div className="applicationaddress-step">
          <span className="applicationaddress-step-number">4</span>
          <span className="applicationaddress-step-name">Language</span>
        </div>
        <div className="applicationaddress-step">
          <span className="applicationaddress-step-number">5</span>
          <span className="applicationaddress-step-name">Education</span>
        </div>
        <div className="applicationaddress-step">
          <span className="applicationaddress-step-number">6</span>
          <span className="applicationaddress-step-name">Documents</span>
        </div>
        <div className="applicationaddress-step">
          <span className="applicationaddress-step-number">7</span>
          <span className="applicationaddress-step-name">Review</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="applicationaddress-error-banner">
          <span className="applicationaddress-error-icon" aria-hidden="true">!</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="applicationaddress-error-close-btn" aria-label="Close"><FaTimes size={16} aria-hidden="true" /></button>
        </div>
      )}

      {/* Main Form */}
      <div className="applicationaddress-form-container">
        <div className="applicationaddress-form-header">
          <h2>Address Information</h2>
          <p className="applicationaddress-form-subtitle">
            Please provide your permanent address as it appears on official documents
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); saveAddress(); }}>
          {/* Permanent Address Section */}
          <div className="applicationaddress-form-section">
            <div className="applicationaddress-section-title">
              <h3>Permanent Home Address</h3>
              <span className="applicationaddress-required-badge">Required</span>
            </div>

            <div className="applicationaddress-form-group">
              <label className="applicationaddress-form-label" htmlFor="careOf">
                Care of (C/o)
                <span className="applicationaddress-label-hint">Optional</span>
              </label>
              <input
                type="text"
                id="careOf"
                className={`applicationaddress-form-input ${validationErrors.careOf ? 'error' : ''}`}
                value={formData.careOf}
                onChange={(e) => handleInputChange("careOf", e.target.value)}
                placeholder="e.g., John Doe, c/o Jane Smith"
                disabled={isSubmitting}
              />
              <small className="applicationaddress-field-hint">Leave blank if not applicable</small>
            </div>

            <div className="applicationaddress-form-group">
              <label className="applicationaddress-form-label required" htmlFor="streetAndHouseNumber">
                Street and house number
              </label>
              <input
                type="text"
                id="streetAndHouseNumber"
                className={`applicationaddress-form-input ${validationErrors.streetAndHouseNumber ? 'error' : ''}`}
                value={formData.streetAndHouseNumber}
                onChange={(e) => handleInputChange("streetAndHouseNumber", e.target.value)}
                placeholder="Enter street name and house number"
                disabled={isSubmitting}
              />
              {validationErrors.streetAndHouseNumber && (
                <span className="applicationaddress-error-message">{validationErrors.streetAndHouseNumber}</span>
              )}
            </div>

            <div className="applicationaddress-form-row">
              <div className="applicationaddress-form-group">
                <label className="applicationaddress-form-label required" htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  className={`applicationaddress-form-input ${validationErrors.city ? 'error' : ''}`}
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Enter city"
                  disabled={isSubmitting}
                />
                {validationErrors.city && (
                  <span className="applicationaddress-error-message">{validationErrors.city}</span>
                )}
              </div>

              <div className="applicationaddress-form-group">
                <label className="applicationaddress-form-label required" htmlFor="country">Country</label>
                <ApplicationAddressSelect
                  id="country"
                  value={formData.country}
                  options={COUNTRY_OPTIONS}
                  placeholder="Select Country"
                  onChange={(nextValue) => handleInputChange("country", nextValue)}
                  disabled={isSubmitting}
                  invalid={!!validationErrors.country}
                  searchable
                />
                {validationErrors.country && (
                  <span className="applicationaddress-error-message">{validationErrors.country}</span>
                )}
              </div>
            </div>

            <div className="applicationaddress-form-row">
              <div className="applicationaddress-form-group">
                <label className="applicationaddress-form-label required" htmlFor="stateProvince">
                  State / Province
                </label>
                {formData.country === 'India' ? (
                  <ApplicationAddressSelect
                    id="stateProvince"
                    value={formData.stateProvince}
                    options={INDIA_STATE_OPTIONS}
                    placeholder="Select State"
                    onChange={(nextValue) => handleInputChange("stateProvince", nextValue)}
                    disabled={isSubmitting}
                    invalid={!!validationErrors.stateProvince}
                    searchable
                  />
                ) : (
                  <input
                    type="text"
                    id="stateProvince"
                    className={`applicationaddress-form-input ${validationErrors.stateProvince ? 'error' : ''}`}
                    value={formData.stateProvince}
                    onChange={(e) => handleInputChange("stateProvince", e.target.value)}
                    placeholder="Enter state/province"
                    disabled={isSubmitting}
                  />
                )}
                {validationErrors.stateProvince && (
                  <span className="applicationaddress-error-message">{validationErrors.stateProvince}</span>
                )}
              </div>

              <div className="applicationaddress-form-group">
                <label className="applicationaddress-form-label required" htmlFor="postcode">Postcode</label>
                <input
                  type="text"
                  id="postcode"
                  className={`applicationaddress-form-input ${validationErrors.postcode ? 'error' : ''}`}
                  value={formData.postcode}
                  onChange={(e) => handleInputChange("postcode", e.target.value)}
                  placeholder="Enter postal code"
                  disabled={isSubmitting}
                />
                {validationErrors.postcode && (
                  <span className="applicationaddress-error-message">{validationErrors.postcode}</span>
                )}
              </div>
            </div>
          </div>

          {/* Correspondence Address Section */}
          <div className="applicationaddress-form-section">
            <div className="applicationaddress-section-title">
              <h3>Correspondence Address</h3>
            </div>

            <div className="applicationaddress-form-group full-width">
              <label className="applicationaddress-form-label">
                Do you have a different address for correspondence?
              </label>
              <div className="applicationaddress-radio-group">
                <label className={`applicationaddress-radio-option ${formData.hasDifferentCorrespondenceAddress === true ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="correspondenceAddress"
                    value="yes"
                    checked={formData.hasDifferentCorrespondenceAddress === true}
                    onChange={() => handleCorrespondenceToggle('yes')}
                    disabled={isSubmitting}
                  />
                  <span className="applicationaddress-radio-custom"></span>
                  <span className="applicationaddress-radio-label-text">Yes</span>
                </label>
                <label className={`applicationaddress-radio-option ${formData.hasDifferentCorrespondenceAddress === false ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="correspondenceAddress"
                    value="no"
                    checked={formData.hasDifferentCorrespondenceAddress === false}
                    onChange={() => handleCorrespondenceToggle('no')}
                    disabled={isSubmitting}
                  />
                  <span className="applicationaddress-radio-custom"></span>
                  <span className="applicationaddress-radio-label-text">No, same as permanent address</span>
                </label>
              </div>
            </div>

            {formData.hasDifferentCorrespondenceAddress && (
              <div className="applicationaddress-correspondence-fields">
                <div className="applicationaddress-form-group">
                  <label className="applicationaddress-form-label" htmlFor="correspondenceCareOf">
                    Care of (C/o)
                    <span className="applicationaddress-label-hint">Optional</span>
                  </label>
                  <input
                    type="text"
                    id="correspondenceCareOf"
                    className={`applicationaddress-form-input ${validationErrors.correspondenceCareOf ? 'error' : ''}`}
                    value={formData.correspondenceCareOf}
                    onChange={(e) => handleInputChange("correspondenceCareOf", e.target.value)}
                    placeholder="e.g., John Doe, c/o Jane Smith"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="applicationaddress-form-group">
                  <label className="applicationaddress-form-label required" htmlFor="correspondenceStreetAndHouseNumber">
                    Street and house number
                  </label>
                  <input
                    type="text"
                    id="correspondenceStreetAndHouseNumber"
                    className={`applicationaddress-form-input ${validationErrors.correspondenceStreetAndHouseNumber ? 'error' : ''}`}
                    value={formData.correspondenceStreetAndHouseNumber}
                    onChange={(e) => handleInputChange("correspondenceStreetAndHouseNumber", e.target.value)}
                    placeholder="Enter street name and house number"
                    disabled={isSubmitting}
                  />
                  {validationErrors.correspondenceStreetAndHouseNumber && (
                    <span className="applicationaddress-error-message">{validationErrors.correspondenceStreetAndHouseNumber}</span>
                  )}
                </div>

                <div className="applicationaddress-form-row">
                  <div className="applicationaddress-form-group">
                    <label className="applicationaddress-form-label required" htmlFor="correspondenceCity">City</label>
                    <input
                      type="text"
                      id="correspondenceCity"
                      className={`applicationaddress-form-input ${validationErrors.correspondenceCity ? 'error' : ''}`}
                      value={formData.correspondenceCity}
                      onChange={(e) => handleInputChange("correspondenceCity", e.target.value)}
                      placeholder="Enter city"
                      disabled={isSubmitting}
                    />
                    {validationErrors.correspondenceCity && (
                      <span className="applicationaddress-error-message">{validationErrors.correspondenceCity}</span>
                    )}
                  </div>

                  <div className="applicationaddress-form-group">
                    <label className="applicationaddress-form-label required" htmlFor="correspondenceCountry">Country</label>
                    <ApplicationAddressSelect
                      id="correspondenceCountry"
                      value={formData.correspondenceCountry}
                      options={COUNTRY_OPTIONS}
                      placeholder="Select Country"
                      onChange={(nextValue) => handleInputChange("correspondenceCountry", nextValue)}
                      disabled={isSubmitting}
                      invalid={!!validationErrors.correspondenceCountry}
                      searchable
                    />
                    {validationErrors.correspondenceCountry && (
                      <span className="applicationaddress-error-message">{validationErrors.correspondenceCountry}</span>
                    )}
                  </div>
                </div>

                <div className="applicationaddress-form-row">
                  <div className="applicationaddress-form-group">
                    <label className="applicationaddress-form-label required" htmlFor="correspondenceStateProvince">
                      State / Province
                    </label>
                    <input
                      type="text"
                      id="correspondenceStateProvince"
                      className={`applicationaddress-form-input ${validationErrors.correspondenceStateProvince ? 'error' : ''}`}
                      value={formData.correspondenceStateProvince}
                      onChange={(e) => handleInputChange("correspondenceStateProvince", e.target.value)}
                      placeholder="Enter state/province"
                      disabled={isSubmitting}
                    />
                    {validationErrors.correspondenceStateProvince && (
                      <span className="applicationaddress-error-message">{validationErrors.correspondenceStateProvince}</span>
                    )}
                  </div>

                  <div className="applicationaddress-form-group">
                    <label className="applicationaddress-form-label required" htmlFor="correspondencePostcode">Postcode</label>
                    <input
                      type="text"
                      id="correspondencePostcode"
                      className={`applicationaddress-form-input ${validationErrors.correspondencePostcode ? 'error' : ''}`}
                      value={formData.correspondencePostcode}
                      onChange={(e) => handleInputChange("correspondencePostcode", e.target.value)}
                      placeholder="Enter postal code"
                      disabled={isSubmitting}
                    />
                    {validationErrors.correspondencePostcode && (
                      <span className="applicationaddress-error-message">{validationErrors.correspondencePostcode}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* National ID Upload Section */}
          <div className="applicationaddress-form-section">
            <div className="applicationaddress-section-title">
              <h3>National ID Document</h3>
              <span className="applicationaddress-optional-badge">Optional</span>
            </div>

            <div className="applicationaddress-form-group">
              <label className="applicationaddress-form-label">Upload National ID (Aadhaar, Passport, etc.)</label>
              <div className={`applicationaddress-upload-area ${uploading ? 'uploading' : ''}`}>
                {uploading && (
                  <div className="applicationaddress-upload-progress">
                    <div className="applicationaddress-progress-bar">
                      <div className="applicationaddress-progress-fill"></div>
                    </div>
                    <span>Uploading...</span>
                  </div>
                )}

                {formData.nationalIdFile ? (
                  <div className="applicationaddress-file-info">
                    <div className="applicationaddress-file-details">
                      <span className="applicationaddress-file-name">{formData.nationalIdFile.originalName || formData.nationalIdFile.fileName}</span>
                      {formData.nationalIdFile.fileSize && (
                        <span className="applicationaddress-file-size">
                          {(formData.nationalIdFile.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="applicationaddress-remove-file-btn"
                      onClick={removeNationalId}
                      disabled={uploading || isSubmitting}
                      title="Remove file"
                      aria-label="Remove file"
                    >
                      <FaTimes size={16} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="applicationaddress-upload-prompt">
                    <p className="applicationaddress-upload-instruction">Drag and drop your file here, or click to browse</p>
                    <p className="applicationaddress-upload-hint">Supported formats: JPG, PNG, PDF (Max size: 5MB)</p>
                    <input
                      type="file"
                      id="nationalIdUpload"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                      style={{ display: 'none' }}
                      disabled={uploading || isSubmitting}
                    />
                    <button
                      type="button"
                      className="applicationaddress-upload-button"
                      onClick={() => document.getElementById('nationalIdUpload').click()}
                      disabled={uploading || isSubmitting}
                    >
                      {uploading ? 'Uploading...' : 'Browse Files'}
                    </button>
                  </div>
                )}
              </div>
              {!addressSaved && !formData.nationalIdFile && (
                <p className="applicationaddress-upload-warning">
                  You can upload this now, then save your address details before continuing.
                </p>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="applicationaddress-form-actions">
            <button
              type="button"
              className="applicationaddress-btn-secondary"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </button>

            <div className="applicationaddress-action-group">
              <button
                type="button"
                className="applicationaddress-btn-outline"
                onClick={handleSaveLater}
                disabled={isSubmitting}
              >
                Save & Continue Later
              </button>

              <button
                type="submit"
                className="applicationaddress-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="applicationaddress-spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    Next Step
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationAddress;
