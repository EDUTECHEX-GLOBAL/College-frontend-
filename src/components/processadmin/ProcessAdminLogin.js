import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProcessAdminLogin.css";

const ProcessAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded credentials for single Process Admin
  const VALID_EMAIL = "process-admin@edutechex.com";
  const VALID_PASSWORD = "process-admin@edutechex123";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log('Attempting login with:', email);

    try {
      const response = await axios.post('http://localhost:5000/api/process-admin/login', {
        email,
        password
      });

      console.log('Login response:', response.data);

      if (response.data.success && response.data.token) {
        localStorage.setItem('processAdminToken', response.data.token);
        localStorage.setItem('processAdminData', JSON.stringify(response.data.processAdmin));
        localStorage.setItem('processAdminEmail', email);
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        console.log('✅ Login successful! Token stored');
        navigate("/process-admin-dashboard");
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      console.error('Login error:', err.response || err);
      
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'ECONNREFUSED') {
        setError("Cannot connect to server. Please ensure backend is running.");
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
    <div className="process-admin-login-wrapper">
      <div className="centered-container">
        <div className="login-card">
          {/* Left Side - Login Form */}
          <div className="login-form-side">
            <div className="brand-section">
              <h1 className="brand-title">EdutechEX</h1>
              <span className="brand-tag">PROCESS ADMIN</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="process-admin@edutechex.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="*********"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="show-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button 
                type="submit" 
                className="login-btn" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login to Dashboard"}
              </button>
            </form>

            <button 
              onClick={handleBackToDashboard} 
              className="back-link"
              disabled={isLoading}
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Right Side - Professional University Illustration */}
          <div className="info-side">
            <div className="illustration-container">
              <svg className="university-illustration" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="120" y="100" width="160" height="130" rx="8" fill="#1E3A8A" opacity="0.9" />
                <rect x="140" y="120" width="20" height="35" rx="2" fill="#FBBF24" />
                <rect x="170" y="120" width="20" height="35" rx="2" fill="#FBBF24" />
                <rect x="200" y="120" width="20" height="35" rx="2" fill="#FBBF24" />
                <rect x="230" y="120" width="20" height="35" rx="2" fill="#FBBF24" />
                <rect x="110" y="80" width="180" height="25" rx="6" fill="#FBBF24" />
                <circle cx="200" cy="65" r="12" fill="#FBBF24" />
                <rect x="185" y="190" width="30" height="40" rx="4" fill="#92400E" />
                <rect x="40" y="120" width="60" height="100" rx="6" fill="#2563EB" opacity="0.8" />
                <rect x="55" y="140" width="12" height="25" rx="2" fill="#FBBF24" />
                <rect x="75" y="140" width="12" height="25" rx="2" fill="#FBBF24" />
                <rect x="300" y="110" width="60" height="110" rx="6" fill="#2563EB" opacity="0.8" />
                <rect x="315" y="130" width="30" height="18" rx="2" fill="#FBBF24" />
                <rect x="315" y="160" width="30" height="18" rx="2" fill="#FBBF24" />
                
                {/* Students Group */}
                <g className="students-group">
                  <circle cx="90" cy="240" r="9" fill="#FBBF24" />
                  <rect x="86" y="249" width="8" height="18" fill="#374151" />
                  <rect x="82" y="254" width="4" height="6" fill="#FBBF24" />
                  
                  <circle cx="135" cy="245" r="9" fill="#FBBF24" />
                  <rect x="131" y="254" width="8" height="18" fill="#374151" />
                  <rect x="137" y="245" width="6" height="10" fill="#92400E" />
                  
                  <circle cx="180" cy="242" r="9" fill="#FBBF24" />
                  <rect x="176" y="251" width="8" height="18" fill="#374151" />
                  <path d="M176 233 L184 233 L180 226 L176 233" fill="#FBBF24" />
                  
                  <circle cx="225" cy="243" r="9" fill="#FBBF24" />
                  <rect x="221" y="252" width="8" height="18" fill="#374151" />
                  <rect x="227" y="243" width="6" height="8" fill="#374151" />
                  
                  <circle cx="270" cy="241" r="9" fill="#FBBF24" />
                  <rect x="266" y="250" width="8" height="18" fill="#374151" />
                  <rect x="270" y="241" width="6" height="10" fill="white" />
                  
                  <circle cx="315" cy="238" r="9" fill="#FBBF24" />
                  <rect x="311" y="247" width="8" height="18" fill="#374151" />
                </g>
                
                {/* Admin/Professor Figure */}
                <g className="admin-figure">
                  <circle cx="200" cy="190" r="10" fill="#FBBF24" />
                  <rect x="196" y="200" width="8" height="20" fill="#1E3A8A" />
                  <path d="M192 208 L208 208 L200 218 L192 208" fill="#1E3A8A" opacity="0.7" />
                  <circle cx="195" cy="187" r="2.5" fill="white" />
                  <circle cx="205" cy="187" r="2.5" fill="white" />
                  <line x1="197.5" y1="187" x2="202.5" y2="187" stroke="black" strokeWidth="1" />
                  <rect x="210" y="185" width="10" height="12" fill="white" rx="1" />
                  <line x1="212" y1="188" x2="218" y2="188" stroke="#374151" strokeWidth="1" />
                </g>
                
                {/* Floating Elements */}
                <g className="floating-books">
                  <rect x="50" y="40" width="14" height="18" rx="1" fill="#FBBF24" opacity="0.7" transform="rotate(-8)" />
                  <rect x="340" y="50" width="12" height="16" rx="1" fill="#FBBF24" opacity="0.7" transform="rotate(12)" />
                  <rect x="20" y="180" width="10" height="14" rx="1" fill="#FBBF24" opacity="0.5" transform="rotate(20)" />
                </g>
                
                <path d="M360 150 L380 140" stroke="#FBBF24" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
                <path d="M30 160 L50 150" stroke="#FBBF24" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
                <line x1="20" y1="270" x2="380" y2="270" stroke="#A7B8C9" strokeWidth="2" />
              </svg>
            </div>

            <h2 className="info-title">Empower Education Through Innovation</h2>
            
            <p className="info-description">
              Streamline academic processes, manage workflows efficiently, and create an exceptional learning environment for future leaders.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="copyright">
          © 2026 EdutechEX. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default ProcessAdminLogin;