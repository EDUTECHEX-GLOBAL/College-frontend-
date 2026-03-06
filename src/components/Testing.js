// components/TestingForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './Testing.css';

// Import all test type components
import TestsTaken from './testingsection/TestsTaken';
import ACTTests from './testingsection/ACTTests';
import SATTests from './testingsection/SATTests';
import SATSubjectTests from './testingsection/SATSubjectTests';
import APTests from './testingsection/APTests';
import IBTests from './testingsection/IBTests';
import CambridgeTests from './testingsection/CambridgeTests';
import TOEFLTests from './testingsection/TOEFLTests';
import PTETests from './testingsection/PTETests';
import IELTSTests from './testingsection/IELTSTests';
import DuolingoTests from './testingsection/DuolingoTests';
import SeniorSecondaryExams from './testingsection/SeniorSecondaryExams';

const TestingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('tests-taken');

  // Map selected tests to their route sections
  const testTypeMapping = {
    'ACT Tests': 'act-tests',
    'SAT Tests': 'sat-tests',
    'SAT Subject Tests': 'sat-subject-tests',
    'AP Subject Tests': 'ap-tests',
    'IB Subject Tests': 'ib-tests',
    'Cambridge': 'cambridge-tests',
    'TOEFL iBT': 'toefl-tests',
    'PTE Academic Test': 'pte-tests',
    'IELTS': 'ielts-tests',
    'Duolingo English Test': 'duolingo-tests'
  };

  // Main form state
  const [formData, setFormData] = useState({
    selfReportTests: false,
    selectedTests: [],
    internationalApplicant: null,
    actTestsCount: 0,
    actTests: [],
    satTestsCount: 0,
    satTests: [],
    satSubjectTestsCount: 0,
    satSubjectTests: [],
    apTestsCount: 0,
    apTests: [],
    ibTestsCount: 0,
    ibTests: [],
    cambridgeTestsCount: 0,
    cambridgeTests: [],
    toeflTestsCount: 0,
    toeflTests: [],
    pteTestsCount: 0,
    pteTests: [],
    ieltsTestsCount: 0,
    ieltsTests: [],
    duolingoTestsCount: 0,
    duolingoTests: [],
    seniorSecondaryExamsCount: 0,
    seniorSecondaryExams: [],
    testingCompletion: {
      testsTaken: false,
      actTests: false,
      satTests: false,
      satSubjectTests: false,
      apTests: false,
      ibTests: false,
      cambridgeTests: false,
      toeflTests: false,
      pteTests: false,
      ieltsTests: false,
      duolingoTests: false,
      seniorSecondaryExams: false
    }
  });

  // Simple local testing progress (count non‑empty fields)
  const calculateTestingProgressLocal = (testingData) => {
    const testFields = [
      'selfReportTests', 'selectedTests', 'internationalApplicant',
      'actTests', 'satTests', 'satSubjectTests', 'apTests',
      'ibTests', 'cambridgeTests', 'toeflTests', 'pteTests',
      'ieltsTests', 'duolingoTests', 'seniorSecondaryExams'
    ];

    let completed = 0;

    testFields.forEach(field => {
      const fieldData = testingData[field];
      if (!fieldData) return;

      if (Array.isArray(fieldData)) {
        if (fieldData.length > 0) completed++;
      } else if (typeof fieldData === 'string' && fieldData.trim() !== '') {
        completed++;
      } else if (typeof fieldData === 'boolean') {
        completed++;
      } else if (typeof fieldData === 'number' && fieldData > 0) {
        completed++;
      } else if (typeof fieldData === 'object' && Object.keys(fieldData).length > 0) {
        completed++;
      }
    });

    return Math.round((completed / testFields.length) * 100);
  };

  // Get active sections based on selections (can take override snapshot)
  const getActiveSections = (dataOverride) => {
    const data = dataOverride || formData;
    const sections = ['tests-taken'];

    if (data.selfReportTests === true && Array.isArray(data.selectedTests)) {
      data.selectedTests.forEach(testName => {
        const sectionName = testTypeMapping[testName];
        if (sectionName && !sections.includes(sectionName)) {
          sections.push(sectionName);
        }
      });
    }

    if (!sections.includes('senior-secondary-exams')) {
      sections.push('senior-secondary-exams');
    }

    console.log('📋 Active sections calculated:', sections);
    return sections;
  };

  // Store active sections in localStorage for DashboardLayout to read
  useEffect(() => {
    const activeSections = getActiveSections();
    localStorage.setItem('testingActiveSections', JSON.stringify(activeSections));
    console.log('💾 Saved active sections to localStorage:', activeSections);
  }, [formData.selfReportTests, formData.selectedTests, formData.internationalApplicant]);

  // Extract section from URL path
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const sectionFromUrl = pathParts[pathParts.length - 1];

    const allPossibleSections = [
      'tests-taken',
      'act-tests',
      'sat-tests',
      'sat-subject-tests',
      'ap-tests',
      'ib-tests',
      'cambridge-tests',
      'toefl-tests',
      'pte-tests',
      'ielts-tests',
      'duolingo-tests',
      'senior-secondary-exams'
    ];

    if (allPossibleSections.includes(sectionFromUrl)) {
      setActiveSection(sectionFromUrl);
    } else {
      navigate('/transfer/dashboard/testing/tests-taken', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Fetch testing data from API
  const fetchTestingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.log('⚠️ No token found, redirecting to sign-in');
        navigate('/sign-in');
        return;
      }

      console.log('📥 Fetching testing data from /api/testing...');
      const response = await axiosInstance.get('/api/testing');
      console.log('📦 Response received:', response.data);

      if (response.data.success && response.data.testing) {
        const testingData = response.data.testing;

        const merged = {
          ...formData,
          ...testingData,
          actTests: testingData.actTests || [],
          satTests: testingData.satTests || [],
          satSubjectTests: testingData.satSubjectTests || [],
          apTests: testingData.apTests || [],
          ibTests: testingData.ibTests || [],
          cambridgeTests: testingData.cambridgeTests || [],
          toeflTests: testingData.toeflTests || [],
          pteTests: testingData.pteTests || [],
          ieltsTests: testingData.ieltsTests || [],
          duolingoTests: testingData.duolingoTests || [],
          seniorSecondaryExams: testingData.seniorSecondaryExams || [],
          selectedTests: testingData.selectedTests || []
        };

        setFormData(merged);

        // also sync initial testingProgress into localStorage for dashboard
        const initialProgress = calculateTestingProgressLocal(merged);
        const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        localStorage.setItem(
          'userData',
          JSON.stringify({ ...storedUserData, testingProgress: initialProgress })
        );
      }
    } catch (error) {
      console.error('❌ Error fetching testing data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load testing data. ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestingData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, index, subField, value) => {
    setFormData(prev => {
      const updatedArray = [...prev[field]];
      if (subField) {
        updatedArray[index] = {
          ...updatedArray[index],
          [subField]: value
        };
      } else {
        updatedArray[index] = value;
      }
      return { ...prev, [field]: updatedArray };
    });
  };

  const addTestEntry = (field, template) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], template]
    }));
  };

  const removeTestEntry = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Save testing data with localStorage support
  const saveTestingData = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.log('⚠️ No token found, redirecting to sign-in');
        navigate('/sign-in');
        return { ok: false, data: null };
      }

      console.log('💾 Saving testing data to /api/testing...');
      const localProgress = calculateTestingProgressLocal(formData);
      const response = await axiosInstance.put('/api/testing', formData);
      console.log('📦 Save response:', response.data);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Testing data saved successfully!'
        });

        // persist testingProgress for dashboard cards
        try {
          const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
          const updatedUserData = {
            ...storedUserData,
            testingProgress: localProgress
          };
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
        } catch (e) {
          console.error('Error updating userData.testingProgress in localStorage', e);
        }

        // dispatch progress event for Dashboard.js listener
        window.dispatchEvent(
          new CustomEvent('testingProgressUpdate', {
            detail: { testingProgress: localProgress }
          })
        );

        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);

        // write latest activeSections snapshot as well
        const sections = getActiveSections(formData);
        localStorage.setItem('testingActiveSections', JSON.stringify(sections));

        return { ok: true, data: { ...formData } };
      }
      return { ok: false, data: null };
    } catch (error) {
      console.error('❌ Error saving testing data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save testing data. ' + (error.response?.data?.message || error.message)
      });
      return { ok: false, data: null };
    } finally {
      setSaving(false);
    }
  };

  // Save & continue through sections
  const handleSaveAndContinue = async () => {
    const { ok, data } = await saveTestingData();

    if (!ok || !data) {
      return;
    }

    const sectionsFromSaved = getActiveSections(data);
    const currentIndex = sectionsFromSaved.indexOf(activeSection);

    if (currentIndex > -1 && currentIndex < sectionsFromSaved.length - 1) {
      const nextSection = sectionsFromSaved[currentIndex + 1];
      setTimeout(() => {
        setActiveSection(nextSection);
        navigate(`/transfer/dashboard/testing/${nextSection}`);
      }, 500);
    } else {
      setTimeout(() => {
        navigate('/transfer/dashboard');
      }, 500);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/transfer/dashboard');
  };

  if (loading) {
    return (
      <div className="testing-loading">
        <div className="loading-spinner"></div>
        <p>Loading testing data...</p>
      </div>
    );
  }

  const getButtonText = () => {
    const sections = getActiveSections();
    const currentIndex = sections.indexOf(activeSection);
    const isLastSection = currentIndex === sections.length - 1;
    return isLastSection ? 'Save & Finish' : 'Save & Continue →';
  };

  return (
    <div className="testing-container">
      <div className="testing-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h1>Complete your Common Application</h1>
        <h2>Testing</h2>
      </div>

      <div className="testing-content">
        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {message.text}
          </div>
        )}

        {activeSection === 'tests-taken' && (
          <TestsTaken formData={formData} handleInputChange={handleInputChange} />
        )}
        {activeSection === 'act-tests' && (
          <ACTTests
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addTestEntry={addTestEntry}
            removeTestEntry={removeTestEntry}
          />
        )}
        {activeSection === 'sat-tests' && (
          <SATTests
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addTestEntry={addTestEntry}
            removeTestEntry={removeTestEntry}
          />
        )}
        {activeSection === 'sat-subject-tests' && (
          <SATSubjectTests
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addTestEntry={addTestEntry}
            removeTestEntry={removeTestEntry}
          />
        )}
        {activeSection === 'ap-tests' && (
          <APTests
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addTestEntry={addTestEntry}
            removeTestEntry={removeTestEntry}
          />
        )}
        {activeSection === 'ib-tests' && (
          <IBTests
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addTestEntry={addTestEntry}
            removeTestEntry={removeTestEntry}
          />
        )}
        {activeSection === 'cambridge-tests' && (
          <CambridgeTests
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addTestEntry={addTestEntry}
            removeTestEntry={removeTestEntry}
          />
        )}
        {activeSection === 'toefl-tests' && (
          <TOEFLTests
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addTestEntry={addTestEntry}
            removeTestEntry={removeTestEntry}
          />
        )}
        {activeSection === 'pte-tests' && (
          <PTETests
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addTestEntry={addTestEntry}
            removeTestEntry={removeTestEntry}
          />
        )}
        {activeSection === 'ielts-tests' && (
          <IELTSTests
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addTestEntry={addTestEntry}
            removeTestEntry={removeTestEntry}
          />
        )}
        {activeSection === 'duolingo-tests' && (
          <DuolingoTests
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addTestEntry={addTestEntry}
            removeTestEntry={removeTestEntry}
          />
        )}
        {activeSection === 'senior-secondary-exams' && (
          <SeniorSecondaryExams
            formData={formData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addTestEntry={addTestEntry}
            removeTestEntry={removeTestEntry}
          />
        )}

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={saveTestingData}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Section'}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleSaveAndContinue}
            disabled={saving}
          >
            {saving ? 'Saving...' : getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestingForm;
