// src/components/TestingForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './TestingForm.css';

// Import testing section components
import TestsTakenSection from './testing-sections/TestsTakenSection';
import ACTTestsSection from './testing-sections/ACTTestsSection';
import SATTestsSection from './testing-sections/SATTestsSection';
import SATSubjectTestsSection from './testing-sections/SATSubjectTestsSection';
import APSubjectTestsSection from './testing-sections/APSubjectTestsSection';
import IBSubjectTests from './testing-sections/IBSubjectTests';
import CambridgeSection from './testing-sections/CambridgeSection';
import TOEFLiBTSection from './testing-sections/TOEFLiBTSection';
import PTEAcademicTestsSection from './testing-sections/PTEAcademicTestsSection';
import IELTSSection from './testing-sections/IELTSSection';
import DuolingoEnglishTestSection from './testing-sections/DuolingoEnglishTestSection';
import TestingPreview from './TestingPreview';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const TestingForm = () => {
  const navigate = useNavigate();
  const { '*': section } = useParams();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('tests-taken');
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    caid: ''
  });

  // Sections list
  const sections = [
    'tests-taken',
    'act-tests',
    'sat-tests',
    'sat-subject-tests',
    'ap-subject-tests',
    'ib-subject-tests',
    'cambridge',
    'toefl-ibt',
    'pte-academic-tests',
    'ielts',
    'duolingo-english-test',
    'senior-secondary-exams',
  ];

  // UPDATED: Main form state with NEW schema structure
  const [formData, setFormData] = useState({
    // Tests Taken Section
    selfReportScores: '',
    testsToReport: [],
    internationalPromotionExams: '',

    // ACT Tests - New attempt-based structure
    pastACTScores: '',
    actAttempts: [],  // Array of { date, composite, english, math, reading, science, writing, percentile }

    // SAT Tests - New attempt-based structure
    pastSATScores: '',
    satAttempts: [],  // Array of { date, total, math, reading, writing, percentile }

    // SAT Subject Tests
    numberOfSATSubjectTests: '',
    satSubjectTests: [],  // Array of { subject, score, date }

    // AP Subject Tests
    numberOfAPTests: '',
    apSubjectTests: [],  // Array of { subject, score, month, year }

    // IB Subject Tests
    numberOfIBTests: '',
    ibSubjectTests: [],  // Array of { subject, level, score, year }

    // Cambridge Exams
    cambridgeNumberOfTests: '',
    cambridgeTests: [],  // Array of { subject, level, grade, date }

    // TOEFL iBT - Simplified structure
    toeflPastTests: '',
    toeflTestDate: '',
    toeflReadingScore: '',
    toeflListeningScore: '',
    toeflSpeakingScore: '',
    toeflWritingScore: '',
    toeflTotalScore: '',

    // PTE Academic - Simplified structure
    ptePastTests: '',
    pteTestDate: '',
    pteListeningScore: '',
    pteReadingScore: '',
    pteSpeakingScore: '',
    pteWritingScore: '',
    pteGrammarScore: '',
    pteVocabularyScore: '',

    // IELTS - Simplified structure
    ieltsPastTests: '',
    ieltsTestDate: '',
    ieltsListeningScore: '',
    ieltsReadingScore: '',
    ieltsWritingScore: '',
    ieltsSpeakingScore: '',
    ieltsOverallBandScore: '',

    // Duolingo - Simplified structure
    duolingoPastTests: '',
    duolingoTestDate: '',
    duolingoLiteracyScore: '',
    duolingoComprehensionScore: '',
    duolingoConversationScore: '',
    duolingoProductionScore: '',
    duolingoTotalScore: '',

    // Senior Secondary Leaving Examinations
    seniorSecondaryExams: [],
  });

  // Set active section based on URL
  useEffect(() => {
    if (section) {
      setActiveSection(section);
    } else {
      navigate('/firstyear/dashboard/testing/tests-taken', { replace: true });
    }
  }, [section, navigate]);

  // Fetch existing testing data from backend
  const fetchTestingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/sign-in');
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/students/testing/detailed`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.testing) {
        const testingData = response.data.testing;

        const mergedData = {
          ...formData,
          ...testingData,
          // Ensure array fields are always defined
          testsToReport: testingData.testsToReport || [],
          actAttempts: testingData.actAttempts || [],
          satAttempts: testingData.satAttempts || [],
          satSubjectTests: testingData.satSubjectTests || [],
          apSubjectTests: testingData.apSubjectTests || [],
          ibSubjectTests: testingData.ibSubjectTests || [],
          cambridgeTests: testingData.cambridgeTests || [],
          seniorSecondaryExams: testingData.seniorSecondaryExams || [],
        };

        setFormData(mergedData);
        setProgress(response.data.testingProgress || 0);

        updateLocalStorageWithTestingData(
          mergedData,
          response.data.testingProgress || 0
        );
      }
    } catch (error) {
      console.error('Error fetching testing data:', error);
      if (error.response?.status !== 404) {
        setMessage({
          type: 'error',
          text: 'Failed to load testing data. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Update localStorage with testing data
  const updateLocalStorageWithTestingData = (testingData, testingProgress) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const updatedUserData = {
      ...userData,
      testingProgress: testingProgress,
      testingData: {
        testsToReport: testingData.testsToReport || [],
        internationalPromotionExams: testingData.internationalPromotionExams || '',
        actTests: testingData.pastACTScores || '0',
        satTests: testingData.pastSATScores || '0',
        ieltsTests: testingData.ieltsPastTests || '0',
        duolingoTests: testingData.duolingoPastTests || '0',
      },
      applicationProgress: {
        ...userData.applicationProgress,
        testing: testingProgress,
      },
    };

    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    fetchTestingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── CV auto-fill callback ──
  const handleCVDataExtracted = (mappedUpdates) => {
    console.log('📥 CV Data Extracted:', mappedUpdates);
    
    setFormData((prev) => {
      // Merge testsToReport additively
      let mergedTestsToReport = prev.testsToReport;
      if (mappedUpdates.testsToReport && mappedUpdates.testsToReport.length > 0) {
        mergedTestsToReport = Array.from(
          new Set([...prev.testsToReport, ...mappedUpdates.testsToReport])
        );
      }

      const next = {
        ...prev,
        ...mappedUpdates,
        testsToReport: mergedTestsToReport,
      };

      updateLocalStorageWithTestingData(next, progress);
      setUpdateTrigger((t) => t + 1);
      return next;
    });
  };

  // ── Score document auto-fill callback ──
  const handleScoreDocExtracted = (extractedFields, testType) => {
    console.log(`📥 Score document extracted for ${testType}:`, extractedFields);
    
    setFormData((prev) => {
      const next = {
        ...prev,
        ...extractedFields,
      };
      
      updateLocalStorageWithTestingData(next, progress);
      setUpdateTrigger((t) => t + 1);
      return next;
    });
  };

  // Handle simple inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // For arrays / complex values from child components
  const handleComplexChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        [field]: prevFormData[field].includes(value)
          ? prevFormData[field].filter((item) => item !== value)
          : [...prevFormData[field], value],
      };
      return updatedFormData;
    });
  };

  const clearAnswer = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const clearArrayAnswer = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [],
    }));
  };

  const clearRelatedFields = (mainField, relatedFields) => {
    const updatedFormData = { ...formData };
    updatedFormData[mainField] = '';

    relatedFields.forEach((field) => {
      updatedFormData[field] = '';
    });

    setFormData(updatedFormData);
    updateLocalStorageWithTestingData(updatedFormData, progress);
    setUpdateTrigger((prev) => prev + 1);
  };

  // Main save function
  const saveTesting = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/sign-in');
        return;
      }

      const response = await axios.put(
        `${API_URL}/api/students/testing`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const newTestingProgress = response.data.testingProgress || 0;

        setMessage({
          type: 'success',
          text: `Section saved successfully! Progress: ${newTestingProgress}%`,
        });

        setProgress(newTestingProgress);

        if (response.data.testing) {
          setFormData((prev) => ({
            ...prev,
            ...response.data.testing,
          }));
          updateLocalStorageWithTestingData(
            response.data.testing,
            newTestingProgress
          );
        } else {
          updateLocalStorageWithTestingData(formData, newTestingProgress);
        }

        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 5000);

        return true;
      } else {
        throw new Error('Failed to save testing data');
      }
    } catch (error) {
      console.error('Error saving testing data:', error);
      setMessage({
        type: 'error',
        text:
          error.response?.data?.message ||
          'Failed to save testing data. Please try again.',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    const success = await saveTesting();

    if (success) {
      const selectedTests = formData.testsToReport || [];
      
      if (activeSection === 'tests-taken') {
        if (selectedTests.length > 0) {
          const firstTest = selectedTests[0];
          navigate(`/firstyear/dashboard/testing/${firstTest}`);
        } else {
          navigate('/firstyear/dashboard');
        }
      } else {
        const currentIndex = selectedTests.indexOf(activeSection);
        
        if (currentIndex < selectedTests.length - 1) {
          const nextTest = selectedTests[currentIndex + 1];
          navigate(`/firstyear/dashboard/testing/${nextTest}`);
        } else {
          navigate('/firstyear/dashboard');
        }
      }
    }
  };

  const handleSaveOnly = async () => {
    await saveTesting();
  };

  const handleBackToDashboard = () => {
    navigate('/firstyear/dashboard');
  };

  const handleEditSection = (section) => {
    setShowPreview(false);
    navigate(`/firstyear/dashboard/testing/${section}`);
  };

  const handleFinalSubmit = async () => {
    const success = await saveTesting();
    if (success) {
      setMessage({
        type: 'success',
        text: 'Testing section saved. Redirecting to dashboard...',
      });
      setTimeout(() => {
        navigate('/firstyear/dashboard');
      }, 3000);
    }
  };

  const handleBackToForm = () => {
    setShowPreview(false);
  };

  if (loading) {
    return (
      <div className="testing-loading">
        <div className="loading-spinner"></div>
        <p>Loading your testing information...</p>
      </div>
    );
  }

  return (
    <div className="testing-container">
      <div className="testing-header">
        <div className="header-bottom">
          <button className="back-button" onClick={handleBackToDashboard}>
            ← Back to Dashboard
          </button>
          <div className="page-title">
            <h1>
              {activeSection === 'tests-taken'
                ? 'Complete your Common Application - Testing'
                : activeSection === 'ielts'
                ? 'Testing - IELTS'
                : activeSection === 'duolingo-english-test'
                ? 'Testing - Duolingo English Test'
                : `Testing - ${activeSection
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}`}
            </h1>
          </div>
          <div className="progress-wrapper">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="progress-text">{progress}% Complete</span>
          </div>
        </div>
      </div>

      <div className="testing-content">
        {message.text && (
          <div
            className={`alert ${
              message.type === 'error' ? 'alert-error' : 'alert-success'
            }`}
          >
            {message.text}
          </div>
        )}

        {showPreview ? (
          <TestingPreview
            formData={formData}
            onEditSection={handleEditSection}
            onBackToForm={handleBackToForm}
            onFinalSubmit={handleFinalSubmit}
            saving={saving}
            message={message}
          />
        ) : (
          <>
            {activeSection === 'tests-taken' && (
              <TestsTakenSection
                formData={formData}
                handleInputChange={handleInputChange}
                handleArrayChange={handleArrayChange}
                clearAnswer={clearAnswer}
                clearArrayAnswer={clearArrayAnswer}
                onCVDataExtracted={handleCVDataExtracted}
                onScoreDocExtracted={handleScoreDocExtracted}
              />
            )}

            {activeSection === 'act-tests' && (
              <ACTTestsSection
                formData={formData}
                handleInputChange={handleInputChange}
                clearAnswer={clearAnswer}
                clearRelatedFields={clearRelatedFields}
              />
            )}

            {activeSection === 'sat-tests' && (
              <SATTestsSection
                formData={formData}
                handleInputChange={handleInputChange}
                clearAnswer={clearAnswer}
                clearRelatedFields={clearRelatedFields}
              />
            )}

            {activeSection === 'sat-subject-tests' && (
              <SATSubjectTestsSection
                formData={formData}
                handleInputChange={handleInputChange}
                clearAnswer={clearAnswer}
                clearRelatedFields={clearRelatedFields}
              />
            )}

            {activeSection === 'ap-subject-tests' && (
              <APSubjectTestsSection
                formData={formData}
                handleInputChange={handleInputChange}
                clearAnswer={clearAnswer}
              />
            )}

            {activeSection === 'ib-subject-tests' && (
              <IBSubjectTests
                formData={formData}
                handleInputChange={handleInputChange}
                clearAnswer={clearAnswer}
              />
            )}

            {activeSection === 'cambridge' && (
              <CambridgeSection
                formData={formData}
                handleInputChange={handleInputChange}
                handleComplexChange={handleComplexChange}
                clearAnswer={clearAnswer}
              />
            )}

            {activeSection === 'toefl-ibt' && (
              <TOEFLiBTSection
                formData={formData}
                handleInputChange={handleInputChange}
                clearAnswer={clearAnswer}
                clearRelatedFields={clearRelatedFields}
              />
            )}

            {activeSection === 'pte-academic-tests' && (
              <PTEAcademicTestsSection
                formData={formData}
                handleInputChange={handleInputChange}
                clearAnswer={clearAnswer}
                clearRelatedFields={clearRelatedFields}
              />
            )}

            {activeSection === 'ielts' && (
              <IELTSSection
                formData={formData}
                handleInputChange={handleInputChange}
                clearAnswer={clearAnswer}
                clearRelatedFields={clearRelatedFields}
              />
            )}

            {activeSection === 'duolingo-english-test' && (
              <DuolingoEnglishTestSection
                formData={formData}
                handleInputChange={handleInputChange}
                clearAnswer={clearAnswer}
                clearRelatedFields={clearRelatedFields}
              />
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveOnly}
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
                {saving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TestingForm;