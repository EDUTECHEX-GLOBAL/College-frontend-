import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./FirstYearAccount.css";
import OtpVerification from "./OtpVerification";

const API_URL = process.env.REACT_APP_API_BASE_URL
;

const FirstYearAccount = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
    studentType: "first-year-2025-2026",
    firstName: "",
    useDifferentFirstName: "no",
    preferredFirstName: "",
    lastName: "",
    birthDate: "",
    phone: "",
    countryCode: "+1",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    europeanUnionResident: "",
    receiveComms: "",
    agreeToTerms: false,
  });

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
    noSpaces: false,
  });

  const [showAddress, setShowAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  
  // New state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "password") {
      validatePassword(value);
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear message when user starts typing
    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const validatePassword = (password) => {
    setPasswordValidation({
      length: password.length >= 10 && password.length <= 32,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noSpaces: !/\s/.test(password),
    });
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Client-side validation
    if (formData.email !== formData.confirmEmail) {
      return setMessage({
        type: "error",
        text: "❌ Email addresses do not match!",
      });
    }

    if (formData.password !== formData.confirmPassword) {
      return setMessage({
        type: "error",
        text: "❌ Passwords do not match!",
      });
    }

    const allValid = Object.values(passwordValidation).every(Boolean);
    if (!allValid) {
      return setMessage({
        type: "error",
        text: "❌ Please meet all password requirements!",
      });
    }

    if (!formData.agreeToTerms) {
      return setMessage({
        type: "error",
        text: "❌ Please agree to the terms of use!",
      });
    }

    try {
      setLoading(true);

      // 🔑 KEY FIX: Only send required fields + non-empty optional fields
      const registrationData = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        studentType: formData.studentType,
        agreeToTerms: formData.agreeToTerms,
      };

      // Add optional fields only if they have values
      if (formData.preferredFirstName.trim()) {
        registrationData.preferredFirstName = formData.preferredFirstName.trim();
      }

      if (formData.useDifferentFirstName === "yes") {
        registrationData.useDifferentFirstName = formData.useDifferentFirstName;
      }

      if (formData.birthDate) {
        registrationData.birthDate = formData.birthDate;
      }

      if (formData.phone.trim()) {
        registrationData.phone = formData.phone.trim();
        registrationData.countryCode = formData.countryCode;
      }

      if (formData.europeanUnionResident) {
        registrationData.europeanUnionResident = formData.europeanUnionResident;
      }

      if (formData.receiveComms) {
        registrationData.receiveComms = formData.receiveComms;
      }

      // Add address fields only if address is being added
      if (showAddress && formData.addressLine1.trim()) {
        registrationData.addressLine1 = formData.addressLine1.trim();
        registrationData.city = formData.city.trim();
        registrationData.state = formData.state.trim();
        registrationData.zipCode = formData.zipCode.trim();
        registrationData.country = formData.country.trim();

        if (formData.addressLine2.trim()) {
          registrationData.addressLine2 = formData.addressLine2.trim();
        }
      }

      console.log("📤 Sending registration request to:", `${API_URL}/api/students/register`);
      console.log("📋 Registration data:", {
        ...registrationData,
        password: '***HIDDEN***',
        confirmPassword: '***HIDDEN***'
      });

      const response = await axios.post(
        `${API_URL}/api/students/register`,
        registrationData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Registration successful:", response.data);

      // Check if OTP verification is required or if immediate login is used
      if (response.data.requireOtpVerification) {
        // OTP Verification Flow
        setRegisteredEmail(formData.email);
        setShowOtpModal(true);
        setLoading(false);
      } else if (response.data.success && response.data.token) {
        // Immediate Login Flow
        localStorage.setItem("token", response.data.token);

        // 🔧 FIX: Make sure userData is properly set
        if (response.data.user) {
          localStorage.setItem("userData", JSON.stringify(response.data.user));
        } else if (response.data.account) {
          localStorage.setItem("userData", JSON.stringify(response.data.account));
        } else {
          // Fallback: create basic user data from form data
          const basicUserData = {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            studentId: `CAID ${Math.floor(10000000 + Math.random() * 90000000)}` // Generate random ID
          };
          localStorage.setItem("userData", JSON.stringify(basicUserData));
          console.log("📝 Created fallback user data:", basicUserData);
        }

        // Show success message
        setMessage({
          type: "success",
          text: "🎉 Account created successfully! Redirecting to dashboard...",
        });

        // Reset form
        setFormData({
          email: "",
          confirmEmail: "",
          password: "",
          confirmPassword: "",
          studentType: "first-year-2025-2026",
          firstName: "",
          useDifferentFirstName: "no",
          preferredFirstName: "",
          lastName: "",
          birthDate: "",
          phone: "",
          countryCode: "+1",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
          europeanUnionResident: "",
          receiveComms: "",
          agreeToTerms: false,
        });

        setPasswordValidation({
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          specialChar: false,
          noSpaces: false,
        });

        setShowAddress(false);
        setShowPassword(false);
        setShowConfirmPassword(false);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: response.data.message || "❌ Registration failed. Please try again.",
        });
      }

      setLoading(false);

    } catch (error) {
        setLoading(false);
        console.error("❌ Error creating account:", error);

        // Handle different error scenarios
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;
          const errorMessage = errorData?.message;

          // 🔍 DETAILED ERROR LOGGING
          console.log("═══════════════════════════════════════");
          console.log("🔍 FULL ERROR DETAILS:");
          console.log("Status Code:", status);
          console.log("Error Message:", errorMessage);
          console.log("Full Error Data:", JSON.stringify(errorData, null, 2));
          console.log("Success Flag:", errorData?.success);
          console.log("═══════════════════════════════════════");

          // Handle specific error codes
          switch (status) {
            case 409:
              setMessage({
                type: "error",
                text: "⚠️ This email is already registered. Please use a different email or sign in.",
              });
              break;

            case 400:
              setMessage({
                type: "error",
                text: `❌ ${errorMessage || "Invalid input. Please check your information and try again."}`,
              });
              break;

            case 500:
              setMessage({
                type: "error",
                text: "❌ Server error. Please try again later.",
              });
              break;

            default:
              setMessage({
                type: "error",
                text: `❌ ${errorMessage || "An error occurred. Please try again."}`,
              });
          }
        } else if (error.request) {
          setMessage({
            type: "error",
            text: "❌ Cannot connect to server. Please check if the server is running at http://localhost:5000",
          });
        } else {
          setMessage({
            type: "error",
            text: "❌ Something went wrong. Please try again.",
          });
        }

        // Scroll to top to show error message
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
  };

  const toggleAddress = () => {
    setShowAddress(!showAddress);
  };

  const clearAnswer = (field) => {
    setFormData({ ...formData, [field]: "" });
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleBackToHome = () => {
    window.location.href = "/";
  };

  const handleBackToLogin = () => {
    window.location.href = "/sign-in";
  };

  const handleOtpVerified = () => {
    setShowOtpModal(false);
    setShowSuccessModal(true);
  };

  return (
    <div className="first-year-wrapper">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="modal-icon">🎉</div>
            <h3 className="modal-title">Account Created Successfully!</h3>
            <p className="modal-message">
              Your EduTechEX account has been created. You can now login and start your application journey.
            </p>
            <div className="modal-actions">
              <button 
                className="modal-btn primary" 
                onClick={handleBackToLogin}
              >
                Go to Signin
              </button>
              <button 
                className="modal-btn secondary" 
                onClick={closeSuccessModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <OtpVerification
          email={registeredEmail}
          onVerified={handleOtpVerified}
          onClose={() => setShowOtpModal(false)}
        />
      )}

      <div className="form-card">
        {/* Back to Home Button */}
        <button className="back-home-btn" onClick={handleBackToHome}>
          ← Back to Home
        </button>

        <h2 className="form-title">Create your account</h2>

        {/* Display error messages */}
        {message.text && (
          <div
            className={`alert ${
              message.type === "error" ? "alert-error" : "alert-success"
            }`}
            role="alert"
          >
            {message.text}
            {message.type === "error" && message.text.includes("already registered") && (
              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() => navigate("sign-in")}
                  className="signin-link-btn"
                >
                  Go to Sign In
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Account Info */}
           <section className="form-section">
            <h3>Account Information</h3>

            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={loading}
              autoComplete="email"
            />

            <label>Re-type Email Address *</label>
            <input
              type="email"
              name="confirmEmail"
              required
              value={formData.confirmEmail}
              onChange={handleChange}
              placeholder="Re-enter your email"
              disabled={loading}
              autoComplete="email"
            />

            <label>Password *</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="new-password"
                className="password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                {showPassword ? (
                  <svg className="eye-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg className="eye-off-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06L17.94 17.94Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.9 4.24C10.5883 4.07888 11.2931 3.99834 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19L9.9 4.24Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>

            <div className="password-requirements">
              <div className={passwordValidation.length ? "valid" : "invalid"}>
                {passwordValidation.length ? "✓" : "✗"} 10-32 characters
              </div>
              <div className={passwordValidation.uppercase ? "valid" : "invalid"}>
                {passwordValidation.uppercase ? "✓" : "✗"} At least one upper case
              </div>
              <div className={passwordValidation.lowercase ? "valid" : "invalid"}>
                {passwordValidation.lowercase ? "✓" : "✗"} At least one lower case
              </div>
              <div className={passwordValidation.number ? "valid" : "invalid"}>
                {passwordValidation.number ? "✓" : "✗"} At least one number
              </div>
              <div className={passwordValidation.specialChar ? "valid" : "invalid"}>
                {passwordValidation.specialChar ? "✓" : "✗"} At least one special character
              </div>
              <div className={passwordValidation.noSpaces ? "valid" : "invalid"}>
                {passwordValidation.noSpaces ? "✓" : "✗"} No space characters
              </div>
            </div>

            <label>Re-type Password *</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                disabled={loading}
                autoComplete="new-password"
                className="password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={toggleConfirmPasswordVisibility}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <svg className="eye-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg className="eye-off-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06L17.94 17.94Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.9 4.24C10.5883 4.07888 11.2931 3.99834 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19L9.9 4.24Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
            <small className="hint-text">Passwords must match</small>

            <label>Which best describes you? I am: *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="studentType"
                  value="first-year-2025-2026"
                  checked={formData.studentType === "first-year-2025-2026"}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                Applying as a first-year student and plan to start college in 2025 or 2026.
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="studentType"
                  value="start-2027"
                  checked={formData.studentType === "start-2027"}
                  onChange={handleChange}
                  disabled={loading}
                />
                Planning to start college in 2027
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="studentType"
                  value="start-2028-beyond"
                  checked={formData.studentType === "start-2028-beyond"}
                  onChange={handleChange}
                  disabled={loading}
                />
                Planning to start college in 2028 or beyond
              </label>
            </div>
            <button
              type="button"
              className="clear-btn"
              onClick={() => clearAnswer("studentType")}
              disabled={loading}
            >
              Clear Answer
            </button>
          </section>

          {/* Personal Info */}
          <section className="form-section">
            <h3>Personal Information</h3>

            <label>Legal first/given name *</label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First name"
              disabled={loading}
              autoComplete="given-name"
            />
            <small className="hint-text">
              Please enter your name exactly as it appears on official documents
            </small>

            <label className="sub-label">
              Would you like to share a different first name that people call you?
            </label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="useDifferentFirstName"
                  value="yes"
                  checked={formData.useDifferentFirstName === "yes"}
                  onChange={handleChange}
                  disabled={loading}
                />
                Yes
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="useDifferentFirstName"
                  value="no"
                  checked={formData.useDifferentFirstName === "no"}
                  onChange={handleChange}
                  disabled={loading}
                />
                No
              </label>
            </div>
            <button
              type="button"
              className="clear-btn"
              onClick={() => clearAnswer("useDifferentFirstName")}
              disabled={loading}
            >
              Clear Answer
            </button>

            {formData.useDifferentFirstName === "yes" && (
              <>
                <label>Preferred First Name</label>
                <input
                  type="text"
                  name="preferredFirstName"
                  value={formData.preferredFirstName}
                  onChange={handleChange}
                  placeholder="Preferred first name"
                  disabled={loading}
                />
              </>
            )}

            <label>Last/family/surname *</label>
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last name"
              disabled={loading}
              autoComplete="family-name"
            />

            <label>Date of birth</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              disabled={loading}
              autoComplete="bday"
            />
            <small className="hint-text">
              Date uses "month day, year" format (e.g. August 1, 2000)
            </small>
          </section>

          {/* Contact Details */}
          <section className="form-section">
            <h3>Contact Details</h3>

            <label>Phone</label>
            <div className="phone-input">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="country-code"
                disabled={loading}
              >
                <option value="+1">+1 (USA/Canada)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+91">+91 (India)</option>
                <option value="+86">+86 (China)</option>
                <option value="+81">+81 (Japan)</option>
                <option value="+49">+49 (Germany)</option>
                <option value="+33">+33 (France)</option>
                <option value="+39">+39 (Italy)</option>
                <option value="+61">+61 (Australia)</option>
                <option value="+7">+7 (Russia)</option>
              </select>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="phone-number"
                disabled={loading}
                autoComplete="tel"
              />
            </div>
            <small className="hint-text">
              Phone includes country code and number
            </small>

            <label>Permanent home address</label>
            <button
              type="button"
              className="add-address-btn"
              onClick={toggleAddress}
              disabled={loading}
            >
              {showAddress ? "- Hide address" : "+ Add address"}
            </button>

            {showAddress && (
              <div className="address-fields">
                <label>Address Line 1 *</label>
                <input
                  type="text"
                  name="addressLine1"
                  required={showAddress}
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="Street address"
                  disabled={loading}
                  autoComplete="address-line1"
                />

                <label>Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  placeholder="Apartment, suite, etc. (optional)"
                  disabled={loading}
                  autoComplete="address-line2"
                />

                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  required={showAddress}
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  disabled={loading}
                  autoComplete="address-level2"
                />

                <label>State/Province *</label>
                <input
                  type="text"
                  name="state"
                  required={showAddress}
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State or Province"
                  disabled={loading}
                  autoComplete="address-level1"
                />

                <label>ZIP/Postal Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  required={showAddress}
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="ZIP or Postal Code"
                  disabled={loading}
                  autoComplete="postal-code"
                />

                <label>Country *</label>
                <input
                  type="text"
                  name="country"
                  required={showAddress}
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  disabled={loading}
                  autoComplete="country-name"
                />
              </div>
            )}
          </section>

          {/* Privacy Policy and Preferences */}
          <section className="form-section">
            <h3>Privacy policy and preferences</h3>

            <p className="privacy-text">
               EduTechEX  will process and share your information in accordance
              with our{" "}
              <a href="#privacy" target="_blank" rel="noopener noreferrer">
                privacy policy
              </a>
              . If you have any concerns regarding our privacy practices, please
              do not use our services.
            </p>

            <label className="sub-label">
              Are you currently based in a European Union country, Iceland,
              Liechtenstein, Norway, Switzerland, or the United Kingdom?
            </label>
            <small className="hint-text">
              Please refer to the{" "}
              <a href="#gdpr" target="_blank" rel="noopener noreferrer">
                European Union General Data Protection Regulation FAQ
              </a>{" "}
              for more information.
            </small>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="europeanUnionResident"
                  value="yes"
                  checked={formData.europeanUnionResident === "yes"}
                  onChange={handleChange}
                  disabled={loading}
                />
                Yes
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="europeanUnionResident"
                  value="no"
                  checked={formData.europeanUnionResident === "no"}
                  onChange={handleChange}
                  disabled={loading}
                />
                No
              </label>
            </div>
            <button
              type="button"
              className="clear-btn"
              onClick={() => clearAnswer("europeanUnionResident")}
              disabled={loading}
            >
              Clear Answer
            </button>

            <label className="sub-label">
              Would you like to receive communications from EduTechEX  about
              opportunities and resources?*
            </label>
            <small className="hint-text">
              We may update this request and other communication preferences at
              any time in account settings.
            </small>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="receiveComms"
                  value="yes"
                  checked={formData.receiveComms === "yes"}
                  onChange={handleChange}
                  disabled={loading}
                />
                Yes
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="receiveComms"
                  value="no"
                  checked={formData.receiveComms === "no"}
                  onChange={handleChange}
                  disabled={loading}
                />
                No
              </label>
            </div>
            <button
              type="button"
              className="clear-btn"
              onClick={() => clearAnswer("receiveComms")}
              disabled={loading}
            >
              Clear Answer
            </button>

            <div className="terms-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <span>
                  By checking this box, I agree to the{" "}
                  <a href="#terms" target="_blank" rel="noopener noreferrer">
                    terms of use
                  </a>
                  . If I am under the age of 18, I represent that my parent or
                  legal guardian also agrees to the terms of use on my behalf.*
                </span>
              </label>
            </div>
          </section>

          <div className="form-actions">
            <button type="button" className="back-btn" onClick={handleBackToHome}>
              Back to Home
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px" }}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/sign-in")}
            style={{
              color: "#007bff",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Sign in here
          </span>
        </p>
      </div>
    </div>
  );
};

export default FirstYearAccount;