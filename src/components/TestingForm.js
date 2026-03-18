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

  // Optional: list of sections (for future use)
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

  // Main form state
  // NOTE: Backend (firstTestingController) calculates testingCompletion & testingProgress
  const [formData, setFormData] = useState({
    // Tests Taken Section
    selfReportScores: '',
    testsToReport: [],
    internationalPromotionExams: '',

    // ACT Tests
    pastACTScores: '',
    futureACTSittings: '',
    highestCompositeScore: '',
    highestCompositeDate: '',
    highestMathScore: '',
    highestMathDate: '',
    highestEnglishScore: '',
    highestEnglishDate: '',
    highestReadingScore: '',
    highestReadingDate: '',
    reportScienceScore: '',
    highestScienceScore: '',
    highestScienceDate: '',
    reportWritingScore: '',
    highestWritingScore: '',
    highestWritingDate: '',
    futureTestDate1: '',
    futureTestDate2: '',
    futureTestDate3: '',

    // SAT Tests
    pastSATScores: '',
    futureSATSittings: '',
    satHighestMathScore: '',
    satHighestMathDate: '',
    satHighestReadingScore: '',
    satHighestReadingDate: '',
    satHighestWritingScore: '',
    satHighestWritingDate: '',
    satHighestTotalScore: '',
    satHighestTotalDate: '',
    satFutureTestDate1: '',
    satFutureTestDate2: '',
    satFutureTestDate3: '',

    // SAT Subject Tests
    satSubjectTests: [],

    // AP Subject Tests
    apSubjectTests: [],

    // IB Subject Tests
    ibSubjectTests: [],

    // Cambridge
    cambridgeNumberOfTests: '',
    cambridgeTests: [],
    cambridgeCertificateReport: '',
    cambridgeCertificateDetails: {
      level: '',
      date: '',
    },

    // TOEFL iBT
    toeflPastTests: '',
    toeflFutureSittings: '',
    toeflHighestReadingScore: '',
    toeflReadingScoreDate: '',
    toeflHighestSpeakingScore: '',
    toeflSpeakingScoreDate: '',
    toeflHighestListeningScore: '',
    toeflListeningScoreDate: '',
    toeflHighestWritingScore: '',
    toeflWritingScoreDate: '',
    toeflHighestTotalScore: '',
    toeflTotalScoreDate: '',
    toeflFutureTestDate1: '',
    toeflFutureTestDate2: '',
    toeflFutureTestDate3: '',

    // PTE Academic Tests
    ptePastTests: '',
    pteFutureSittings: '',
    pteHighestListeningScore: '',
    pteListeningScoreDate: '',
    pteHighestReadingScore: '',
    pteReadingScoreDate: '',
    pteHighestSpeakingScore: '',
    pteSpeakingScoreDate: '',
    pteHighestWritingScore: '',
    pteWritingScoreDate: '',
    pteHighestGrammarScore: '',
    pteGrammarScoreDate: '',
    pteHighestOralFluencyScore: '',
    pteOralFluencyScoreDate: '',
    pteHighestPronunciationScore: '',
    ptePronunciationScoreDate: '',
    pteHighestSpellingScore: '',
    pteSpellingScoreDate: '',
    pteHighestVocabularyScore: '',
    pteVocabularyScoreDate: '',
    pteHighestWrittenDiscourseScore: '',
    pteWrittenDiscourseScoreDate: '',
    pteFutureTestDate1: '',
    pteFutureTestDate2: '',
    pteFutureTestDate3: '',

    // IELTS Fields
    ieltsPastTests: '',
    ieltsFutureSittings: '',
    ieltsHighestListeningScore: '',
    ieltsListeningScoreDate: '',
    ieltsHighestReadingScore: '',
    ieltsReadingScoreDate: '',
    ieltsHighestWritingScore: '',
    ieltsWritingScoreDate: '',
    ieltsHighestSpeakingScore: '',
    ieltsSpeakingScoreDate: '',
    ieltsHighestOverallScore: '',
    ieltsOverallScoreDate: '',
    ieltsFutureTestDate1: '',
    ieltsFutureTestDate2: '',
    ieltsFutureTestDate3: '',

    // Duolingo English Test Fields
    duolingoPastTests: '',
    duolingoFutureSittings: '',
    duolingoFutureTestDate1: '',
    duolingoFutureTestDate2: '',
    duolingoFutureTestDate3: '',
    duolingoHighestLiteracyScore: '',
    duolingoLiteracyScoreDate: '',
    duolingoHighestComprehensionScore: '',
    duolingoComprehensionScoreDate: '',
    duolingoHighestConversationScore: '',
    duolingoConversationScoreDate: '',
    duolingoHighestProductionScore: '',
    duolingoProductionScoreDate: '',
    duolingoHighestTotalScore: '',
    duolingoTotalScoreDate: '',

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
          // Ensure nested/array fields are always defined
          testsToReport: testingData.testsToReport || [],
          satSubjectTests: testingData.satSubjectTests || [],
          apSubjectTests: testingData.apSubjectTests || [],
          ibSubjectTests: testingData.ibSubjectTests || [],
          cambridgeTests: testingData.cambridgeTests || [],
          seniorSecondaryExams: testingData.seniorSecondaryExams || [],
          cambridgeCertificateDetails:
            testingData.cambridgeCertificateDetails || { level: '', date: '' },
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
      // For a brand new user you might get 404 - you can ignore that
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
        internationalPromotionExams:
          testingData.internationalPromotionExams || '',
        // A few useful counts for dashboard display, etc.
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

  // Handle simple inputs + nested objects like cambridgeCertificateDetails.level
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

    if (
      name === 'internationalPromotionExams' ||
      name === 'testsToReport' ||
      name.startsWith('cambridge') ||
      name.startsWith('toefl') ||
      name.startsWith('pte') ||
      name.startsWith('ielts') ||
      name.startsWith('duolingo')
    ) {
      updateLocalStorageWithTestingData(
        { ...formData, [name]: value },
        progress
      );
      setUpdateTrigger((prev) => prev + 1);
    }
  };

  // For arrays / complex values coming from child components
  const handleComplexChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (
      field === 'testsToReport' ||
      field.startsWith('cambridge') ||
      field.startsWith('toefl') ||
      field.startsWith('pte') ||
      field.startsWith('ielts') ||
      field.startsWith('duolingo')
    ) {
      updateLocalStorageWithTestingData(
        { ...formData, [field]: value },
        progress
      );
      setUpdateTrigger((prev) => prev + 1);
    }
  };

  // FIXED: Updated handleArrayChange to use functional update
  const handleArrayChange = (field, value) => {
    setFormData((prevFormData) => {
      const updatedFormData = {
        ...prevFormData,
        [field]: prevFormData[field].includes(value)
          ? prevFormData[field].filter((item) => item !== value)
          : [...prevFormData[field], value],
      };

      // Update localStorage with the UPDATED form data immediately
      if (field === 'testsToReport') {
        updateLocalStorageWithTestingData(updatedFormData, progress);
        setUpdateTrigger((prev) => prev + 1);
      }

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
    const updatedFormData = {
      ...formData,
      [field]: [],
    };

    setFormData(updatedFormData);

    if (field === 'testsToReport') {
      updateLocalStorageWithTestingData(updatedFormData, progress);
      setUpdateTrigger((prev) => prev + 1);
    }
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

  // 🔑 Main save function – now very simple:
  // Backend (firstTestingController) does all validation & progress.
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

        // The backend sends back the updated testing document
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
        // From tests-taken, go to first selected test
        if (selectedTests.length > 0) {
          const firstTest = selectedTests[0];
          navigate(`/firstyear/dashboard/testing/${firstTest}`);
        } else {
          navigate('/firstyear/dashboard');
        }
      } else {
        // From a test section, find next test in sequence
        const currentIndex = selectedTests.indexOf(activeSection);
        
        if (currentIndex < selectedTests.length - 1) {
          // Go to next test in sequence
          const nextTest = selectedTests[currentIndex + 1];
          navigate(`/firstyear/dashboard/testing/${nextTest}`);
        } else {
          // No more tests, go to dashboard
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
    // Final submit just calls saveTesting;
    // backend still validates and sets final progress.
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
      {/* Header with Back Button and Centered Title */}
      <div className="testing-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
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
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{progress}% Complete</span>
        </div>
      </div>

      {/* Main Form Content */}
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
            {/* Render the active section component */}
            {activeSection === 'tests-taken' && (
              <TestsTakenSection
                formData={formData}
                handleInputChange={handleInputChange}
                handleArrayChange={handleArrayChange}
                clearAnswer={clearAnswer}
                clearArrayAnswer={clearArrayAnswer}
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
              />
            )}

            {activeSection === 'sat-subject-tests' && (
              <SATSubjectTestsSection
                formData={formData}
                handleInputChange={handleInputChange}
              />
            )}

            {activeSection === 'ap-subject-tests' && (
              <APSubjectTestsSection
                formData={formData}
                handleInputChange={handleInputChange}
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

            {/* Action Buttons */}
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