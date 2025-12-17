import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyColleges.css";

const API_URL = process.env.REACT_APP_API_BASE_URL;

const MyColleges = () => {
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    const fetchMyColleges = async () => {
      const userId = localStorage.getItem("userId");
      const res = await axios.get(`${API_URL}/api/colleges/mine/${userId}`);
      setColleges(res.data.colleges || []);
    };
    fetchMyColleges();
  }, []);

  return (
    <div className="college-search-container">
      <h2 className="college-search-title">My Colleges</h2>
      {colleges.length === 0 ? (
        <p>You haven’t added any colleges yet.</p>
      ) : (
        <ul className="my-colleges-list">
          {colleges.map((c) => (
            <li key={c.collegeId}>
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyColleges;
