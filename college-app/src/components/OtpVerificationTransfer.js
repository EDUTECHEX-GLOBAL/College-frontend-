import React, { useState, useEffect } from "react";
import axios from "axios";
import "./OtpVerificationTransfer.css";

const API_URL = process.env.REACT_APP_API_URL;

const OtpVerificationTransfer = ({ email, onVerified, onClose }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // ⏱️ Resend Timer Effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0 && !canResend) {
      setCanResend(true);
    }
  }, [resendTimer, canResend]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!otp) {
      return setMessage({ 
        type: "error", 
        text: "❌ Please enter the OTP sent to your email." 
      });
    }

    if (otp.length < 6) {
      return setMessage({ 
        type: "error", 
        text: "❌ OTP must be 6 digits." 
      });
    }

    try {
      setLoading(true);

      console.log("📧 Verifying OTP for Transfer Student:", email);
      console.log("🔐 OTP:", otp);
      console.log("🔗 API URL:", API_URL);
      console.log("📍 Full endpoint:", `${API_URL}/api/transfer/verify-otp`);

      // ✅ For Transfer Student - use /api/transfer endpoint
      const response = await axios.post(`${API_URL}/api/transfer/verify-otp`, {
        email,
        otp,
      }, {
        timeout: 10000,  // 10 second timeout
        headers: {
          "Content-Type": "application/json",
        }
      });

      console.log("✅ OTP Verification successful:", response.data);

      setLoading(false);
      setMessage({ 
        type: "success", 
        text: "✅ " + (response.data.message || "Email verified successfully!") 
      });

      // Call onVerified after short delay
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (error) {
      setLoading(false);
      console.error("❌ OTP verification failed:", error);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      console.error("Error message:", error.message);

      let errorMessage = "Failed to verify OTP. Please try again.";

      if (error.response) {
        // Server responded with error
        console.error("🔴 Server Error - Status:", error.response.status);
        errorMessage = error.response.data?.message || `Error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        console.error("🔴 No response from server");
        errorMessage = "No response from server. Please check if server is running.";
      } else {
        // Error in request setup
        console.error("🔴 Request setup error:", error.message);
        errorMessage = error.message;
      }

      setMessage({
        type: "error",
        text: "❌ " + errorMessage,
      });
    }
  };

  // 🔄 Resend OTP Handler
  const handleResendOTP = async () => {
    setMessage({ type: "", text: "" });

    try {
      setResendLoading(true);

      console.log("📧 Resending OTP to Transfer Student:", email);
      console.log("🔗 API URL:", API_URL);
      console.log("📍 Full endpoint:", `${API_URL}/api/transfer/send-otp`);

      // ✅ For Transfer Student - use /api/transfer endpoint
      const response = await axios.post(`${API_URL}/api/transfer/send-otp`, {
        email,
      }, {
        timeout: 10000,  // 10 second timeout
        headers: {
          "Content-Type": "application/json",
        }
      });

      console.log("✅ OTP Resent:", response.data);

      setResendLoading(false);
      setOtp("");
      setCanResend(false);
      setResendTimer(60);

      setMessage({
        type: "success",
        text: "✅ New OTP sent to your email! Check your inbox.",
      });
    } catch (error) {
      setResendLoading(false);
      console.error("❌ Error resending OTP:", error);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      console.error("Error message:", error.message);

      let errorMessage = "Failed to resend OTP. Please try again.";

      if (error.response) {
        // Server responded with error
        console.error("🔴 Server Error - Status:", error.response.status);
        errorMessage = error.response.data?.message || `Error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        console.error("🔴 No response from server");
        errorMessage = "No response from server. Please check if server is running.";
      } else {
        // Error in request setup
        console.error("🔴 Request setup error:", error.message);
        errorMessage = error.message;
      }

      setMessage({
        type: "error",
        text: "❌ " + errorMessage,
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="otp-modal">
        <button 
          className="modal-close-btn" 
          onClick={onClose}
          title="Close"
        >
          ✕
        </button>

        <div className="otp-header">
          <h3 className="modal-title">Verify Your Email</h3>
        </div>

        <p className="modal-message">
          We've sent a 6-digit OTP to your email: <b>{email}</b>
        </p>

        {message.text && (
          <div 
            className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="otp-input-group">
            <input
              type="text"
              className="otp-input"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength="6"
              disabled={loading}
              autoComplete="off"
            />
            <small className="hint-text">Enter the 6-digit code from your email</small>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="modal-btn secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="modal-btn primary" 
              disabled={loading || !otp}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </form>

        <div className="resend-section">
          <p className="resend-text">Didn't receive the OTP?</p>
          <button
            type="button"
            className="resend-btn"
            onClick={handleResendOTP}
            disabled={!canResend || resendLoading}
          >
            {resendLoading ? (
              "Sending..."
            ) : canResend ? (
              "Resend OTP"
            ) : (
              `Resend in ${resendTimer}s`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationTransfer;
