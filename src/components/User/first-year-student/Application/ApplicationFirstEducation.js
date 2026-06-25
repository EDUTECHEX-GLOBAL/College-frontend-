import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from '../../api/axiosInstance';
import { useNavigate, useLocation } from "react-router-dom";
import "./ApplicationFirstEducation.css";


const createEntryId = () =>
  window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const CERTIFICATE_AUTOFILL_FIELDS = [
  "countryOfInitialRegistration",
  "city",
  "remarks",
  "scoreDetails",
  "startDate",
  "endDate",
  "degree",
  "specialisation",
];

const UPLOAD_OVERWRITE_FIELDS = new Set([
  "degree",
  "specialisation",
  "city",
  "endDate",
  "remarks",
  "scoreDetails",
]);

const REQUIRED_EDUCATION_FIELDS = [
  { key: "countryOfInitialRegistration", label: "Country of initial registration" },
  { key: "degree", label: "Degree" },
  { key: "specialisation", label: "Specialisation" },
  { key: "institutionName", label: "Institution Name" },
  { key: "city", label: "City" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
];
const SCHOOL_GRADE_SPECIALISATIONS = [
  "10th Grade",
  "11th Grade",
  "12th Grade",
  "11th Grade / Intermediate First Year",
  "12th Grade / Intermediate Second Year",
];

const createEmptyEntry = () => ({
  id: createEntryId(),
  countryOfInitialRegistration: "",
  entryType: "",
  degree: "",
  specialisation: "",
  standardStudyPeriod: "",
  city: "",
  remarks: null,
  scoreDetails: {
    obtainedMarks: null,
    maxMarks: null,
    percentage: null,
    grade: "",
  },
  institutionName: "",
  startDate: "",
  endDate: "",
  isCurrentEnrollment: false,
});

const clearCertificateDataFromEntry = (entry = {}, clearManualFields = false) => ({
  ...entry,
  countryOfInitialRegistration: "",
  degree: "",
  specialisation: "",
  city: "",
  endDate: "",
  remarks: null,
  scoreDetails: {
    obtainedMarks: null,
    maxMarks: null,
    percentage: null,
    grade: "",
  },
  ...(clearManualFields
    ? {
        entryType: "",
        standardStudyPeriod: "",
        institutionName: "",
        startDate: "",
      }
    : {}),
  transcriptFileName: "",
  transcriptFileUrl: "",
  transcriptOriginalName: "",
  transcriptFileSize: 0,
  transcriptFileType: "",
  transcriptUploadedAt: "",
  documentStatus: "not_uploaded",
});

const getCertificateLabel = (entry = {}, uploadedCertificate = null) =>
  uploadedCertificate?.originalName ||
  entry.transcriptOriginalName ||
  entry.transcriptFileName ||
  "";

const ApplicationFirstEducation = ({ onInputChange }) => {
  const navigate   = useNavigate();
  const location   = useLocation();

  const countryOptions = [
    { value: "India", label: "India" },
    { value: "USA", label: "United States" },
    { value: "UK", label: "United Kingdom" },
    { value: "Germany", label: "Germany" },
    { value: "France", label: "France" },
    { value: "Canada", label: "Canada" },
    { value: "Australia", label: "Australia" },
  ];
  const degreeOptions = [
    { value: "11th Grade / Intermediate First Year", label: "11th Grade / Intermediate First Year" },
    { value: "12th Grade / Intermediate Second Year", label: "12th Grade / Intermediate Second Year" },
    { value: "bachelor", label: "Bachelor" },
    { value: "master", label: "Master" },
    { value: "diploma", label: "Diploma" },
    { value: "phd", label: "PhD" },
  ];
  const [isLoading,            setIsLoading]            = useState(true);
  const [isSubmitting,         setIsSubmitting]         = useState(false);
  const [isAutoFilling,        setIsAutoFilling]        = useState(false);
  const [error,                setError]                = useState("");
  const [autoFillMessage,      setAutoFillMessage]      = useState("");
  const [uploadedCertificate,  setUploadedCertificate]  = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(66);
  const [openCompactPicker, setOpenCompactPicker] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [wasEnrolled,         setWasEnrolled]         = useState(null);
  const [isCurrentlyEnrolled, setIsCurrentlyEnrolled] = useState(null);
  const educationFieldErrorStyle = {
    borderColor: "#ef4444",
    background: "#fffafa",
    boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.14)",
  };

const [educationEntries, setEducationEntries] = useState([
  {
    ...createEmptyEntry(),
    countryOfInitialRegistration:  "",
    entryType:                     "",
    degree:                        "",
    specialisation:                "",
    standardStudyPeriod:           "",
    city:                          "",
    remarks:                       null,   // ✅ was ""
    scoreDetails: {
      obtainedMarks: null,
      maxMarks: null,
      percentage: null,
      grade: "",
    },
    institutionName:               "",
    startDate:                     "",
    endDate:                       "",
    isCurrentEnrollment:           false,
  },
]);

  // ─────────────────────────────────────────────────────────────
  // FIX 3: useEffect-based resume mapping instead of calling
  // onInputChange inside setState callbacks (avoids the
  // "Cannot update a component while rendering" warning)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!onInputChange) return;

    const primary = educationEntries.length > 0 ? educationEntries[0] : {};

    onInputChange("qualificationLevel",  primary.degree                       || "");
    onInputChange("institutionName",     primary.institutionName              || "");
    onInputChange("boardUniversity",     primary.specialisation               || "");
    onInputChange("countryOfStudy",      primary.countryOfInitialRegistration || "");
    onInputChange("startYear",           primary.startDate
                                           ? primary.startDate.split("-")[0]
                                           : "");
    onInputChange("endYear",             primary.endDate
                                           ? primary.endDate.split("-")[0]
                                           : "");
onInputChange("score", primary.remarks !== null && primary.remarks !== undefined 
  ? primary.remarks 
  : "");
    onInputChange("standardStudyPeriod", primary.standardStudyPeriod || "");
    onInputChange("educationCity",       primary.city              || "");
    onInputChange("wasEnrolled",         wasEnrolled);
    onInputChange("isCurrentlyEnrolled", isCurrentlyEnrolled);
    onInputChange("educationEntries",    educationEntries);
  }, [educationEntries, wasEnrolled, isCurrentlyEnrolled]);

  const calculatePercentage = (obtainedMarks, maxMarks) => {
    const obtained = Number(obtainedMarks);
    const maximum = Number(maxMarks);
    if (!Number.isFinite(obtained) || !Number.isFinite(maximum) || maximum <= 0 || obtained < 0 || obtained > maximum) {
      return null;
    }
    return Number(((obtained / maximum) * 100).toFixed(2));
  };

  const normalizeUploadedScoreDetails = (scoreDetails = {}) => {
    const obtainedMarks = scoreDetails?.obtainedMarks;
    const maxMarks = scoreDetails?.maxMarks;
    const hasValidExtractedMarks =
      obtainedMarks !== "" &&
      obtainedMarks !== null &&
      obtainedMarks !== undefined &&
      maxMarks !== "" &&
      maxMarks !== null &&
      maxMarks !== undefined;

    if (!hasValidExtractedMarks) {
      return {
        hasValidExtractedMarks: false,
        scoreDetails: {
          obtainedMarks: null,
          maxMarks: null,
          percentage: null,
          grade: scoreDetails?.grade || "",
        },
      };
    }

    const percentage = scoreDetails.percentage ?? calculatePercentage(obtainedMarks, maxMarks);
    return {
      hasValidExtractedMarks: true,
      scoreDetails: {
        obtainedMarks: Number(obtainedMarks),
        maxMarks: Number(maxMarks),
        percentage,
        grade: scoreDetails?.grade || "",
      },
    };
  };

  // ─────────────────────────────────────────────────────────────
  // FETCH education data on mount
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    fetchEducationData();
  } else {
    setError("No authentication token found");
    setIsLoading(false);
  }
}, []);

  const fetchEducationData = async () => {
    try {
      setIsLoading(true);
    const res = await axiosInstance.get('/api/application/education');

      if (res.data.success && res.data.educationInfo) {
        const data = res.data.educationInfo;

        setWasEnrolled(data.wasEnrolled);
        setIsCurrentlyEnrolled(data.isCurrentlyEnrolled);

        if (data.educationEntries && data.educationEntries.length > 0) {
          const entriesWithIds = data.educationEntries.map((entry, index) => ({
            ...entry,
            scoreDetails: {
              obtainedMarks: entry.scoreDetails?.obtainedMarks ?? null,
              maxMarks: entry.scoreDetails?.maxMarks ?? null,
              percentage: entry.scoreDetails?.percentage ?? entry.remarks ?? null,
              grade: entry.scoreDetails?.grade || "",
            },
            startDate: entry.startDate
              ? new Date(entry.startDate).toISOString().split("T")[0]
              : "",
            endDate: entry.endDate
              ? new Date(entry.endDate).toISOString().split("T")[0]
              : "",
            id: entry.id || `${createEntryId()}-${index}`,
          }));
          setEducationEntries(entriesWithIds);
        }

        if (data.completionPercentage) {
          setCompletionPercentage(data.completionPercentage);
        }
      }
    } catch (err) {
      console.error("Fetch education error:", err);
      if (err.response?.status !== 404) {
        setError("Failed to load education data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLE ENTRY FIELD CHANGE
  // ─────────────────────────────────────────────────────────────
  const handleEntryChange = useCallback((id, field, value) => {
    setEducationEntries(prev =>
      prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry)
    );
    setValidationErrors(prev => {
      const key = `${id}.${field}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleScoreDetailsChange = useCallback((id, field, value) => {
    setEducationEntries(prev =>
      prev.map(entry => {
        if (entry.id !== id) return entry;

        const nextScoreDetails = {
          obtainedMarks: entry.scoreDetails?.obtainedMarks ?? null,
          maxMarks: entry.scoreDetails?.maxMarks ?? null,
          percentage: entry.scoreDetails?.percentage ?? null,
          grade: entry.scoreDetails?.grade || "",
          [field]: value,
        };
        const percentage = calculatePercentage(
          nextScoreDetails.obtainedMarks,
          nextScoreDetails.maxMarks
        );

        return {
          ...entry,
          scoreDetails: {
            ...nextScoreDetails,
            percentage,
          },
          remarks: percentage,
        };
      })
    );
    setValidationErrors(prev => {
      const key = `${id}.scoreDetails.${field}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleCompactSelect = (entryId, field, value) => {
    handleEntryChange(entryId, field, value);
    setOpenCompactPicker(null);
  };

  const handleEducationCertificateUpload = async (file, entryIndex = 0) => {
    if (!file || isAutoFilling) return;

    setIsAutoFilling(true);
    setAutoFillMessage("");
    setError("");

    const formData = new FormData();
    formData.append("certificate", file);
    formData.append("entryIndex", entryIndex);

    try {
      const res = await axiosInstance.post(
        "/api/application/education/upload-autofill",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Auto-fill failed");
      }

      console.log("Education upload-autofill response:", res.data);

      const { extractedFields = {}, file: uploadedFile } = res.data;
      console.log("Autofill extractedFields:", extractedFields);
      if (
        res.data?.rejectedGradeDocument ||
        ["9th Grade", "10th Grade"].includes(extractedFields.degree)
      ) {
        setUploadedCertificate(null);
        setAutoFillMessage("");
        setError(
          res.data?.message ||
          "Please upload 11th, 12th, diploma, bachelor, or higher education certificate. 9th/10th certificates are not accepted here."
        );
        return;
      }
      const normalizedExtractedFields = { ...extractedFields };
      delete normalizedExtractedFields.institutionName;
      const hasScoreDetailsResponse = Object.prototype.hasOwnProperty.call(
        normalizedExtractedFields,
        "scoreDetails"
      );
      const {
        hasValidExtractedMarks,
        scoreDetails: uploadedScoreDetails,
      } = normalizeUploadedScoreDetails(normalizedExtractedFields.scoreDetails);

      setWasEnrolled(true);
      setUploadedCertificate(uploadedFile);
      setEducationEntries(prev => {
        const next = [...prev];
        if (!next[entryIndex]) next[entryIndex] = createEmptyEntry();

        const detectedValues = Object.fromEntries(
          Object.entries(normalizedExtractedFields).filter(([key, value]) =>
            CERTIFICATE_AUTOFILL_FIELDS.includes(key) &&
            key !== "scoreDetails" &&
            key !== "remarks" &&
            value !== "" &&
            value !== null &&
            value !== undefined
          )
        );

        const currentEntry = next[entryIndex];
        const cleanedEntry = {
          ...currentEntry,
          specialisation: SCHOOL_GRADE_SPECIALISATIONS.includes(currentEntry.specialisation)
            ? ""
            : currentEntry.specialisation,
        };

        next[entryIndex] = {
          ...cleanedEntry,
          ...Object.fromEntries(
            Object.entries(detectedValues).filter(([key]) =>
              UPLOAD_OVERWRITE_FIELDS.has(key) ||
              cleanedEntry[key] === "" ||
              cleanedEntry[key] === null ||
              cleanedEntry[key] === undefined
            )
          ),
          ...(hasValidExtractedMarks
            ? {
                scoreDetails: uploadedScoreDetails,
                remarks: uploadedScoreDetails.percentage,
              }
            : hasScoreDetailsResponse
              ? {
                  scoreDetails: uploadedScoreDetails,
                  remarks: null,
                }
              : {}),
          transcriptFileName: uploadedFile?.key || "",
          transcriptFileUrl: uploadedFile?.url || "",
          transcriptOriginalName: uploadedFile?.originalName || "",
          transcriptFileSize: uploadedFile?.size || 0,
          transcriptFileType: uploadedFile?.type || "",
          transcriptUploadedAt: new Date().toISOString(),
          documentStatus: "pending",
        };
        return next;
      });

      setAutoFillMessage(
        "Certificate uploaded successfully. Some fields could not be detected. Please complete the highlighted required fields manually."
      );
    } catch (err) {
      console.error("Education auto-fill upload error:", err.response?.data || err.message);
      if (err.response?.data?.rejectedGradeDocument) {
        setUploadedCertificate(null);
        setAutoFillMessage("");
      }
      setError(err.response?.data?.message || err.message || "Failed to upload and auto-fill certificate");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleRemoveCertificate = async (entryIndex = 0) => {
    if (isSubmitting || isAutoFilling) return;

    const entry = educationEntries[entryIndex] || {};
    const clearManualFields = window.confirm("Remove certificate and clear all education details?");

    setError("");
    setIsSubmitting(true);

    try {
      if (entry.transcriptFileName) {
        await axiosInstance.delete(
          `/api/application/education/certificate/${entryIndex}?clearManualFields=${clearManualFields}`
        );
      }

      setUploadedCertificate(null);
      setAutoFillMessage("");
      setEducationEntries(prev => {
        const next = [...prev];
        if (!next[entryIndex]) next[entryIndex] = createEmptyEntry();
        next[entryIndex] = clearCertificateDataFromEntry(next[entryIndex], clearManualFields);
        return next;
      });
    } catch (err) {
      console.error("Remove education certificate error:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Failed to remove certificate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEntryPicker = (entry, field, options, placeholder = "Select") => {
    const pickerKey = `${entry.id}-${field}`;
    const isOpen = openCompactPicker === pickerKey;
    const selectedValue = entry[field] || "";
    const selectedLabel = options.find(option => option.value === selectedValue)?.label || selectedValue;
    const hasError = Boolean(validationErrors[`${entry.id}.${field}`]);

    return (
      <div
        className="applicationfirsteducation-compact-select"
        data-education-field={`${entry.id}.${field}`}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setOpenCompactPicker(null);
          }
        }}
      >
        <button
          type="button"
          id={pickerKey}
          className={`applicationfirsteducation-compact-select-trigger ${hasError ? "applicationfirsteducation-field-error" : ""}`}
          style={hasError ? educationFieldErrorStyle : undefined}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={isSubmitting}
          onClick={() => setOpenCompactPicker(isOpen ? null : pickerKey)}
        >
          <span>{selectedLabel || placeholder}</span>
          <span className="applicationfirsteducation-compact-select-arrow">v</span>
        </button>

        {isOpen && (
          <div
            className="applicationfirsteducation-compact-select-list"
            role="listbox"
            aria-labelledby={pickerKey}
          >
            <button
              type="button"
              className={`applicationfirsteducation-compact-select-option ${!selectedValue ? "selected" : ""}`}
              role="option"
              aria-selected={!selectedValue}
              onClick={() => handleCompactSelect(entry.id, field, "")}
            >
              {placeholder}
            </button>
            {options.map(option => (
              <button
                type="button"
                key={option.value}
                className={`applicationfirsteducation-compact-select-option ${selectedValue === option.value ? "selected" : ""}`}
                role="option"
                aria-selected={selectedValue === option.value}
                onClick={() => handleCompactSelect(entry.id, field, option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // ADD / REMOVE ENTRY
  // ─────────────────────────────────────────────────────────────
const addNewEntry = () => {
  const newId = createEntryId();
  setEducationEntries(prev => [
    ...prev,
    {
      id:                            newId,
      countryOfInitialRegistration:  "",
      entryType:                     "",
      degree:                        "",
      specialisation:                "",
      standardStudyPeriod:           "",
      city:                          "",
      remarks:                       null,   // ✅ was ""
      scoreDetails: {
        obtainedMarks: null,
        maxMarks: null,
        percentage: null,
        grade: "",
      },
      institutionName:               "",
      startDate:                     "",
      endDate:                       "",
      isCurrentEnrollment:           false,
    },
  ]);
};


  const removeEntry = (id) => {
    if (educationEntries.length > 1) {
      setEducationEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  // ─────────────────────────────────────────────────────────────
  // VALIDATE
  // ─────────────────────────────────────────────────────────────
  const validateForm = () => {
    const missingFields = [];
    const nextValidationErrors = {};
    let firstMissingFieldKey = "";

    const addEntryError = (entry, fieldKey, label, index) => {
      const errorKey = `${entry.id}.${fieldKey}`;
      nextValidationErrors[errorKey] = true;
      if (!firstMissingFieldKey) firstMissingFieldKey = errorKey;
      missingFields.push(`Entry ${index + 1}: ${label}`);
    };

    if (wasEnrolled === null) {
      missingFields.push("Please indicate if you were enrolled at an institute of higher education");
      return { isValid: false, missingFields, validationErrors: nextValidationErrors, firstMissingFieldKey };
    }

    if (wasEnrolled === true) {
      educationEntries.forEach((entry, index) => {
        REQUIRED_EDUCATION_FIELDS.forEach(({ key, label }) => {
          const value = entry[key];
          if (value === "" || value === null || value === undefined) {
            addEntryError(entry, key, label, index);
          }
        });

        const obtainedMarks = entry.scoreDetails?.obtainedMarks;
        const maxMarks = entry.scoreDetails?.maxMarks;
        const hasObtainedMarks =
          obtainedMarks !== "" &&
          obtainedMarks !== null &&
          obtainedMarks !== undefined;
        const hasMaxMarks =
          maxMarks !== "" &&
          maxMarks !== null &&
          maxMarks !== undefined;

        if (!hasObtainedMarks) {
          addEntryError(entry, "scoreDetails.obtainedMarks", "Marks Obtained", index);
        }

        if (!hasMaxMarks) {
          addEntryError(entry, "scoreDetails.maxMarks", "Total Marks", index);
        }

        if (hasObtainedMarks !== hasMaxMarks) {
          if (!hasObtainedMarks) nextValidationErrors[`${entry.id}.scoreDetails.obtainedMarks`] = true;
          if (!hasMaxMarks) nextValidationErrors[`${entry.id}.scoreDetails.maxMarks`] = true;
          missingFields.push(`Entry ${index + 1}: Marks obtained and total marks must be entered together`);
        }

        if (hasObtainedMarks) {
          const obtained = Number(obtainedMarks);
          if (!Number.isFinite(obtained) || obtained < 0) {
            nextValidationErrors[`${entry.id}.scoreDetails.obtainedMarks`] = true;
            if (!firstMissingFieldKey) firstMissingFieldKey = `${entry.id}.scoreDetails.obtainedMarks`;
            missingFields.push(`Entry ${index + 1}: Marks obtained must be 0 or higher`);
          }
        }
        if (hasMaxMarks) {
          const maximum = Number(maxMarks);
          if (!Number.isFinite(maximum) || maximum <= 0) {
            nextValidationErrors[`${entry.id}.scoreDetails.maxMarks`] = true;
            if (!firstMissingFieldKey) firstMissingFieldKey = `${entry.id}.scoreDetails.maxMarks`;
            missingFields.push(`Entry ${index + 1}: Total marks must be greater than 0`);
          }
        }
        if (hasObtainedMarks && hasMaxMarks && Number(obtainedMarks) > Number(maxMarks)) {
          nextValidationErrors[`${entry.id}.scoreDetails.obtainedMarks`] = true;
          nextValidationErrors[`${entry.id}.scoreDetails.maxMarks`] = true;
          if (!firstMissingFieldKey) firstMissingFieldKey = `${entry.id}.scoreDetails.obtainedMarks`;
          missingFields.push(`Entry ${index + 1}: Marks obtained cannot exceed total marks`);
        }
      });
    }

    if (isCurrentlyEnrolled === null)
      missingFields.push("Please indicate if you are currently enrolled in another university");

    return {
      isValid: missingFields.length === 0,
      missingFields,
      validationErrors: nextValidationErrors,
      firstMissingFieldKey,
    };
  };

  const scrollToEducationField = (fieldKey) => {
    if (!fieldKey) return;
    window.setTimeout(() => {
      const target = document.querySelector(`[data-education-field="${fieldKey}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusTarget = target.matches("input, button, select, textarea")
        ? target
        : target.querySelector("input, button, select, textarea");
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    }, 100);
  };

  // ─────────────────────────────────────────────────────────────
  // SAVE to backend
  // ─────────────────────────────────────────────────────────────
  const saveEducation = async () => {
    if (isSubmitting) return false;

    const validation = validateForm();
    if (!validation.isValid) {
      setValidationErrors(validation.validationErrors || {});
      setError("Please complete missing education details before continuing.");
      alert("Please complete missing education details before continuing.");
      scrollToEducationField(validation.firstMissingFieldKey);
      return false;
    }

    setIsSubmitting(true);
    setError("");
    setValidationErrors({});

    try {
      const entriesToSave = educationEntries.map(({ id, ...rest }) => {
        const obtainedMarks = rest.scoreDetails?.obtainedMarks;
        const maxMarks = rest.scoreDetails?.maxMarks;
        const hasMarks =
          obtainedMarks !== "" &&
          obtainedMarks !== null &&
          obtainedMarks !== undefined &&
          maxMarks !== "" &&
          maxMarks !== null &&
          maxMarks !== undefined;
        const percentage = hasMarks
          ? calculatePercentage(obtainedMarks, maxMarks)
          : rest.scoreDetails?.percentage ?? rest.remarks;

        return {
          ...rest,
          remarks: percentage === "" || percentage === null || percentage === undefined
            ? null
            : Number(percentage),
          scoreDetails: {
            obtainedMarks: hasMarks ? Number(obtainedMarks) : null,
            maxMarks: hasMarks ? Number(maxMarks) : null,
            percentage: percentage === "" || percentage === null || percentage === undefined
              ? null
              : Number(percentage),
            grade: rest.scoreDetails?.grade || "",
          },
        };
      });

      const payload = {
        wasEnrolled,
        isCurrentlyEnrolled,
        educationEntries: wasEnrolled ? entriesToSave : [],
      };

      const res = await axiosInstance.post('/api/application/education', payload);

      if (res.data.success) {
        setCompletionPercentage(75);
        return true;
      }
    } catch (err) {
      console.error("Save education error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to save education data");
      alert("Failed to save education information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
    return false;
  };

  // ─────────────────────────────────────────────────────────────
  // NAVIGATION - UPDATED to go to /scores instead of /documents
  // ─────────────────────────────────────────────────────────────
  const handleNext = async () => {
    const saved = await saveEducation();
    if (saved) {
      let targetPath;
      if (location.pathname.includes("/firsteducation")) {
        targetPath = location.pathname.replace("/firsteducation", "/scores");
      } else {
        targetPath = "/firstyear/dashboard/application/scores";
      }
      navigate(targetPath);
    }
  };

  const handleBack = () => {
    let backPath;
    if (location.pathname.includes("/firsteducation")) {
      backPath = location.pathname.replace("/firsteducation", "/specialneeds");
    } else {
      backPath = "/firstyear/dashboard/application/specialneeds";
    }
    navigate(backPath);
  };

  // ─────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="applicationfirsteducation">
        <div className="applicationfirsteducation-loading-container">
          <div className="applicationfirsteducation-loading-spinner"></div>
          <p className="applicationfirsteducation-loading-text">Loading your education information...</p>
        </div>
      </div>
    );
  }

  const primaryEducationEntry = educationEntries[0] || {};
  const hasUploadedCertificate =
    Boolean(uploadedCertificate) ||
    Boolean(primaryEducationEntry.transcriptFileName) ||
    Boolean(primaryEducationEntry.transcriptFileUrl);
  const uploadedCertificateLabel = getCertificateLabel(primaryEducationEntry, uploadedCertificate);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="applicationfirsteducation">

      {/* Header */}
      <div className="applicationfirsteducation-page-header">
        <div className="applicationfirsteducation-header-content">
          <h1 className="applicationfirsteducation-page-title">BA Communication Design</h1>
          <div className="applicationfirsteducation-application-id">APPLICATION ID - UEG0000104849</div>
        </div>
        <div className="applicationfirsteducation-progress-indicator">
          <span className="applicationfirsteducation-progress-value">{completionPercentage}%</span>
          <span className="applicationfirsteducation-progress-label">Completed</span>
        </div>
      </div>

      {/* Navigation Steps */}
      <div className="applicationfirsteducation-steps-container">
        {[
          "Study programme",
          "Applicant Details",
          "Address",
          "Entrance qualification",
          "Special Needs",
          "Higher Education",
          "Test Scores",
          "Documents",
          "Declaration",
          "Review",
        ].map((step, index) => {
          let stepClass = "applicationfirsteducation-step-item";
          if (index < 5) stepClass += " completed";
          if (index === 5) stepClass += " active";
          return (
            <div key={step} className={stepClass}>
              <span className="applicationfirsteducation-step-marker">{index < 5 ? "✓" : index + 1}</span>
              <span className="applicationfirsteducation-step-text">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="applicationfirsteducation-error-notice">
          <span className="applicationfirsteducation-error-message-text">{error}</span>
          <button onClick={() => setError("")} className="applicationfirsteducation-error-dismiss">×</button>
        </div>
      )}

      {/* Main Form */}
      <div className="applicationfirsteducation-form-wrapper">
        <div className="applicationfirsteducation-form-header-section">
          <h2 className="applicationfirsteducation-form-main-title">Higher Education</h2>
          <p className="applicationfirsteducation-form-description">
            Please fill in the details below, if you have studied at university level before —
            with or without graduating. Do not withhold any information, even if you did not
            attend any classes and/or did not pass any exams.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>

          <div className="applicationfirsteducation-form-card applicationfirsteducation-autofill-card">
            <div>
              <h3 className="applicationfirsteducation-card-title">Auto-fill from certificate</h3>
              <p className="applicationfirsteducation-autofill-text">
                Upload your 11th, 12th, diploma, bachelor, or previous higher education certificate.
                We will extract available details and you can review before saving.
              </p>
              <p className="applicationfirsteducation-autofill-warning">
                Institution name still needs manual review.
              </p>
            </div>
            <label className="applicationfirsteducation-upload-dropzone">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                disabled={isSubmitting || isAutoFilling}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleEducationCertificateUpload(file, 0);
                  event.target.value = "";
                }}
              />
              <span>{isAutoFilling ? "Uploading and reading..." : "Choose certificate"}</span>
            </label>
            {hasUploadedCertificate && uploadedCertificateLabel && (
              <div className="applicationfirsteducation-uploaded-file">
                Uploaded: {uploadedCertificateLabel}
              </div>
            )}
            {autoFillMessage && (
              <div className="applicationfirsteducation-autofill-message">
                {autoFillMessage}
              </div>
            )}
            {hasUploadedCertificate && (
              <button
                type="button"
                className="applicationfirsteducation-remove-certificate-button"
                onClick={() => handleRemoveCertificate(0)}
                disabled={isSubmitting || isAutoFilling}
              >
                Remove certificate
              </button>
            )}
          </div>

          {/* Was Enrolled? */}
          <div className="applicationfirsteducation-form-card">
            <h3 className="applicationfirsteducation-card-title">University/College education 1</h3>

            <div className="applicationfirsteducation-field-group">
              <label className="applicationfirsteducation-field-label required">
                I was enrolled at an institute of higher education at an earlier date
              </label>
              <div className="applicationfirsteducation-radio-options">
                <label className="applicationfirsteducation-radio-choice">
                  <input
                    type="radio"
                    name="wasEnrolled"
                    value="yes"
                    checked={wasEnrolled === true}
                    onChange={() => setWasEnrolled(true)}
                    disabled={isSubmitting}
                  />
                  <span className="applicationfirsteducation-radio-text">Yes</span>
                </label>
                <label className="applicationfirsteducation-radio-choice">
                  <input
                    type="radio"
                    name="wasEnrolled"
                    value="no"
                    checked={wasEnrolled === false}
                   onChange={() => {
  setWasEnrolled(false);
  setEducationEntries([{
    ...createEmptyEntry(),
    id:                            createEntryId(),
    countryOfInitialRegistration:  "",
    entryType:                     "",
    degree:                        "",
    specialisation:                "",
    standardStudyPeriod:           "",
    city:                          "",
    remarks:                       null,   // ✅ was ""
    scoreDetails: {
      obtainedMarks: null,
      maxMarks: null,
      percentage: null,
      grade: "",
    },
    institutionName:               "",
    startDate:                     "",
    endDate:                       "",
    isCurrentEnrollment:           false,
  }]);
}}
                    disabled={isSubmitting}
                  />
                  <span className="applicationfirsteducation-radio-text">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Education Entries */}
          {wasEnrolled === true && (
            <>
              {educationEntries.map((entry, index) => (
                <div key={entry.id} className="applicationfirsteducation-form-card applicationfirsteducation-education-card">
                  <div className="applicationfirsteducation-card-header">
                    <h3 className="applicationfirsteducation-card-title">University/College education {index + 1}</h3>
                    {educationEntries.length > 1 && (
                      <button
                        type="button"
                        className="applicationfirsteducation-remove-button"
                        onClick={() => removeEntry(entry.id)}
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="applicationfirsteducation-form-grid">

                    {/* Country of initial registration */}
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label required">Country of initial registration</label>
                      {renderEntryPicker(entry, "countryOfInitialRegistration", countryOptions)}
                    </div>

                    {/* Degree */}
                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label required">Degree</label>
                      {renderEntryPicker(entry, "degree", degreeOptions)}
                    </div>

                    {/* Specialisation */}
                    <div className="applicationfirsteducation-input-group" data-education-field={`${entry.id}.specialisation`}>
                      <label className="applicationfirsteducation-input-label required">Specialisation</label>
                      <input
                        type="text"
                        className={`applicationfirsteducation-input-field ${validationErrors[`${entry.id}.specialisation`] ? "applicationfirsteducation-field-error" : ""}`}
                        style={validationErrors[`${entry.id}.specialisation`] ? educationFieldErrorStyle : undefined}
                        value={entry.specialisation || ""}
                        onChange={(e) => handleEntryChange(entry.id, "specialisation", e.target.value)}
                        placeholder="Enter stream / group / specialisation"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Institution Name */}
                    <div className="applicationfirsteducation-input-group" data-education-field={`${entry.id}.institutionName`}>
                      <label className="applicationfirsteducation-input-label required">Institution Name</label>
                      <input
                        type="text"
                        className={`applicationfirsteducation-input-field ${validationErrors[`${entry.id}.institutionName`] ? "applicationfirsteducation-field-error" : ""}`}
                        style={validationErrors[`${entry.id}.institutionName`] ? educationFieldErrorStyle : undefined}
                        value={entry.institutionName || ""}
                        onChange={(e) => handleEntryChange(entry.id, "institutionName", e.target.value)}
                        placeholder="Enter school / college name manually"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* City */}
                    <div className="applicationfirsteducation-input-group" data-education-field={`${entry.id}.city`}>
                      <label className="applicationfirsteducation-input-label required">City</label>
                      <input
                        type="text"
                        className={`applicationfirsteducation-input-field ${validationErrors[`${entry.id}.city`] ? "applicationfirsteducation-field-error" : ""}`}
                        style={validationErrors[`${entry.id}.city`] ? educationFieldErrorStyle : undefined}
                        value={entry.city || ""}
                        onChange={(e) => handleEntryChange(entry.id, "city", e.target.value)}
                        placeholder="Enter city"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Start Date */}
                    <div className="applicationfirsteducation-input-group" data-education-field={`${entry.id}.startDate`}>
                      <label className="applicationfirsteducation-input-label required">Start Date</label>
                    <input
  type="date"
  className={`applicationfirsteducation-input-field ${validationErrors[`${entry.id}.startDate`] ? "applicationfirsteducation-field-error" : ""}`}
  style={validationErrors[`${entry.id}.startDate`] ? educationFieldErrorStyle : undefined}
  value={entry.startDate || ""}
  min="2000-01-01"
  max={new Date().toISOString().split("T")[0]}         // today
  onChange={(e) => handleEntryChange(entry.id, "startDate", e.target.value)}
  disabled={isSubmitting}
/>
                    </div>

                    {/* End Date */}
                    <div className="applicationfirsteducation-input-group" data-education-field={`${entry.id}.endDate`}>
                      <label className="applicationfirsteducation-input-label required">End Date</label>
                     <input
  type="date"
  className={`applicationfirsteducation-input-field ${validationErrors[`${entry.id}.endDate`] ? "applicationfirsteducation-field-error" : ""}`}
  style={validationErrors[`${entry.id}.endDate`] ? educationFieldErrorStyle : undefined}
  value={entry.endDate || ""}
  min={entry.startDate || "2000-01-01"}                // can't end before start
  max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    .toISOString().split("T")[0]}                      // 1 year future max
  onChange={(e) => handleEntryChange(entry.id, "endDate", e.target.value)}
  disabled={isSubmitting}
/>
                    </div>

                    
                    {/* Marks / Score */}
                    <div className="applicationfirsteducation-input-group full-width applicationfirsteducation-score-section-label">
                      <span className="applicationfirsteducation-input-label">Marks / Score</span>
                    </div>

                    <div className="applicationfirsteducation-input-group" data-education-field={`${entry.id}.scoreDetails.obtainedMarks`}>
                      <label className="applicationfirsteducation-input-label required">Marks Obtained</label>
                      <input
                        type="number"
                        className={`applicationfirsteducation-input-field ${validationErrors[`${entry.id}.scoreDetails.obtainedMarks`] ? "applicationfirsteducation-field-error" : ""}`}
                        style={validationErrors[`${entry.id}.scoreDetails.obtainedMarks`] ? educationFieldErrorStyle : undefined}
                        value={entry.scoreDetails?.obtainedMarks ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || Number(value) >= 0) {
                            handleScoreDetailsChange(entry.id, "obtainedMarks", value);
                          }
                        }}
                        placeholder="Marks obtained"
                        min="0"
                        step="0.01"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="applicationfirsteducation-input-group" data-education-field={`${entry.id}.scoreDetails.maxMarks`}>
                      <label className="applicationfirsteducation-input-label required">Total Marks</label>
                      <input
                        type="number"
                        className={`applicationfirsteducation-input-field ${validationErrors[`${entry.id}.scoreDetails.maxMarks`] ? "applicationfirsteducation-field-error" : ""}`}
                        style={validationErrors[`${entry.id}.scoreDetails.maxMarks`] ? educationFieldErrorStyle : undefined}
                        value={entry.scoreDetails?.maxMarks ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || Number(value) > 0) {
                            handleScoreDetailsChange(entry.id, "maxMarks", value);
                          }
                        }}
                        placeholder="Total marks"
                        min="0.01"
                        step="0.01"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="applicationfirsteducation-input-group">
                      <label className="applicationfirsteducation-input-label">Percentage</label>
                      <input
                        type="text"
                        className="applicationfirsteducation-input-field"
                        value={
                          entry.scoreDetails?.percentage !== null &&
                          entry.scoreDetails?.percentage !== undefined
                            ? `${entry.scoreDetails.percentage}%`
                            : ""
                        }
                        placeholder="Calculated percentage"
                        readOnly
                        disabled
                      />
                    </div>

                  </div>
                </div>
              ))}

              {/* Add Another Entry */}
              <div className="applicationfirsteducation-add-entry-container">
                <button
                  type="button"
                  className="applicationfirsteducation-add-button"
                  onClick={addNewEntry}
                  disabled={isSubmitting}
                >
                  + Add Another Entry
                </button>
              </div>
            </>
          )}

          {/* Currently Enrolled? */}
          <div className="applicationfirsteducation-form-card">
            <h3 className="applicationfirsteducation-card-title">Further information</h3>

            <div className="applicationfirsteducation-field-group">
              <label className="applicationfirsteducation-field-label required">
                Are you currently enrolled in another university?
              </label>
              <div className="applicationfirsteducation-radio-options">
                <label className="applicationfirsteducation-radio-choice">
                  <input
                    type="radio"
                    name="currentlyEnrolled"
                    value="yes"
                    checked={isCurrentlyEnrolled === true}
                    onChange={() => setIsCurrentlyEnrolled(true)}
                    disabled={isSubmitting}
                  />
                  <span className="applicationfirsteducation-radio-text">Yes</span>
                </label>
                <label className="applicationfirsteducation-radio-choice">
                  <input
                    type="radio"
                    name="currentlyEnrolled"
                    value="no"
                    checked={isCurrentlyEnrolled === false}
                    onChange={() => setIsCurrentlyEnrolled(false)}
                    disabled={isSubmitting}
                  />
                  <span className="applicationfirsteducation-radio-text">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="applicationfirsteducation-action-buttons">
            <button
              type="button"
              className="applicationfirsteducation-button button-secondary"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </button>

            <button
              type="submit"
              className="applicationfirsteducation-button button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>Save and Continue</>
              )}
            </button>
          </div>

          

        </form>
      </div>
    </div>
  );
};

export default ApplicationFirstEducation;
