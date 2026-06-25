import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api";
import "./AdminLogin.css";
import loginIllustration from "../assets/login-illustration.png";

const ALLOWED_ADMIN_EMAIL = "edutechexcollege@gmail.com";

const AdminForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const normalizedEmail = email.trim().toLowerCase();

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const getErrorMessage = (err, fallback) =>
    err.response?.data?.message || fallback;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!normalizedEmail) {
      setError("Please enter your admin email.");
      return;
    }

    if (normalizedEmail !== ALLOWED_ADMIN_EMAIL) {
      setError("This email is not authorized for admin access.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/forgot-password`, {
        email: normalizedEmail,
      });

      if (response.data.success) {
        setMessage(response.data.message || "OTP sent successfully.");
        setOtp("");
        setStep("otp");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send OTP. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!otp.trim()) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/verify-reset-otp`, {
        email: normalizedEmail,
        otp: otp.trim(),
      });

      if (response.data.success) {
        setMessage(response.data.message || "OTP verified.");
        setStep("reset");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Invalid or expired OTP. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/reset-password`, {
        email: normalizedEmail,
        newPassword,
      });

      if (response.data.success) {
        setMessage(response.data.message || "Password reset successful.");
        setTimeout(() => navigate("/admin-login"), 1200);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Password reset failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-container">
        <div className="login-right">
          <img
            src={loginIllustration}
            alt="Admin password reset"
            className="login-image"
          />
          <div className="login-right-text">
            <h2>Recover Admin Access</h2>
            <p className="login-now-text">OTP verification required</p>
          </div>
          <div className="security-info">
            <p>Password Reset Steps</p>
            <ul>
              <li>Enter the authorized admin email</li>
              <li>Verify the OTP sent by email</li>
              <li>Create a new secure password</li>
            </ul>
          </div>
        </div>

        <div className="login-left">
          <h1 className="login-title">Reset Password</h1>
          <p className="login-subtitle">
            {step === "email" && "Enter the authorized admin email"}
            {step === "otp" && "Enter the OTP sent to your inbox"}
            {step === "reset" && "Create a new admin password"}
          </p>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          {step === "email" && (
            <form className="login-form" onSubmit={handleSendOtp} noValidate>
              <label htmlFor="email">Admin Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder=""
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearMessages();
                }}
                disabled={loading}
                autoComplete="email"
                required
              />

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form className="login-form" onSubmit={handleVerifyOtp} noValidate>
              <label htmlFor="otp">OTP</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  clearMessages();
                }}
                disabled={loading}
                autoComplete="one-time-code"
                required
              />

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                className="forgot-password-link"
                onClick={handleSendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
            </form>
          )}

          {step === "reset" && (
            <form className="login-form" onSubmit={handleResetPassword} noValidate>
              <label htmlFor="newPassword">New Password</label>
              <div className="password-container">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearMessages();
                  }}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearMessages();
                }}
                disabled={loading}
                autoComplete="new-password"
                required
                minLength="6"
              />

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <button
            type="button"
            className="back-link"
            onClick={() => navigate("/admin-login")}
            disabled={loading}
          >
            Back to Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
