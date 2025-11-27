import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from '../api/axiosInstance';
import "./SignIn.css";

const SignIn = () => {
  const navigate = useNavigate();
  const [showStudentOptions, setShowStudentOptions] = useState(false);
  const [studentType, setStudentType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔄 Reset state handler
  const handleResetState = () => {
    setShowStudentOptions(false);
    setStudentType(null);
    setError("");
  };

  // 🔐 First-Year Student Sign-In
  const handleFirstYearSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    // ✅ Validation
    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      console.log("📤 Signing in (First-Year):", email);

      const response = await axiosInstance.post('/api/students/login', {
        email,
        password
      });

      console.log("📩 Response data:", response.data);

      if (response.data.success && response.data.token) {
        console.log("🔑 Token received:", response.data.token.substring(0, 20) + "...");
        console.log("📦 Full response:", response.data);
        
        // ✅ Store token
        localStorage.setItem("token", response.data.token);
        console.log("💾 Token stored in localStorage");
        console.log("🔍 Verify token in localStorage:", localStorage.getItem("token") ? "✅ Present" : "❌ Missing");
        
        // ✅ Store user data
        localStorage.setItem("userData", JSON.stringify(response.data.user));
        localStorage.setItem("studentType", "firstyear");
        
        console.log("✅ All data stored. Token exists:", !!localStorage.getItem("token"));
        console.log("✅ First-year login successful → Redirecting to dashboard");
        
        navigate("/firstyear/dashboard"); // ✅ Use the correct dashboard path
      } else {
        console.error("❌ Response missing success or token:", {
          success: response.data?.success,
          hasToken: !!response.data?.token
        });
        setError(response.data.message || "Sign in failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Sign in error:", err);
      console.error("   Response:", err.response?.data);
      
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Invalid request. Please check your details.");
      } else if (err instanceof TypeError) {
        setError("Network error. Please ensure your backend is running.");
      } else {
        setError(err.response?.data?.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Transfer Student Sign-In - FIXED VERSION
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
      console.log("📤 Signing in (Transfer Student):", username);

      const response = await axiosInstance.post('/api/transfer/login', {
        username: username, // Remove .toLowerCase() to preserve original case
        password
      });

      console.log("📩 Response data:", response.data);

      if (response.data.success && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify(response.data.user));
        localStorage.setItem("studentType", "transfer");

        const hasCompletedExtendedProfile =
          response.data.user?.hasCompletedExtendedProfile;

        if (hasCompletedExtendedProfile) {
          navigate("/transfer/dashboard");
        } else {
          navigate("/extended-profile");
        }
      } else {
        setError(response.data.message || "Sign in failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Sign in error:", err);
      console.error("   Response data:", err.response?.data);
      console.error("   Status:", err.response?.status);

      if (err.response?.status === 401) {
        setError("Invalid username or password. Please try again.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Invalid request. Please check your credentials.");
      } else if (err.response?.status === 404) {
        setError("User not found. Please check your username.");
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.response?.data?.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle keyboard navigation for back link
  const handleBackKeyPress = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleResetState();
    }
  };

  // ✅ Handle keyboard navigation for create account link
  const handleCreateAccountKeyPress = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      navigate("/create-account");
    }
  };

  return (
    <div className="signin-overlay">
      <div className="signin-modal">
        {/* ✕ Close button */}
        <button
          className="close-btn"
          onClick={() => {
            navigate("/");
            handleResetState();
          }}
          title="Close Sign In Modal"
          aria-label="Close"
        >
          ✕
        </button>

        {/* 🔹 Step 1: Choose student type */}
        {!showStudentOptions ? (
          <>
            <h1 className="signin-title">Sign in</h1>

            <div className="student-section">
              <h3>Students</h3>

              <button
                className="btn-primary"
                onClick={() => {
                  setShowStudentOptions(true);
                  setStudentType("first-year");
                  setError("");
                }}
                type="button"
              >
                First-year student
              </button>

              <button
                className="btn-primary"
                onClick={() => {
                  setShowStudentOptions(true);
                  setStudentType("transfer");
                  setError("");
                }}
                type="button"
              >
                Transfer student
              </button>

              <p className="create-account-text">
                Don't have an account yet?{" "}
                <span
                  onClick={() => navigate("/create-account")}
                  onKeyPress={handleCreateAccountKeyPress}
                  className="link"
                  role="button"
                  tabIndex={0}
                >
                  Create an account
                </span>
              </p>
            </div>

            <div className="extra-login">
              <button 
                className="link" 
                type="button"
                onClick={() => navigate("/recommender-login")}
              >
                Recommender login →
              </button>
              <button 
                className="link" 
                type="button"
                onClick={() => navigate("/member-college-login")}
              >
                Member college login →
              </button>
            </div>
          </>
        ) : studentType === "first-year" ? (
          // 🧑‍🎓 First-Year Sign In Form
          <div className="signin-form-container">
            <h2>Sign in to your account</h2>

            {error && (
              <div 
                className="error-message" 
                role="alert"
                aria-live="polite"
              >
                <strong>⚠️ Error: </strong>
                {error}
              </div>
            )}

            <form onSubmit={handleFirstYearSignIn} noValidate>
              <label htmlFor="signin-email">Email</label>
              <input
                id="signin-email"
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                disabled={loading}
                autoComplete="email"
              />

              <label htmlFor="signin-password">Password</label>
              <input
                id="signin-password"
                type="password"
                name="password"
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
              />

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>

            <p
              className="back-link"
              onClick={handleResetState}
              onKeyPress={handleBackKeyPress}
              role="button"
              tabIndex={0}
            >
              ← Back to student type
            </p>
          </div>
        ) : (
          // 🔁 Transfer Student Sign In Form
          <div className="signin-form-container">
            <h2>Transfer Student Sign In</h2>

            {error && (
              <div 
                className="error-message" 
                role="alert"
                aria-live="polite"
              >
                <strong>⚠️ Error: </strong>
                {error}
              </div>
            )}

            <form onSubmit={handleTransferSignIn} noValidate>
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

              <label htmlFor="transfer-password">Password</label>
              <input
                id="transfer-password"
                type="password"
                name="password"
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
              />

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>

            <p
              className="back-link"
              onClick={handleResetState}
              onKeyPress={handleBackKeyPress}
              role="button"
              tabIndex={0}
            >
              ← Back to student type
            </p>
          </div>
        )}
      </div>

      <style>{`
        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          border: 1px solid #fcc;
          font-size: 14px;
          animation: slideDown 0.3s ease-in-out;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SignIn;