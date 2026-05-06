import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance, { clearAllUserData } from "../api/axiosInstance";
import LoginImage from "../assets/LoginImage.png";
import EdutechLogo from "../assets/Edutech-logo.svg";
import "./SignIn.css";

const SignIn = () => {
  const navigate = useNavigate();
  const [showStudentOptions, setShowStudentOptions] = useState(false);
  const [studentType, setStudentType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showTransferPassword, setShowTransferPassword] = useState(false);

const handleResetState = () => {
  setShowStudentOptions(false);
  setStudentType(null);
  setError("");
  setShowPassword(false);
  setShowTransferPassword(false);
  navigate("/home");  // ← ADD THIS
};
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleTransferPasswordVisibility = () => setShowTransferPassword(!showTransferPassword);

 // ✅ Fix - clear old data when SignIn page loads
// ✅ Fix - clears ALL keys when sign-in page loads
useEffect(() => {
  clearAllUserData(); // ✅ clears everything
}, []);

 // ✅ Fix - only trust backend response, never localStorage
const isProfileComplete = (backendUser) => {
  return backendUser?.profileCompleted === true;
};

const storeAuthData = (token, user, type, identifier) => {
  clearAllUserData(); // ✅ one function clears everything
  localStorage.setItem("token", token);
  localStorage.setItem("userData", JSON.stringify(user));
  localStorage.setItem("studentType", type);
  localStorage.setItem("userEmail", identifier);
};

  const markProfileCompleted = (user) => {
    localStorage.setItem("profileCompleted", "true");
    localStorage.setItem("userProfile", JSON.stringify(user));
  };

  // ── First-Year Student Sign-In ─────────────────────────────────────────────
  const handleFirstYearSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.post("/api/students/login", { email, password });
      if (response.data.success && response.data.token) {
        const { token, user } = response.data;
        storeAuthData(token, user, "firstyear", email);
        if (isProfileComplete(user)) {
          markProfileCompleted(user);
          navigate("/firstyear/dashboard");
        } else {
          localStorage.removeItem("profileCompleted");
          localStorage.removeItem("userProfile");
          navigate("/profile");
        }
      } else {
        setError(response.data.message || "Sign in failed. Please try again.");
      }
    } catch (err) {
      if (err.response?.status === 401) setError("Invalid email or password. Please try again.");
      else if (err.response?.status === 400) setError(err.response?.data?.message || "Invalid request. Please check your details.");
      else if (err instanceof TypeError) setError("Network error. Please ensure your backend is running.");
      else setError(err.response?.data?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Transfer Student Sign-In ───────────────────────────────────────────────
  const handleTransferSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const username = e.target.username.value.trim();
    const password = e.target.password.value.trim();
    if (!username || !password) {
      setError("Username and password are required");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.post("/api/transfer/login", { username, password });
      if (response.data.success && response.data.token) {
        const { token, user } = response.data;
        storeAuthData(token, user, "transfer", username);
        if (isProfileComplete(user)) {
          markProfileCompleted(user);
          navigate("/transfer/dashboard");
        } else {
          localStorage.removeItem("profileCompleted");
          localStorage.removeItem("userProfile");
          navigate("/profile");
        }
      } else {
        setError(response.data.message || "Sign in failed. Please try again.");
      }
    } catch (err) {
      if (err.response?.status === 401) setError("Invalid username or password. Please try again.");
      else if (err.response?.status === 400) setError(err.response?.data?.message || "Invalid request. Please check your credentials.");
      else if (err.response?.status === 404) setError("User not found. Please check your username.");
      else if (err.code === "NETWORK_ERROR" || err.message?.includes("Network Error")) setError("Network error. Please check your connection and try again.");
      else setError(err.response?.data?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackKeyPress = (e) => { if (e.key === "Enter" || e.key === " ") handleResetState(); };
  const handleCreateAccountKeyPress = (e) => { if (e.key === "Enter" || e.key === " ") navigate("/create-account"); };

  // ── Shared Right Panel ─────────────────────────────────────────────────────
  const RightPanel = () => (
    <div className="signin-right">
      <div className="signin-right-content">
        <img src={LoginImage} alt="Login illustration" className="signin-right-img" />
        <h3 className="signin-right-title">Empower Education Through Innovation</h3>
        <p className="signin-right-desc">
          Streamline academic processes, manage workflows efficiently, and create an
          exceptional learning environment for future leaders.
        </p>
        <div className="signin-right-badges">
          <span className="signin-badge">First-Year</span>
          <span className="signin-badge">Transfer</span>
          <span className="signin-badge">Applications</span>
        </div>
      </div>
    </div>
  );

  // ── Shared Brand Header ────────────────────────────────────────────────────
  const BrandHeader = ({ subtitle }) => (
    <div className="signin-brand-header">
      <img src={EdutechLogo} alt="EdutechEX" className="signin-logo" />
      <p className="signin-brand-sub">STUDENT PORTAL</p>
      <h2 className="signin-welcome">Welcome back</h2>
      <p className="signin-sub">{subtitle}</p>
    </div>
  );

  // ── Eye toggle SVG ─────────────────────────────────────────────────────────
  const EyeIcon = ({ open }) =>
    open ? (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );

  return (
    <div className="signin-overlay">
      <div className="signin-modal">

        {/* Close button */}
        <button
          className="signin-close-btn"
          onClick={() => { navigate("/home"); handleResetState(); }}
          title="Close Sign In Modal"
          aria-label="Close"
        >
          &times;
        </button>

        {/* ── Step 1: Choose student type ── */}
        {!showStudentOptions ? (
          <div className="signin-split">
            <div className="signin-left">
              <BrandHeader subtitle="Sign in to your student account" />

              <div className="signin-type-group">
                <p className="signin-type-label">Select your student type</p>

                <button
                  className="signin-type-btn"
                  onClick={() => { setShowStudentOptions(true); setStudentType("first-year"); setError(""); }}
                  type="button"
                >
                  <div className="signin-type-text">
                    <span className="signin-type-title">First-year student</span>
                    <span className="signin-type-desc">New to college this year</span>
                  </div>
                  <span className="signin-type-arrow">&#8594;</span>
                </button>

                <button
                  className="signin-type-btn"
                  onClick={() => { setShowStudentOptions(true); setStudentType("transfer"); setError(""); }}
                  type="button"
                >
                  <div className="signin-type-text">
                    <span className="signin-type-title">Transfer student</span>
                    <span className="signin-type-desc">Transferring from another college</span>
                  </div>
                  <span className="signin-type-arrow">&#8594;</span>
                </button>
              </div>

              <p className="signin-create-account-text">
                New here?{" "}
                <span
                  className="signin-link"
                  onClick={() => navigate("/create-account")}
                  onKeyPress={handleCreateAccountKeyPress}
                  role="button"
                  tabIndex={0}
                >
                  Create an account
                </span>
              </p>

              

              <div className="signin-extra-login">
                
              </div>
            </div>
            <RightPanel />
          </div>

        ) : studentType === "first-year" ? (

          /* ── First-Year Sign In Form ── */
          <div className="signin-split">
            <div className="signin-left">
              <BrandHeader subtitle="Sign in to your First-Year account" />

              {error && (
                <div className="signin-error-message" role="alert" aria-live="polite">
                  <strong>Error: </strong>{error}
                </div>
              )}

              <form onSubmit={handleFirstYearSignIn} noValidate className="signin-form">
                <div className="signin-field">
                  <label htmlFor="signin-email">Email Address</label>
                  <input
                    id="signin-email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                <div className="signin-field">
                  <label htmlFor="signin-password">Password</label>
                  <div className="signin-password-wrapper">
                    <input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="signin-eye-btn"
                      onClick={togglePasswordVisibility}
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                <p className="signin-forgot">
                  <span
                    className="signin-link"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate("/firstyear/forgot-password")}
                    onKeyPress={(e) => { if (e.key === "Enter" || e.key === " ") navigate("/firstyear/forgot-password"); }}
                  >
                    Forgot password?
                  </span>
                </p>

                <button type="submit" className="signin-submit-btn" disabled={loading}>
                  {loading ? "Signing in..." : "Login to Dashboard"}
                </button>

                <p className="signin-create-account-text" style={{ marginTop: "14px" }}>
                  New here?{" "}
                  <span
                    className="signin-link"
                    onClick={() => navigate("/create-account")}
                    onKeyPress={handleCreateAccountKeyPress}
                    role="button"
                    tabIndex={0}
                  >
                    Create an account
                  </span>
                </p>
              </form>

              <p
                className="signin-back-link"
                onClick={handleResetState}
                onKeyPress={handleBackKeyPress}
                role="button"
                tabIndex={0}
              >
                &#8592; Back to student type
              </p>
            </div>
            <RightPanel />
          </div>

        ) : (

          /* ── Transfer Student Sign In Form ── */
          <div className="signin-split">
            <div className="signin-left">
              <BrandHeader subtitle="Sign in to your Transfer account" />

              {error && (
                <div className="signin-error-message" role="alert" aria-live="polite">
                  <strong>Error: </strong>{error}
                </div>
              )}

              <form onSubmit={handleTransferSignIn} noValidate className="signin-form">
                <div className="signin-field">
                  <label htmlFor="transfer-username">Username</label>
                  <input
                    id="transfer-username"
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>

                <div className="signin-field">
                  <label htmlFor="transfer-password">Password</label>
                  <div className="signin-password-wrapper">
                    <input
                      id="transfer-password"
                      type={showTransferPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="signin-eye-btn"
                      onClick={toggleTransferPasswordVisibility}
                      disabled={loading}
                      aria-label={showTransferPassword ? "Hide password" : "Show password"}
                    >
                      <EyeIcon open={showTransferPassword} />
                    </button>
                  </div>
                </div>

                <p className="signin-forgot">
                  <span
                    className="signin-link"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate("/transfer/forgot-password")}
                    onKeyPress={(e) => { if (e.key === "Enter" || e.key === " ") navigate("/transfer/forgot-password"); }}
                  >
                    Forgot password?
                  </span>
                </p>

                <button type="submit" className="signin-submit-btn" disabled={loading}>
                  {loading ? "Signing in..." : "Login to Dashboard"}
                </button>

                <p className="signin-create-account-text" style={{ marginTop: "14px" }}>
                  New here?{" "}
                  <span
                    className="signin-link"
                    onClick={() => navigate("/create-account")}
                    onKeyPress={handleCreateAccountKeyPress}
                    role="button"
                    tabIndex={0}
                  >
                    Create an account
                  </span>
                </p>
              </form>

              <p
                className="signin-back-link"
                onClick={handleResetState}
                onKeyPress={handleBackKeyPress}
                role="button"
                tabIndex={0}
              >
                &#8592; Back to student type
              </p>
            </div>
            <RightPanel />
          </div>
        )}

      </div>
    </div>
  );
};

export default SignIn;