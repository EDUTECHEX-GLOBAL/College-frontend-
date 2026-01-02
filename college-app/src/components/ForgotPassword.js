// src/components/ForgotPassword.js - FIXED OTP PROP PASSING
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import OtpVerification from "./OtpVerification"; 
import OtpVerificationTransfer from "./OtpVerificationTransfer"; 
import "./SignIn.css";

const ForgotPassword = function() {
  // ✅ FIXED: Proper useState hooks
  const [step, setStep] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  var navigate = useNavigate();
  var location = useLocation();

  // Detect student type from URL
  var isFirstYear = location.pathname.includes("firstyear");
  var isTransfer = location.pathname.includes("transfer");
  var identifierLabel = isFirstYear ? "Email" : "Username";
  var apiPrefix = isFirstYear ? "students" : "transfer";

  var handleSendOtp = async function(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      var response = await axiosInstance.post(
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

  var handleResetPassword = async function(e) {
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
      var response = await axiosInstance.post(
        "/api/" + apiPrefix + "/forgot-password/reset",
        {
          [isFirstYear ? "email" : "username"]: identifier,
          password: newPassword,
          confirmPassword: confirmPassword,
        }
      );

      // Auto-login
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userData", JSON.stringify(response.data.account || response.data.user));
      localStorage.setItem("studentType", isFirstYear ? "firstyear" : "transfer");
      
      // Redirect to correct dashboard
      navigate(isFirstYear ? "/firstyear/dashboard" : "/transfer/dashboard");
    } catch (err) {
      setError(err.response ? err.response.data.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  var handleOtpVerified = function() {
    setStep("password");
  };

  // ✅ FIXED: Choose correct OTP modal & pass CORRECT prop
  var OtpModal = isFirstYear ? OtpVerification : OtpVerificationTransfer;

  if (step === "otp") {
    return React.createElement(OtpModal, {
      // ✅ FIXED: Always pass as 'email' prop - OtpVerificationTransfer expects 'email'
      email: identifier,  // 👈 This works for BOTH firstyear (email) AND transfer (username)
      onVerified: handleOtpVerified,
      onClose: function() { navigate(-1); }
    });
  }

  return React.createElement("div", { className: "signin-overlay" },
    React.createElement("div", { className: "signin-modal" },
      React.createElement("button", {
        className: "close-btn",
        onClick: function() { navigate(-1); }
      }, "✕"),
      
      step === "email" ? 
        React.createElement(React.Fragment, null,
          React.createElement("h2", null, "Reset " + (isFirstYear ? "First-Year" : "Transfer") + " Password"),
          message && React.createElement("div", { className: "success-message" }, message),
          error && React.createElement("div", { className: "error-message" }, error),
          React.createElement("form", { onSubmit: handleSendOtp },
            React.createElement("label", null, identifierLabel),
            React.createElement("input", {
              type: isFirstYear ? "email" : "text",
              value: identifier,
              onChange: function(e) { setIdentifier(e.target.value); },
              placeholder: "Enter your " + identifierLabel.toLowerCase(),
              required: true,
              disabled: loading,
              autoComplete: "off"
            }),
            React.createElement("button", {
              type: "submit",
              className: "btn-primary",
              disabled: loading || !identifier
            }, loading ? "Sending..." : "Send OTP")
          )
        ) :
        React.createElement(React.Fragment, null,
          React.createElement("h2", null, "New Password"),
          error && React.createElement("div", { className: "error-message" }, error),
          React.createElement("form", { onSubmit: handleResetPassword },
            React.createElement("label", null, "New Password"),
            React.createElement("input", {
              type: "password",
              value: newPassword,
              onChange: function(e) { setNewPassword(e.target.value); },
              placeholder: "New password (8+ chars)",
              required: true,
              disabled: loading,
              autoComplete: "new-password"
            }),
            React.createElement("label", null, "Confirm Password"),
            React.createElement("input", {
              type: "password",
              value: confirmPassword,
              onChange: function(e) { setConfirmPassword(e.target.value); },
              placeholder: "Confirm password",
              required: true,
              disabled: loading,
              autoComplete: "new-password"
            }),
            React.createElement("button", {
              type: "submit",
              className: "btn-primary",
              disabled: loading
            }, loading ? "Resetting..." : "Reset Password")
          )
        )
    )
  );
};

export default ForgotPassword;
