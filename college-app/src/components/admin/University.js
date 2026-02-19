// src/pages/University/University.js
import React, { useState, useEffect } from "react";
import "./University.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const University = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all universities on component mount
  useEffect(() => {
    console.log("University component mounted");
    fetchAllUniversities();
  }, []);

  // Fetch all universities using the working college-search endpoint
  const fetchAllUniversities = async () => {
    console.log("Fetching all universities...");
    setLoading(true);
    setError(null);
    
    try {
      // Use the same endpoint that CollegeSearch uses - with empty query to get all
      const response = await axios.get(`${API_URL}/api/college-search`, {
        params: { query: "" }
      });

      console.log("API Response:", response.data);
      
      if (response.data.success) {
        console.log("Universities data:", response.data.colleges.length);
        setUniversities(response.data.colleges || []);
      } else {
        setError("Failed to load universities");
      }
    } catch (err) {
      console.error("Failed to fetch universities:", err);
      setError("Failed to load universities. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Get program count
  const getProgramCount = (university) => {
    if (university.GUS_DATA?.programs_data) {
      return university.GUS_DATA.programs_data.length;
    }
    return 0;
  };

  // Get location string
  const getLocationString = (university) => {
    const parts = [];
    if (university.CITY) parts.push(university.CITY);
    if (university.STABBR) parts.push(university.STABBR);
    if (university.GUS_DATA?.country) parts.push(university.GUS_DATA.country);
    else parts.push('USA');
    
    return parts.join(', ') || 'Location not specified';
  };

  // Get university code/initials for logo
  const getUniversityCode = (university) => {
    if (university.IALIAS) {
      return university.IALIAS.split(' ').map(w => w[0]).join('').substring(0, 4).toUpperCase();
    }
    if (university.INSTNM) {
      const words = university.INSTNM.split(' ');
      if (words.length > 1) {
        return words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
      }
      return university.INSTNM.substring(0, 4).toUpperCase();
    }
    return 'UNI';
  };

  // Check if university is GUS
  const isGUSUniversity = (university) => {
    return !!university.GUS_DATA;
  };

  return (
    <div className="university-container">
      {/* Header */}
      <div className="university-header">
        <h1 className="university-title">University Directory</h1>
        <div className="university-count">{universities.length} universities</div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={fetchAllUniversities}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-message">Loading universities...</p>
        </div>
      ) : (
        <div className="university-grid">
          {universities.length === 0 && !error ? (
            <div className="empty-container">
              <p className="empty-message">No universities found.</p>
              <p className="empty-submessage">Make sure your backend is running.</p>
              <button className="retry-button" onClick={fetchAllUniversities}>
                Refresh
              </button>
            </div>
          ) : (
            universities.map((uni, index) => {
              const programCount = getProgramCount(uni);
              const location = getLocationString(uni);
              const uniCode = getUniversityCode(uni);
              const isGUS = isGUSUniversity(uni);

              return (
                <div key={uni.UNITID || index} className="university-card">
                  {/* Logo/Initials */}
                  <div className="university-card-logo">
                    {uni.logo ? (
                      <img 
                        src={uni.logo} 
                        alt={uni.INSTNM}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `<span class="university-initials">${uniCode}</span>`;
                        }}
                      />
                    ) : (
                      <span className="university-initials">{uniCode}</span>
                    )}
                  </div>

                  {/* University Details */}
                  <div className="university-card-details">
                    <div className="university-card-header">
                      <h3 className="university-card-name">{uni.INSTNM}</h3>
                      {isGUS && (
                        <span className="university-badge">GUS Portal</span>
                      )}
                    </div>

                    <p className="university-card-location">
                      <span className="location-icon">📍</span> {location}
                    </p>

                    {isGUS && programCount > 0 && (
                      <p className="university-card-programs">
                        <span className="programs-icon">📚</span> {programCount} programs available
                      </p>
                    )}

                    {uni.WEBADDR && (
                      <a 
                        href={uni.WEBADDR} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="university-card-website"
                      >
                        Visit Website →
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default University;