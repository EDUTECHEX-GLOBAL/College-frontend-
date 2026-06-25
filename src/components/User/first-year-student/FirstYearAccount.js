import React, { useRef, useState } from "react";
import axiosInstance, { clearAllUserData } from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import "./FirstYearAccount.css";
import OtpVerification from "./OtpVerification";

/* ── Eye icons ── */
const IcoEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IcoEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ── EduTechEX SVG Logo ── */
const EduTechLogo = () => (
  <svg
    viewBox="0 0 506 106"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    className="fy-svg-logo"
    aria-label="EduTechEX"
  >
    <defs>
      <linearGradient id="logoGrad1" gradientUnits="userSpaceOnUse" x1="516.3248" y1="53.11" x2="67.3956" y2="53.11" gradientTransform="matrix(1 0 0 -1 0 106.11)">
        <stop offset="0" stopColor="#3C4C9B"/>
        <stop offset="0.4042" stopColor="#323E91"/>
        <stop offset="1" stopColor="#293682"/>
      </linearGradient>
      <linearGradient id="logoGradX" gradientUnits="userSpaceOnUse" x1="399.2313" y1="79.1373" x2="482.5292" y2="50.4227" gradientTransform="matrix(1 0 0 -1 0 106.11)">
        <stop offset="0.006" stopColor="#64C5E0"/>
        <stop offset="1" stopColor="#12A480"/>
      </linearGradient>
      <clipPath id="xClip">
        <polygon points="460.82,22.08 446.1,22.08 467.17,49.13 398.72,49.13 398.72,57.32 467.13,57.32 446.73,83.52 461.45,83.52 485.17,53.35"/>
      </clipPath>
    </defs>
    {/* Main letterforms */}
    <path fill="url(#logoGrad1)" d="M82.86,33.68c-0.48-0.33-0.96-0.65-1.47-0.94c-0.27-0.15-0.55-0.29-0.83-0.44c0.28,0.14,0.56,0.28,0.83,0.44C81.9,33.04,82.39,33.35,82.86,33.68z M87.09,37.59c0.82,1.01,1.57,2.1,2.21,3.28c1.9,3.47,2.87,7.47,2.87,11.87c0,4.4-0.96,8.39-2.87,11.87c-0.8,1.45-1.74,2.78-2.8,3.98c1.07-1.2,2.01-2.52,2.81-3.98c1.9-3.47,2.87-7.47,2.87-11.87c0-4.39-0.96-8.39-2.87-11.86C88.66,39.7,87.91,38.6,87.09,37.59z M39.36,30.19c1.18,0,2.17-0.38,2.96-1.13c0.79-0.75,1.21-1.75,1.21-2.88c0-1.12-0.41-2.12-1.19-2.9c-0.79-0.79-1.79-1.19-2.98-1.19H3.97c-1.13,0-2.11,0.39-2.92,1.17c-0.82,0.78-1.25,1.82-1.25,3v53.05c0,1.14,0.41,2.13,1.23,2.94c0.82,0.82,1.8,1.23,2.95,1.23h35.4c1.19,0,2.19-0.4,2.98-1.19c0.78-0.78,1.19-1.78,1.19-2.9c0-1.14-0.42-2.13-1.21-2.88c-0.79-0.75-1.78-1.13-2.96-1.13H8.15V56.76h22.4c1.09,0,2.05-0.37,2.84-1.09c0.83-0.77,1.33-1.87,1.33-3c0-1.12-0.41-2.12-1.19-2.9c-0.79-0.79-1.79-1.18-2.98-1.18H8.13V30.19H39.36z M85.62,26.01c-4.64-2.61-9.98-3.93-15.84-3.93H56.19c-1.18,0-2.19,0.4-2.98,1.18c-0.79,0.79-1.19,1.79-1.19,2.98V79.3c0,1.19,0.4,2.19,1.19,2.98c0.79,0.79,1.79,1.19,2.98,1.19h13.59c5.87,0,11.2-1.33,15.84-3.93c4.66-2.61,8.33-6.31,10.92-10.96c2.58-4.64,3.89-9.97,3.89-15.84c0-5.87-1.31-11.19-3.89-15.81C93.95,32.3,90.28,28.63,85.62,26.01z M89.31,64.6c-0.8,1.45-1.74,2.78-2.81,3.98c-1.47,1.65-3.17,3.06-5.12,4.2c-3.37,1.97-7.27,2.96-11.61,2.96h-9.42V29.81h9.42c3.99,0,7.61,0.85,10.79,2.49c0.28,0.14,0.56,0.28,0.83,0.44c0.51,0.29,0.99,0.61,1.47,0.94c1.6,1.1,3.01,2.41,4.23,3.91c0.82,1.01,1.57,2.1,2.22,3.28c1.9,3.47,2.87,7.47,2.87,11.86C92.17,57.13,91.21,61.13,89.31,64.6z M155.13,22.08c-1.19,0-2.19,0.4-2.98,1.19c-0.79,0.79-1.19,1.79-1.19,2.98v36.53c0,2.66-0.68,5.07-2.03,7.14c-1.36,2.09-3.26,3.75-5.66,4.93c-2.44,1.2-5.28,1.8-8.44,1.8c-3.22,0-6.11-0.61-8.6-1.8c-2.45-1.18-4.37-2.83-5.73-4.92c-1.34-2.07-2.03-4.48-2.03-7.14V26.25c0-1.18-0.4-2.19-1.19-2.98c-0.79-0.79-1.79-1.19-2.98-1.19c-1.19,0-2.19,0.4-2.98,1.19s-1.19,1.79-1.19,2.98v36.53c0,4.2,1.07,8.01,3.17,11.33c2.1,3.33,5.07,5.95,8.84,7.8c3.72,1.83,7.99,2.77,12.69,2.77c4.65,0,8.87-0.93,12.55-2.77c3.71-1.85,6.65-4.48,8.75-7.8c2.1-3.33,3.17-7.14,3.17-11.33V26.25c0-1.18-0.4-2.19-1.19-2.98C157.33,22.48,156.32,22.08,155.13,22.08z M214.04,23.19c-0.73-0.72-1.71-1.11-2.83-1.11h-41.73c-1.12,0-2.1,0.39-2.83,1.11c-0.74,0.74-1.12,1.69-1.12,2.83c0,1.07,0.39,2.02,1.11,2.75c0.74,0.74,1.69,1.12,2.83,1.12h16.66v49.42c0,1.14,0.41,2.13,1.23,2.94c0.8,0.8,1.82,1.23,2.95,1.23c1.27,0,2.37-0.5,3.17-1.44c0.67-0.8,1-1.84,1-2.88V29.89h16.74c1.14,0,2.09-0.37,2.83-1.11c0.73-0.73,1.12-1.68,1.12-2.75C215.15,24.9,214.77,23.92,214.04,23.19z M260.94,30.19c1.18,0,2.17-0.38,2.96-1.13c0.79-0.75,1.21-1.75,1.21-2.88c0-1.12-0.41-2.12-1.19-2.9c-0.79-0.79-1.79-1.19-2.98-1.19h-35.4c-1.13,0-2.11,0.39-2.92,1.17c-0.82,0.78-1.25,1.82-1.25,3v53.05c0,1.14,0.41,2.13,1.23,2.94c0.82,0.82,1.8,1.23,2.95,1.23h35.4c1.19,0,2.19-0.4,2.98-1.19c0.78-0.78,1.19-1.78,1.19-2.9c0-1.14-0.42-2.13-1.21-2.88c-0.79-0.75-1.78-1.13-2.96-1.13h-31.23V56.76h22.4c1.09,0,2.05-0.37,2.84-1.09c0.83-0.77,1.33-1.87,1.33-3c0-1.12-0.41-2.12-1.19-2.9c-0.79-0.79-1.79-1.18-2.98-1.18h-22.4V30.19H260.94z M290.19,32.53c3.41-2.1,7.15-3.18,11.13-3.18c2.91,0,5.5,0.38,7.68,1.14c2.15,0.75,4.17,1.96,5.99,3.6c0.73,0.66,1.64,0.99,2.71,0.99c0.61,0,1.2-0.15,1.74-0.47c0.45-0.26,0.8-0.6,1.02-1.02c0.37-0.24,0.67-0.56,0.92-0.95c0.32-0.52,0.48-1.1,0.48-1.74c0-1.15-0.46-2.09-1.27-2.68c-2.87-2.4-5.88-4.17-8.98-5.27c-3.09-1.1-6.55-1.66-10.3-1.66c-5.58,0-10.77,1.43-15.42,4.25c-4.64,2.82-8.36,6.67-11.07,11.46c-2.71,4.79-4.08,10.07-4.08,15.69c0,5.68,1.39,10.98,4.12,15.77c2.73,4.79,6.47,8.65,11.11,11.46c4.65,2.82,9.82,4.25,15.35,4.25c7.88,0,14.38-2.29,19.31-6.81l0.07-0.07c0.77-0.83,1.15-1.82,1.15-2.94c0-1.18-0.42-2.2-1.21-2.96c-0.79-0.75-1.73-1.13-2.8-1.13c-0.82,0-1.61,0.28-2.42,0.87c-4.18,3.33-8.93,5.02-14.11,5.02c-4.03,0-7.8-1.06-11.21-3.14c-3.42-2.09-6.17-4.96-8.17-8.53c-2-3.57-3.01-7.53-3.01-11.78c0-4.14,1.02-8.06,3.05-11.62C283.99,37.54,286.76,34.65,290.19,32.53z M378.8,22.08c-0.86-0.02-1.73,0.21-2.44,0.69c-1.2,0.81-1.84,2.04-1.84,3.48v22.32h-34.38V26.25c0-1.18-0.4-2.19-1.19-2.98c-0.79-0.79-1.79-1.19-2.98-1.19c-1.13,0-2.11,0.39-2.92,1.17c-0.82,0.78-1.25,1.82-1.25,3V79.3c0,1.14,0.41,2.13,1.23,2.94c0.82,0.82,1.8,1.23,2.95,1.23c1.27,0,2.37-0.5,3.17-1.44c0.67-0.8,1-1.84,1-2.88V56.3h34.38v23c0,1.12,0.42,2.14,1.23,2.94c0.82,0.82,1.8,1.23,2.95,1.23c1.27,0,2.37-0.5,3.17-1.44c0.67-0.8,1-1.84,1-2.88v-52.9c0-1.18-0.4-2.19-1.19-2.98C380.89,22.5,379.94,22.1,378.8,22.08z M446.1,30.26l-47.37,0.01v-8.18h18.89h22.54L446.1,30.26z M446.1,75.34l-47.37-0.01v8.18h18.89h22.54L446.1,75.34z M505.57,83.52h-10.57L481.9,66.68l5.28-6.78L505.57,83.52z M495.63,22.08l-13.68,17.56l5.28,6.78l18.96-24.35L495.63,22.08z"/>
    {/* Gradient X mark */}
    <polygon clipPath="url(#xClip)" fill="url(#logoGradX)" points="460.82,22.08 446.1,22.08 467.17,49.13 398.72,49.13 398.72,57.32 467.13,57.32 446.73,83.52 461.45,83.52 485.17,53.35"/>
  </svg>
);

const STEPS = [
  { num: 1, label: 'Account'  },
  { num: 2, label: 'Personal' },
  { num: 3, label: 'Contact'  },
  { num: 4, label: 'Passport' },
  { num: 5, label: 'Privacy'  },
];

const NAME_REGEX = /^[A-Za-z\s]+$/;
const PHONE_REGEX = /^\d{10}$/;

const sanitizeName = (value) => value.replace(/[^A-Za-z\s]/g, "");
const normalizeName = (value) => sanitizeName(value).replace(/\s+/g, " ").trim();

const formatDateForInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateAge = (dateString) => {
  if (!dateString) return null;
  const birthDate = new Date(dateString);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
};

const isValidAge = (dateString) => {
  const age = calculateAge(dateString);
  return age !== null && age >= 15 && age <= 25;
};

const getBirthDateLimits = () => {
  const today = new Date();
  const maxDate = new Date(today);
  const minDate = new Date(today);

  maxDate.setFullYear(today.getFullYear() - 15);
  minDate.setFullYear(today.getFullYear() - 25);

  return {
    min: formatDateForInput(minDate),
    max: formatDateForInput(maxDate),
  };
};

const FirstYearAccount = () => {
  const navigate = useNavigate();
  const birthDateLimits = getBirthDateLimits();
  const fieldRefs = {
    email: useRef(null),
    confirmEmail: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
    firstName: useRef(null),
    lastName: useRef(null),
    preferredFirstName: useRef(null),
    birthDate: useRef(null),
    phone: useRef(null),
    passportNumber: useRef(null),
    passportIssueDate: useRef(null),
    passportExpiryDate: useRef(null),
    issuingCountry: useRef(null),
    citizenship: useRef(null),
    agreeToTerms: useRef(null),
  };

  const [formData, setFormData] = useState({
    email: "", confirmEmail: "", password: "", confirmPassword: "",
    studentType: "first-year-2025-2026", firstName: "",
    useDifferentFirstName: "no", preferredFirstName: "", lastName: "",
    birthDate: "", phone: "", countryCode: "+91",
    addressLine1: "", addressLine2: "", city: "", state: "",
    zipCode: "", country: "", europeanUnionResident: "",
    hasPassport: "",
    passportNumber: "", passportIssueDate: "", passportExpiryDate: "",
    issuingCountry: "", citizenship: "",
    passportFileName: "", passportFileKey: "", passportFileUrl: "",
    passportOriginalName: "", passportFileType: "", passportFileSize: 0,
    passportUploadedAt: null, passportValidationStatus: "not_checked",
    receiveComms: "", agreeToTerms: false,
  });

  const [pwValid, setPwValid] = useState({
    length: false, uppercase: false, lowercase: false,
    number: false, specialChar: false, noSpaces: false,
  });

  const [showAddress,        setShowAddress]        = useState(false);
  const [loading,            setLoading]            = useState(false);
  const [message,            setMessage]            = useState({ type: "", text: "" });
  const [validationPopup,    setValidationPopup]    = useState({
    show: false,
    field: "",
    text: "",
    type: "error",
  });
  const [showSuccessModal,   setShowSuccessModal]   = useState(false);
  const [showOtpModal,       setShowOtpModal]       = useState(false);
  const [registeredEmail,    setRegisteredEmail]    = useState("");
  const [showPw,             setShowPw]             = useState(false);
  const [showConfirmPw,      setShowConfirmPw]      = useState(false);
  const [errorField,         setErrorField]         = useState("");
  const [passportUploadStatus, setPassportUploadStatus] = useState({ type: "", text: "" });

  const visibleSteps = formData.hasPassport === "no"
    ? STEPS.filter(step => step.label !== "Passport").map((step, index) => ({
        ...step,
        displayNum: index + 1,
        originalNum: step.num,
      }))
    : STEPS.map(step => ({
        ...step,
        displayNum: step.num,
        originalNum: step.num,
      }));

  const getActiveStepNumber = () => {
    if (!formData.email && !formData.password) return 1;
    if (!formData.firstName && !formData.lastName)  return 2;
    if (!formData.phone)                            return 3;
    if (formData.hasPassport === "yes" && !formData.passportNumber && !formData.passportIssueDate && !formData.passportExpiryDate && !formData.issuingCountry && !formData.citizenship)
      return 4;
    return 5;
  };
  const activeStepNumber = getActiveStepNumber();
  const activeStep = visibleSteps.find(step => step.originalNum === activeStepNumber)?.displayNum || visibleSteps.length;

  const getFieldClass = (baseClass, fieldName) =>
    `${baseClass}${errorField === fieldName ? " fy-field-error" : ""}`;

  const scrollToField = (fieldName) => {
    const field = fieldRefs[fieldName]?.current;
    if (!field) return;

    field.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      field.focus({ preventScroll: true });
    }, 350);
  };

  const showValidationError = (fieldName, text) => {
    setErrorField(fieldName);
    setValidationPopup({
      show: true,
      field: fieldName,
      text,
      type: "error",
    });
  };

  const showValidationPopup = (fieldName, text, type = "error") => {
    if (fieldName) setErrorField(fieldName);
    setValidationPopup({
      show: true,
      field: fieldName,
      text,
      type,
    });
  };

  const handleValidationPopupClose = () => {
    const targetField = validationPopup.field;

    setValidationPopup({
      show: false,
      field: "",
      text: "",
      type: "error",
    });

    if (!targetField) return;

    setTimeout(() => {
      scrollToField(targetField);

      const element = document.querySelector(`[name="${targetField}"]`);
      if (element) element.focus();
    }, 150);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let nextValue = type === "checkbox" ? checked : value;

    if (name === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (["firstName", "lastName", "preferredFirstName"].includes(name)) {
      nextValue = sanitizeName(value);
    }

    if (name === "password") validatePw(value);
    setFormData(prev => ({ ...prev, [name]: nextValue }));
    if (errorField === name) setErrorField("");
    if (message.text) setMessage({ type: "", text: "" });
    if (validationPopup.field === name) {
      setValidationPopup(prev => ({ ...prev, field: "" }));
    }
  };

  const validatePw = (pw) => {
    setPwValid({
      length:      pw.length >= 10 && pw.length <= 32,
      uppercase:   /[A-Z]/.test(pw),
      lowercase:   /[a-z]/.test(pw),
      number:      /[0-9]/.test(pw),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
      noSpaces:    !/\s/.test(pw),
    });
  };

  const mergePassportData = (data = {}) => {
    const cleanPlace = (value = "") => {
      const cleaned = String(value)
        .replace(/[^A-Za-z .'-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return /^[A-Za-z][A-Za-z .'-]*$/.test(cleaned) ? cleaned : "";
    };

    const indianStates = new Set([
      "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
      "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
      "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya",
      "mizoram", "nagaland", "odisha", "punjab", "rajasthan", "sikkim",
      "tamil nadu", "telangana", "tripura", "uttar pradesh", "uttarakhand",
      "west bengal", "delhi", "jammu and kashmir", "ladakh", "puducherry",
    ]);

    const cleanedData = { ...data };
    if (/file\s*(?:no|number)/i.test(cleanedData.city || "")) cleanedData.city = "";

    if (/\d/.test(String(cleanedData.state || ""))) {
      cleanedData.state = "";
    }

    const addressParts = String(cleanedData.addressLine1 || "")
      .split(/\s*,\s*/)
      .map(part => part.trim())
      .filter(Boolean);

    if (addressParts.length >= 4) {
      cleanedData.addressLine1 = addressParts[0];
      if (!cleanedData.addressLine2) cleanedData.addressLine2 = addressParts[1];
      if (!cleanedData.city) cleanedData.city = cleanPlace(addressParts[2]);
      if (!cleanedData.state) {
        const stateCandidate = addressParts[addressParts.length - 1];
        if (indianStates.has(stateCandidate.toLowerCase())) {
          cleanedData.state = cleanPlace(stateCandidate);
        }
      }
    }

    cleanedData.city = cleanPlace(cleanedData.city);
    cleanedData.state = cleanPlace(cleanedData.state);
    if (/^ind(?:ia|ian)$/i.test(cleanedData.country || "")) cleanedData.country = "India";

    const fieldsToMerge = [
      "firstName", "lastName", "birthDate", "gender",
      "phone", "countryCode", "passportNumber", "passportIssueDate",
      "passportExpiryDate", "issuingCountry", "citizenship",
      "passportFileName", "passportFileKey", "passportFileUrl",
      "passportOriginalName", "passportFileType", "passportFileSize",
      "passportUploadedAt", "passportValidationStatus",
      "addressLine1", "addressLine2", "city", "state", "zipCode",
      "country",
    ];

    setFormData(prev => {
      const next = { ...prev };
      fieldsToMerge.forEach((field) => {
        const rawValue = cleanedData[field];
        if (rawValue === undefined || rawValue === null) return;
        let value = String(rawValue).trim();
        if (!value) return;

        if (["firstName", "lastName"].includes(field)) value = sanitizeName(value);
        if (field === "phone") value = value.replace(/\D/g, "").slice(-10);
        if (field === "countryCode" && !value.startsWith("+")) value = `+${value.replace(/\D/g, "")}`;
        if (!value) return;

        next[field] = value;
      });
      return next;
    });

    if (["addressLine1", "addressLine2", "city", "state", "zipCode", "country"].some(field => cleanedData[field] && String(cleanedData[field]).trim())) {
      setShowAddress(true);
    }
  };

  const handlePassportAvailability = (value) => {
    setFormData(prev => ({ ...prev, hasPassport: value }));
    if (value === "no") {
      setPassportUploadStatus({
        type: "success",
        text: "No problem. Continue the registration manually; passport details will be skipped for now.",
      });
      return;
    }

    setPassportUploadStatus({
      type: "",
      text: "",
    });
  };
  const handlePassportUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const allowedName = /\.(pdf|jpe?g|png)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) && !allowedName) {
      setPassportUploadStatus({ type: "error", text: "Please upload a PDF, JPG, or PNG passport file." });
      event.target.value = "";
      return;
    }

    const uploadData = new FormData();
    uploadData.append("passport", file);

    try {
      setPassportUploadStatus({ type: "loading", text: "Reading passport details..." });
      setMessage({ type: "", text: "" });

      const response = await axiosInstance.post("/api/students/parse-passport", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extractedData = response.data?.data || {};
      const extractedPassportNumber = String(extractedData.passportNumber || "").trim();

      // mergePassportData ignores blank OCR values, so a manually typed
      // passport number is never overwritten with an empty result.
      mergePassportData(extractedData);
      setPassportUploadStatus({
        type: "success",
        text: extractedPassportNumber
          ? (response.data?.message || "Passport details filled. Please review and edit anything that needs correction.")
          : "Passport details extracted. Please enter Passport Number manually.",
      });
    } catch (err) {
      setPassportUploadStatus({
        type: "error",
        text: err.response?.data?.message || "Could not read this passport. Please upload a clearer PDF, JPG, or PNG.",
      });
    } finally {
      event.target.value = "";
    }
  };
  const clearField = (field) => {
    setFormData(prev => ({ ...prev, [field]: "" }));
    if (errorField === field) setErrorField("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const trimmedFirstName = normalizeName(formData.firstName);
    const trimmedLastName = normalizeName(formData.lastName);
    const trimmedPreferredFirstName = normalizeName(formData.preferredFirstName);
    const trimmedPhone = formData.phone.trim();
    const trimmedPassportNumber = formData.passportNumber.trim();
    const trimmedIssuingCountry = formData.issuingCountry.trim();
    const trimmedCitizenship = formData.citizenship.trim();
    const requiresPassport = formData.hasPassport !== "no";

    if (formData.email !== formData.confirmEmail)
      return showValidationError("confirmEmail", "Email addresses do not match.");
    if (formData.password !== formData.confirmPassword)
      return showValidationError("confirmPassword", "Passwords do not match.");
    if (!Object.values(pwValid).every(Boolean))
      return showValidationError("password", "Please meet all password requirements.");
    if (!trimmedFirstName || !NAME_REGEX.test(trimmedFirstName))
      return showValidationError("firstName", "First name can contain only letters and spaces.");
    if (!trimmedLastName || !NAME_REGEX.test(trimmedLastName))
      return showValidationError("lastName", "Last name can contain only letters and spaces.");
    if (trimmedPreferredFirstName && !NAME_REGEX.test(trimmedPreferredFirstName))
      return showValidationError("preferredFirstName", "Preferred first name can contain only letters and spaces.");
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone))
      return showValidationError("phone", "Phone number must be exactly 10 digits.");
    if (formData.birthDate && !isValidAge(formData.birthDate))
      return showValidationError("birthDate", "Date of birth must show an age between 15 and 25 years.");
    if (!formData.hasPassport)
      return showValidationPopup("", "Please tell us whether you have a passport available.");
    if (requiresPassport && !trimmedPassportNumber)
      return showValidationError("passportNumber", "Passport Number is required.");
    if (requiresPassport && !formData.passportIssueDate)
      return showValidationError("passportIssueDate", "Passport Issue Date is required.");
    if (requiresPassport && !formData.passportExpiryDate)
      return showValidationError("passportExpiryDate", "Passport Expiry Date is required.");
    if (requiresPassport && !trimmedIssuingCountry)
      return showValidationError("issuingCountry", "Issuing Country is required.");
    if (requiresPassport && !trimmedCitizenship)
      return showValidationError("citizenship", "Citizenship is required.");
    if (requiresPassport && new Date(formData.passportExpiryDate) <= new Date(formData.passportIssueDate))
      return showValidationError("passportExpiryDate", "Passport Expiry Date must be after Passport Issue Date.");
    if (!formData.agreeToTerms)
      return showValidationError("agreeToTerms", "Please agree to the terms of use.");

    try {
      setLoading(true);

      const payload = {
        email:           formData.email.toLowerCase().trim(),
        password:        formData.password,
        confirmPassword: formData.confirmPassword,
        firstName:       trimmedFirstName,
        lastName:        trimmedLastName,
        studentType:     formData.studentType,
        agreeToTerms:    formData.agreeToTerms,
      };

      payload.hasPassport = formData.hasPassport;
      if (requiresPassport) {
        payload.passportNumber = formData.passportNumber.trim();
        payload.passportIssueDate = formData.passportIssueDate;
        payload.passportExpiryDate = formData.passportExpiryDate;
        payload.issuingCountry = formData.issuingCountry.trim();
        payload.citizenship = formData.citizenship.trim();
        if (formData.passportFileKey || formData.passportFileUrl) {
          payload.passportFileName = formData.passportFileName;
          payload.passportFileKey = formData.passportFileKey;
          payload.passportFileUrl = formData.passportFileUrl;
          payload.passportOriginalName = formData.passportOriginalName;
          payload.passportFileType = formData.passportFileType;
          payload.passportFileSize = formData.passportFileSize;
          payload.passportUploadedAt = formData.passportUploadedAt;
          payload.passportValidationStatus = formData.passportValidationStatus;
        }
      }

      if (trimmedPreferredFirstName)                  payload.preferredFirstName    = trimmedPreferredFirstName;
      if (formData.useDifferentFirstName === "yes")   payload.useDifferentFirstName = formData.useDifferentFirstName;
      if (formData.birthDate)                         payload.birthDate             = formData.birthDate;
      if (trimmedPhone) {
        payload.phone        = trimmedPhone;
        payload.countryCode  = formData.countryCode;
      }
      if (formData.europeanUnionResident) payload.europeanUnionResident = formData.europeanUnionResident;
      if (formData.receiveComms)          payload.receiveComms          = formData.receiveComms;

      if (showAddress && formData.addressLine1.trim()) {
        payload.addressLine1 = formData.addressLine1.trim();
        payload.city         = formData.city.trim();
        payload.state        = formData.state.trim();
        payload.zipCode      = formData.zipCode.trim();
        payload.country      = formData.country.trim();
        if (formData.addressLine2.trim()) payload.addressLine2 = formData.addressLine2.trim();
      }

    const response = await axiosInstance.post("/api/students/register", payload);

      if (response.data.requireOtpVerification) {
        setRegisteredEmail(payload.email);
        setShowOtpModal(true);
        setLoading(false);
        return;
      }

   if (response.data.success && response.data.token) {
  clearAllUserData(); 

  localStorage.setItem("token", response.data.token);
  const userData = response.data.user || response.data.account || {
    name: `${formData.firstName} ${formData.lastName}`,
    email: formData.email, firstName: formData.firstName, lastName: formData.lastName,
    studentId: `CAID ${Math.floor(10000000 + Math.random() * 90000000)}`,
  };
  localStorage.setItem("userData", JSON.stringify(userData));
        setMessage({ type: "success", text: "Account created! Redirecting to dashboard…" });
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        showValidationPopup("", response.data.message || "Registration failed. Please try again.");
      }
      setLoading(false);

    } catch (err) {
      setLoading(false);
      const status = err.response?.status;
      const msg    = err.response?.data?.message;
      if (status === 409) {
        showValidationPopup("email", msg || "This email address is already registered.", "existing-email");
      }
      else if (status === 400) showValidationPopup("", msg || "Invalid input. Please check your details.");
      else if (status === 500) showValidationPopup("", "Server error. Please try again later.");
      else if (err.request)   showValidationPopup("", "Cannot connect to server. Please try again.");
      else                    showValidationPopup("", msg || "Something went wrong. Please try again.");
    }
  };

  const handleOtpVerified = () => { setShowOtpModal(false); setShowSuccessModal(true); };

  const COUNTRY_CODES = [
    { code: "+1",   label: "+1  US/CA"    },
    { code: "+44",  label: "+44 UK"       },
    { code: "+91",  label: "+91 India"    },
    { code: "+86",  label: "+86 China"    },
    { code: "+81",  label: "+81 Japan"    },
    { code: "+49",  label: "+49 Germany"  },
    { code: "+33",  label: "+33 France"   },
    { code: "+39",  label: "+39 Italy"    },
    { code: "+61",  label: "+61 AU"       },
    { code: "+7",   label: "+7  Russia"   },
    { code: "+971", label: "+971 UAE"     },
    { code: "+966", label: "+966 KSA"     },
  ];

  const PW_RULES = [
    { key: "length",      label: "10–32 characters"       },
    { key: "uppercase",   label: "One uppercase letter"   },
    { key: "lowercase",   label: "One lowercase letter"   },
    { key: "number",      label: "One number"             },
    { key: "specialChar", label: "One special character"  },
    { key: "noSpaces",    label: "No spaces"              },
  ];

  return (
    <div className="fy-wrapper">

      {/* Validation Modal */}
      {validationPopup.show && (
        <div className="fy-modal-overlay">
          <div className="fy-modal fy-validation-modal" role="dialog" aria-modal="true" aria-labelledby="fy-validation-title">
            <div className="fy-validation-icon" aria-hidden="true">!</div>
            <h3 className="fy-modal-title" id="fy-validation-title">Please Check Your Details</h3>
            <p className="fy-modal-message">{validationPopup.text}</p>
            <div className="fy-modal-actions">
              {validationPopup.type === "existing-email" && (
                <button className="fy-modal-btn-secondary" onClick={() => navigate("/sign-in")}>
                  Go To Sign In
                </button>
              )}
              <button className="fy-modal-btn-primary" onClick={handleValidationPopupClose}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal ── */}
      {showSuccessModal && (
        <div className="fy-modal-overlay">
          <div className="fy-modal">
            <div className="fy-modal-icon">🎉</div>
            <h3 className="fy-modal-title">Account Created!</h3>
            <p className="fy-modal-msg">
              Your EduTechEX account is ready. Sign in to start your application journey.
            </p>
            <div className="fy-modal-btns">
              <button className="fy-modal-btn-primary" onClick={() => window.location.href = "/sign-in"}>
                Go to Sign In
              </button>
              <button className="fy-modal-btn-secondary" onClick={() => setShowSuccessModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OTP Modal ── */}
      {showOtpModal && (
        <OtpVerification
          email={registeredEmail}
          onVerified={handleOtpVerified}
          onClose={() => setShowOtpModal(false)}
        />
      )}

      {/* ── Brand Header ── */}
      <div className="fy-brand-header">
       <a href="/home" className="fy-logo" aria-label="EduTechEX Home">
          <EduTechLogo />
        </a>
       <button className="fy-back-btn" onClick={() => window.location.href = "/home"}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span className="fy-back-label">Back to Home</span>
        </button>
      </div>

      {/* ── Form Card ── */}
      <div className="fy-card">
        <div className="fy-card-inner">

          <h2 className="fy-title">Create your account</h2>
          <p className="fy-subtitle">Fill in the details below to get started with EduTechEX</p>

          <div className="fy-passport-start">
            <div className="fy-passport-start-copy">
              <span className="fy-passport-eyebrow">Optional fast fill</span>
              <h3>Do you have a passport available?</h3>
              <p>
                Upload it now to auto-fill matching details before you type the form. If you do not have one,
                choose No and continue the registration manually.
              </p>
            </div>
            <div className="fy-passport-choice-row">
              <button
                type="button"
                className={`fy-passport-choice ${formData.hasPassport === "yes" ? "selected" : ""}`}
                onClick={() => handlePassportAvailability("yes")}
                disabled={loading || passportUploadStatus.type === "loading"}
              >
                Yes, upload passport
              </button>
              <button
                type="button"
                className={`fy-passport-choice ${formData.hasPassport === "no" ? "selected" : ""}`}
                onClick={() => handlePassportAvailability("no")}
                disabled={loading || passportUploadStatus.type === "loading"}
              >
                No, continue manually
              </button>
            </div>

            {formData.hasPassport === "yes" && (
              <div className="fy-passport-upload fy-passport-upload-top">
                <div>
                  <label className="fy-label" htmlFor="passportUpload">Upload Passport</label>
                  <span className="fy-hint">PDF, JPG, or PNG. We will fill matching fields and keep everything editable.</span>
                </div>
                <label className={`fy-upload-btn ${passportUploadStatus.type === "loading" ? "is-loading" : ""}`} htmlFor="passportUpload">
                  {passportUploadStatus.type === "loading" && <span className="fy-upload-spinner" />}
                  {passportUploadStatus.type === "loading" ? "Scanning..." : "Choose file"}
                </label>
                <input
                  id="passportUpload"
                  className="fy-file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handlePassportUpload}
                  disabled={loading || passportUploadStatus.type === "loading"}
                />
              </div>
            )}

            {passportUploadStatus.text && (
              <div className={`fy-passport-status fy-passport-status-${passportUploadStatus.type}`}>
                {passportUploadStatus.text}
              </div>
            )}
          </div>

          {formData.hasPassport && (
            <>
          {/* Step progress */}
          <div className="fy-steps">
            {visibleSteps.map((s) => {
              const isDone   = s.displayNum < activeStep;
              const isActive = s.displayNum === activeStep;
              return (
                <div key={s.originalNum} className={`fy-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="fy-step-circle">
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : s.displayNum}
                  </div>
                  <span className="fy-step-label">{s.label}</span>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {message.text && (
              <div className={`fy-alert fy-alert-${message.type === "success" ? "success" : "error"}`}>
                {message.text}
              </div>
            )}

            {/* -- SECTION 1: Account Info -- */}
            <div className="fy-section">
              <div className="fy-section-header">
                <div className="fy-section-num">1</div>
                <span className="fy-section-title">Account Information</span>
              </div>
              <div className="fy-section-body">

                <div className="fy-field">
                  <label className="fy-label">Email Address <span className="fy-required">*</span></label>
                  <input ref={fieldRefs.email} className={getFieldClass("fy-input", "email")} type="email" name="email" required
                    value={formData.email} onChange={handleChange}
                    placeholder="you@example.com" disabled={loading} autoComplete="email"/>
                </div>

                <div className="fy-field">
                  <label className="fy-label">Re-type Email Address <span className="fy-required">*</span></label>
                  <input ref={fieldRefs.confirmEmail} className={getFieldClass("fy-input", "confirmEmail")} type="email" name="confirmEmail" required
                    value={formData.confirmEmail} onChange={handleChange}
                    placeholder="Confirm your email" disabled={loading} autoComplete="email"/>
                </div>

                <div className="fy-field">
                  <label className="fy-label">Password <span className="fy-required">*</span></label>
                  <div className="fy-pw-wrap">
                    <input ref={fieldRefs.password} className={getFieldClass("fy-pw-input", "password")} type={showPw ? "text" : "password"}
                      name="password" required value={formData.password}
                      onChange={handleChange} placeholder="Create a strong password"
                      disabled={loading} autoComplete="new-password"/>
                    <button type="button" className="fy-pw-toggle" onClick={() => setShowPw(p => !p)} disabled={loading}>
                      {showPw ? <IcoEye/> : <IcoEyeOff/>}
                    </button>
                  </div>
                  <div className="fy-pw-rules">
                    {PW_RULES.map(r => (
                      <div key={r.key} className={`fy-pw-rule ${pwValid[r.key] ? 'valid' : 'invalid'}`}>
                        <div className="fy-pw-rule-dot"/>
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="fy-field">
                  <label className="fy-label">Re-type Password <span className="fy-required">*</span></label>
                  <div className="fy-pw-wrap">
                    <input ref={fieldRefs.confirmPassword} className={getFieldClass("fy-pw-input", "confirmPassword")} type={showConfirmPw ? "text" : "password"}
                      name="confirmPassword" required value={formData.confirmPassword}
                      onChange={handleChange} placeholder="Repeat your password"
                      disabled={loading} autoComplete="new-password"/>
                    <button type="button" className="fy-pw-toggle" onClick={() => setShowConfirmPw(p => !p)} disabled={loading}>
                      {showConfirmPw ? <IcoEye/> : <IcoEyeOff/>}
                    </button>
                  </div>
                  <span className="fy-hint">Must match the password above</span>
                </div>

                <div className="fy-field">
                  <label className="fy-label">Which best describes you? <span className="fy-required">*</span></label>
                  <div className="fy-radios">
                    {[
                      { val: "first-year-2025-2026", label: "Applying as a first-year student � plan to start in 2025 or 2026" },
                      { val: "start-2027",           label: "Planning to start college in 2027" },
                      { val: "start-2028-beyond",    label: "Planning to start college in 2028 or beyond" },
                    ].map(opt => (
                      <label key={opt.val} className={`fy-radio-label ${formData.studentType === opt.val ? 'selected' : ''}`}>
                        <input type="radio" name="studentType" value={opt.val}
                          checked={formData.studentType === opt.val}
                          onChange={handleChange} disabled={loading}/>
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  <button type="button" className="fy-clear-btn" onClick={() => clearField("studentType")} disabled={loading}>
                    ? Clear answer
                  </button>
                </div>

              </div>
            </div>

            {/* -- SECTION 2: Personal Info -- */}
            <div className="fy-section">
              <div className="fy-section-header">
                <div className="fy-section-num">2</div>
                <span className="fy-section-title">Personal Information</span>
              </div>
              <div className="fy-section-body">

                <div className="fy-field">
                  <label className="fy-label">Legal first / given name <span className="fy-required">*</span></label>
                  <input ref={fieldRefs.firstName} className={getFieldClass("fy-input", "firstName")} type="text" name="firstName" required
                    value={formData.firstName} onChange={handleChange}
                    placeholder="First name" disabled={loading} autoComplete="given-name"/>
                  <span className="fy-hint">Enter your name exactly as it appears on official documents</span>
                </div>

                <div className="fy-field">
                  <label className="fy-label-sub">Would you like to share a different first name people call you?</label>
                  <div className="fy-radios">
                    {["yes", "no"].map(v => (
                      <label key={v} className={`fy-radio-label ${formData.useDifferentFirstName === v ? 'selected' : ''}`}>
                        <input type="radio" name="useDifferentFirstName" value={v}
                          checked={formData.useDifferentFirstName === v}
                          onChange={handleChange} disabled={loading}/>
                        {v === "yes" ? "Yes" : "No"}
                      </label>
                    ))}
                  </div>
                  <button type="button" className="fy-clear-btn" onClick={() => clearField("useDifferentFirstName")} disabled={loading}>
                    ? Clear answer
                  </button>
                </div>

                {formData.useDifferentFirstName === "yes" && (
                  <div className="fy-field">
                    <label className="fy-label">Preferred First Name</label>
                    <input ref={fieldRefs.preferredFirstName} className={getFieldClass("fy-input", "preferredFirstName")} type="text" name="preferredFirstName"
                      value={formData.preferredFirstName} onChange={handleChange}
                      placeholder="What should we call you?" disabled={loading}/>
                  </div>
                )}

                <div className="fy-field">
                  <label className="fy-label">Last / family / surname <span className="fy-required">*</span></label>
                  <input ref={fieldRefs.lastName} className={getFieldClass("fy-input", "lastName")} type="text" name="lastName" required
                    value={formData.lastName} onChange={handleChange}
                    placeholder="Last name" disabled={loading} autoComplete="family-name"/>
                </div>

                <div className="fy-field">
                  <label className="fy-label">Date of birth</label>
                  <input ref={fieldRefs.birthDate} className={getFieldClass("fy-input", "birthDate")} type="date" name="birthDate"
                    value={formData.birthDate} onChange={handleChange}
                    min={birthDateLimits.min} max={birthDateLimits.max}
                    disabled={loading} autoComplete="bday"/>
                  <span className="fy-hint">Format: Month Day, Year (e.g. August 1, 2000)</span>
                </div>

              </div>
            </div>

            {/* -- SECTION 3: Contact Details -- */}
            <div className="fy-section">
              <div className="fy-section-header">
                <div className="fy-section-num">3</div>
                <span className="fy-section-title">Contact Details</span>
              </div>
              <div className="fy-section-body">

                <div className="fy-field">
                  <label className="fy-label">Phone number</label>
                  <div className="fy-phone-row">
                    <select className="fy-input fy-country-code" name="countryCode"
                      value={formData.countryCode} onChange={handleChange} disabled={loading}>
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <input ref={fieldRefs.phone} className={getFieldClass("fy-input fy-phone-num", "phone")} type="tel" name="phone"
                      value={formData.phone} onChange={handleChange}
                      maxLength="10" inputMode="numeric" pattern="\d{10}"
                      placeholder="Enter phone number" disabled={loading} autoComplete="tel"/>
                  </div>
                  <span className="fy-hint">Include country code + number</span>
                </div>

                <div className="fy-field">
                  <label className="fy-label">Permanent home address</label>
                  <button type="button" className="fy-addr-toggle"
                    onClick={() => setShowAddress(p => !p)} disabled={loading}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {showAddress
                        ? <line x1="5" y1="12" x2="19" y2="12"/>
                        : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
                      }
                    </svg>
                    {showAddress ? "Hide address" : "Add address"}
                  </button>

                  {showAddress && (
                    <div className="fy-addr-fields">
                      <div className="fy-field">
                        <label className="fy-label">Address Line 1 <span className="fy-required">*</span></label>
                        <input className="fy-input" type="text" name="addressLine1"
                          required={showAddress} value={formData.addressLine1}
                          onChange={handleChange} placeholder="Street address"
                          disabled={loading} autoComplete="address-line1"/>
                      </div>
                      <div className="fy-field">
                        <label className="fy-label">Address Line 2</label>
                        <input className="fy-input" type="text" name="addressLine2"
                          value={formData.addressLine2} onChange={handleChange}
                          placeholder="Apartment, suite, unit (optional)"
                          disabled={loading} autoComplete="address-line2"/>
                      </div>
                      <div className="fy-addr-row">
                        <div className="fy-field">
                          <label className="fy-label">City <span className="fy-required">*</span></label>
                          <input className="fy-input" type="text" name="city"
                            required={showAddress} value={formData.city}
                            onChange={handleChange} placeholder="City"
                            disabled={loading} autoComplete="address-level2"/>
                        </div>
                        <div className="fy-field">
                          <label className="fy-label">State / Province <span className="fy-required">*</span></label>
                          <input className="fy-input" type="text" name="state"
                            required={showAddress} value={formData.state}
                            onChange={handleChange} placeholder="State or Province"
                            disabled={loading} autoComplete="address-level1"/>
                        </div>
                      </div>
                      <div className="fy-addr-row">
                        <div className="fy-field">
                          <label className="fy-label">ZIP / Postal Code <span className="fy-required">*</span></label>
                          <input className="fy-input" type="text" name="zipCode"
                            required={showAddress} value={formData.zipCode}
                            onChange={handleChange} placeholder="ZIP or Postal Code"
                            disabled={loading} autoComplete="postal-code"/>
                        </div>
                        <div className="fy-field">
                          <label className="fy-label">Country <span className="fy-required">*</span></label>
                          <input className="fy-input" type="text" name="country"
                            required={showAddress} value={formData.country}
                            onChange={handleChange} placeholder="Country"
                            disabled={loading} autoComplete="country-name"/>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>


            {formData.hasPassport === "yes" && (
              <>
                {/* -- SECTION 4: Passport Details -- */}
                <div className="fy-section">
                  <div className="fy-section-header">
                    <div className="fy-section-num">4</div>
                    <span className="fy-section-title">Passport Details</span>
                  </div>
                  <div className="fy-section-body">
                    <div className="fy-field">
                      <label className="fy-label">Passport Number <span className="fy-required">*</span></label>
                      <input ref={fieldRefs.passportNumber} className={getFieldClass("fy-input", "passportNumber")} type="text" name="passportNumber" required
                        value={formData.passportNumber} onChange={handleChange}
                        placeholder="Enter passport number" disabled={loading} autoComplete="off"/>
                      <span className="fy-hint">Use the number exactly as it appears on your passport</span>
                    </div>

                    <div className="fy-addr-row">
                      <div className="fy-field">
                        <label className="fy-label">Passport Issue Date <span className="fy-required">*</span></label>
                        <input ref={fieldRefs.passportIssueDate} className={getFieldClass("fy-input", "passportIssueDate")} type="date" name="passportIssueDate" required
                          value={formData.passportIssueDate} onChange={handleChange}
                          disabled={loading} autoComplete="off"/>
                      </div>

                      <div className="fy-field">
                        <label className="fy-label">Passport Expiry Date <span className="fy-required">*</span></label>
                        <input ref={fieldRefs.passportExpiryDate} className={getFieldClass("fy-input", "passportExpiryDate")} type="date" name="passportExpiryDate" required
                          value={formData.passportExpiryDate} onChange={handleChange}
                          min={formData.passportIssueDate || undefined}
                          disabled={loading} autoComplete="off"/>
                      </div>
                    </div>

                    <div className="fy-field">
                      <label className="fy-label">Issuing Country <span className="fy-required">*</span></label>
                      <input ref={fieldRefs.issuingCountry} className={getFieldClass("fy-input", "issuingCountry")} type="text" name="issuingCountry" required
                        value={formData.issuingCountry} onChange={handleChange}
                        placeholder="Country that issued your passport" disabled={loading} autoComplete="country-name"/>
                    </div>

                    <div className="fy-field">
                      <label className="fy-label">Citizenship <span className="fy-required">*</span></label>
                      <input ref={fieldRefs.citizenship} className={getFieldClass("fy-input", "citizenship")} type="text" name="citizenship" required
                        value={formData.citizenship} onChange={handleChange}
                        placeholder="Your citizenship" disabled={loading} autoComplete="country-name"/>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* -- SECTION 5: Privacy -- */}
            <div className="fy-section">
              <div className="fy-section-header">
                <div className="fy-section-num">{formData.hasPassport === "no" ? 4 : 5}</div>
                <span className="fy-section-title">Privacy Policy & Preferences</span>
              </div>
              <div className="fy-section-body">

                <div className="fy-privacy-box">
                  EduTechEX will process and share your information in accordance with our{" "}
                  <a href="#privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>.
                  If you have concerns, please do not use our services.
                </div>

                <div className="fy-field">
                  <label className="fy-label-sub">
                    Are you currently based in a European Union country, Iceland, Liechtenstein,
                    Norway, Switzerland, or the United Kingdom?
                  </label>
                  <span className="fy-hint" style={{ marginBottom: 8, display: 'block' }}>
                    See the{" "}
                    <a href="#gdpr" target="_blank" rel="noopener noreferrer">EU GDPR FAQ</a>{" "}
                    for more information.
                  </span>
                  <div className="fy-radios">
                    {["yes", "no"].map(v => (
                      <label key={v} className={`fy-radio-label ${formData.europeanUnionResident === v ? 'selected' : ''}`}>
                        <input type="radio" name="europeanUnionResident" value={v}
                          checked={formData.europeanUnionResident === v}
                          onChange={handleChange} disabled={loading}/>
                        {v === "yes" ? "Yes" : "No"}
                      </label>
                    ))}
                  </div>
                  <button type="button" className="fy-clear-btn" onClick={() => clearField("europeanUnionResident")} disabled={loading}>
                    ✕ Clear answer
                  </button>
                </div>

                <div className="fy-field">
                  <label className="fy-label-sub">
                    Would you like to receive communications from EduTechEX about opportunities and resources?
                    <span className="fy-required"> *</span>
                  </label>
                  <span className="fy-hint" style={{ marginBottom: 8, display: 'block' }}>
                    You can update communication preferences anytime in account settings.
                  </span>
                  <div className="fy-radios">
                    {["yes", "no"].map(v => (
                      <label key={v} className={`fy-radio-label ${formData.receiveComms === v ? 'selected' : ''}`}>
                        <input type="radio" name="receiveComms" value={v}
                          checked={formData.receiveComms === v}
                          onChange={handleChange} disabled={loading}/>
                        {v === "yes" ? "Yes, keep me informed" : "No thanks"}
                      </label>
                    ))}
                  </div>
                  <button type="button" className="fy-clear-btn" onClick={() => clearField("receiveComms")} disabled={loading}>
                    ✕ Clear answer
                  </button>
                </div>

                <div className="fy-terms-box">
                  <label className="fy-checkbox-label">
                    <input ref={fieldRefs.agreeToTerms} className={errorField === "agreeToTerms" ? "fy-field-error" : ""} type="checkbox" name="agreeToTerms"
                      checked={formData.agreeToTerms} onChange={handleChange}
                      required disabled={loading}/>
                    <span>
                      By checking this box I agree to the{" "}
                      <a href="#terms" target="_blank" rel="noopener noreferrer">terms of use</a>.
                      If I am under 18, my parent or legal guardian also agrees on my behalf.
                      <span className="fy-required"> *</span>
                    </span>
                  </label>
                </div>

              </div>
            </div>

            {/* ── Footer ── */}
            <div className="fy-form-footer">
              <button type="submit" className="fy-submit-btn" disabled={loading}>
                {loading ? (
                  <><span className="fy-submit-spinner"/> Creating account…</>
                ) : (
                  <>
                    Create Account
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>

              <p className="fy-signin-row">
                Already have an account?{" "}
                <button type="button" onClick={() => navigate("/sign-in")}>Sign in here</button>
              </p>
            </div>

          </form>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default FirstYearAccount;
