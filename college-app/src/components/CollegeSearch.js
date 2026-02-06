import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CollegeSearch.css";

const API_URL = process.env.REACT_APP_API_BASE_URL;

const CollegeSearch = ({ onCollegeUpdate }) => {
  const [query, setQuery] = useState("");
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userColleges, setUserColleges] = useState(new Set());
  const [addingCollege, setAddingCollege] = useState(null);
  const [removingCollege, setRemovingCollege] = useState(null);
  const navigate = useNavigate();

  // Function to trigger college update events
  const triggerCollegeUpdate = () => {
    window.dispatchEvent(new CustomEvent('collegesUpdated'));
    if (onCollegeUpdate) {
      onCollegeUpdate();
    }
  };

  // Fetch user's college list
  const fetchUserColleges = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/colleges`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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

  // Fetch colleges from search
  const fetchColleges = async (searchQuery = "") => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/college-search`, {
        params: { query: searchQuery },
      });
      setColleges(res.data.colleges || []);
      await fetchUserColleges();
    } catch (error) {
      console.error("Error fetching colleges:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add college to user's list
  const handleAddCollege = async (college, programData = null) => {
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
        collegeData: college
      };

      // Add program data if available
      if (programData) {
        collegePayload.selectedProgram = programData;
      }

      const response = await axios.post(
        `${API_URL}/api/colleges`,
        collegePayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log("✅ College added successfully");
        if (programData) {
          console.log(`Program added: ${programData.program.program_name}`);
        }
      }
      triggerCollegeUpdate();

    } catch (error) {
      console.error("❌ Error adding college:", error);
      
      if (error.response?.status === 409) {
        console.log("ℹ️ College was already in list - UI updated");
      } else {
        alert("Failed to add college to your list");
        setUserColleges(prev => {
          const newSet = new Set(prev);
          newSet.delete(college.UNITID);
          return newSet;
        });
      }
      triggerCollegeUpdate();
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

      const response = await axios.delete(
        `${API_URL}/api/colleges/${college.UNITID}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log("✅ College removed successfully");
      }
      triggerCollegeUpdate();

    } catch (error) {
      console.error("❌ Error removing college:", error);
      alert("Failed to remove college from your list");
      setUserColleges(prev => new Set([...prev, college.UNITID]));
      triggerCollegeUpdate();
    } finally {
      setRemovingCollege(null);
    }
  };

  // Navigate to Courses page for non-Kansas universities
  const handleCollegeClick = (college) => {
    const isKansas = college.INSTNM.toLowerCase().includes('kansas');
    
    if (isKansas) {
      // Kansas universities still use direct add button
      return;
    }
    
    // Determine base path based on current URL
    const isFirstYear = window.location.pathname.includes('/firstyear/');
    const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';
    
    // Store the university data in localStorage for the Courses page to access
    localStorage.setItem(`university_${college.UNITID}`, JSON.stringify(college));
    
    // Also store as current university for immediate access
    localStorage.setItem('currentUniversity', JSON.stringify(college));
    
    console.log(`🎓 Navigating to courses for: ${college.INSTNM} (ID: ${college.UNITID})`);
    console.log("📦 University data stored:", college);
    
    // Navigate to Courses page with university data
    navigate(`${basePath}/courses/${college.UNITID}`, {
      state: {
        university: college
      }
    });
  };

  // Handle View Courses button click
  const handleViewCourses = (college) => {
    handleCollegeClick(college);
  };

  // Handle direct add for Kansas universities
  const handleDirectAdd = async (college) => {
    await handleAddCollege(college);
  };

  // Handle add for GUS universities (when clicking on name)
  const handleAddGusUniversity = async (college) => {
    // For GUS universities, we'll navigate to courses first
    // But if user wants to add without selecting program, we can do that too
    const shouldAdd = window.confirm(
      `Would you like to add ${college.INSTNM} to My Colleges?\n\n` +
      `If you want to select a specific program first, click "View Courses" instead.`
    );
    
    if (shouldAdd) {
      await handleAddCollege(college);
    }
  };

  useEffect(() => {
    fetchUserColleges();
    fetchColleges("");
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchColleges(query);
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="college-search-container">
      {/* Header */}
      <div className="college-search-header">
        <h2 className="college-search-title">College Search</h2>
        <div className="college-search-count">{colleges.length} results</div>
      </div>

      {/* Search input */}
      <div className="college-search-bar">
        <input
          type="text"
          className="college-search-input"
          placeholder="College or City Name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Results */}
      {loading ? (
        <p className="loading-message">Loading colleges...</p>
      ) : colleges.length === 0 ? (
        <p className="empty-message">No colleges found. Try a different search.</p>
      ) : (
        <div className="college-list">
          {colleges.map((college) => {
            const isAdded = userColleges.has(college.UNITID);
            const isKansas = college.INSTNM.toLowerCase().includes('kansas');
            const isAdding = addingCollege === college.UNITID;
            const isRemoving = removingCollege === college.UNITID;

            return (
              <div key={college.UNITID} className="college-list-item">
                <div className="college-info">
                  <div className="college-logo-small">
                    <img
                      src={college.logo}
                      alt={`${college.INSTNM} logo`}
                      onError={(e) => (e.target.src = college.fallbackLogo)}
                    />
                  </div>

                  <div className="college-text">
                    {/* Clickable name for all universities */}
                    <div className="college-name-wrapper">
                      <h4 
                        className={`college-name-link ${isKansas ? 'kansas-university' : 'gus-university'}`}
                        onClick={() => handleCollegeClick(college)}
                      >
                        {college.INSTNM}
                      </h4>
                      {!isKansas && <span className="university-type-badge">GUS Portal</span>}
                    </div>
                    <p className="college-location-small">
                      {college.CITY}, {college.STABBR || college.CITY} - {college.GUS_DATA?.country || 'USA'}
                    </p>
                    {isAdded && (
                      <div className="college-status-badge">
                        ✓ Added to My Colleges
                      </div>
                    )}
                    {!isKansas && college.GUS_DATA?.major_areas && (
                      <div className="college-programs-preview">
                        <span className="programs-count">
                          {college.GUS_DATA.major_areas.reduce((total, area) => 
                            total + (area.specific_programs?.length || 0), 0
                          )} programs available
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buttons - Different logic for Kansas vs other universities */}
                {isKansas ? (
                  // KANSAS: Direct Add/Remove buttons
                  !isAdded ? (
                    <button 
                      className="add-circle-button"
                      onClick={() => handleDirectAdd(college)}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <span className="adding-spinner"></span>
                      ) : (
                        <span className="add-icon">+</span>
                      )}
                      {isAdding ? 'Adding...' : 'Add'}
                    </button>
                  ) : (
                    <button 
                      className="remove-circle-button"
                      onClick={() => handleRemoveCollege(college)}
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <span className="removing-spinner"></span>
                      ) : (
                        <span className="remove-icon">×</span>
                      )}
                      {isRemoving ? 'Removing...' : 'Remove'}
                    </button>
                  )
                ) : (
                  // NON-KANSAS: View Courses or Remove button
                  isAdded ? (
                    <div className="gus-university-buttons">
                      <button 
                        className="view-courses-button"
                        onClick={() => handleViewCourses(college)}
                      >
                        <span className="courses-icon">🎓</span>
                        View Courses
                      </button>
                      <button 
                        className="remove-circle-button small"
                        onClick={() => handleRemoveCollege(college)}
                        disabled={isRemoving}
                        title="Remove from My Colleges"
                      >
                        {isRemoving ? (
                          <span className="removing-spinner"></span>
                        ) : (
                          <span className="remove-icon">×</span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="gus-university-buttons">
                      <button 
                        className="view-courses-button primary"
                        onClick={() => handleViewCourses(college)}
                      >
                        <span className="courses-icon">🎓</span>
                        View Courses
                      </button>
                      <button 
                        className="add-gus-button secondary"
                        onClick={() => handleAddGusUniversity(college)}
                        disabled={isAdding}
                        title="Add university without selecting program"
                      >
                        {isAdding ? (
                          <span className="adding-spinner"></span>
                        ) : (
                          <span className="add-icon">+</span>
                        )}
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Banner for GUS Portal Universities */}
      {colleges.length > 0 && (
        <div className="info-banner">
          <div className="info-banner-content">
            <div className="info-icon">ℹ️</div>
            <div className="info-text">
              <strong>Note:</strong> 
              <ul className="info-list">
                <li>Click on any <span className="gus-highlight">GUS Portal</span> university name or "View Courses" button to see available programs.</li>
                <li>Kansas universities can be added directly using the Add button.</li>
                <li>For GUS universities, you can either view courses first or add the university directly.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeSearch;