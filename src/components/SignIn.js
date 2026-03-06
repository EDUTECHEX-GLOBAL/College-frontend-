import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "./SignIn.css";

const SignIn = () => {
  const navigate = useNavigate();
  const [showStudentOptions, setShowStudentOptions] = useState(false);
  const [studentType, setStudentType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // New state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showTransferPassword, setShowTransferPassword] = useState(false);

  // 🔄 Reset state handler
  const handleResetState = () => {
    setShowStudentOptions(false);
    setStudentType(null);
    setError("");
    setShowPassword(false);
    setShowTransferPassword(false);
  };

  // Toggle password visibility for first-year students
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle password visibility for transfer students
  const toggleTransferPasswordVisibility = () => {
    setShowTransferPassword(!showTransferPassword);
  };

  // Check localStorage on component mount
  useEffect(() => {
    console.log("🔍 Current localStorage on SignIn page:");
    console.log("profileCompleted:", localStorage.getItem('profileCompleted'));
    console.log("userProfile:", localStorage.getItem('userProfile'));
    console.log("token:", localStorage.getItem('token') ? "Present" : "Missing");
    
    // DON'T clear profile data here - let the login flow handle it
  }, []);

  // Check if user has completed profile - FIXED VERSION
  const hasCompletedProfile = () => {
    const profileCompleted = localStorage.getItem('profileCompleted');
    const userProfile = localStorage.getItem('userProfile');
    const token = localStorage.getItem('token');
    
    console.log("🔍 hasCompletedProfile check:");
    console.log("  profileCompleted:", profileCompleted);
    console.log("  userProfile exists:", !!userProfile);
    console.log("  token exists:", !!token);
    
    // Only return true if ALL conditions are met:
    // 1. profileCompleted is explicitly 'true'
    // 2. userProfile exists
    // 3. token exists (user is logged in)
    if (profileCompleted === 'true' && userProfile && token) {
      console.log("  ✅ Profile is completed");
      return true;
    }
    
    console.log("  ❌ Profile not completed");
    return false;
  };

  // Clear all user data on logout (call this from your logout function)
  const clearUserData = () => {
    localStorage.removeItem('profileCompleted');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('studentType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('selectedUniversities');
    localStorage.removeItem('eligibleProgram');
    console.log("🧹 All user data cleared from localStorage");
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

      const response = await axiosInstance.post("/api/students/login", {
        email,
        password,
      });

      console.log("📩 Response data:", response.data);

      if (response.data.success && response.data.token) {
        console.log("🔑 Token received");

        // ✅ Clear any existing data first (fresh login)
        clearUserData();

        // ✅ Store new token and user data
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify(response.data.user));
        localStorage.setItem("studentType", "firstyear");
        localStorage.setItem("userEmail", email);

        console.log("✅ New user data stored");

        // IMPORTANT: For a new user, profileCompleted is NOT set yet
        // So this will always redirect to /profile for first login
        console.log("➡️ First login - Redirecting to profile completion");
        navigate("/profile");
        
      } else {
        console.error("❌ Response missing success or token");
        setError(response.data.message || "Sign in failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Sign in error:", err);
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

  // 🔁 Transfer Student Sign-In
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

      const response = await axiosInstance.post("/api/transfer/login", {
        username: username,
        password,
      });

      console.log("📩 Response data:", response.data);

      if (response.data.success && response.data.token) {
        // ✅ Clear any existing data first (fresh login)
        clearUserData();

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify(response.data.user));
        localStorage.setItem("studentType", "transfer");
        localStorage.setItem("userEmail", username);

        const hasCompletedExtendedProfile = response.data.user?.hasCompletedExtendedProfile;

        // IMPORTANT: For a new user, profileCompleted is NOT set yet
        // So this will always redirect to /profile for first login
        console.log("➡️ First login - Redirecting to profile completion");
        navigate("/profile");
        
      } else {
        setError(response.data.message || "Sign in failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Sign in error:", err);
      if (err.response?.status === 401) {
        setError("Invalid username or password. Please try again.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Invalid request. Please check your credentials.");
      } else if (err.response?.status === 404) {
        setError("User not found. Please check your username.");
      } else if (err.code === "NETWORK_ERROR" || err.message?.includes("Network Error")) {
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
              <div className="error-message" role="alert" aria-live="polite">
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
              <div className="password-input-container">
                <input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="password-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>

              <p className="forgot-password-text">
                <span
                  className="link"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate("/firstyear/forgot-password")}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate("/firstyear/forgot-password");
                    }
                  }}
                >
                  Forgot password?
                </span>
              </p>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
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
              <div className="error-message" role="alert" aria-live="polite">
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
              <div className="password-input-container">
                <input
                  id="transfer-password"
                  type={showTransferPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="password-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={toggleTransferPasswordVisibility}
                  disabled={loading}
                  aria-label={showTransferPassword ? "Hide password" : "Show password"}
                >
                  {showTransferPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>

              <p className="forgot-password-text">
                <span
                  className="link"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate("/transfer/forgot-password")}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate("/transfer/forgot-password");
                    }
                  }}
                >
                  Forgot password?
                </span>
              </p>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
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
    </div>
  );
};

export default SignIn;