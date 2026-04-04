import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProcessAdminLogin.css";

const API_URL = process.env.REACT_APP_API_URL;

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
    console.log("Attempting login with:", email);

    try {
      // ✅ Fixed: uses REACT_APP_API_URL instead of hardcoded localhost:5000
      const response = await axios.post(
        `${API_URL}/api/process-admin/login`,
        { email, password }
      );
      console.log("Login response:", response.data);

      if (response.data.success && response.data.token) {
        localStorage.setItem("processAdminToken", response.data.token);
        localStorage.setItem("processAdminData", JSON.stringify(response.data.processAdmin));
        localStorage.setItem("processAdminEmail", email);
        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
        console.log("✅ Login successful! Token stored");
        navigate("/process-admin-dashboard");
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err.response || err);
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === "ECONNREFUSED" || err.message === "Network Error") {
        setError("Cannot connect to server. Please try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/");
  };

  return (
    <div className="pal-wrapper">
      <div className="pal-container">
        <div className="pal-card">

          {/* ── LEFT — Login Form ── */}
          <div className="pal-form-side">

            {/* Brand block */}
            <div className="pal-brand-block">
              <h1 className="pal-brand-title">EdutechEX</h1>
              <span className="pal-brand-tag">PROCESS ADMIN</span>
            </div>

            <form onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <div className="pal-field-group">
                <label className="pal-label">Email Address</label>
                <div className={`pal-input-wrap ${emailFocused ? "pal-focused" : ""}`}>
                  <span className="pal-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    className="pal-input"
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
              <div className="pal-field-group">
                <label className="pal-label">Password</label>
                <div className={`pal-input-wrap ${passFocused ? "pal-focused" : ""}`}>
                  <span className="pal-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    className="pal-input pal-input-pass"
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
                    className="pal-show-btn"
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
                <div className="pal-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                  <button type="button" className="pal-error-close" onClick={() => setError("")}>✕</button>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className={`pal-submit-btn ${isLoading ? "pal-loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="pal-spinner" />
                    Signing in…
                  </>
                ) : (
                  "Login to Dashboard"
                )}
              </button>
            </form>

            <button
              onClick={handleBackToDashboard}
              className="pal-back-btn"
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
          <div className="pal-info-side">
            <div className="pal-illustration-wrap">
              <svg
                className="pal-illustration-svg"
                viewBox="0 0 400 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Ground */}
                <line x1="20" y1="270" x2="380" y2="270" stroke="#e2e8f0" strokeWidth="2"/>

                {/* Main building */}
                <rect x="120" y="100" width="160" height="130" rx="6" fill="#2563eb" opacity="0.92"/>
                {/* Roof */}
                <rect x="110" y="82" width="180" height="22" rx="5" fill="#f59e0b"/>
                {/* Roof top orb */}
                <circle cx="200" cy="68" r="11" fill="#f59e0b"/>

                {/* Windows row */}
                <rect x="140" y="118" width="22" height="30" rx="3" fill="#fbbf24"/>
                <rect x="170" y="118" width="22" height="30" rx="3" fill="#fbbf24"/>
                <rect x="200" y="118" width="22" height="30" rx="3" fill="#fbbf24"/>
                <rect x="230" y="118" width="22" height="30" rx="3" fill="#fbbf24"/>

                {/* Door */}
                <rect x="184" y="188" width="32" height="42" rx="3" fill="#1d4ed8"/>
                <circle cx="212" cy="210" r="2.5" fill="#93c5fd"/>

                {/* Admin figure */}
                <circle cx="200" cy="178" r="9" fill="#f59e0b"/>
                <rect x="195" y="187" width="10" height="18" rx="2" fill="#7c3aed"/>
                {/* Clipboard */}
                <rect x="207" y="182" width="10" height="13" rx="1.5" fill="#fff"/>
                <line x1="209" y1="185" x2="215" y2="185" stroke="#94a3b8" strokeWidth="1.2"/>
                <line x1="209" y1="188" x2="215" y2="188" stroke="#94a3b8" strokeWidth="1.2"/>
                <line x1="209" y1="191" x2="213" y2="191" stroke="#94a3b8" strokeWidth="1.2"/>

                {/* Left building */}
                <rect x="35" y="128" width="60" height="100" rx="4" fill="#3b82f6" opacity="0.85"/>
                <rect x="48" y="144" width="14" height="20" rx="2" fill="#fbbf24"/>
                <rect x="68" y="144" width="14" height="20" rx="2" fill="#fbbf24"/>
                <rect x="48" y="172" width="14" height="20" rx="2" fill="#fbbf24"/>
                <rect x="68" y="172" width="14" height="20" rx="2" fill="#fbbf24"/>

                {/* Right building */}
                <rect x="305" y="138" width="60" height="90" rx="4" fill="#3b82f6" opacity="0.85"/>
                <rect x="318" y="152" width="14" height="18" rx="2" fill="#fbbf24"/>
                <rect x="338" y="152" width="14" height="18" rx="2" fill="#fbbf24"/>
                <rect x="318" y="178" width="14" height="18" rx="2" fill="#fbbf24"/>
                <rect x="338" y="178" width="14" height="18" rx="2" fill="#fbbf24"/>

                {/* Students */}
                {[85, 125, 165, 235, 280, 320].map((x, i) => (
                  <g key={i}>
                    <circle cx={x} cy={248} r={8} fill="#f59e0b"/>
                    <rect x={x - 5} y={256} width={10} height={16} rx={2} fill="#374151"/>
                  </g>
                ))}

                {/* Lamp posts */}
                {[58, 100, 305, 345].map((x, i) => (
                  <g key={i}>
                    <rect x={x - 1.5} y={230} width={3} height={14} rx={1.5} fill="#94a3b8"/>
                    <circle cx={x} cy={228} r={4} fill="#fbbf24" opacity="0.9"/>
                  </g>
                ))}

                {/* Floating accents */}
                <rect x="345" y="44" width="14" height="14" rx="3" fill="#f59e0b" opacity="0.7" transform="rotate(15 352 51)"/>
                <circle cx="60" cy="52" r="7" fill="#f59e0b" opacity="0.8"/>
                <rect x="30" y="100" width="10" height="10" rx="2" fill="#93c5fd" opacity="0.6" transform="rotate(-10 35 105)"/>

                {/* Dashed lines */}
                <path d="M360 148 L382 136" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.45"/>
                <path d="M28 158 L50 146" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.45"/>
              </svg>
            </div>

            <h2 className="pal-info-title">
              Empower Education Through Innovation
            </h2>
            <p className="pal-info-desc">
              Streamline academic processes, manage workflows efficiently, and
              create an exceptional learning environment for future leaders.
            </p>
          </div>
        </div>

        <div className="pal-copyright">© 2026 EdutechEX. All rights reserved.</div>
      </div>
    </div>
  );
};

export default ProcessAdminLogin;
