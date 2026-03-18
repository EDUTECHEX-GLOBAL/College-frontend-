import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TransferStudent.css";
import OtpVerificationTransfer from "./OtpVerificationTransfer";

const API_URL = process.env.REACT_APP_API_BASE_URL;

const TransferStudent = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    email: "",
    emailType: "Home",
    confirmEmail: "",
    primaryPhone: "",
    primaryPhoneType: "Mobile",
    primaryPhoneCountry: "+1",
    alternatePhone: "",
    alternatePhoneType: "Mobile",
    alternatePhoneCountry: "+1",
    textAuthAgreed: false,
    username: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    euResident: "",
  });

  const [passwordValidation, setPasswordValidation] = useState({
    noUsername: true,
    minLength: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const clearDataAndNavigate = (path) => {
    localStorage.clear();
    sessionStorage.clear();
    navigate(path, { replace: true });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "password") {
      validatePassword(value, formData.username);
    }

    if (name === "username") {
      validatePassword(formData.password, value);
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const validatePassword = (password, username) => {
    setPasswordValidation({
      noUsername: username ? !password.toLowerCase().includes(username.toLowerCase()) : true,
      minLength: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

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

    const allValid = Object.values(passwordValidation).every((v) => v === true);
    if (!allValid) {
      return setMessage({
        type: "error",
        text: "❌ Please meet all password requirements!",
      });
    }

    if (!formData.termsAccepted) {
      return setMessage({
        type: "error",
        text: "❌ Please agree to the terms of use!",
      });
    }

    if (!formData.euResident) {
      return setMessage({
        type: "error",
        text: "❌ Please specify your EU residency status!",
      });
    }

    try {
      setLoading(true);

      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        confirmEmail: formData.confirmEmail.toLowerCase().trim(),
        primaryPhone: formData.primaryPhone.trim(),
        primaryPhoneType: formData.primaryPhoneType,
        primaryPhoneCountry: formData.primaryPhoneCountry,
        username: formData.username.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        emailType: formData.emailType,
        textAuthAgreed: formData.textAuthAgreed,
        termsAccepted: formData.termsAccepted,
        euResident: formData.euResident,
      };

      if (formData.middleName.trim()) {
        registrationData.middleName = formData.middleName.trim();
      }

      if (formData.suffix.trim()) {
        registrationData.suffix = formData.suffix.trim();
      }

      if (formData.alternatePhone.trim()) {
        registrationData.alternatePhone = formData.alternatePhone.trim();
        registrationData.alternatePhoneType = formData.alternatePhoneType;
        registrationData.alternatePhoneCountry = formData.alternatePhoneCountry;
      }

      console.log("📤 Sending registration request to:", `${API_URL}/api/transfer/register`);
      console.log("📋 Registration data:", {
        ...registrationData,
        password: '***HIDDEN***',
        confirmPassword: '***HIDDEN***'
      });

      setRegisteredEmail(formData.email);
      setShowOtpModal(true);
      setLoading(false);

      setMessage({
        type: "success",
        text: "📧 Account being created... OTP sent to your email! Please check your inbox.",
      });

      const response = await axios.post(
        `${API_URL}/api/transfer/register`,
        registrationData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Registration successful:", response.data);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify(response.data.user));
        localStorage.setItem("accountType", "transfer-student");
      }

    } catch (error) {
      setLoading(false);
      setShowOtpModal(false);

      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        const errorMessage = errorData?.message;

        console.log("═══════════════════════════════════════");
        console.log("🔍 FULL ERROR DETAILS:");
        console.log("Status Code:", status);
        console.log("Error Message:", errorMessage);
        console.log("Full Error Data:", JSON.stringify(errorData, null, 2));
        console.log("Errors Array:", errorData?.errors);
        console.log("═══════════════════════════════════════");

        switch (status) {
          case 409:
            setMessage({
              type: "error",
              text: "⚠️ This email or username is already registered. Please use different credentials or sign in.",
            });
            break;

          case 400:
            if (errorData?.errors && Array.isArray(errorData.errors)) {
              const errorList = errorData.errors.join("\n");
              setMessage({
                type: "error",
                text: `❌ ${errorList}`,
              });
            } else {
              setMessage({
                type: "error",
                text: `❌ ${errorMessage || "Invalid input. Please check your information and try again."}`,
              });
            }
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

      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleBackToHome = () => {
    clearDataAndNavigate("/");
  };

  const handleBackToSignIn = () => {
    clearDataAndNavigate("/sign-in");
  };

  const handleOtpVerified = () => {
    setShowOtpModal(false);
    setShowSuccessModal(true);

    setMessage({
      type: "success",
      text: "🎉 Email verified successfully! Redirecting to sign-in...",
    });

    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      email: "",
      emailType: "Home",
      confirmEmail: "",
      primaryPhone: "",
      primaryPhoneType: "Mobile",
      primaryPhoneCountry: "+1",
      alternatePhone: "",
      alternatePhoneType: "Mobile",
      alternatePhoneCountry: "+1",
      textAuthAgreed: false,
      username: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
      euResident: "",
    });

    setPasswordValidation({
      noUsername: true,
      minLength: false,
      lowercase: false,
      uppercase: false,
      number: false,
      specialChar: false,
    });

    setTimeout(() => {
      handleBackToSignIn();
    }, 2000);
  };

  return (
    <div className="transfer-student-wrapper">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="transfer-student-modal-overlay">
          <div className="transfer-student-success-modal">
            <div className="transfer-student-modal-icon">🎉</div>
            <h3 className="transfer-student-modal-title">Account Created Successfully!</h3>
            <p className="transfer-student-modal-message">
              Your transfer student account has been created and your email has been verified. You can now login and start your application journey.
            </p>
            <div className="transfer-student-modal-actions">
              <button
                className="transfer-student-modal-btn primary"
                onClick={handleBackToSignIn}
              >
                Go to Sign In
              </button>
              <button
                className="transfer-student-modal-btn secondary"
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
        <OtpVerificationTransfer
          email={registeredEmail}
          onVerified={handleOtpVerified}
          onClose={() => setShowOtpModal(false)}
        />
      )}

      <div className="transfer-student-container">
        <div className="transfer-student-header">
          <div className="transfer-student-logo">
            <span className="transfer-student-logo-text">college</span>
            <span className="transfer-student-logo-app">app</span>
          </div>
        </div>

        <div className="transfer-student-card">
          {/* Back to Home Button */}
          <button className="transfer-student-back-home-btn" onClick={handleBackToHome}>
            ← Back to Home
          </button>

          <h1 className="transfer-student-title">Create an Account</h1>

          {/* Display error/success messages */}
          {message.text && (
            <div
              className={`transfer-student-alert ${
                message.type === "error" ? "transfer-student-alert-error" : "transfer-student-alert-success"
              }`}
              role="alert"
            >
              {message.text}
              {message.type === "error" && message.text.includes("already registered") && (
                <div style={{ marginTop: "10px" }}>
                  <button
                    onClick={handleBackToSignIn}
                    className="transfer-student-signin-link-btn"
                  >
                    Go to Sign In
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="transfer-student-intro">
            <p className="transfer-student-subtext">
              The information below will be provided to the admissions offices at
              the programs to which you apply. Please provide complete and accurate
              information. Within the application, you will be able to specify
              additional addresses and alternate name details.
            </p>
            <p className="transfer-student-required-note">* indicates required field</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Legal Name Section */}
            <section className="transfer-student-form-section">
              <h3 className="transfer-student-section-title">Your Legal Name</h3>

              <div className="transfer-student-form-group">
                <label className="transfer-student-label">
                  <span className="transfer-student-required">*</span> Legal First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  disabled={loading}
                  required
                  autoComplete="given-name"
                  className="transfer-student-input"
                />
              </div>

              <div className="transfer-student-form-group">
                <label className="transfer-student-label">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="Enter your middle name (optional)"
                  disabled={loading}
                  autoComplete="additional-name"
                  className="transfer-student-input"
                />
              </div>

              <div className="transfer-student-form-group">
                <label className="transfer-student-label">
                  <span className="transfer-student-required">*</span> Last or Family Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  disabled={loading}
                  required
                  autoComplete="family-name"
                  className="transfer-student-input"
                />
              </div>

              <div className="transfer-student-form-group">
                <label className="transfer-student-label">Suffix (Jr., Sr., III, etc.)</label>
                <input
                  type="text"
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleChange}
                  placeholder="Enter suffix if applicable"
                  disabled={loading}
                  className="transfer-student-input"
                />
              </div>
            </section>

            {/* Contact Information */}
            <section className="transfer-student-form-section">
              <h3 className="transfer-student-section-title">Contact Information</h3>

              <div className="transfer-student-form-group">
                <label className="transfer-student-label">
                  <span className="transfer-student-required">*</span> Email Address
                </label>
                <div className="transfer-student-input-row">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled={loading}
                    required
                    className="transfer-student-input transfer-student-input-flex"
                    autoComplete="email"
                  />
                  <select
                    name="emailType"
                    value={formData.emailType}
                    onChange={handleChange}
                    className="transfer-student-select transfer-student-select-small"
                    disabled={loading}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="School">School</option>
                  </select>
                </div>
              </div>

              <div className="transfer-student-form-group">
                <label className="transfer-student-label">
                  <span className="transfer-student-required">*</span> Confirm Email Address
                </label>
                <input
                  type="email"
                  name="confirmEmail"
                  value={formData.confirmEmail}
                  onChange={handleChange}
                  placeholder="Re-enter your email"
                  disabled={loading}
                  required
                  autoComplete="email"
                  className="transfer-student-input"
                />
                <small className="transfer-student-hint-text">Email addresses must match</small>
              </div>

              <div className="transfer-student-form-group">
                <label className="transfer-student-label">
                  <span className="transfer-student-required">*</span> Preferred Phone Number
                </label>
                <div className="transfer-student-input-row">
                  <select
                    name="primaryPhoneCountry"
                    value={formData.primaryPhoneCountry}
                    onChange={handleChange}
                    className="transfer-student-select transfer-student-select-country"
                    disabled={loading}
                  >
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+7">🇷🇺 +7</option>
                  </select>
                  <input
                    type="tel"
                    name="primaryPhone"
                    value={formData.primaryPhone}
                    onChange={handleChange}
                    required
                    placeholder="(201) 555-0123"
                    className="transfer-student-input transfer-student-input-flex"
                    disabled={loading}
                    autoComplete="tel"
                  />
                  <select
                    name="primaryPhoneType"
                    value={formData.primaryPhoneType}
                    onChange={handleChange}
                    className="transfer-student-select transfer-student-select-small"
                    disabled={loading}
                  >
                    <option value="Mobile">Mobile</option>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                  </select>
                </div>
              </div>

              <div className="transfer-student-form-group">
                <label className="transfer-student-label">Alternate Phone Number</label>
                <div className="transfer-student-input-row">
                  <select
                    name="alternatePhoneCountry"
                    value={formData.alternatePhoneCountry}
                    onChange={handleChange}
                    className="transfer-student-select transfer-student-select-country"
                    disabled={loading}
                  >
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+7">🇷🇺 +7</option>
                  </select>
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    placeholder="(201) 555-0123 (optional)"
                    className="transfer-student-input transfer-student-input-flex"
                    disabled={loading}
                    autoComplete="tel"
                  />
                  <select
                    name="alternatePhoneType"
                    value={formData.alternatePhoneType}
                    onChange={handleChange}
                    className="transfer-student-select transfer-student-select-small"
                    disabled={loading}
                  >
                    <option value="Mobile">Mobile</option>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                  </select>
                </div>
                <small className="transfer-student-hint-text">Alternate phone is optional</small>
              </div>
            </section>

            {/* Text and Phone Authorization */}
            <section className="transfer-student-form-section">
              <h3 className="transfer-student-section-title">Text and Phone Authorization</h3>
              <div className="transfer-student-checkbox-group">
                <input
                  type="checkbox"
                  id="textAuth"
                  name="textAuthAgreed"
                  checked={formData.textAuthAgreed}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label htmlFor="textAuth" className="transfer-student-checkbox-label">
                  I agree to the{" "}
                  <a href="#terms" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </a>{" "}
                  and to receive calls and/or texts at any phone number I have
                  provided or may provide in the future, including any wireless
                  number, from any entity associated with my application process,
                  including but not limited to my designated schools and programs,
                  the Liaison International support team, and any entities or
                  contractors authorized by them. I understand that such consent
                  is not a requirement for enrollment.
                </label>
              </div>
            </section>

            {/* Username and Password */}
            <section className="transfer-student-form-section">
              <h3 className="transfer-student-section-title">Username and Password</h3>
              <p className="transfer-student-section-description">
                Your username must be at least 6 characters. Your password must be
                a minimum of 8 characters and contain at least one lower and upper
                case letter, one number, and a special character.
              </p>

              <div className="transfer-student-form-group">
                <label className="transfer-student-label">
                  <span className="transfer-student-required">*</span> Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Create a username"
                  disabled={loading}
                  required
                  minLength={6}
                  autoComplete="username"
                  className="transfer-student-input"
                />
                <small className="transfer-student-hint-text">At least 6 characters, letters, numbers, underscores, and hyphens only</small>
              </div>

              <div className="transfer-student-form-group">
                <label className="transfer-student-label">
                  <span className="transfer-student-required">*</span> Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                  autoComplete="new-password"
                  className="transfer-student-input"
                />
              </div>

              <div className="transfer-student-password-requirements">
                <p className="transfer-student-requirements-title">
                  Your password must meet these minimal requirements:
                </p>
                <ul className="transfer-student-password-rules">
                  <li className={passwordValidation.noUsername ? "valid" : "invalid"}>
                    {passwordValidation.noUsername ? "✓" : "✗"} Password cannot contain username
                  </li>
                  <li className={passwordValidation.minLength ? "valid" : "invalid"}>
                    {passwordValidation.minLength ? "✓" : "✗"} Minimum of 8 Characters
                  </li>
                  <li className={passwordValidation.lowercase ? "valid" : "invalid"}>
                    {passwordValidation.lowercase ? "✓" : "✗"} 1 lowercase letter
                  </li>
                  <li className={passwordValidation.uppercase ? "valid" : "invalid"}>
                    {passwordValidation.uppercase ? "✓" : "✗"} 1 uppercase letter
                  </li>
                  <li className={passwordValidation.number ? "valid" : "invalid"}>
                    {passwordValidation.number ? "✓" : "✗"} 1 number
                  </li>
                  <li className={passwordValidation.specialChar ? "valid" : "invalid"}>
                    {passwordValidation.specialChar ? "✓" : "✗"} 1 special character
                  </li>
                </ul>
              </div>

              <div className="transfer-student-form-group">
                <label className="transfer-student-label">
                  <span className="transfer-student-required">*</span> Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  disabled={loading}
                  required
                  autoComplete="new-password"
                  className="transfer-student-input"
                />
                <small className="transfer-student-hint-text">Passwords must match</small>
              </div>
            </section>

            {/* Terms and Conditions */}
            <section className="transfer-student-form-section">
              <h3 className="transfer-student-section-title">Terms and Conditions</h3>
              <div className="transfer-student-terms-box">
                <div className="transfer-student-terms-header">Terms of Use</div>
                <div className="transfer-student-terms-content">
                  <p>
                    These Terms of Use constitute an agreement ("Agreement")
                    between you and Liaison International, Inc. (the "Company"),
                    the owner of the website located at www.liaisonedu.com.
                  </p>
                  <p>
                    By accessing or using this website, you acknowledge that you
                    have read, understand, and agree to be bound by these Terms of
                    Use and all applicable laws and regulations. If you do not
                    agree to these Terms of Use, you may not access or use this
                    website.
                  </p>
                  <p>
                    The Company reserves the right to modify these Terms of Use at
                    any time without prior notice. Your continued use of this
                    website following the posting of changes constitutes your
                    acceptance of such changes.
                  </p>
                </div>
              </div>
              <div className="transfer-student-checkbox-group">
                <input
                  type="checkbox"
                  id="termsAccept"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <label htmlFor="termsAccept" className="transfer-student-checkbox-label">
                  <span className="transfer-student-required">*</span> I agree to these terms
                </label>
              </div>
            </section>

            {/* EU Data Protection */}
            <section className="transfer-student-form-section">
              <h3 className="transfer-student-section-title">European Union Data Protection</h3>
              <div className="transfer-student-form-group">
                <label className="transfer-student-label transfer-student-radio-question">
                  <span className="transfer-student-required">*</span> Are you currently located in
                  a European Union country, Iceland, Liechtenstein, Norway, or
                  Switzerland?
                </label>
                <div className="transfer-student-radio-group">
                  <label className="transfer-student-radio-label">
                    <input
                      type="radio"
                      name="euResident"
                      value="yes"
                      checked={formData.euResident === "yes"}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="transfer-student-radio-label">
                    <input
                      type="radio"
                      name="euResident"
                      value="no"
                      checked={formData.euResident === "no"}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </section>

            <div className="transfer-student-form-actions">
              <button 
                type="button" 
                className="transfer-student-back-btn" 
                onClick={handleBackToHome}
                disabled={loading}
              >
                Back to Home
              </button>
              <button 
                type="submit" 
                className="transfer-student-submit-btn" 
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create my account"}
              </button>
            </div>
          </form>
        </div>

        <footer className="transfer-student-footer">
          <a href="#system">System Requirements</a>
          <a href="#help">Help Center</a>
          <a href="#contact">Contact Us</a>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Use</a>
          <a href="#fraud">Fraud Policy</a>
        </footer>

        <div className="transfer-student-footer-note">
          <p>in partnership with LIAISON</p>
          <p>© 2025 Liaison International. All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
};

export default TransferStudent;