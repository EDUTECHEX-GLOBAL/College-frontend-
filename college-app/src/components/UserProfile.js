// src/components/UserProfile.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UserProfile.css";

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const UserProfile = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Get user email and token from localStorage
  const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('studentType') || 'firstyear';

  // Profile image state
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Loading states
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Error state
  const [error, setError] = useState('');

  // Step 1: Basic Student Information
  const [basicInfo, setBasicInfo] = useState({
    fullName: "",
    email: userEmail,
    mobile: "",
    dob: "",
    gender: "",
    nationality: "",
    residence: "",
  });

  // Step 2: Education Background
  const [education, setEducation] = useState({
    qualification: "",
    institution: "",
    field: "",
    year: "",
    cgpa: "",
  });

  // Step 3: Program Eligibility
  const [eligibleProgram, setEligibleProgram] = useState("");
  
  // Step 3: Selected Universities
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  
  // All universities from backend
  const [universities, setUniversities] = useState([]);
  const [filteredUniversities, setFilteredUniversities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch existing profile on component mount
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!token) {
        setFetchingProfile(false);
        return;
      }

      try {
        setFetchingProfile(true);
        const response = await axios.get(`${API_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success && response.data.data) {
          const profile = response.data.data;
          
          // Populate form with existing data
          setBasicInfo(profile.basicInfo || {
            fullName: "",
            email: userEmail,
            mobile: "",
            dob: "",
            gender: "",
            nationality: "",
            residence: "",
          });

          setEducation(profile.education || {
            qualification: "",
            institution: "",
            field: "",
            year: "",
            cgpa: "",
          });

          setEligibleProgram(profile.eligibleProgram || "");
          setSelectedUniversities(profile.selectedUniversities || []);
          
          if (profile.profileImage) {
            setImagePreview(profile.profileImage);
          }

          console.log("✅ Existing profile loaded");
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Error fetching profile:", error);
        }
      } finally {
        setFetchingProfile(false);
      }
    };

    checkExistingProfile();
  }, [token, userEmail]);

  // Check if user has already completed profile (local check)
  useEffect(() => {
    const profileCompleted = localStorage.getItem('profileCompleted') === 'true';
    
    if (profileCompleted && !fetchingProfile) {
      console.log("Profile already completed - redirecting to dashboard");
      navigateToDashboard();
    }
  }, [fetchingProfile]);

  // Fetch all universities on component mount
  useEffect(() => {
    fetchAllUniversities();
  }, []);

  // Filter universities when eligible program or search term changes
  useEffect(() => {
    if (universities.length > 0) {
      filterUniversities();
    }
  }, [eligibleProgram, searchTerm, universities]);

  // Fetch all universities from the working college-search endpoint
  const fetchAllUniversities = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/college-search`, {
        params: { query: "" }
      });
      
      if (response.data.success) {
        console.log("Universities loaded:", response.data.colleges.length);
        setUniversities(response.data.colleges || []);
      }
    } catch (error) {
      console.error("Error fetching universities:", error);
      setError("Failed to load universities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Detect eligible program based on qualification
  const detectProgram = (qualification) => {
    if (qualification === "12th" || qualification === "High School") return "Bachelor";
    if (qualification === "Bachelor" || qualification === "Bachelor's Degree") return "Master";
    if (qualification === "Master" || qualification === "Master's Degree") return "PhD";
    return "";
  };

  // Handle education change
  const handleEducationChange = (e) => {
    const value = e.target.value;
    setEducation({ ...education, qualification: value });
    const program = detectProgram(value);
    setEligibleProgram(program);
  };

  // Filter universities based on eligible program and search
  const filterUniversities = () => {
    let filtered = [...universities];
    
    if (eligibleProgram === "Bachelor") {
      filtered = filtered;
    } else if (eligibleProgram === "Master") {
      filtered = filtered.filter(u => u.GUS_DATA);
    } else if (eligibleProgram === "PhD") {
      filtered = filtered.filter(u => 
        u.INSTNM?.toLowerCase().includes('university') && 
        !u.INSTNM?.toLowerCase().includes('college')
      );
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        (u.INSTNM || '').toLowerCase().includes(term) ||
        (u.CITY || '').toLowerCase().includes(term) ||
        (u.STABBR || '').toLowerCase().includes(term) ||
        (u.GUS_DATA?.country || '').toLowerCase().includes(term)
      );
    }
    
    setFilteredUniversities(filtered);
  };

  // Toggle university selection
  const toggleUniversity = (university) => {
    const isSelected = selectedUniversities.some(u => u.UNITID === university.UNITID);
    
    if (isSelected) {
      setSelectedUniversities(selectedUniversities.filter(u => u.UNITID !== university.UNITID));
    } else if (selectedUniversities.length < 5) {
      setSelectedUniversities([...selectedUniversities, university]);
    }
  };

  // Check if step 1 is valid
  const isStep1Valid = () => {
    return basicInfo.fullName && basicInfo.mobile && basicInfo.dob && 
           basicInfo.gender && basicInfo.nationality && basicInfo.residence;
  };

  // Check if step 2 is valid
  const isStep2Valid = () => {
    return education.qualification && education.institution && 
           education.field && education.year && education.cgpa;
  };

  // Check if step 3 is valid
  const isStep3Valid = () => {
    return selectedUniversities.length >= 3;
  };

  // Navigate to dashboard based on user type
  const navigateToDashboard = () => {
    if (userType === 'transfer') {
      navigate('/transfer/dashboard');
    } else {
      navigate('/firstyear/dashboard');
    }
  };

  // Handle profile image upload to server
  const uploadProfileImage = async () => {
    if (!profileImage || !token) return;

    try {
      const response = await axios.patch(`${API_URL}/api/user/profile/image`, 
        { profileImage: imagePreview },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log("✅ Profile image updated");
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
    }
  };

  // Handle final submit to backend
  const handleSubmitProfile = async () => {
    if (!token) {
      setError("You must be logged in to submit your profile");
      return;
    }

    setSaving(true);
    setError('');

    try {
      // First upload profile image if changed
      if (profileImage) {
        await uploadProfileImage();
      }

      // Prepare profile data
      const profileData = {
        profileImage: imagePreview,
        basicInfo,
        education,
        eligibleProgram,
        selectedUniversities: selectedUniversities.map(u => ({
          id: u.UNITID,
          name: u.INSTNM,
          location: `${u.CITY || ''}, ${u.STABBR || ''}`,
          country: u.GUS_DATA?.country || 'USA'
        })),
        profileCompleted: true,
        completedAt: new Date().toISOString()
      };

      // Send to backend
      const response = await axios.post(`${API_URL}/api/user/profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Save to localStorage as backup
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        localStorage.setItem('profileCompleted', 'true');
        
        console.log("✅ Profile saved to backend successfully");
        
        // Show success message
        alert("Profile submitted successfully! Redirecting to dashboard...");
        
        // Redirect to dashboard
        navigateToDashboard();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      
      let errorMessage = "Failed to save profile. Please try again.";
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Your session has expired. Please login again.";
          // Redirect to login
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.errors) {
          errorMessage = error.response.data.errors.join(', ');
        }
      }
      
      setError(errorMessage);
      
      // Fallback to localStorage if backend fails
      const profileData = {
        profileImage: imagePreview,
        basicInfo,
        education,
        eligibleProgram,
        selectedUniversities: selectedUniversities.map(u => ({
          id: u.UNITID,
          name: u.INSTNM,
          location: `${u.CITY || ''}, ${u.STABBR || ''}`,
          country: u.GUS_DATA?.country || 'USA'
        })),
        completedAt: new Date().toISOString(),
        profileCompleted: true
      };
      
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      localStorage.setItem('profileCompleted', 'true');
      
      console.log("⚠️ Saved profile to localStorage as fallback");
      alert("Profile saved locally! Redirecting to dashboard...");
      
      navigateToDashboard();
    } finally {
      setSaving(false);
    }
  };

  // Handle save progress (for each step)
  const handleSaveProgress = async (nextStep) => {
    if (!token) {
      setStep(nextStep);
      return;
    }

    try {
      const progressData = {
        basicInfo,
        education: step === 1 ? education : undefined,
        selectedUniversities: step === 2 ? selectedUniversities : undefined,
        eligibleProgram
      };

      // You can implement a draft save endpoint if needed
      console.log("Progress saved:", progressData);
    } catch (error) {
      console.error("Error saving progress:", error);
    }

    setStep(nextStep);
  };

  // Handle cancel/back to dashboard
  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Your progress will be lost.")) {
      navigateToDashboard();
    }
  };

  // Get university initials for logo
  const getInitials = (name) => {
    if (!name) return "UNI";
    return name.split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Get program count
  const getProgramCount = (university) => {
    if (university.GUS_DATA?.programs_data) {
      return university.GUS_DATA.programs_data.length;
    }
    if (university.GUS_DATA?.major_areas) {
      return university.GUS_DATA.major_areas.reduce((total, area) => 
        total + (area.specific_programs?.length || 0), 0
      );
    }
    return 0;
  };

  // Get user initials for default avatar
  const getUserInitials = () => {
    if (basicInfo.fullName) {
      return basicInfo.fullName.split(' ')
        .map(name => name[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return userEmail ? userEmail.charAt(0).toUpperCase() : 'U';
  };

  // Show loading state
  if (fetchingProfile) {
    return (
      <div className="profile-wrapper">
        <div className="loading-screen">
          <div className="loading-spinner-large"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      {/* Clean Header with Left Profile Image and Centered Title */}
      <div className="profile-header">
        <div className="header-container">
          <div className="profile-image-wrapper">
            <div className="profile-image-container">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="profile-image" />
              ) : (
                <div className="profile-image-placeholder">
                  <span className="placeholder-initials">{getUserInitials()}</span>
                </div>
              )}
              <label htmlFor="profile-upload" className="image-upload-label">
                <input
                  type="file"
                  id="profile-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-upload-input"
                />
                <span className="upload-icon">+</span>
              </label>
            </div>
          </div>
          
          <div className="header-title-section">
            <h1 className="header-title">Complete Your Profile</h1>
            <p className="header-email">{basicInfo.email}</p>
          </div>

          <button className="header-cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>

      <div className="profile-content">
        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Progress Steps */}
        <div className="progress-container">
          <div className="progress-steps">
            <div className={`step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-number">
                {step > 1 ? '✓' : '1'}
              </div>
              <div className="step-label">Basic Info</div>
            </div>
            <div className={`step-connector ${step > 1 ? 'active' : ''}`}></div>
            
            <div className={`step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-number">
                {step > 2 ? '✓' : '2'}
              </div>
              <div className="step-label">Education</div>
            </div>
            <div className={`step-connector ${step > 2 ? 'active' : ''}`}></div>
            
            <div className={`step-item ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <div className="step-number">
                {step > 3 ? '✓' : '3'}
              </div>
              <div className="step-label">Universities</div>
            </div>
            <div className={`step-connector ${step > 3 ? 'active' : ''}`}></div>
            
            <div className={`step-item ${step === 4 ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">Review</div>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="form-card fade-in">
            <div className="card-header">
              <h2>Personal Information</h2>
              <p>Tell us about yourself</p>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={basicInfo.fullName}
                  onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label>Email ID</label>
                <div className="email-field">
                  <input
                    type="email"
                    value={basicInfo.email}
                    disabled
                    className="disabled-input"
                  />
                  <span className="email-note">Auto-filled from your account</span>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Mobile Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={basicInfo.mobile}
                  onChange={(e) => setBasicInfo({ ...basicInfo, mobile: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  Date of Birth <span className="required">*</span>
                </label>
                <input
                  type="date"
                  placeholder="dd-mm-yyyy"
                  value={basicInfo.dob}
                  onChange={(e) => setBasicInfo({ ...basicInfo, dob: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  Gender <span className="required">*</span>
                </label>
                <select
                  value={basicInfo.gender}
                  onChange={(e) => setBasicInfo({ ...basicInfo, gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Nationality <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Indian, American"
                  value={basicInfo.nationality}
                  onChange={(e) => setBasicInfo({ ...basicInfo, nationality: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label>
                  Country of Residence <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., India, USA, UK"
                  value={basicInfo.residence}
                  onChange={(e) => setBasicInfo({ ...basicInfo, residence: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="continue-btn"
                onClick={() => handleSaveProgress(2)}
                disabled={!isStep1Valid() || saving}
              >
                {saving ? 'Saving...' : 'Continue to Education →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Education Background */}
        {step === 2 && (
          <div className="form-card fade-in">
            <div className="card-header">
              <h2>Education Background</h2>
              <p>Tell us about your academic journey</p>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>
                  Highest Qualification Completed <span className="required">*</span>
                </label>
                <select
                  value={education.qualification}
                  onChange={handleEducationChange}
                >
                  <option value="">Select Qualification</option>
                  <option value="12th">12th / High School</option>
                  <option value="Bachelor">Bachelor's Degree</option>
                  <option value="Master">Master's Degree</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>
                  University / School Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter institution name"
                  value={education.institution}
                  onChange={(e) => setEducation({ ...education, institution: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label>
                  Field of Study <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Computer Science, Business"
                  value={education.field}
                  onChange={(e) => setEducation({ ...education, field: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  Year of Passing <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2023"
                  value={education.year}
                  onChange={(e) => setEducation({ ...education, year: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  Percentage / CGPA <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 85% or 8.5"
                  value={education.cgpa}
                  onChange={(e) => setEducation({ ...education, cgpa: e.target.value })}
                />
              </div>
            </div>

            {eligibleProgram && (
              <div className="eligibility-badge">
                <span className="badge-icon">🎓</span>
                <span>You are eligible for: <strong>{eligibleProgram} Programs</strong></span>
              </div>
            )}

            <div className="form-actions">
              <button className="back-btn" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button 
                className="continue-btn"
                onClick={() => handleSaveProgress(3)}
                disabled={!isStep2Valid() || saving}
              >
                {saving ? 'Saving...' : 'Continue to Universities →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Universities */}
        {step === 3 && (
          <div className="form-card fade-in">
            <div className="card-header">
              <h2>Select Your Universities</h2>
              <p>Choose at least 3 universities that interest you</p>
            </div>

            {eligibleProgram && (
              <div className="program-indicator">
                <span>Showing universities for: <strong>{eligibleProgram} Program</strong></span>
              </div>
            )}

            <div className="university-controls">
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search universities by name, city, country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="selection-counter">
                <span className="counter-number">{selectedUniversities.length}</span>
                <span>/5 selected</span>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading universities...</p>
              </div>
            ) : (
              <div className="universities-grid">
                {filteredUniversities.length > 0 ? (
                  filteredUniversities.map((uni) => {
                    const isSelected = selectedUniversities.some(u => u.UNITID === uni.UNITID);
                    const programCount = getProgramCount(uni);
                    
                    return (
                      <div 
                        key={uni.UNITID} 
                        className={`university-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleUniversity(uni)}
                      >
                        <div className="university-logo">{getInitials(uni.INSTNM)}</div>
                        <div className="university-details">
                          <h4>{uni.INSTNM}</h4>
                          <p>{uni.CITY || ''}, {uni.STABBR || ''}</p>
                          {programCount > 0 && (
                            <span className="program-badge">{programCount} programs</span>
                          )}
                        </div>
                        {isSelected && <span className="check-mark">✓</span>}
                      </div>
                    );
                  })
                ) : (
                  <p className="no-results">No universities found.</p>
                )}
              </div>
            )}

            <div className="form-actions">
              <button className="back-btn" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button 
                className="continue-btn"
                onClick={() => setStep(4)}
                disabled={!isStep3Valid()}
              >
                Continue to Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="form-card fade-in">
            <div className="card-header">
              <h2>Review Your Profile</h2>
              <p>Please verify your information before submitting</p>
            </div>

            <div className="review-section">
              <h3>Personal Information</h3>
              <div className="review-grid">
                <p><strong>Full Name:</strong> {basicInfo.fullName}</p>
                <p><strong>Email:</strong> {basicInfo.email}</p>
                <p><strong>Mobile:</strong> {basicInfo.mobile}</p>
                <p><strong>Date of Birth:</strong> {basicInfo.dob}</p>
                <p><strong>Gender:</strong> {basicInfo.gender}</p>
                <p><strong>Nationality:</strong> {basicInfo.nationality}</p>
                <p><strong>Residence:</strong> {basicInfo.residence}</p>
              </div>
            </div>

            <div className="review-section">
              <h3>Education Background</h3>
              <div className="review-grid">
                <p><strong>Qualification:</strong> {education.qualification}</p>
                <p><strong>Institution:</strong> {education.institution}</p>
                <p><strong>Field:</strong> {education.field}</p>
                <p><strong>Year:</strong> {education.year}</p>
                <p><strong>CGPA:</strong> {education.cgpa}</p>
              </div>
            </div>

            <div className="review-section">
              <h3>Selected Universities ({selectedUniversities.length})</h3>
              <div className="universities-list">
                {selectedUniversities.map((uni, index) => (
                  <p key={uni.UNITID}>{index + 1}. {uni.INSTNM} - {uni.CITY}, {uni.STABBR}</p>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button className="back-btn" onClick={() => setStep(3)}>
                ← Back
              </button>
              <button 
                className="submit-btn" 
                onClick={handleSubmitProfile}
                disabled={saving}
              >
                {saving ? 'Submitting...' : 'Submit Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;