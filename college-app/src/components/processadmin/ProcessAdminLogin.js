import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProcessAdminLogin.css";
import EdutechLogo from "../../assets/Edutech-logo.svg";
import LoginImage from "../../assets/login.png";

const ProcessAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/process-admin/login",
        { email, password }
      );

      if (response.data.success && response.data.token) {
        localStorage.setItem("processAdminToken", response.data.token);
        localStorage.setItem("processAdminData", JSON.stringify(response.data.processAdmin));
        localStorage.setItem("processAdminEmail", email);
        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
        navigate("/process-admin-dashboard");
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === "ECONNREFUSED") {
        setError("Cannot connect to server. Please ensure backend is running.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="process-wrapper">
      <div className="process-container">
        <div className="process-card">

          {/* ── LEFT — Login Form ── */}
          <div className="process-form-side">

            {/* Logo only — no box */}
            <div className="process-logo-block">
              <img src={EdutechLogo} alt="EdutechEX" className="process-logo" />
              <span className="process-role-tag">PROCESS ADMIN</span>
            </div>

            <form onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <div className="process-field-group">
                <label className="process-label">Email Address</label>
                <div className={`process-input-wrap ${emailFocused ? "process-focused" : ""}`}>
                  <span className="process-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    className="process-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="process-admin@edutechex.com"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="process-field-group">
                <label className="process-label">Password</label>
                <div className={`process-input-wrap ${passFocused ? "process-focused" : ""}`}>
                  <span className="process-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    className="process-input process-input-pass"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    placeholder="••••••••••"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="process-show-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="process-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                  <button type="button" className="process-error-close" onClick={() => setError("")}>✕</button>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className={`process-submit-btn ${isLoading ? "process-loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <><span className="process-spinner" />Signing in…</>
                ) : (
                  "Login to Dashboard"
                )}
              </button>
            </form>

            <button
              onClick={() => navigate("/")}
              className="process-back-btn"
              disabled={isLoading}
              type="button"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Dashboard
            </button>
          </div>

          {/* ── RIGHT — Illustration ── */}
          <div className="process-info-side">
            <div className="process-illustration-wrap">
  <img
    src={LoginImage}
    alt="Login Illustration"
    className="process-illustration-img"
  />
</div>
            <h2 className="process-info-title">Empower Education Through Innovation</h2>
            <p className="process-info-desc">
              Streamline academic processes, manage workflows efficiently, and
              create an exceptional learning environment for future leaders.
            </p>
          </div>
        </div>

        <div className="process-copyright">© 2026 EdutechEX. All rights reserved.</div>
      </div>
    </div>
  );
};

export default ProcessAdminLogin;