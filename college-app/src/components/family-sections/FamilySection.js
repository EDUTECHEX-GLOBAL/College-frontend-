import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './FamilySection.css';
import HouseholdForm from './HouseholdForm';
import Parent1Form from './Parent1Form';
import Parent2Form from './Parent2Form';
import SiblingForm from './SiblingForm';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const FamilySection = ({ onComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_URL}/api/students/family-dashb`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          const data = response.data.familyData;
          setFamilyData(data);

          if (data.overallProgress >= 100) {
            localStorage.setItem('familySectionComplete', 'true');
            if (onComplete) {
              onComplete(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching family data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBackToDashboard = () => {
    const path = location.pathname;
    if (path.includes('/firstyear/')) {
      navigate('/firstyear/dashboard');
    } else if (path.includes('/transfer/')) {
      navigate('/transfer/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="family-loading">
        <div className="loading-spinner"></div>
        <p>Loading family information...</p>
      </div>
    );
  }

  return (
    <div className="family-section-container">
      {/* Fixed Header */}
      <div className="family-header-section">
        <div className="family-header-content">
          <button
            className="back-to-dashboard-btn"
            onClick={handleBackToDashboard}
          >
            ← Back to Dashboard
          </button>

          <div className="family-title-container">
            <h1 className="family-main-title">Family Information</h1>
            <p className="family-sub-title">Manage your family background and relationships</p>
          </div>
        </div>
      </div>

      <div className="family-content-wrapper">
        <div className="family-forms-container">
          <Routes>
            <Route path="/" element={<HouseholdForm />} />
            <Route path="/household" element={<HouseholdForm />} />
            <Route path="/parent1" element={<Parent1Form />} />
            <Route path="/parent2" element={<Parent2Form />} />
            <Route path="/sibling" element={<SiblingForm onComplete={onComplete} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default FamilySection;