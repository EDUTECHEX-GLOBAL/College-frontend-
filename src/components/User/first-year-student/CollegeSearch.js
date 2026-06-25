// src/components/CollegeSearch.js
import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from "react-router-dom";
import "./CollegeSearch.css";



// ─── Shared master-level detector (same as Courses.js) ───────────────────────
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

// ─── Resolve university ID from ALL possible field names ─────────────────────
const resolveUniversityId = (college) =>
  college.UNITID   ||
  college.unitid   ||
  college.UNIT_ID  ||
  college.unit_id  ||
  college._id      ||
  college.id       ||
  null;

const getUniversityLocation = (college = {}) => {
  const cityValue = college.CITY || college.city || "";
  const city = cityValue && cityValue !== "Location not specified" ? cityValue : "";
  const state = college.STABBR || college.state || "";
  const rawCountry =
    college.COUNTRY ||
    college.country ||
    college.location?.country ||
    college.fullData?.country ||
    college.selectedUniversityData?.country ||
    "";
  const country = rawCountry === "Unknown" ? "" : rawCountry;

  const parts = [city, state, country].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Location not specified";
};

// Detect master university using ALL available signals
const detectIsMasterUniversity = (college) => {
  if (college.universityType === 'master') return true;
  if (college.type           === 'master') return true;
  if (college.isMaster       === true)     return true;

  if (containsMasterKeyword(college.INSTNM || '')) return true;

  if (college.selectedCourses?.length > 0) {
    const hasMasterCourse = college.selectedCourses.some(c =>
      containsMasterKeyword(c.title        || '') ||
      containsMasterKeyword(c.name         || '') ||
      containsMasterKeyword(c.program_name || '') ||
      containsMasterKeyword(c.level        || '')
    );
    if (hasMasterCourse) return true;
  }

  if (college.programs?.length > 0) {
    const hasMasterProgram = college.programs.some(p =>
      containsMasterKeyword(p.title || '') ||
      containsMasterKeyword(p.name  || '') ||
      containsMasterKeyword(p.level || '')
    );
    if (hasMasterProgram) return true;
  }

  if (containsMasterKeyword(college.metadata?.type || '')) return true;

  return false;
};

const normalizeProgramLevel = (value = '') => value.toString().trim().toLowerCase();

const CollegeSearch = ({ onCollegeUpdate }) => {
  const [query,                setQuery]                = useState("");
  const [colleges,             setColleges]             = useState([]);
  const [loading,              setLoading]              = useState(false);
  const [userColleges,         setUserColleges]         = useState(new Set());
  const [addingCollege,        setAddingCollege]        = useState(null);
  const [removingCollege,      setRemovingCollege]      = useState(null);
  const [studentProfile,       setStudentProfile]       = useState(null);
  const [profileLoaded,        setProfileLoaded]        = useState(false);
  const [profileMessage,       setProfileMessage]       = useState("");
 
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

  const getProfileProgramLevel = (college = {}) => {
    const eligibleProgram = normalizeProgramLevel(
      studentProfile?.eligibleProgram ||
      college.studentProfile?.eligibleProgram ||
      college.profileUsed?.program ||
      college.profile?.program ||
      ''
    );
    const programType = normalizeProgramLevel(
      studentProfile?.programType ||
      college.studentProfile?.programType ||
      college.profileUsed?.programType ||
      college.profile?.programType ||
      ''
    );

    if (eligibleProgram === 'bachelor' || programType === 'ug') return 'UG';
    if (eligibleProgram === 'master' || programType === 'pg') return 'PG';
    return '';
  };

  const isMasterUniversity = (college) => {
    const profileProgramLevel = getProfileProgramLevel(college);
    if (profileProgramLevel === 'UG') return false;
    if (profileProgramLevel === 'PG') return true;
    return detectIsMasterUniversity(college);
  };

  const isProfileMaster =
    studentProfile?.eligibleProgram === 'Master' ||
    studentProfile?.programType === 'PG';

  const isProfileBachelor =
    studentProfile?.eligibleProgram === 'Bachelor' ||
    studentProfile?.programType === 'UG';

  const getPortalIsMaster = (college) => {
    if (studentProfile) {
      if (isProfileMaster) return true;
      if (isProfileBachelor) return false;
      return false;
    }
    return isMasterUniversity(college);
  };

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

const response = await axiosInstance.get('/api/college-search', { params });
if (response.data.success) {

  // ✅ FIX: support both API structures
  const sourceData =
    (response.data.colleges && response.data.colleges.length > 0)
      ? response.data.colleges
      : (response.data.selectedUniversities || []);

  const fetchedColleges = sourceData.map((college) => {
    const resolvedId =
      college.UNITID ||
      college.unitid ||
      college.UNIT_ID ||
      college.unit_id ||
      college._id ||
      college.id;

    return {
      ...college,

      // ✅ Ensure ID is always present
      UNITID: resolvedId,

      // ✅ FIX: correct name mapping (this was your main bug)
  INSTNM:
  college.INSTNM ||
  college.name ||
  college.universityName ||
  college.university ||   // ✅ ADD THIS
  "Unknown University",

      // ✅ Better country fallback
      COUNTRY:
        college.COUNTRY ||
        college.country ||
        college.location?.country ||
        college.fullData?.country ||
        college.selectedUniversityData?.country ||
        "",

      // ✅ Optional: normalize city/state (prevents UI issues)
      CITY: college.CITY || college.city || "",
      STABBR: college.STABBR || college.state || "",
      profileUsed: response.data.profileUsed || college.profileUsed || null,
    };
  });

  setColleges(fetchedColleges);



  if (response.data.message) {
    setProfileMessage(response.data.message);
  }
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
    const response = await axiosInstance.get('/api/user/profile');
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
     const response = await axiosInstance.get('/api/colleges');
      if (response.data.success) {
        const collegeIds = response.data.colleges.map(c => c.collegeId);
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
  const delay = setTimeout(() => {
    fetchColleges(query); 
  }, query ? 400 : 0);

  return () => clearTimeout(delay);
}, [query, profileLoaded, fetchColleges]);

  // ─── Add college ──────────────────────────────────────────────────────────
  const handleAddCollege = async (college) => {
    // ── FIX: resolve ID from all possible field names ──
    const collegeId = resolveUniversityId(college);

    if (!collegeId) {
      console.error('❌ Cannot add college — no ID found:', college);
      alert('This university is missing an ID. Please contact support.');
      return;
    }

    try {
      setAddingCollege(collegeId);
      const token = localStorage.getItem('token');
      if (!token) { alert("Please sign in"); return; }

      // Clear existing colleges first
      try {
       const existing = await axiosInstance.get('/api/colleges');
        if (existing.data?.colleges?.length > 0) {
          for (const c of existing.data.colleges) {
         await axiosInstance.delete(`/api/colleges/${c.collegeId}`);
          }
        }
      } catch (err) {
        console.log("Failed to clear old colleges (continuing)");
      }
await axiosInstance.post('/api/colleges', {
  collegeId,
  collegeData: {
    ...college,
    UNITID:  String(collegeId),
    INSTNM:  college.INSTNM || college.universityName || college.name || 'Unknown University',
    CITY:    college.CITY   || college.city   || '',
    STABBR:  college.STABBR || college.state  || '',
    COUNTRY: college.COUNTRY|| college.country|| college.location?.country || college.fullData?.country || '',
    WEBADDR: college.WEBADDR|| college.website|| '',
  },
  selectedCourses: college.selectedCourses || [],
});

      setUserColleges(new Set([collegeId]));
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
    // ── FIX: resolve ID from all possible field names ──
    const collegeId = resolveUniversityId(college);

    if (!collegeId) {
      console.error('❌ Cannot remove college — no ID found:', college);
      alert('This university is missing an ID. Please contact support.');
      return;
    }

    try {
      setRemovingCollege(collegeId);
      const token = localStorage.getItem('token');
      if (!token) { alert("Please sign in to manage your college list"); return; }

      setUserColleges(prev => {
        const newSet = new Set(prev);
        newSet.delete(collegeId);
        return newSet;
      });

    await axiosInstance.delete(`/api/colleges/${collegeId}`);
      triggerCollegeUpdate();
    } catch (error) {
      console.error("Error removing college:", error);
      alert("Failed to remove college from your list");
      setUserColleges(prev => new Set([...prev, collegeId]));
    } finally {
      setRemovingCollege(null);
    }
  };

  // ─── Navigate to courses page ─────────────────────────────────────────────
  const handleCollegeClick = (college) => {
    const isFirstYear = window.location.pathname.includes('/firstyear/');
    const basePath    = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';

    // ── FIX: resolve ID from all possible field names ──
    const universityId = resolveUniversityId(college);

    if (!universityId) {
      console.error('❌ Cannot navigate to courses — university has no ID:', college);
      alert('This university is missing an ID. Please contact support.');
      return;
    }

    // Kansas — go straight to application overview
    if (isKansasUniversity(college)) {
      const kansasCollege = { ...college, UNITID: universityId };
      localStorage.setItem('kansasUniversity',  JSON.stringify(kansasCollege));
      localStorage.setItem('currentUniversity', JSON.stringify(kansasCollege));
      navigate(`${basePath}/application/overview`, {
        state: { university: kansasCollege }
      });
      return;
    }

    // Build enhanced college object — always with a normalised UNITID
    const enhancedCollege = {
      ...college,
      UNITID:   universityId,          // ← ensures Courses.js always finds the ID
      programs: college.programs || [],
      fullData: college.fullData || college
    };

    // Persist to localStorage so Courses.js can load without navigation state
    localStorage.setItem(`university_${universityId}`, JSON.stringify(enhancedCollege));
    localStorage.setItem('currentUniversity',          JSON.stringify(enhancedCollege));

    if (enhancedCollege.selectedCourses?.length > 0) {
      localStorage.setItem(
        `university_courses_${universityId}`,
        JSON.stringify(enhancedCollege.selectedCourses)
      );
    }

    // Navigate — both master and non-master use the same navigate call
    navigate(`${basePath}/courses/${universityId}`, {
      state: {
        university:         enhancedCollege,
        selectedCourses:    enhancedCollege.selectedCourses || [],
        isMasterUniversity: isProfileMaster
      }
    });
  };

  const handleViewCourses      = (college) => handleCollegeClick(college);
  const handleDirectAdd        = async (college) => await handleAddCollege(college);
  const handleAddGusUniversity = async (college) => {
    const shouldAdd = window.confirm(
      `Would you like to add ${college.INSTNM} to My Colleges?\n\n` +
      `If you want to select a specific program first, click "View Courses" instead.`
    );
    if (shouldAdd) await handleAddCollege(college);
  };

  // ─── SVG Icons ────────────────────────────────────────────────────────────
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
            // ── FIX: use resolveUniversityId for all per-card comparisons ──
            const resolvedId = resolveUniversityId(college);

            const isAdded    = userColleges.has(resolvedId);
            const isAdding   = addingCollege   === resolvedId;
            const isRemoving = removingCollege  === resolvedId;
            const isKansas   = isKansasUniversity(college);
            const isMaster   = getPortalIsMaster(college);
            const initials   = getInitials(college.INSTNM);
           const selectedCourseCount = college.selectedCourses?.length || 0;
const programCount = selectedCourseCount || college.programCount || college.programs?.length || 0;

            return (
              <div key={resolvedId || college.INSTNM} className="collegesearch-list-item">

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
                        <span className="collegesearch-type-badge">Bachelor Portal</span>
                      )}
                    </div>

                    <p className="collegesearch-location-small">
                      {getUniversityLocation(college)}
                    </p>

                    {!isKansas && programCount > 0 && (
                      <div className="collegesearch-programs-preview">
                        <span className="collegesearch-programs-count">
           {selectedCourseCount > 0
  ? `${selectedCourseCount} selected course${selectedCourseCount !== 1 ? 's' : ''}`
  : `${programCount} program${programCount !== 1 ? 's' : ''} available`}
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

                {/* ── Action Buttons ── */}

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
                          {isAdding
                            ? <span className="collegesearch-adding-spinner"></span>
                            : <PlusIcon />}
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
                          {isRemoving
                            ? <span className="collegesearch-removing-spinner"></span>
                            : <XIcon />}
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
                          {isRemoving
                            ? <span className="collegesearch-removing-spinner"></span>
                            : <XIcon />}
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
                          {isAdding
                            ? <span className="collegesearch-adding-spinner"></span>
                            : <PlusIcon />}
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
                          {isRemoving
                            ? <span className="collegesearch-removing-spinner"></span>
                            : <XIcon />}
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
                          {isAdding
                            ? <span className="collegesearch-adding-spinner"></span>
                            : <PlusIcon />}
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
