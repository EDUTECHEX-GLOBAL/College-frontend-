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

  const [showPassword, setShowPassword] = useState(false);
  const [showTransferPassword, setShowTransferPassword] = useState(false);

  const handleResetState = () => {
    setShowStudentOptions(false);
    setStudentType(null);
    setError("");
    setShowPassword(false);
    setShowTransferPassword(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleTransferPasswordVisibility = () => {
    setShowTransferPassword(!showTransferPassword);
  };

  useEffect(() => {
    console.log("Current localStorage on SignIn page:");
    console.log("profileCompleted:", localStorage.getItem('profileCompleted'));
    console.log("userProfile:", localStorage.getItem('userProfile'));
    console.log("token:", localStorage.getItem('token') ? "Present" : "Missing");
  }, []);

  /**
   * Single source of truth: check backend response FIRST,
   * then fall back to localStorage. This handles:
   *  - New users     → profileCompleted is false  → go to /profile
   *  - Admin-approved returning users → profileCompleted is true → go to dashboard
   *  - Returning users who completed profile before → localStorage flag → go to dashboard
   */
  const isProfileComplete = (backendUser) => {
    // 1. Backend is the authority — always check it first
    if (backendUser?.profileCompleted === true) {
      console.log("  ✅ profileCompleted=true from backend");
      return true;
    }

    // 2. Fallback: localStorage flag (covers edge cases where backend hasn't updated yet)
    if (
      localStorage.getItem('profileCompleted') === 'true' &&
      localStorage.getItem('userProfile')
    ) {
      console.log("  ✅ profileCompleted=true from localStorage fallback");
      return true;
    }

    console.log("  ❌ Profile not completed");
    return false;
  };

  /**
   * Store all essential auth data after a successful login.
   * Called before any navigation so data is always present.
   */
  const storeAuthData = (token, user, type, identifier) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userData", JSON.stringify(user));
    localStorage.setItem("studentType", type);
    localStorage.setItem("userEmail", identifier);
  };

  /**
   * Mark the profile as completed in localStorage so returning users
   * skip the profile page without needing an extra API call.
   */
  const markProfileCompleted = (user) => {
    localStorage.setItem("profileCompleted", "true");
    localStorage.setItem("userProfile", JSON.stringify(user));
  };

  // ─── First-Year Student Sign-In ───────────────────────────────────────────
  const handleFirstYearSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      console.log("Signing in (First-Year):", email);

      const response = await axiosInstance.post("/api/students/login", {
        email,
        password,
      });

      console.log("Response data:", response.data);

      if (response.data.success && response.data.token) {
        const { token, user } = response.data;

        // Step 1: Always store auth data first
        storeAuthData(token, user, "firstyear", email);

        // Step 2: Check profile completion (backend is the authority)
        if (isProfileComplete(user)) {
          console.log("Profile completed → Redirecting to dashboard");
          markProfileCompleted(user); // keep localStorage in sync
          navigate("/firstyear/dashboard");
        } else {
          console.log("Profile not completed → Redirecting to profile");
          // Clear stale profile flags so profile page starts fresh
          localStorage.removeItem('profileCompleted');
          localStorage.removeItem('userProfile');
          navigate("/profile");
        }
      } else {
        console.error("Response missing success or token");
        setError(response.data.message || "Sign in failed. Please try again.");
      }
    } catch (err) {
      console.error("Sign in error:", err);
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

  // ─── Transfer Student Sign-In ─────────────────────────────────────────────
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
      console.log("Signing in (Transfer Student):", username);

      const response = await axiosInstance.post("/api/transfer/login", {
        username,
        password,
      });

      console.log("Response data:", response.data);

      if (response.data.success && response.data.token) {
        const { token, user } = response.data;

        // Step 1: Always store auth data first
        storeAuthData(token, user, "transfer", username);

        // Step 2: Check profile completion (backend is the authority)
        if (isProfileComplete(user)) {
          console.log("Profile completed → Redirecting to transfer dashboard");
          markProfileCompleted(user); // keep localStorage in sync
          navigate("/transfer/dashboard");
        } else {
          console.log("Profile not completed → Redirecting to profile");
          // Clear stale profile flags so profile page starts fresh
          localStorage.removeItem('profileCompleted');
          localStorage.removeItem('userProfile');
          navigate("/profile");
        }
      } else {
        setError(response.data.message || "Sign in failed. Please try again.");
      }
    } catch (err) {
      console.error("Sign in error:", err);
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

  const handleBackKeyPress = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleResetState();
    }
  };

  const handleCreateAccountKeyPress = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      navigate("/create-account");
    }
  };

  return (
    <div className="signin-overlay">
      <div className="signin-modal">
        {/* Close button */}
        <button
          className="signin-close-btn"
          onClick={() => {
            navigate("/");
            handleResetState();
          }}
          title="Close Sign In Modal"
          aria-label="Close"
        >
          ×
        </button>

        {/* Step 1: Choose student type */}
        {!showStudentOptions ? (
          <>
            <h1 className="signin-title">Sign in</h1>

            <div className="signin-student-section">
              <h3>Students</h3>

              <button
                className="signin-btn-primary"
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
                className="signin-btn-primary"
                onClick={() => {
                  setShowStudentOptions(true);
                  setStudentType("transfer");
                  setError("");
                }}
                type="button"
              >
                Transfer student
              </button>

              <p className="signin-create-account-text">
                Don't have an account yet?{" "}
                <span
                  onClick={() => navigate("/create-account")}
                  onKeyPress={handleCreateAccountKeyPress}
                  className="signin-link"
                  role="button"
                  tabIndex={0}
                >
                  Create an account
                </span>
              </p>
            </div>

            <div className="signin-extra-login">
              <button
                className="signin-link"
                type="button"
                onClick={() => navigate("/recommender-login")}
              >
                Recommender login →
              </button>
              <button
                className="signin-link"
                type="button"
                onClick={() => navigate("/member-college-login")}
              >
                Member college login →
              </button>
            </div>
          </>
        ) : studentType === "first-year" ? (
          // First-Year Sign In Form
          <div className="signin-form-container">
            <h2>Sign in to your account</h2>

            {error && (
              <div className="signin-error-message" role="alert" aria-live="polite">
                <strong>Error: </strong>
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
              <div className="signin-password-input-container">
                <input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="signin-password-input"
                />
                <button
                  type="button"
                  className="signin-password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <p className="signin-forgot-password-text">
                <span
                  className="signin-link"
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

              <div className="signin-form-actions">
                <button type="submit" className="signin-btn-primary" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>

            <p
              className="signin-back-link"
              onClick={handleResetState}
              onKeyPress={handleBackKeyPress}
              role="button"
              tabIndex={0}
            >
              ← Back to student type
            </p>
          </div>
        ) : (
          // Transfer Student Sign In Form
          <div className="signin-form-container">
            <h2>Transfer Student Sign In</h2>

            {error && (
              <div className="signin-error-message" role="alert" aria-live="polite">
                <strong>Error: </strong>
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
              <div className="signin-password-input-container">
                <input
                  id="transfer-password"
                  type={showTransferPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="signin-password-input"
                />
                <button
                  type="button"
                  className="signin-password-toggle-btn"
                  onClick={toggleTransferPasswordVisibility}
                  disabled={loading}
                  aria-label={showTransferPassword ? "Hide password" : "Show password"}
                >
                  {showTransferPassword ? "Hide" : "Show"}
                </button>
              </div>

              <p className="signin-forgot-password-text">
                <span
                  className="signin-link"
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

              <div className="signin-form-actions">
                <button type="submit" className="signin-btn-primary" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>

            <p
              className="signin-back-link"
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