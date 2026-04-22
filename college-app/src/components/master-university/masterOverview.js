import React, { useEffect, useState } from "react";
import axios from "axios";
import "./masteroverview.css";

const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const MasterOverview = ({ data = {}, onNext }) => {
  const [course, setCourse] = useState({});
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  /* =========================================
     FETCH FROM BACKEND
  ========================================= */
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        if (!token) {
          setCourse(data.course || {});
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API_URL}/api/master-overview`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success && res.data.data) {
          setCourse(res.data.data.course);
        } else {
          // fallback → save from props
          if (data?.course) {
            setCourse(data.course);
            await saveCourse(data.course);
          }
        }
      } catch (err) {
        console.error("GET ERROR:", err);

        // fallback
        if (data?.course) {
          setCourse(data.course);
          await saveCourse(data.course);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  /* =========================================
     SAVE TO BACKEND
  ========================================= */
  const saveCourse = async (courseData) => {
    try {
      if (!courseData?.preferredCourse) return;

      const payload = {
        course: {
          preferredCourse: courseData.preferredCourse,
          universityName: courseData.universityName || "",
          level: courseData.level || "",
          modeOfStudy: courseData.modeOfStudy || "",
          duration: courseData.duration || "",
          majorArea: courseData.majorArea || "",
          intake: courseData.intake || "",
        },
      };

      console.log("Sending payload:", payload);

      await axios.post(`${API_URL}/api/master-overview/save`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Saved to DB ✅");
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err.message);
    }
  };

  /* =========================================
     LOADING
  ========================================= */
  if (loading) {
    return (
      <div className="master-overview-container">
        <p>Loading...</p>
      </div>
    );
  }

  const hasCourse = !!course?.preferredCourse;

  return (
    <div className="master-overview-container">
      <div className="master-overview-header">
        <h2 className="master-overview-title">Application Overview</h2>
        <p className="master-overview-subtitle">
          Review your selected course details before starting the application
        </p>
      </div>

      <div className="master-overview-card">
        <div className="master-overview-card-header">
          <h3 className="master-overview-course-name">
            {course.preferredCourse || "No Course Selected"}
          </h3>

          {hasCourse && (
            <span className="master-overview-status-badge">
              Ready to Apply
            </span>
          )}
        </div>

        <div className="master-overview-details-grid">
          <div className="master-overview-detail-item">
            <span className="master-overview-detail-label">University:</span>
            <span className="master-overview-detail-value">
              {course.universityName || "—"}
            </span>
          </div>

          <div className="master-overview-detail-item">
            <span className="master-overview-detail-label">Level:</span>
            <span className="master-overview-detail-value">
              {course.level || "—"}
            </span>
          </div>

          <div className="master-overview-detail-item">
            <span className="master-overview-detail-label">Mode of Study:</span>
            <span className="master-overview-detail-value">
              {course.modeOfStudy || "—"}
            </span>
          </div>

          <div className="master-overview-detail-item">
            <span className="master-overview-detail-label">Duration:</span>
            <span className="master-overview-detail-value">
              {course.duration || "—"}
            </span>
          </div>

          <div className="master-overview-detail-item">
            <span className="master-overview-detail-label">Field of Study:</span>
            <span className="master-overview-detail-value">
              {course.majorArea || "—"}
            </span>
          </div>

          <div className="master-overview-detail-item">
            <span className="master-overview-detail-label">Intake:</span>
            <span className="master-overview-detail-value">
              {course.intake || "—"}
            </span>
          </div>
        </div>

        {hasCourse && (
          <div className="master-overview-info-box">
            <span className="master-overview-info-icon">i</span>
            <div className="master-overview-info-content">
              <strong>Application Instructions</strong>
              <p>
                Please review all information carefully before proceeding. You
                can edit your course selection at any time before submission.
              </p>
            </div>
          </div>
        )}
      </div>

      {!hasCourse && (
        <div className="master-overview-warning">
          <span className="master-overview-warning-icon">!</span>
          <span>
            No course selected. Please go back and select a course to continue.
          </span>
        </div>
      )}

      <div className="master-overview-actions">
        <button
          onClick={onNext}
          className="master-overview-btn"
          disabled={!hasCourse}
        >
          {hasCourse ? "Start Application →" : "Select Course First"}
        </button>
      </div>
    </div>
  );
};

export default MasterOverview;