// src/components/CollegeSearch.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CollegeSearch.css";

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// ─── Shared master-level detector (same as Courses.js) ───────────────────────
// Checks a string for any master/postgrad keyword
const MASTER_KEYWORDS = [
  'master', 'msc', 'm.sc', 'mba', 'mtech', 'm.tech', 'ms ',
  'postgraduate', 'post-graduate', 'pg diploma', 'pgdiploma',
  'graduate certificate', 'm.eng', 'meng', 'llm', 'mfa', 'mph',
  'executive master', 'executive mba'
];

const containsMasterKeyword = (str = '') => {
  const lower = str.toLowerCase();
  return MASTER_KEYWORDS.some(kw => lower.includes(kw));
};

// Detect master university using ALL available signals
const detectIsMasterUniversity = (college) => {
  // 1. Explicit flags from backend
  if (college.universityType === 'master') return true;
  if (college.type === 'master')           return true;
  if (college.isMaster === true)           return true;

  // 2. University name itself contains master keyword
  if (containsMasterKeyword(college.INSTNM || '')) return true;

  // 3. Any selected course name or level is master-level
  if (college.selectedCourses?.length > 0) {
    const hasMasterCourse = college.selectedCourses.some(c =>
      containsMasterKeyword(c.title        || '') ||
      containsMasterKeyword(c.name         || '') ||
      containsMasterKeyword(c.program_name || '') ||
      containsMasterKeyword(c.level        || '')
    );
    if (hasMasterCourse) return true;
  }

  // 4. Programs array — if ANY program is master-level
  if (college.programs?.length > 0) {
    const hasMasterProgram = college.programs.some(p =>
      containsMasterKeyword(p.title || '') ||
      containsMasterKeyword(p.name  || '') ||
      containsMasterKeyword(p.level || '')
    );
    if (hasMasterProgram) return true;
  }

  // 5. metadata tag
  if (containsMasterKeyword(college.metadata?.type || '')) return true;

  return false;
};

const CollegeSearch = ({ onCollegeUpdate }) => {
  const [query, setQuery] = useState("");
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userColleges, setUserColleges] = useState(new Set());
  const [addingCollege, setAddingCollege] = useState(null);
  const [removingCollege, setRemovingCollege] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [selectedCoursesSummary, setSelectedCoursesSummary] = useState([]);
  const navigate = useNavigate();

  const triggerCollegeUpdate = () => {
    window.dispatchEvent(new CustomEvent('collegesUpdated'));
    if (onCollegeUpdate) onCollegeUpdate();
  };

  const getInitials = (name) => {
    if (!name) return "UNI";
    return name.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase();
  };

  const isKansasUniversity = (college) =>
    college.INSTNM && college.INSTNM.toLowerCase().includes('kansas');

  // Use the improved detector everywhere
  const isMasterUniversity = (college) => detectIsMasterUniversity(college);

  // ─── Fetch colleges ───────────────────────────────────────────────────────
  const fetchColleges = useCallback(async (searchQuery = "") => {
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
  }, []);

  // ─── Fetch student profile ────────────────────────────────────────────────
  const fetchStudentProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setProfileLoaded(true); return; }
      const response = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success && response.data.data) {
        setStudentProfile(response.data.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error fetching profile:", error);
      }
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  // ─── Fetch user's college list ────────────────────────────────────────────
  const fetchUserColleges = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchStudentProfile();
    fetchUserColleges();
  }, [fetchStudentProfile, fetchUserColleges]);

  useEffect(() => {
    if (!profileLoaded) return;
    fetchColleges(query);
  }, [profileLoaded]);

  useEffect(() => {
    if (!profileLoaded) return;
    const delay = setTimeout(() => { fetchColleges(query); }, 400);
    return () => clearTimeout(delay);
  }, [query, profileLoaded, fetchColleges]);

  // ─── Add college ──────────────────────────────────────────────────────────
  const handleAddCollege = async (college) => {
    try {
      setAddingCollege(college.UNITID);
      const token = localStorage.getItem('token');
      if (!token) { alert("Please sign in"); return; }

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
        console.log("Failed to clear old colleges (continuing)");
      }

      await axios.post(
        `${API_URL}/api/colleges`,
        { collegeId: college.UNITID, collegeData: college },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserColleges(new Set([college.UNITID]));
      triggerCollegeUpdate();
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.message || "Failed to update university");
    } finally {
      setAddingCollege(null);
    }
  };

  // ─── Remove college ───────────────────────────────────────────────────────
  const handleRemoveCollege = async (college) => {
    try {
      setRemovingCollege(college.UNITID);
      const token = localStorage.getItem('token');
      if (!token) { alert("Please sign in to manage your college list"); return; }

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

  // ─── Navigate based on university type ───────────────────────────────────
  const handleCollegeClick = (college) => {
    const isFirstYear = window.location.pathname.includes('/firstyear/');
    const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';

    if (isKansasUniversity(college)) {
      localStorage.setItem('kansasUniversity', JSON.stringify(college));
      localStorage.setItem('currentUniversity', JSON.stringify(college));
      navigate(`${basePath}/application/overview`, { state: { university: college } });
      return;
    }

    const enhancedCollege = {
      ...college,
      programs: college.programs || [],
      fullData: college.fullData || college
    };
    localStorage.setItem(`university_${college.UNITID}`, JSON.stringify(enhancedCollege));
    localStorage.setItem('currentUniversity', JSON.stringify(enhancedCollege));

    if (enhancedCollege.selectedCourses?.length > 0) {
      localStorage.setItem(
        `university_courses_${college.UNITID}`,
        JSON.stringify(enhancedCollege.selectedCourses)
      );
    }

    if (isMasterUniversity(college)) {
      navigate(`${basePath}/courses/${college.UNITID}`, {
        state: {
          university: enhancedCollege,
          selectedCourses: enhancedCollege.selectedCourses || [],
          isMasterUniversity: true
        }
      });
    } else {
      navigate(`${basePath}/courses/${college.UNITID}`, {
        state: {
          university: enhancedCollege,
          selectedCourses: enhancedCollege.selectedCourses || [],
          isMasterUniversity: false
        }
      });
    }
  };

  const handleViewCourses       = (college) => handleCollegeClick(college);
  const handleDirectAdd         = async (college) => await handleAddCollege(college);
  const handleAddGusUniversity  = async (college) => {
    const shouldAdd = window.confirm(
      `Would you like to add ${college.INSTNM} to My Colleges?\n\n` +
      `If you want to select a specific program first, click "View Courses" instead.`
    );
    if (shouldAdd) await handleAddCollege(college);
  };

  // SVG Icon Components
  const PlusIcon = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );

  const XIcon = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
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
          disabled={colleges.length === 0 && !loading}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="collegesearch-loading-message">Loading your selected universities...</div>
      ) : profileMessage ? (
        <div className="collegesearch-empty-message">{profileMessage}</div>
      ) : colleges.length === 0 ? (
        <div className="collegesearch-empty-message">
          {!studentProfile
            ? "Please complete your profile to see university recommendations."
            : studentProfile?.selectedUniversities?.length === 0
            ? "You haven't selected any universities in your profile yet."
            : "No universities match your search."}
        </div>
      ) : (
        <div className="collegesearch-list">
          {colleges.map((college) => {
            const isAdded    = userColleges.has(college.UNITID);
            const isAdding   = addingCollege  === college.UNITID;
            const isRemoving = removingCollege === college.UNITID;
            const isKansas   = isKansasUniversity(college);
            const isMaster   = isMasterUniversity(college);
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
                      <h4
                        className={`collegesearch-name-link ${
                          isKansas ? 'kansas-university' :
                          isMaster ? 'master-university' :
                          'gus-university'
                        }`}
                        onClick={() => handleCollegeClick(college)}
                        style={{ cursor: 'pointer' }}
                      >
                        {college.INSTNM}
                      </h4>
                      {isKansas && (
                        <span className="collegesearch-type-badge kansas-badge">Kansas</span>
                      )}
                      {isMaster && !isKansas && (
                        <span className="collegesearch-type-badge master-badge">Master Portal</span>
                      )}
                      {!isKansas && !isMaster && (
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

                    {college.selectedCourses?.length > 0 && (
                      <div className="collegesearch-selected-courses">
                        <span className="collegesearch-courses-label">Your courses: </span>
                        {college.selectedCourses.map((c, i) => (
                          <span key={i} className="collegesearch-course-tag">
                            {c.title || c.name || c.program_name || 'Course'}
                          </span>
                        ))}
                      </div>
                    )}

                    {isAdded && (
                      <div className="collegesearch-status-badge">Added to My Colleges</div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}

                {/* Kansas */}
                {isKansas && (
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
                          {isAdding ? <span className="collegesearch-adding-spinner"></span> : <PlusIcon />}
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
                        <span className="collegesearch-remove-icon">
                          {isRemoving ? <span className="collegesearch-removing-spinner"></span> : <XIcon />}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Master university */}
                {isMaster && !isKansas && (
                  isAdded ? (
                    <div className="collegesearch-gus-buttons">
                      <button
                        className="collegesearch-view-courses-button master-btn"
                        onClick={() => handleViewCourses(college)}
                      >
                        View Master Courses
                      </button>
                      <button
                        className="collegesearch-remove-circle-button small"
                        onClick={() => handleRemoveCollege(college)}
                        disabled={isRemoving}
                        title="Remove from My Colleges"
                      >
                        <span className="collegesearch-remove-icon">
                          {isRemoving ? <span className="collegesearch-removing-spinner"></span> : <XIcon />}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="collegesearch-gus-buttons">
                      <button
                        className="collegesearch-view-courses-button master-btn primary"
                        onClick={() => handleViewCourses(college)}
                      >
                        View Master Courses
                      </button>
                      <button
                        className="collegesearch-add-gus-button secondary"
                        onClick={() => handleAddGusUniversity(college)}
                        disabled={isAdding}
                        title="Add university without selecting program"
                      >
                        <span className="collegesearch-add-icon">
                          {isAdding ? <span className="collegesearch-adding-spinner"></span> : <PlusIcon />}
                        </span>
                      </button>
                    </div>
                  )
                )}

                {/* GUS / regular university */}
                {!isKansas && !isMaster && (
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
                        <span className="collegesearch-remove-icon">
                          {isRemoving ? <span className="collegesearch-removing-spinner"></span> : <XIcon />}
                        </span>
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
                        <span className="collegesearch-add-icon">
                          {isAdding ? <span className="collegesearch-adding-spinner"></span> : <PlusIcon />}
                        </span>
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