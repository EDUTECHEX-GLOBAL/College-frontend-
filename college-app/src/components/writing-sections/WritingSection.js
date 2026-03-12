import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import PersonalEssay from './PersonalEssay';
import AdditionalInformation from './AdditionalInformation';
import './WritingSection.css';

const WritingSection = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [activeSubsection, setActiveSubsection] = useState('personal-essay');

  useEffect(() => {
    setActiveSubsection(
      location.pathname.includes('/additional-information')
        ? 'additional-information'
        : 'personal-essay'
    );
  }, [location.pathname]);

  return (
    <div className="writing-section">
      <div className="writing-container">
        <div className="writing-main-content">
          {/* Back to Dashboard */}
          <div className="content-back-button">
            <button
              className="back-to-dashboard-content-btn"
              onClick={() => navigate('/firstyear/dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>

          <Routes>
            <Route path="/"                       element={<PersonalEssay />} />
            <Route path="/personal-essay"         element={<PersonalEssay />} />
            <Route path="/additional-information" element={<AdditionalInformation />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default WritingSection;