// src/components/ForgotPassword.js - UPDATED with EDUTECHEX logo colors
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import OtpVerification from "./OtpVerification";
import OtpVerificationTransfer from "./OtpVerificationTransfer";
import "./SignIn.css";

const ForgotPassword = function() {
  const [step, setStep] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Detect student type from URL
  const isFirstYear = location.pathname.includes("firstyear");
  const isTransfer = location.pathname.includes("transfer");
  const identifierLabel = isFirstYear ? "Email" : "Username";
  const apiPrefix = isFirstYear ? "students" : "transfer";

  const handleSendOtp = async function(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axiosInstance.post(
        "/api/" + apiPrefix + "/forgot-password/request-otp",
        { [isFirstYear ? "email" : "username"]: identifier.trim() }
      );
      setMessage(response.data.message);
      setStep("otp");
    } catch (err) {
      setError(err.response ? err.response.data.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async function(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post(
        "/api/" + apiPrefix + "/forgot-password/reset",
        {
          [isFirstYear ? "email" : "username"]: identifier,
          password: newPassword,
          confirmPassword: confirmPassword,
        }
      );

      // Auto-login
      // ✅ Do NOT auto-login after password reset

// Clear any old session (important)
// Clear any existing session
localStorage.removeItem("token");
localStorage.removeItem("userData");
localStorage.removeItem("studentType");

// ✅ Redirect to correct SignIn route
navigate("/sign-in", {
  replace: true,
  state: {
    message: "Password reset successful. Please sign in with your new password.",
    type: isFirstYear ? "firstyear" : "transfer",
    identifier: identifier // optional (for pre-fill)
  }
});
    } catch (err) {
      setError(err.response ? err.response.data.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = function() {
    setStep("password");
  };

  const OtpModal = isFirstYear ? OtpVerification : OtpVerificationTransfer;

  if (step === "otp") {
    return React.createElement(OtpModal, {
      email: identifier,
      onVerified: handleOtpVerified,
      onClose: function() { navigate(-1); }
    });
  }

  // Updated JSX with EDUTECHEX logo colors (Teal gradient)
  return React.createElement("div", { className: "signin-overlay" },
    React.createElement("div", { className: "signin-modal" },
      // Close button
      React.createElement("button", {
        className: "signin-close-btn",
        onClick: function() { navigate(-1); }
      }, "✕"),
      
      step === "email" ? 
        React.createElement(React.Fragment, null,
          // Title with gradient color
          React.createElement("h2", { 
            className: "signin-title",
            style: { 
              background: "linear-gradient(135deg, #0891b2, #0e7490)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "1.8rem",
              marginBottom: "20px"
            }
          }, "Reset " + (isFirstYear ? "First-Year" : "Transfer") + " Password"),
          
          // Success message
          message && React.createElement("div", { 
            className: "signin-success-message",
            style: {
              background: "linear-gradient(135deg, rgba(8, 145, 178, 0.1) 0%, rgba(14, 116, 144, 0.05) 100%)",
              color: "#0e7490",
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              borderLeft: "4px solid #0891b2",
              fontSize: "0.9rem"
            }
          }, message),
          
          // Error message
          error && React.createElement("div", { className: "signin-error-message" }, error),
          
          React.createElement("form", { onSubmit: handleSendOtp },
            React.createElement("label", { 
              style: { 
                fontWeight: "600", 
                color: "#334155",
                marginBottom: "8px",
                display: "block"
              }
            }, identifierLabel),
            React.createElement("input", {
              type: isFirstYear ? "email" : "text",
              value: identifier,
              onChange: function(e) { setIdentifier(e.target.value); },
              placeholder: "Enter your " + identifierLabel.toLowerCase(),
              required: true,
              disabled: loading,
              autoComplete: "off",
              style: {
                width: "100%",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "2px solid #e2e8f0",
                fontSize: "1rem",
                marginBottom: "20px",
                boxSizing: "border-box"
              }
            }),
            React.createElement("button", {
              type: "submit",
              className: "signin-btn-primary",
              disabled: loading || !identifier.trim(),
              style: {
                width: "100%",
                padding: "14px 24px",
                background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
                color: "white",
                border: "none",
                borderRadius: "14px",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading || !identifier.trim() ? 0.7 : 1
              }
            }, loading ? "Sending OTP..." : "Send OTP")
          )
        ) :
        React.createElement(React.Fragment, null,
          // New Password step
          React.createElement("h2", { 
            className: "signin-title",
            style: { 
              background: "linear-gradient(135deg, #0891b2, #0e7490)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "1.8rem",
              marginBottom: "20px"
            }
          }, "Create New Password"),
          
          error && React.createElement("div", { className: "signin-error-message" }, error),
          
          React.createElement("form", { onSubmit: handleResetPassword },
            React.createElement("label", { 
              style: { 
                fontWeight: "600", 
                color: "#334155",
                marginBottom: "8px",
                display: "block"
              }
            }, "New Password"),
            React.createElement("div", { className: "signin-password-input-container", style: { marginBottom: "20px" } },
              React.createElement("input", {
                type: "password",
                className: "signin-password-input",
                value: newPassword,
                onChange: function(e) { setNewPassword(e.target.value); },
                placeholder: "Enter new password (8+ characters)",
                required: true,
                disabled: loading,
                autoComplete: "new-password",
                style: {
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "2px solid #e2e8f0",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }
              })
            ),
            
            React.createElement("label", { 
              style: { 
                fontWeight: "600", 
                color: "#334155",
                marginBottom: "8px",
                display: "block"
              }
            }, "Confirm Password"),
            React.createElement("div", { className: "signin-password-input-container", style: { marginBottom: "25px" } },
              React.createElement("input", {
                type: "password",
                className: "signin-password-input",
                value: confirmPassword,
                onChange: function(e) { setConfirmPassword(e.target.value); },
                placeholder: "Confirm your new password",
                required: true,
                disabled: loading,
                autoComplete: "new-password",
                style: {
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "2px solid #e2e8f0",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }
              })
            ),
            
            React.createElement("button", {
              type: "submit",
              className: "signin-btn-primary",
              disabled: loading || !newPassword || !confirmPassword,
              style: {
                width: "100%",
                padding: "14px 24px",
                background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
                color: "white",
                border: "none",
                borderRadius: "14px",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading || !newPassword || !confirmPassword ? 0.7 : 1
              }
            }, loading ? "Resetting Password..." : "Reset Password")
          )
        ),
      
      // Back to Sign In link
      React.createElement("div", { 
        className: "signin-back-link",
        onClick: function() { navigate("/signin"); },
        style: {
          marginTop: "25px",
          textAlign: "center",
          cursor: "pointer",
          color: "#0891b2",
          fontWeight: "600"
        }
      }, "← Back to Sign In")
    )
  );
};

export default ForgotPassword;