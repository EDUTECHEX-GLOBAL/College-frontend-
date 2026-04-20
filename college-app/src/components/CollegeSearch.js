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
  const [profileMessage, setProfileMessage] = useState("");
  const [selectedCoursesSummary, setSelectedCoursesSummary] = useState([]);
  const navigate = useNavigate();

  // Trigger college update events
  const triggerCollegeUpdate = () => {
    window.dispatchEvent(new CustomEvent('collegesUpdated'));
    if (onCollegeUpdate) onCollegeUpdate();
  };

  // Get initials for logo placeholder
  const getInitials = (name) => {
    if (!name) return "UNI";
    return name.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase();
  };

  // ─── Fetch student profile ────────────────────────────────────────────────────
  const fetchStudentProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setStudentProfile(response.data.data);
        if (response.data.data.selectedUniversities?.length > 0) {
          fetchColleges("");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // ─── Fetch user's college list ────────────────────────────────────────────────
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
      }
    } catch (error) {
      console.error("Error fetching user colleges:", error);
    }
  };

  // ─── Fetch colleges ───────────────────────────────────────────────────────────
  const fetchColleges = async (searchQuery = "") => {
    setLoading(true);
    setProfileMessage("");
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setProfileMessage("Please login to view universities");
        setLoading(false);
        return;
      }
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (filterProgram) params.append('program', filterProgram);
      if (filterCountry) params.append('country', filterCountry);

      const response = await axios.get(`${API_URL}/api/college-search`, {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setColleges(response.data.colleges || []);
        if (response.data.selectedCoursesSummary) {
          setSelectedCoursesSummary(response.data.selectedCoursesSummary);
        }
        if (response.data.message) setProfileMessage(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
      setProfileMessage("Failed to load universities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Add college ──────────────────────────────────────────────────────────────
 const handleAddCollege = async (college, programData = null) => {
  try {
    setAddingCollege(college.UNITID);

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please sign in");
      return;
    }

    // ✅ STEP 1: REMOVE existing colleges first
    try {
      const existing = await axios.get(`${API_URL}/api/colleges`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (existing.data?.colleges?.length > 0) {
        for (const c of existing.data.colleges) {
          await axios.delete(`${API_URL}/api/colleges/${c.collegeId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
    } catch (err) {
      console.log("⚠️ Failed to clear old colleges (continuing)");
    }

    // ✅ STEP 2: Add new college
    const response = await axios.post(
      `${API_URL}/api/colleges`,
      {
        collegeId: college.UNITID,
        collegeData: college
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log("✅ New college added");

    // ✅ Update UI
    setUserColleges(new Set([college.UNITID]));
    triggerCollegeUpdate();

  } catch (error) {
    console.error("❌ Error:", error);

    alert(
      error.response?.data?.message || "Failed to update university"
    );
  } finally {
    setAddingCollege(null);
  }
};
  // ─── Remove college ───────────────────────────────────────────────────────────
  const handleRemoveCollege = async (college) => {
    try {
      setRemovingCollege(college.UNITID);
      const token = localStorage.getItem('token');
      if (!token) { alert("Please sign in to manage your college list"); return; }

      // Optimistic update
      setUserColleges(prev => {
        const newSet = new Set(prev);
        newSet.delete(college.UNITID);
        return newSet;
      });

      await axios.delete(`${API_URL}/api/colleges/${college.UNITID}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      triggerCollegeUpdate();
    } catch (error) {
      console.error("Error removing college:", error);
      alert("Failed to remove college from your list");
      setUserColleges(prev => new Set([...prev, college.UNITID]));
    } finally {
      setRemovingCollege(null);
    }
  };

  // ─── Navigate to application overview (Kansas) ────────────────────────────────
  // FIX: store university in localStorage so Overview can read it as fallback,
  //      then navigate with state.
  const handleCollegeClick = (college) => {
    const isKansas = college.INSTNM && college.INSTNM.toLowerCase().includes('kansas');

    if (isKansas) {
      const isFirstYear = window.location.pathname.includes('/firstyear/');
      const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';

      // Store so Overview has fallback even if state is lost on refresh
      localStorage.setItem('kansasUniversity', JSON.stringify(college));
      localStorage.setItem('currentUniversity', JSON.stringify(college));

      navigate(`${basePath}/application/overview`, {
        state: { university: college }
      });
      return;
    }

    // GUS universities — navigate to courses
    const isFirstYear = window.location.pathname.includes('/firstyear/');
    const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';

    const enhancedCollege = {
      ...college,
      programs: college.programs || [],
      fullData: college.fullData || college
    };

    localStorage.setItem(`university_${college.UNITID}`, JSON.stringify(enhancedCollege));
    localStorage.setItem('currentUniversity', JSON.stringify(enhancedCollege));

    if (enhancedCollege.selectedCourses && enhancedCollege.selectedCourses.length > 0) {
      localStorage.setItem(`university_courses_${college.UNITID}`, JSON.stringify(enhancedCollege.selectedCourses));
    }

    navigate(`${basePath}/courses/${college.UNITID}`, {
      state: {
        university: enhancedCollege,
        selectedCourses: enhancedCollege.selectedCourses || []
      }
    });
  };

  const handleViewCourses = (college) => handleCollegeClick(college);
  const handleDirectAdd = async (college) => await handleAddCollege(college);

  const handleAddGusUniversity = async (college) => {
    const shouldAdd = window.confirm(
      `Would you like to add ${college.INSTNM} to My Colleges?\n\n` +
      `If you want to select a specific program first, click "View Courses" instead.`
    );
    if (shouldAdd) await handleAddCollege(college);
  };

  // ─── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStudentProfile();
    fetchUserColleges();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (studentProfile && studentProfile.selectedUniversities?.length > 0) {
        fetchColleges(query);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [query, filterProgram, filterCountry]);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="collegesearch-container">

      {/* Header */}
      <div className="collegesearch-header">
        <h1 className="collegesearch-title">My Selected Universities</h1>
        <div className="collegesearch-count">
          {colleges.length} {colleges.length === 1 ? 'College' : 'Colleges'}
        </div>
      </div>

      {/* Search */}
      <div className="collegesearch-bar">
        <input
          type="text"
          className="collegesearch-input"
          placeholder="Search your selected universities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={colleges.length === 0}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="collegesearch-loading-message">Loading your selected universities...</div>
      ) : colleges.length === 0 ? (
        <div className="collegesearch-empty-message">
          {studentProfile?.selectedUniversities?.length === 0
            ? "You haven't selected any universities in your profile yet."
            : "No universities match your current filters."}
        </div>
      ) : (
        <div className="collegesearch-list">
          {colleges.map((college) => {
            const isAdded    = userColleges.has(college.UNITID);
            const isAdding   = addingCollege === college.UNITID;
            const isRemoving = removingCollege === college.UNITID;
            const isKansas   = college.INSTNM && college.INSTNM.toLowerCase().includes('kansas');
            const initials   = getInitials(college.INSTNM);
            const programCount = college.programs?.length || college.programCount || 0;

            return (
              <div key={college.UNITID || college._id} className="collegesearch-list-item">

                {/* Info */}
                <div className="collegesearch-info">
                  <div className="collegesearch-logo-small">
                    {college.logo && !college.logo.includes('ui-avatars') ? (
                      <img
                        src={college.logo}
                        alt={college.INSTNM}
                        onError={(e) => { e.target.onerror = null; e.target.src = '/default-university-logo.png'; }}
                      />
                    ) : (
                      <div className="collegesearch-logo-initials">{initials}</div>
                    )}
                  </div>

                  <div className="collegesearch-text">
                    <div className="collegesearch-name-wrapper">
                      {/* FIX: cursor always pointer — Kansas name click navigates to overview */}
                      <h4
                        className={`collegesearch-name-link ${isKansas ? 'kansas-university' : 'gus-university'}`}
                        onClick={() => handleCollegeClick(college)}
                        style={{ cursor: 'pointer' }}
                      >
                        {college.INSTNM}
                      </h4>
                      {!isKansas && (
                        <span className="collegesearch-type-badge">GUS Portal</span>
                      )}
                    </div>

                    <p className="collegesearch-location-small">
                      {college.CITY || ''}{college.CITY && college.STABBR ? ', ' : ''}{college.STABBR || ''} - {college.COUNTRY || 'USA'}
                    </p>

                    {!isKansas && programCount > 0 && (
                      <div className="collegesearch-programs-preview">
                        <span className="collegesearch-programs-count">
                          {programCount} program{programCount !== 1 ? 's' : ''} available
                        </span>
                      </div>
                    )}

                    {isAdded && (
                      <div className="collegesearch-status-badge">Added to My Colleges</div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isKansas ? (
                  // FIX: Kansas always shows "Go to Application" + Add/Remove
                  <div className="collegesearch-gus-buttons">
                    <button
                      className="collegesearch-view-courses-button"
                      onClick={() => handleCollegeClick(college)}
                    >
                      Go to Application
                    </button>
                    {!isAdded ? (
                      <button
                        className="collegesearch-add-circle-button"
                        onClick={() => handleDirectAdd(college)}
                        disabled={isAdding}
                        title="Add to My Colleges"
                      >
                        <span className="collegesearch-add-icon">
                          {isAdding ? <span className="collegesearch-adding-spinner"></span> : '+'}
                        </span>
                        {isAdding ? 'Adding...' : 'Add'}
                      </button>
                    ) : (
                      <button
                        className="collegesearch-remove-circle-button small"
                        onClick={() => handleRemoveCollege(college)}
                        disabled={isRemoving}
                        title="Remove from My Colleges"
                      >
                        {isRemoving
                          ? <span className="collegesearch-removing-spinner"></span>
                          : <span style={{ fontSize: '18px' }}>x</span>
                        }
                      </button>
                    )}
                  </div>
                ) : (
                  // GUS universities — unchanged
                  isAdded ? (
                    <div className="collegesearch-gus-buttons">
                      <button
                        className="collegesearch-view-courses-button"
                        onClick={() => handleViewCourses(college)}
                      >
                        View Courses
                      </button>
                      <button
                        className="collegesearch-remove-circle-button small"
                        onClick={() => handleRemoveCollege(college)}
                        disabled={isRemoving}
                        title="Remove from My Colleges"
                      >
                        {isRemoving
                          ? <span className="collegesearch-removing-spinner"></span>
                          : <span style={{ fontSize: '18px' }}>x</span>
                        }
                      </button>
                    </div>
                  ) : (
                    <div className="collegesearch-gus-buttons">
                      <button
                        className="collegesearch-view-courses-button primary"
                        onClick={() => handleViewCourses(college)}
                      >
                        View Courses
                      </button>
                      <button
                        className="collegesearch-add-gus-button secondary"
                        onClick={() => handleAddGusUniversity(college)}
                        disabled={isAdding}
                        title="Add university without selecting program"
                      >
                        {isAdding
                          ? <span className="collegesearch-adding-spinner"></span>
                          : <span style={{ fontSize: '18px' }}>+</span>
                        }
                      </button>
                    </div>
                  )
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default CollegeSearch;