import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './FamilySection.css';
import HouseholdForm from './HouseholdForm';
import Parent1Form from './Parent1Form';
import Parent2Form from './Parent2Form';
import SiblingForm from './SiblingForm';

const API_URL = process.env.REACT_APP_API_URL;

const FamilySection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubSection, setActiveSubSection] = useState('household');

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
          setFamilyData(response.data.familyData);
        }
      } catch (error) {
        console.error('Error fetching family data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, []);

  // Update active subsection based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/firstyear/dashboard/household')) {
      setActiveSubSection('household');
    } else if (path.includes('/firstyear/dashboard/parent1')) {
      setActiveSubSection('parent1');
    } else if (path.includes('/firstyear/dashboard/parent2')) {
      setActiveSubSection('parent2');
    } else if (path.includes('/firstyear/dashboard/sibling')) {
      setActiveSubSection('sibling');
    } else {
      setActiveSubSection('household');
    }
  }, [location.pathname]);

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
      <header className="family-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="welcome-title">Family Information</h1>
            <p className="welcome-subtitle">Manage your family background and relationships</p>
          </div>
          <div className="header-actions">
            <button className="help-button">
              <span className="help-icon">?</span>
              Need Help?
            </button>
          </div>
        </div>
      </header>

      <div className="family-content">
        {/* Main Form Content - Full width without sidebar */}
        <div className="family-main-content-full">
          <Routes>
            <Route path="/" element={<HouseholdForm />} />
            <Route path="/household" element={<HouseholdForm />} />
            <Route path="/parent1" element={<Parent1Form />} />
            <Route path="/parent2" element={<Parent2Form />} />
            <Route path="/sibling" element={<SiblingForm />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default FamilySection;