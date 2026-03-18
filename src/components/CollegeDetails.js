import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CollegeDetails.css";

const API_URL = process.env.REACT_APP_API_BASE_URL
;

const CollegeDetails = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollegeDetails();
  }, [collegeId]);

  const fetchCollegeDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/colleges/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setCollege(response.data.college);
      }
    } catch (error) {
      console.error("Error fetching college details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollege = async () => {
    if (window.confirm(`Remove ${college?.basicInfo?.name} from your list?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/colleges/${collegeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        navigate('/firstyear/dashboard/college-search');
      } catch (error) {
        console.error("Error removing college:", error);
        alert("Failed to remove college from your list");
      }
    }
  };

  if (loading) {
    return (
      <div className="common-app-loading">
        <div className="loading-spinner"></div>
        <p>Loading college details...</p>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="common-app-error">
        <h2>College not found</h2>
        <p>The college you're looking for is not in your list.</p>
        <button onClick={() => navigate('/firstyear/dashboard/college-search')}>
          Search Colleges
        </button>
      </div>
    );
  }

  return (
    <div className="common-app-container">
      {/* Header Section */}
      <div className="common-app-header">
        <div className="header-nav">
          
          <button
            className="college-back-button"
            onClick={() => navigate('/firstyear/dashboard/college-search')}
          >
            ← Back to Search
          </button>

        </div>

        <div className="college-header-info">
          <h1 className="college-name">
            {college.basicInfo?.name || "University of Kansas"}
          </h1>
          <div className="contact-info">
            <span className="email">adm@ku.edu</span>
            <span className="separator">·</span>
            <span className="phone">Phone (785) 864-3911</span>
          </div>
          <div className="address">
            <div>Jayhawk Welcome Center</div>
            <div>1266 Oread Ave</div>
            <div>Lawrence, KS 66045</div>
            <div>USA</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="common-app-content">
        {/* Application Deadlines */}
        <section className="content-section">
          <h2 className="section-title">Application deadlines</h2>
          <div className="deadlines-grid">
            <div className="deadline-item">
              <span className="deadline-term">Fall 2026</span>
              <span className="deadline-date">
                Rolling Admission · July 28, 2026
              </span>
            </div>
            <div className="deadline-item">
              <span className="deadline-term">Spring 2026</span>
              <span className="deadline-date">
                Rolling Admission · January 13, 2026
              </span>
            </div>
            <div className="deadline-item">
              <span className="deadline-term">Summer 2026</span>
              <span className="deadline-date">
                Rolling Admission · May 26, 2026
              </span>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="content-section">
          <h2 className="section-title">Links</h2>
          <div className="links-grid">
            <a
              href="https://ku.edu"
              target="_blank"
              rel="noopener noreferrer"
              className="link-item"
            >
              College website
            </a>
            <a
              href="https://admissions.ku.edu"
              target="_blank"
              rel="noopener noreferrer"
              className="link-item"
            >
              Admissions office
            </a>
            <a
              href="https://financialaid.ku.edu"
              target="_blank"
              rel="noopener noreferrer"
              className="link-item"
            >
              Financial aid
            </a>
            <a
              href="https://visit.ku.edu"
              target="_blank"
              rel="noopener noreferrer"
              className="link-item"
            >
              Virtual tour
            </a>
            <a
              href="https://nces.ed.gov/collegenavigator"
              target="_blank"
              rel="noopener noreferrer"
              className="link-item"
            >
              College Navigator
            </a>
          </div>
        </section>

        {/* Other Deadline Information */}
        <section className="content-section">
          <h2 className="section-title">Other deadline information</h2>
          <div className="text-content">
            <p>
              <strong>Other Deadline Information FY</strong>
            </p>
            <p>
              <strong>Domestic students:</strong>
            </p>
            <p>
              Deadline for scholarship and priority admission consideration is
              December 1st.
            </p>
            <p>
              <strong>International students:</strong>
            </p>
            <p>
              Please review deadlines here:{" "}
              <a href="https://world.ku.edu/deadlines">
                https://world.ku.edu/deadlines
              </a>
            </p>
          </div>
        </section>

        {/* Application Information */}
        <section className="content-section">
          <h2 className="section-title">Application information</h2>

          <div className="info-subsection">
            <h3>Application Fees:</h3>
            <div className="fees-list">
              <div className="fee-item">First Year International Fee - $90</div>
              <div className="fee-item">First Year Domestic Fee - $40</div>
            </div>
          </div>

          <div className="info-subsection">
            <h3>Standardized test policy:</h3>
            <p>Sometimes required</p>
            <p>See website</p>
            <a href="#" className="text-link">
              Test Policy Information
            </a>
          </div>

          <div className="info-subsection">
            <h3>Accepted English proficiency tests:</h3>
            <p>See website</p>
          </div>

          <div className="info-subsection">
            <h3>Courses & Grades:</h3>
            <p>Not Used</p>
          </div>

          <div className="info-subsection">
            <h3>Recommendations:</h3>
            <div className="recommendations-grid">
              <div className="recommendation-item">
                <span className="rec-label">School Report</span>
                <span className="rec-value">Required</span>
              </div>
              <div className="recommendation-item">
                <span className="rec-label">Final Report</span>
                <span className="rec-value">Required</span>
              </div>
              <div className="recommendation-item">
                <span className="rec-label">Teacher Evaluation(s):</span>
                <span className="rec-value">Not Applicable</span>
              </div>
              <div className="recommendation-item">
                <span className="rec-label">Other Evaluation(s):</span>
                <span className="rec-value">Not Applicable</span>
              </div>
            </div>
          </div>

          <div className="info-subsection">
            <h3>Saves school forms after matriculation:</h3>
            <p>No</p>
          </div>

          <div className="info-subsection">
            <h3>Additional information:</h3>
            <div className="additional-text">
              <p>
                *Please do not submit another application if you have already
                applied through https://apply.ku.edu/.
              </p>
              <p>
                SAT scores include math and evidence-based reading and writing
                taken March 2016 and after.
              </p>
              <p>
                ACT test scores include English, math &amp; reading. (As of
                April 2025, science is optional)
              </p>
              <p>
                Professional schools have different admission requirements which
                can be found at Major-Specific Admission Requirements |
                University of Kansas.
              </p>
            </div>
          </div>
        </section>

        {/* Writing Requirements */}
        <section className="content-section">
          <h2 className="section-title">Writing requirements</h2>

          <div className="college-writing-section">
            <div className="college-writing-item">
              <div className="college-writing-header">
                <span className="college-writing-title">
                  Common App personal essay
                </span>
                <span className="college-writing-tag college-writing-tag-optional">
                  Optional
                </span>
              </div>
            </div>

            <div className="college-writing-item">
              <div className="college-writing-header">
                <span className="college-writing-title">College questions</span>
              </div>
              <p className="college-writing-desc">
                There are no writing questions for this college.
              </p>
            </div>

            <div className="college-writing-item">
              <div className="college-writing-header">
                <span className="college-writing-title">
                  Writing Supplement
                </span>
              </div>
              <p className="college-writing-desc">
                This college does not use a writing supplement for any
                additional writing requirements.
              </p>
            </div>
          </div>
        </section>

        {/* Remove College */}
        <section className="content-section">
          <button className="remove-college-button" onClick={handleRemoveCollege}>
            Remove college
          </button>
        </section>
      </div>
    </div>
  );
};

export default CollegeDetails;
