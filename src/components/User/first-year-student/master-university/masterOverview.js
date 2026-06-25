import React, { useCallback, useEffect, useState } from "react";
import axiosInstance from './../../api/axiosInstance';
import "./masteroverview.css";

const normalizeCourse = (course = {}) => ({
  preferredCourse:
    course.preferredCourse ||
    course.title ||
    course.name ||
    course.program_name ||
    course.programName ||
    course.courseTitle ||
    "",
  universityName:
    course.universityName ||
    course.university ||
    course.nameOfUniversity ||
    "",
  level:
    course.level ||
    course.educationLevel ||
    "Postgraduate",
  modeOfStudy:
    course.modeOfStudy ||
    course.studyMode ||
    course.study_mode ||
    "",
  duration: course.duration || "",
  majorArea:
    course.majorArea ||
    course.major_area ||
    course.category ||
    "",
  intake: course.intake || "",
});

const getStoredMasterCourse = () => {
  try {
    return JSON.parse(localStorage.getItem("masterSelectedCourse") || "{}");
  } catch {
    return {};
  }
};



const MasterOverview = ({ data = {}, onNext }) => {
  const [course, setCourse] = useState({});
  const [loading, setLoading] = useState(true);

  /* =========================================
     SAVE TO BACKEND
  ========================================= */
  const saveCourse = useCallback(async (courseData) => {
    try {
      const normalized = normalizeCourse(courseData);
      if (!normalized.preferredCourse) return;

      const payload = { course: normalized };

      console.log("Sending payload:", payload);

     await axiosInstance.post('/api/master-overview/save', payload);

      console.log("Saved to DB ✅");
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err.message);
    }
  }, []);

  /* =========================================
     FETCH FROM BACKEND
  ========================================= */
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await axiosInstance.get("/api/master-overview");
        const backendCourse = normalizeCourse(res.data?.data?.course || {});

        if (backendCourse.preferredCourse) {
          setCourse(backendCourse);
          setLoading(false);
          return;
        }

        const localCourse = normalizeCourse(getStoredMasterCourse());

        if (localCourse.preferredCourse) {
          setCourse(localCourse);
          await saveCourse(localCourse);
          setLoading(false);
          return;
        }

        const propsCourse = normalizeCourse(data?.course || {});

        if (propsCourse.preferredCourse) {
          setCourse(propsCourse);
          await saveCourse(propsCourse);
          setLoading(false);
          return;
        }

        setCourse({});
      } catch (err) {
        console.error("GET overview error:", err.response?.data || err.message);

        const localCourse = normalizeCourse(getStoredMasterCourse());
        const propsCourse = normalizeCourse(data?.course || {});

        if (localCourse.preferredCourse) {
          setCourse(localCourse);
        } else if (propsCourse.preferredCourse) {
          setCourse(propsCourse);
        } else {
          setCourse({});
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [data?.course, saveCourse]);

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

  const normalizedCourse = normalizeCourse(course);
  const hasCourse = !!normalizedCourse.preferredCourse;

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
            {normalizedCourse.preferredCourse || "No Course Selected"}
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
              {normalizedCourse.universityName || "—"}
            </span>
          </div>

          <div className="master-overview-detail-item">
            <span className="master-overview-detail-label">Level:</span>
            <span className="master-overview-detail-value">
              {normalizedCourse.level || "—"}
            </span>
          </div>

          <div className="master-overview-detail-item">
            <span className="master-overview-detail-label">Mode of Study:</span>
            <span className="master-overview-detail-value">
              {normalizedCourse.modeOfStudy || "—"}
            </span>
          </div>

          <div className="master-overview-detail-item">
            <span className="master-overview-detail-label">Duration:</span>
            <span className="master-overview-detail-value">
              {normalizedCourse.duration || "—"}
            </span>
          </div>

          <div className="master-overview-detail-item">
            <span className="master-overview-detail-label">Field of Study:</span>
            <span className="master-overview-detail-value">
              {normalizedCourse.majorArea || "—"}
            </span>
          </div>

          <div className="master-overview-detail-item">
            <span className="master-overview-detail-label">Intake:</span>
            <span className="master-overview-detail-value">
              {normalizedCourse.intake || "—"}
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
