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

  const hasCompletedProfile = () => {
    const profileCompleted = localStorage.getItem('profileCompleted');
    const userProfile = localStorage.getItem('userProfile');

    console.log("hasCompletedProfile check:");
    console.log("  profileCompleted:", profileCompleted);
    console.log("  userProfile exists:", !!userProfile);

    if (profileCompleted === 'true' && userProfile) {
      console.log("  Profile is completed");
      return true;
    }

    console.log("  Profile not completed");
    return false;
  };

  const clearUserData = () => {
    localStorage.removeItem('profileCompleted');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('studentType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('selectedUniversities');
    localStorage.removeItem('eligibleProgram');
    console.log("All user data cleared from localStorage");
  };

  // First-Year Student Sign-In
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
  console.log("Token received");

  // ✅ Step 1: Always store auth data first
  localStorage.setItem("token", response.data.token);
  localStorage.setItem("userData", JSON.stringify(response.data.user));
  localStorage.setItem("studentType", "firstyear");
  localStorage.setItem("userEmail", email);

  // ✅ Step 2: Check profile completion (Backend FIRST, fallback to localStorage)
  const isProfileCompleted =
    response.data.user?.profileCompleted === true ||
    localStorage.getItem("profileCompleted") === "true";

  if (isProfileCompleted) {
    console.log("Profile already completed - Redirecting to dashboard");

    // ✅ Keep profile flags consistent (important for future reloads)
    localStorage.setItem("profileCompleted", "true");
    localStorage.setItem("userProfile", JSON.stringify(response.data.user));

    navigate("/firstyear/dashboard");

  } else {
    console.log("Profile not completed - Redirecting to profile");

    // ⚠️ Clear only unnecessary data (avoid breaking auth flow)
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

  // Transfer Student Sign-In
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
        username: username,
        password,
      });

      console.log("Response data:", response.data);

      if (response.data.success && response.data.token) {

        // Step 1: Set new token and user data FIRST
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify(response.data.user));
        localStorage.setItem("studentType", "transfer");
        localStorage.setItem("userEmail", username);

        // Step 2: NOW check if profile is completed (profileCompleted still exists)
        if (hasCompletedProfile()) {
          console.log("Profile already completed - Redirecting to dashboard");
          navigate("/transfer/dashboard");
        } else {
          // Step 3: Only clear if going to profile (new/incomplete student)
          console.log("Profile not completed - Redirecting to profile");
          clearUserData();
          // Re-set essentials after clearing
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("userData", JSON.stringify(response.data.user));
          localStorage.setItem("studentType", "transfer");
          localStorage.setItem("userEmail", username);
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