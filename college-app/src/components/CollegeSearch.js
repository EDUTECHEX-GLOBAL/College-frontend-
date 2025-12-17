import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CollegeSearch.css";

const API_URL = process.env.REACT_APP_API_BASE_URL
;

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
    // Trigger custom event for Dashboard to listen to
    window.dispatchEvent(new CustomEvent('collegesUpdated'));
    // Also call prop callback if provided
    if (onCollegeUpdate) {
      onCollegeUpdate();
    }
  };

  // Fetch user's college list - call this whenever needed
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
      
      // After fetching colleges, also fetch user's college list to ensure state is current
      await fetchUserColleges();
    } catch (error) {
      console.error("Error fetching colleges:", error);
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

      // OPTIMISTIC UPDATE: Immediately update UI to show as added
      setUserColleges(prev => new Set([...prev, college.UNITID]));

      const response = await axios.post(
        `${API_URL}/api/colleges`,
        {
          collegeId: college.UNITID,
          collegeData: college
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log("✅ College added successfully");
      }
      
      // Always trigger update event for Dashboard regardless of success/conflict
      triggerCollegeUpdate();

    } catch (error) {
      console.error("❌ Error adding college:", error);
      
      if (error.response?.status === 409) {
        // College already exists - this is fine, just log it
        console.log("ℹ️ College was already in list - UI updated");
        // Don't show alert for this case since it's not really an error
      } else {
        // Only show alert for actual errors (not conflicts)
        alert("Failed to add college to your list");
        // Revert optimistic update for actual errors
        setUserColleges(prev => {
          const newSet = new Set(prev);
          newSet.delete(college.UNITID);
          return newSet;
        });
      }
      
      // Still trigger update to ensure Dashboard is in sync
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

      // OPTIMISTIC UPDATE: Immediately update UI to show as removed
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

      // Trigger update event for Dashboard
      triggerCollegeUpdate();

    } catch (error) {
      console.error("❌ Error removing college:", error);
      alert("Failed to remove college from your list");
      
      // Revert optimistic update on error
      setUserColleges(prev => new Set([...prev, college.UNITID]));
      
      // Still trigger update to ensure Dashboard is in sync
      triggerCollegeUpdate();
    } finally {
      setRemovingCollege(null);
    }
  };

  // Handle college name click - navigate to college details
  const handleCollegeClick = (college) => {
    navigate(`/firstyear/dashboard/colleges/${college.UNITID}`);
  };

  // Load default data and user colleges on component mount
  useEffect(() => {
    fetchColleges("");
  }, []);

  // Debounced live search
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
                    <h4 
                      className="college-name-link"
                      onClick={() => handleCollegeClick(college)}
                    >
                      {college.INSTNM}
                    </h4>
                    <p className="college-location-small">
                      {college.CITY}, {college.STABBR} - USA
                    </p>
                    {isAdded && (
                      <div className="college-status-badge">
                        ✓ Added to My Colleges
                      </div>
                    )}
                  </div>
                </div>

                {isAdded ? (
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
                ) : (
                  <button 
                    className="add-circle-button"
                    onClick={() => handleAddCollege(college)}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <span className="adding-spinner"></span>
                    ) : (
                      <span className="add-icon">+</span>
                    )}
                    {isAdding ? 'Adding...' : 'Add'}
                  </button>
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