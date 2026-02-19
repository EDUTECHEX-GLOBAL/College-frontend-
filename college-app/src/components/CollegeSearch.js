// src/components/CollegeSearch.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CollegeSearch.css";

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const CollegeSearch = ({ onCollegeUpdate }) => {
  const [query, setQuery] = useState("");
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userColleges, setUserColleges] = useState(new Set());
  const [addingCollege, setAddingCollege] = useState(null);
  const [removingCollege, setRemovingCollege] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [filterProgram, setFilterProgram] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [autoFiltered, setAutoFiltered] = useState(false);
  const navigate = useNavigate();

  // Function to trigger college update events
  const triggerCollegeUpdate = () => {
    window.dispatchEvent(new CustomEvent('collegesUpdated'));
    if (onCollegeUpdate) {
      onCollegeUpdate();
    }
  };

  // Fetch student profile
  const fetchStudentProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setStudentProfile(response.data.data);
        console.log("📋 Student profile loaded:", response.data.data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Fetch user's college list
  const fetchUserColleges = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/colleges`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const collegeIds = response.data.colleges.map(college => college.collegeId);
        setUserColleges(new Set(collegeIds));
        console.log("📋 User colleges loaded:", collegeIds.length);
      }
    } catch (error) {
      console.error("Error fetching user colleges:", error);
    }
  };

  // Fetch colleges from database based on profile - AUTO-FILTERS WHEN NO QUERY
  const fetchColleges = async (searchQuery = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('query', searchQuery);
      if (filterProgram) params.append('program', filterProgram);
      if (filterCountry) params.append('country', filterCountry);

      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      console.log('🔍 Fetching colleges with params:', params.toString());
      
      const response = await axios.get(`${API_URL}/api/college-search`, {
        params,
        headers
      });

      if (response.data.success) {
        setColleges(response.data.colleges || []);
        setAutoFiltered(response.data.autoFiltered || false);
        console.log(`📚 Found ${response.data.colleges.length} universities`);
        
        if (response.data.hasProfile) {
          console.log("🎯 Results personalized based on your profile");
          if (response.data.profileUsed) {
            console.log("   Profile used:", response.data.profileUsed);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Please login to get personalized recommendations");
        return;
      }

      setLoading(true);
      const response = await axios.get(`${API_URL}/api/college-search/recommendations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setColleges(response.data.recommendations || []);
        setShowRecommendations(true);
        setAutoFiltered(true);
        console.log("🎯 Recommendations loaded:", response.data.profile);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add college to user's list
  const handleAddCollege = async (college) => {
    try {
      setAddingCollege(college.UNITID);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("Please sign in to add colleges to your list");
        return;
      }

      setUserColleges(prev => new Set([...prev, college.UNITID]));

      const collegePayload = {
        collegeId: college.UNITID,
        collegeData: {
          name: college.INSTNM,
          location: college.CITY,
          state: college.STABBR,
          country: college.COUNTRY,
          programCount: college.programCount,
          matchPercentage: college.matchPercentage
        }
      };

      const response = await axios.post(
        `${API_URL}/api/colleges`,
        collegePayload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        console.log("✅ College added successfully");
      }
      triggerCollegeUpdate();

    } catch (error) {
      console.error("❌ Error adding college:", error);
      
      if (error.response?.status === 409) {
        console.log("ℹ️ College was already in list");
      } else {
        alert("Failed to add college to your list");
        setUserColleges(prev => {
          const newSet = new Set(prev);
          newSet.delete(college.UNITID);
          return newSet;
        });
      }
    } finally {
      setAddingCollege(null);
    }
  };

  // Remove college from user's list
  const handleRemoveCollege = async (college) => {
    try {
      setRemovingCollege(college.UNITID);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("Please sign in to manage your college list");
        return;
      }

      setUserColleges(prev => {
        const newSet = new Set(prev);
        newSet.delete(college.UNITID);
        return newSet;
      });

      await axios.delete(`${API_URL}/api/colleges/${college.UNITID}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log("✅ College removed successfully");
      triggerCollegeUpdate();

    } catch (error) {
      console.error("❌ Error removing college:", error);
      alert("Failed to remove college from your list");
      setUserColleges(prev => new Set([...prev, college.UNITID]));
    } finally {
      setRemovingCollege(null);
    }
  };

  // Navigate to College Details page
  const handleCollegeClick = (college) => {
    const isFirstYear = window.location.pathname.includes('/firstyear/');
    const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';
    
    localStorage.setItem(`college_${college.UNITID}`, JSON.stringify(college));
    localStorage.setItem('currentCollege', JSON.stringify(college));
    
    console.log(`🎓 Navigating to: ${basePath}/college-search/${college.UNITID}`);
    
    navigate(`${basePath}/college-search/${college.UNITID}`, {
      state: { 
        college: college,
        from: 'college-search'
      }
    });
  };

  // Handle View Details button click
  const handleViewDetails = (college) => {
    handleCollegeClick(college);
  };

  // Handle View Programs button click
  const handleViewPrograms = (college) => {
    const isFirstYear = window.location.pathname.includes('/firstyear/');
    const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';
    
    localStorage.setItem(`college_${college.UNITID}`, JSON.stringify(college));
    localStorage.setItem('currentCollege', JSON.stringify(college));
    
    navigate(`${basePath}/college-search/${college.UNITID}/programs`, {
      state: { 
        college: college,
        from: 'college-search'
      }
    });
  };

  // Get match badge color
  const getMatchColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    if (percentage >= 40) return '#f97316';
    return '#6b7280';
  };

  useEffect(() => {
    fetchStudentProfile();
    fetchUserColleges();
    fetchColleges(""); // This will auto-filter based on profile
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchColleges(query);
    }, 400);
    return () => clearTimeout(delay);
  }, [query, filterProgram, filterCountry]);

  return (
    <div className="college-search-container">
      {/* Header with Profile Summary */}
      <div className="college-search-header">
        <div className="header-title-section">
          <h2 className="college-search-title">College Search</h2>
          <div className="college-search-count">{colleges.length} results</div>
        </div>
        
        {studentProfile && (
          <div className="profile-summary-badge">
            <span className="badge-icon">🎓</span>
            <span className="badge-text">
              {studentProfile.eligibleProgram} • {studentProfile.education?.field}
            </span>
          </div>
        )}
      </div>

      {/* Auto-Filter Badge - Shows when profile-based filtering is active */}
      {studentProfile && autoFiltered && !query && (
        <div className="auto-filter-badge">
          <span className="auto-filter-icon">✨</span>
          <span className="auto-filter-text">
            Showing universities matched to your profile
          </span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="search-filters-section">
        <div className="college-search-bar">
          <input
            type="text"
            className="college-search-input"
            placeholder="Search universities by name, city, or country..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select 
            className="filter-select"
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
          >
            <option value="">All Programs</option>
            <option value="Bachelor">Bachelor's</option>
            <option value="Master">Master's</option>
            <option value="PhD">PhD</option>
          </select>

          <select 
            className="filter-select"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
          >
            <option value="">All Countries</option>
            <option value="USA">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="India">India</option>
          </select>

          {studentProfile && (
            <button 
              className={`recommend-btn ${showRecommendations ? 'active' : ''}`}
              onClick={() => {
                if (showRecommendations) {
                  setShowRecommendations(false);
                  fetchColleges(query);
                } else {
                  fetchRecommendations();
                }
              }}
            >
              <span className="recommend-icon">🎯</span>
              {showRecommendations ? 'Show All' : 'Get Recommendations'}
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Finding the best universities for you...</p>
        </div>
      ) : colleges.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No universities found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="college-list">
          {colleges.map((college) => {
            const isAdded = userColleges.has(college.UNITID);
            const isAdding = addingCollege === college.UNITID;
            const isRemoving = removingCollege === college.UNITID;
            const matchPercentage = college.matchPercentage || college.matchScore || 0;

            return (
              <div key={college.UNITID} className="college-list-item modern-card">
                <div className="college-info">
                  <div className="college-logo-small">
                    <img
                      src={college.logo || '/default-university-logo.png'}
                      alt={`${college.INSTNM} logo`}
                      onError={(e) => (e.target.src = '/default-university-logo.png')}
                    />
                  </div>

                  <div className="college-text">
                    <div className="college-name-wrapper">
                      <h4 
                        className="college-name-link clickable"
                        onClick={() => handleCollegeClick(college)}
                      >
                        {college.INSTNM}
                      </h4>
                      <span className="university-type-badge">University</span>
                    </div>
                    
                    <p className="college-location-small">
                      <span className="location-icon">📍</span>
                      {college.CITY}, {college.STABBR} - {college.COUNTRY}
                    </p>
                    
                    {isAdded && (
                      <div className="college-status-badge">
                        ✓ Added to My Colleges
                      </div>
                    )}
                    
                    {college.programCount > 0 && (
                      <div className="college-programs-preview">
                        <span className="programs-count">
                          🎓 {college.programCount} programs available
                        </span>
                      </div>
                    )}

                    {matchPercentage > 0 && (
                      <div className="match-indicator">
                        <div 
                          className="match-badge-small"
                          style={{ backgroundColor: getMatchColor(matchPercentage) }}
                        >
                          {matchPercentage}% Match
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Reasons */}
                {college.matchReasons && college.matchReasons.length > 0 && (
                  <div className="match-reasons-container">
                    {college.matchReasons.map((reason, index) => (
                      <span key={index} className="match-reason-tag">
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="college-actions">
                  <button 
                    className="view-details-button"
                    onClick={() => handleViewDetails(college)}
                  >
                    <span className="button-icon">📋</span>
                    Details
                  </button>

                  <button 
                    className="view-programs-button"
                    onClick={() => handleViewPrograms(college)}
                  >
                    <span className="button-icon">🎓</span>
                    Programs
                  </button>

                  {!isAdded ? (
                    <button 
                      className="add-button"
                      onClick={() => handleAddCollege(college)}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <span className="spinner-small"></span>
                      ) : (
                        <span className="button-icon">+</span>
                      )}
                      {isAdding ? 'Adding...' : 'Add'}
                    </button>
                  ) : (
                    <button 
                      className="remove-button"
                      onClick={() => handleRemoveCollege(college)}
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <span className="spinner-small"></span>
                      ) : (
                        <span className="button-icon">✓</span>
                      )}
                      Added
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Banner */}
      {showRecommendations && studentProfile && (
        <div className="info-banner">
          <div className="info-banner-content">
            <div className="info-icon">🎯</div>
            <div className="info-text">
              <strong>Personalized Recommendations</strong>
              <p>Based on your profile: {studentProfile.eligibleProgram} in {studentProfile.education?.field}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeSearch;