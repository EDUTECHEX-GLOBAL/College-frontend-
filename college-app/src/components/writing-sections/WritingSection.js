import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import PersonalEssay from './PersonalEssay';
import AdditionalInformation from './AdditionalInformation';
import './WritingSection.css';

const WritingSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSubsection, setActiveSubsection] = useState('personal-essay');

  useEffect(() => {
    if (location.pathname.includes('/additional-information')) {
      setActiveSubsection('additional-information');
    } else {
      setActiveSubsection('personal-essay');
    }
  }, [location.pathname]);

  return (
    <div className="writing-section">
      {/* REMOVED the duplicate header - DashboardLayout already shows "Writing" in sidebar */}
      
      <div className="writing-container">


        {/* Main Content - Only shows PersonalEssay or AdditionalInformation */}
        <div className="writing-main-content">
          <Routes>
            <Route path="/" element={<PersonalEssay />} />
            <Route path="/personal-essay" element={<PersonalEssay />} />
            <Route path="/additional-information" element={<AdditionalInformation />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default WritingSection;