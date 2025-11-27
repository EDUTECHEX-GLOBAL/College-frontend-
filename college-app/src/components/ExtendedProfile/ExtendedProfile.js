import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./ExtendedProfile.css";

const ExtendedProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🧠 Form state
  const [formData, setFormData] = useState({
    collegeCredits: "",
    bornBefore2003: "",
    degreeStatus: "",
    communityCollege: "",
    degreeGoal: "",
    militaryStatus: "",
  });

  // 🔄 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 💾 Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("📤 Submitting extended profile:", formData);

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem('token');

      if (!token) {
        console.error('❌ No token found in localStorage');
        setError('Session expired. Please sign in again.');
        setTimeout(() => {
          navigate('/sign-in');
        }, 2000);
        return;
      }

      console.log('🔑 Token exists:', token.substring(0, 20) + '...');
      console.log('🔗 Sending PUT request to /api/transfer/profile');

      // ✅ FIXED: Use PUT request to /api/transfer/profile
      const response = await axiosInstance.put(
        '/api/transfer/profile',
        formData
      );

      console.log("✅ Response received:", response.data);

      if (response.data.success) {
        console.log("✅ Extended profile saved successfully");

        // Store extended profile data
        localStorage.setItem("extendedProfile", JSON.stringify(formData));

        // Update user data if provided by backend
        if (response.data.account) {
          const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
          const updatedUserData = {
            ...currentUserData,
            ...formData,
            ...response.data.account
          };
          localStorage.setItem("userData", JSON.stringify(updatedUserData));
          console.log("✅ User data updated in localStorage");
        }

        console.log("🎯 Navigating to /transfer/dashboard");
        
        // ✅ Navigate to transfer dashboard
        navigate("/transfer/dashboard");
      } else {
        const errorMsg = response.data.message || "Failed to save profile. Please try again.";
        console.error("❌ Backend error:", errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error("❌ Error saving extended profile:");
      console.error("   Status:", error.response?.status);
      console.error("   Message:", error.response?.data?.message || error.message);

      // Better error messaging
      let errorMsg = "Error saving profile. Please try again.";
      
      if (error.response?.status === 401) {
        errorMsg = "Authentication failed. Please sign in again.";
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setTimeout(() => {
          navigate('/sign-in');
        }, 2000);
      } else if (error.response?.status === 400) {
        errorMsg = error.response?.data?.message || "Invalid profile data. Please check your inputs.";
      } else if (error.response?.status === 404) {
        errorMsg = "Profile endpoint not found. Please contact support.";
      } else if (error.message === 'Network Error') {
        errorMsg = "Network error. Please ensure your backend is running.";
      } else {
        errorMsg = error.response?.data?.message || error.message;
      }

      console.error("🔴 Final error message:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ⬅️ Back button handler
  const handleBack = () => {
    console.log("⬅️ Navigating back to sign-in");
    navigate("/sign-in");
  };

  return (
    <div className="extended-bg">
      <div className="extended-profile-card">
        <h1>Create Your Extended Profile</h1>
        <p className="subtitle">
          Please provide additional details to complete your application.
        </p>

        {/* Error Message Display */}
        {error && (
          <div 
            className="error-message" 
            role="alert"
            aria-live="polite"
            style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '12px 15px',
              borderRadius: '5px',
              marginBottom: '20px',
              border: '1px solid #fcc',
              fontSize: '14px'
            }}
          >
            <strong>⚠️ Error: </strong>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          {/* College Credits */}
          <div className="form-section">
            <h3>College credits earned</h3>
            <p>How many college credits will you have earned when you transfer?</p>
            <div className="radio-group">
              {["0 - 14", "15 - 29", "30 - 59"].map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name="collegeCredits"
                    value={option}
                    checked={formData.collegeCredits === option}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          {/* Born Before 2003 */}
          <div className="form-section">
            <h3>Date of birth</h3>
            <p>Were you born before January 1, 2003?</p>
            <div className="radio-group">
              {["Yes", "No"].map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name="bornBefore2003"
                    value={option}
                    checked={formData.bornBefore2003 === option}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          {/* Degree Status */}
          <div className="form-section">
            <h3>Degree status</h3>
            <p>Will you have a degree when you transfer?</p>
            <div className="radio-group vertical">
              {[
                "I will have completed college classes without earning a degree",
                "I will have an associate degree",
                "I will have a bachelor's degree or higher",
              ].map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name="degreeStatus"
                    value={option}
                    checked={formData.degreeStatus === option}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          {/* Community College */}
          <div className="form-section">
            <h3>Community college status</h3>
            <p>Are you currently a community college student?</p>
            <div className="radio-group">
              {["Yes", "No"].map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name="communityCollege"
                    value={option}
                    checked={formData.communityCollege === option}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          {/* Degree Goal */}
          <div className="form-section">
            <h3>Degree goal</h3>
            <p>What is the highest degree you intend to pursue?</p>
            <div className="radio-group vertical">
              {[
                "Bachelor's degree",
                "Graduate or professional degree",
                "Non-degree or certificate",
              ].map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name="degreeGoal"
                    value={option}
                    checked={formData.degreeGoal === option}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          {/* Military Status */}
          <div className="form-section">
            <h3>U.S. Military history status</h3>
            <p>Are you currently serving, have previously served, or are a military dependent?</p>
            <div className="radio-group">
              {["Yes", "No"].map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name="militaryStatus"
                    value={option}
                    checked={formData.militaryStatus === option}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="button-container">
            <button 
              type="button" 
              className="back-btn" 
              onClick={handleBack}
              disabled={loading}
            >
              ← Back to Sign In
            </button>
            <button 
              type="submit" 
              className="save-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtendedProfile;
