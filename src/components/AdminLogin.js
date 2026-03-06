import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import loginIllustration from "../assets/login-illustration.png";
import axios from "axios";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Base URL for API calls
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/login`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true // For cookies if using HTTP-only cookies
        }
      );

      if (response.data.success) {
        // Store token in localStorage or context
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem("adminData", JSON.stringify(response.data.admin));
        
        // Store admin info for session management
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminEmail", response.data.admin.email);
        localStorage.setItem("adminName", response.data.admin.name);
        localStorage.setItem("adminRole", response.data.admin.role);
        
        // Set token for future requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
        
        navigate("/admin-dashboard");
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.response) {
        // Server responded with error
        setError(error.response.data.message || "Invalid credentials");
      } else if (error.request) {
        // Request made but no response
        setError("Cannot connect to server. Please try again later.");
      } else {
        // Something else happened
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const handleBackToStudentType = () => navigate("/");

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-container">
        {/* Left Side - Form */}
        <div className="login-left">
          <h1 className="login-title">Admin Login 👋</h1>
          <p className="login-subtitle">Access your admin dashboard</p>

          {error && <div className="error-message">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter admin email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />

            <label>Password</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter admin password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                minLength="6"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Signing In..." : "Login"}
            </button>
          </form>

          <button className="back-link" onClick={handleBackToStudentType} disabled={loading}>
            ← Back to Dashboard
          </button>

          <div className="login-footer">
            <p>© {new Date().getFullYear()} EdutechEX All Rights Reserved.</p>
            <p className="login-tip">Use your admin credentials provided by the system administrator</p>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="login-right">
          <img src={loginIllustration} alt="Login Illustration" className="login-image" />
          <h2>Admin Dashboard Access</h2>
          <p className="login-now-text">Secure Login Required</p>
          <div className="security-info">
            <p><strong>Security Features:</strong></p>
            <ul>
              <li>Encrypted password storage</li>
              <li>Account lockout protection</li>
              <li>Secure session management</li>
              <li>Role-based access control</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;