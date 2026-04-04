// src/components/CollegeSearch.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CollegeSearch.css";

const API_URL = process.env.REACT_APP_API_BASE_URL ;

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
  const [profileMessage, setProfileMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);
  const [selectedCoursesSummary, setSelectedCoursesSummary] = useState([]);
  const [expandedUniversities, setExpandedUniversities] = useState(new Set());
  const navigate = useNavigate();

  // Function to trigger college update events
  const triggerCollegeUpdate = () => {
    window.dispatchEvent(new CustomEvent('collegesUpdated'));
    if (onCollegeUpdate) {
      onCollegeUpdate();
    }
  };

  // Toggle expanded state for university courses
  const toggleExpandUniversity = (universityId) => {
    setExpandedUniversities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(universityId)) {
        newSet.delete(universityId);
      } else {
        newSet.add(universityId);
      }
      return newSet;
    });
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
        
        // After loading profile, fetch colleges
        if (response.data.data.selectedUniversities?.length > 0) {
          fetchColleges("");
        }
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

  // Fetch colleges from database based on profile
  const fetchColleges = async (searchQuery = "") => {
    setLoading(true);
    setProfileMessage("");
    setDebugInfo(null);
    
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

      const headers = { 'Authorization': `Bearer ${token}` };

      console.log('🔍 Fetching selected universities with params:', params.toString());
      
      const response = await axios.get(`${API_URL}/api/college-search`, {
        params,
        headers
      });

      console.log('📥 College search response:', response.data);

      if (response.data.success) {
        setColleges(response.data.colleges || []);
        
        // Store selected courses summary if available
        if (response.data.selectedCoursesSummary) {
          setSelectedCoursesSummary(response.data.selectedCoursesSummary);
        }
        
        if (response.data.message) {
          setProfileMessage(response.data.message);
        }
        
        if (response.data.debug) {
          setDebugInfo(response.data.debug);
          console.log('🔍 Debug info:', response.data.debug);
        }
        
        console.log(`📚 Found ${response.data.colleges.length} universities from your selected list`);
        
        // Log courses and programs for each university
        response.data.colleges.forEach((uni, index) => {
          if (uni.selectedCourses && uni.selectedCourses.length > 0) {
            console.log(`   ${index + 1}. ${uni.INSTNM} - ${uni.selectedCourses.length} courses selected:`);
            uni.selectedCourses.forEach((course, idx) => {
              console.log(`      - ${course.title || course.program_name} (${course.level || 'N/A'})`);
            });
          }
          
          // Log programs count if available
          if (uni.programs && uni.programs.length > 0) {
            console.log(`   ${uni.INSTNM} has ${uni.programs.length} total programs available`);
          } else if (uni.isKansas) {
            console.log(`   ${index + 1}. ${uni.INSTNM} - Kansas University (Direct Apply)`);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
      setProfileMessage("Failed to load universities. Please try again.");
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
      setProfileMessage("");

      const response = await axios.get(`${API_URL}/api/college-search/recommendations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setColleges(response.data.recommendations || []);
        setShowRecommendations(true);
        
        if (response.data.message) {
          setProfileMessage(response.data.message);
        }
        
        console.log("🎯 Recommendations loaded:", response.data.profile);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Add college to user's list - Now matches backend expectations
  const handleAddCollege = async (college, programData = null) => {
    try {
      setAddingCollege(college.UNITID);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("Please sign in to add colleges to your list");
        return;
      }

      // Optimistically update UI
      setUserColleges(prev => new Set([...prev, college.UNITID]));

      // Format the college data to match what backend expects (FirstCollege model)
      const collegePayload = {
        collegeId: college.UNITID,
        collegeData: {
          // Required fields that the backend expects
          UNITID: college.UNITID,
          INSTNM: college.INSTNM,
          IALIAS: college.IALIAS || '',
          CITY: college.CITY || '',
          STABBR: college.STABBR || '',
          ZIP: college.ZIP || '',
          ADDR: college.ADDRESS || college.ADDR || '',
          GENTELE: college.contact?.phone || college.GENTELE || '',
          WEBADDR: college.WEBADDR || college.contact?.website || '',
          ADMINURL: college.ADMINURL || college.contact?.admissionsUrl || '',
          FAIDURL: college.FAIDURL || college.contact?.financialAidUrl || '',
          APPLURL: college.APPLURL || college.contact?.applicationUrl || '',
          CHFNM: college.CHFNM || '',
          CHFTITLE: college.CHFTITLE || '',
          LONGITUD: college.LONGITUD || college.location?.longitude || '',
          LATITUDE: college.LATITUDE || college.location?.latitude || '',
          
          // Additional fields you were sending before
          country: college.COUNTRY || 'USA',
          programCount: college.programCount || 0,
          matchPercentage: college.matchPercentage || 0,
          selectedCourses: college.selectedCourses || [],
          isKansas: college.INSTNM?.toLowerCase().includes('kansas') || false
        }
      };

      // Add program data if available
      if (programData) {
        collegePayload.selectedProgram = programData;
      }

      console.log("📤 Sending college payload:", collegePayload);

      const response = await axios.post(
        `${API_URL}/api/colleges`,
        collegePayload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        console.log("✅ College added successfully");
        if (programData) {
          console.log(`Program added: ${programData.program?.program_name || programData.name}`);
        }
        if (college.selectedCourses && college.selectedCourses.length > 0) {
          console.log(`Courses: ${college.selectedCourses.length} courses included`);
        }
        
        // Show success message (optional)
        // You could add a toast notification here
      }
      
      triggerCollegeUpdate();

    } catch (error) {
      console.error("❌ Error adding college:", error);
      
      if (error.response?.status === 409) {
        console.log("ℹ️ College was already in list");
        // Optionally show a message that college was already added
      } else {
        alert(`Failed to add college: ${error.response?.data?.message || 'Please try again'}`);
        // Revert optimistic update
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

      // Optimistically update UI
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
      // Revert optimistic update
      setUserColleges(prev => new Set([...prev, college.UNITID]));
    } finally {
      setRemovingCollege(null);
    }
  };

  // Navigate to Courses page for non-Kansas universities
  const handleCollegeClick = (college) => {
    const isKansas = college.INSTNM && college.INSTNM.toLowerCase().includes('kansas');
    
    if (isKansas) {
      // Kansas universities use direct add button
      return;
    }
    
    // Determine base path based on current URL
    const isFirstYear = window.location.pathname.includes('/firstyear/');
    const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';
    
    // Enhance the college data to ensure programs are included
    const enhancedCollege = {
      ...college,
      // Make sure programs array is included (from the API response)
      programs: college.programs || [],
      // Include any other relevant data
      fullData: college.fullData || college
    };
    
    // Log what we're passing
    console.log(`🎓 Preparing to navigate to courses for: ${college.INSTNM}`);
    console.log("📦 College data being passed:", {
      name: enhancedCollege.INSTNM,
      hasPrograms: !!(enhancedCollege.programs && enhancedCollege.programs.length > 0),
      programsCount: enhancedCollege.programs?.length || 0,
      hasSelectedCourses: !!(enhancedCollege.selectedCourses && enhancedCollege.selectedCourses.length > 0),
      selectedCoursesCount: enhancedCollege.selectedCourses?.length || 0
    });
    
    // Store the enhanced university data in localStorage
    localStorage.setItem(`university_${college.UNITID}`, JSON.stringify(enhancedCollege));
    localStorage.setItem('currentUniversity', JSON.stringify(enhancedCollege));
    
    // Store selected courses if available
    if (enhancedCollege.selectedCourses && enhancedCollege.selectedCourses.length > 0) {
      localStorage.setItem(`university_courses_${college.UNITID}`, JSON.stringify(enhancedCollege.selectedCourses));
    }
    
    // Navigate to Courses page with enhanced university data
    navigate(`${basePath}/courses/${college.UNITID}`, {
      state: {
        university: enhancedCollege,
        selectedCourses: enhancedCollege.selectedCourses || []
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
    const shouldAdd = window.confirm(
      `Would you like to add ${college.INSTNM} to My Colleges?\n\n` +
      `If you want to select a specific program first, click "View Courses" instead.`
    );
    
    if (shouldAdd) {
      await handleAddCollege(college);
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

  return (
    <div className="college-search-container">
      {/* Header */}
      <div className="college-search-header">
        <h1 className="college-search-title">My Selected Universities</h1>
        <div className="college-search-count">
          {colleges.length} {colleges.length === 1 ? 'College' : 'Colleges'}
        </div>
      </div>

      {/* Search Bar */}
      <div className="college-search-bar">
        <input
          type="text"
          className="college-search-input"
          placeholder="Search your selected universities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={colleges.length === 0}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading-message">Loading your selected universities...</div>
      ) : colleges.length === 0 ? (
        <div className="empty-message">
          {studentProfile?.selectedUniversities?.length === 0 
            ? "You haven't selected any universities in your profile yet."
            : "No universities match your current filters."}
        </div>
      ) : (
        <div className="college-list">
          {colleges.map((college) => {
            const isAdded = userColleges.has(college.UNITID);
            const isAdding = addingCollege === college.UNITID;
            const isRemoving = removingCollege === college.UNITID;
            const isKansas = college.INSTNM && college.INSTNM.toLowerCase().includes('kansas');
            const initials = getInitials(college.INSTNM);
            const hasPrograms = college.programs && college.programs.length > 0;
            const programCount = college.programs?.length || college.programCount || 0;

            return (
              <div key={college.UNITID || college._id} className="college-list-item">
                <div className="college-info">
                  <div className="college-logo-small">
                    {college.logo && !college.logo.includes('ui-avatars') ? (
                      <img 
                        src={college.logo} 
                        alt={college.INSTNM}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-university-logo.png';
                        }}
                      />
                    ) : (
                      <div className="college-logo-initials">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="college-text">
                    <div className="college-name-wrapper">
                      <h4 
                        className={`college-name-link ${isKansas ? 'kansas-university' : 'gus-university'}`}
                        onClick={() => handleCollegeClick(college)}
                        style={{ cursor: isKansas ? 'default' : 'pointer' }}
                      >
                        {college.INSTNM}
                      </h4>
                      {!isKansas && (
                        <span className="university-type-badge">
                          GUS Portal
                        </span>
                      )}
                    </div>
                    <p className="college-location-small">
                      {college.CITY || ''}{college.CITY && college.STABBR ? ', ' : ''}{college.STABBR || ''} - {college.COUNTRY || 'USA'}
                    </p>
                    
                    {/* Program count badge */}
                    {!isKansas && programCount > 0 && (
                      <div className="college-programs-preview">
                        <span className="programs-count">
                          {programCount} program{programCount !== 1 ? 's' : ''} available
                        </span>
                      </div>
                    )}

                    {/* Added Status */}
                    {isAdded && (
                      <div className="college-status-badge">
                        ✓ Added to My Colleges
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isKansas ? (
                  !isAdded ? (
                    <button 
                      className="add-circle-button"
                      onClick={() => handleDirectAdd(college)}
                      disabled={isAdding}
                    >
                      <span className="add-icon">
                        {isAdding ? (
                          <span className="adding-spinner"></span>
                        ) : '+'}
                      </span>
                      {isAdding ? 'Adding...' : 'Add'}
                    </button>
                  ) : (
                    <button 
                      className="remove-circle-button"
                      onClick={() => handleRemoveCollege(college)}
                      disabled={isRemoving}
                    >
                      <span className="remove-icon">
                        {isRemoving ? (
                          <span className="removing-spinner"></span>
                        ) : '×'}
                      </span>
                      {isRemoving ? 'Removing...' : 'Remove'}
                    </button>
                  )
                ) : (
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
                          <span style={{ fontSize: '18px' }}>×</span>
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
                          <span style={{ fontSize: '18px' }}>+</span>
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

      {/* Info Banner */}
      {colleges.length > 0 && (
        <div className="info-banner">
          <div className="info-banner-content">
            <div className="info-icon">ℹ️</div>
            <div className="info-text">
              <strong>Note:</strong>
              <ul className="info-list">
                <li>Click on any <span className="gus-highlight">GUS Portal</span> university name or "View Courses" button to see available programs.</li>
                <li>Kansas universities can be added directly using the Add button.</li>
                <li>For GUS universities, you can either view courses first or add the university directly using the + button.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeSearch;