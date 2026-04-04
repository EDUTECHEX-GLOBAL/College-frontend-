import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./MyColleges.css";

const API_URL = process.env.REACT_APP_API_BASE_URL;

const MyColleges = () => {
  const [colleges, setColleges] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyColleges = async () => {
      const userId = localStorage.getItem("userId");
      const res = await axios.get(`${API_URL}/api/colleges/mine/${userId}`);
      setColleges(res.data.colleges || []);
    };
    fetchMyColleges();
  }, []);

  const handleCollegeClick = (college) => {
    // ✅ GUS university → go to Courses page
    if (college.source === "GUS") {
      navigate(`/my-colleges/${college.collegeId}/courses`);
    } 
    // ✅ Non-GUS → normal application flow
    else {
      navigate(`/my-colleges/${college.collegeId}/application`);
    }
  };

  return (
    <div className="college-search-container">
      <h2 className="college-search-title">My Colleges</h2>

      {colleges.length === 0 ? (
        <p>You haven’t added any colleges yet.</p>
      ) : (
        <ul className="my-colleges-list">
          {colleges.map((c) => (
            <li
              key={c.collegeId}
              className="my-college-item"
              onClick={() => handleCollegeClick(c)}
              style={{ cursor: "pointer" }}
            >
              <span>{c.name}</span>

              {c.source === "GUS" && (
                <span className="gus-badge">GUS</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyColleges;
