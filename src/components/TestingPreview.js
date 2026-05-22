import React from 'react';
import './TestingPreview.css';

const TestingPreview = ({ formData, onEditSection, onBackToForm, onFinalSubmit, saving, message }) => {
  return (
    <div className="testing-preview">
      <div className="preview-header">
        <h2>Testing Preview</h2>
        <p>Review your testing information before final submission</p>
      </div>

      <div className="preview-sections">
        {/* Tests Taken Preview */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Tests Taken</h3>
            <button 
              className="edit-section-btn"
              onClick={() => onEditSection('tests-taken')}
            >
              Edit
            </button>
          </div>
          <div className="preview-content">
            <p><strong>Self-report scores:</strong> {formData.selfReportScores ? formData.selfReportScores.charAt(0).toUpperCase() + formData.selfReportScores.slice(1) : 'Not answered'}</p>
            {formData.selfReportScores === 'yes' && (
              <p><strong>Tests to report:</strong> {formData.testsToReport && formData.testsToReport.length > 0 ? formData.testsToReport.join(', ') : 'No tests selected'}</p>
            )}
            <p><strong>International promotion exams:</strong> {formData.internationalPromotionExams ? formData.internationalPromotionExams.charAt(0).toUpperCase() + formData.internationalPromotionExams.slice(1) : 'Not answered'}</p>
          </div>
        </div>

        {/* ACT Tests Preview */}
        {formData.testsToReport?.includes('act-tests') && (
          <div className="preview-section">
            <div className="preview-section-header">
              <h3>ACT Tests</h3>
              <button 
                className="edit-section-btn"
                onClick={() => onEditSection('act-tests')}
              >
                Edit
              </button>
            </div>
            <div className="preview-content">
              <p><strong>Past ACT scores to report:</strong> {formData.pastACTScores || 'Not answered'}</p>
              <p><strong>Future ACT sittings expected:</strong> {formData.futureACTSittings || 'Not answered'}</p>
              {formData.highestCompositeScore && (
                <p><strong>Highest Composite Score:</strong> {formData.highestCompositeScore} (Date: {formData.highestCompositeDate || 'Not specified'})</p>
              )}
            </div>
          </div>
        )}

        {/* SAT Tests Preview */}
        {formData.testsToReport?.includes('sat-tests') && (
          <div className="preview-section">
            <div className="preview-section-header">
              <h3>SAT Tests</h3>
              <button 
                className="edit-section-btn"
                onClick={() => onEditSection('sat-tests')}
              >
                Edit
              </button>
            </div>
            <div className="preview-content">
              <p><strong>Past SAT scores to report:</strong> {formData.pastSATScores || 'Not answered'}</p>
              <p><strong>Future SAT sittings expected:</strong> {formData.futureSATSittings || 'Not answered'}</p>
              {formData.satHighestTotalScore && (
                <p><strong>Highest Total Score:</strong> {formData.satHighestTotalScore} (Date: {formData.satHighestTotalDate || 'Not specified'})</p>
              )}
            </div>
          </div>
        )}

        {/* SAT Subject Tests Preview */}
        {formData.testsToReport?.includes('sat-subject-tests') && (
          <div className="preview-section">
            <div className="preview-section-header">
              <h3>SAT Subject Tests</h3>
              <button 
                className="edit-section-btn"
                onClick={() => onEditSection('sat-subject-tests')}
              >
                Edit
              </button>
            </div>
            <div className="preview-content">
              <p><strong>Number of tests:</strong> {formData.satSubjectTests ? formData.satSubjectTests.length : 0}</p>
              {formData.satSubjectTests && formData.satSubjectTests.length > 0 && (
                <div>
                  <p><strong>Test Details:</strong></p>
                  {formData.satSubjectTests.map((test, index) => (
                    <div key={index} style={{marginLeft: '20px', marginBottom: '10px'}}>
                      <p><strong>Test {index + 1}:</strong></p>
                      <p style={{marginLeft: '10px'}}><strong>Date:</strong> {test.date || 'Not specified'}</p>
                      <p style={{marginLeft: '10px'}}><strong>Subject:</strong> {test.subject || 'Not specified'}</p>
                      <p style={{marginLeft: '10px'}}><strong>Score:</strong> {test.score || 'Not specified'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AP Subject Tests Preview */}
        {formData.testsToReport?.includes('ap-subject-tests') && (
          <div className="preview-section">
            <div className="preview-section-header">
              <h3>AP Subject Tests</h3>
              <button 
                className="edit-section-btn"
                onClick={() => onEditSection('ap-subject-tests')}
              >
                Edit
              </button>
            </div>
            <div className="preview-content">
              <p><strong>Number of tests:</strong> {formData.apSubjectTests ? formData.apSubjectTests.length : 0}</p>
              {formData.apSubjectTests && formData.apSubjectTests.length > 0 && (
                <div>
                  <p><strong>Test Details:</strong></p>
                  {formData.apSubjectTests.map((test, index) => (
                    <div key={index} style={{marginLeft: '20px', marginBottom: '10px'}}>
                      <p><strong>Test {index + 1}:</strong> {test.name} - Score: {test.score} - Year: {test.year}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* IB Subject Tests Preview */}
        {formData.testsToReport?.includes('ib-subject-tests') && (
          <div className="preview-section">
            <div className="preview-section-header">
              <h3>IB Subject Tests</h3>
              <button 
                className="edit-section-btn"
                onClick={() => onEditSection('ib-subject-tests')}
              >
                Edit
              </button>
            </div>
            <div className="preview-content">
              <p><strong>Number of tests:</strong> {formData.ibSubjectTests ? formData.ibSubjectTests.length : 0}</p>
              {formData.ibSubjectTests && formData.ibSubjectTests.length > 0 && (
                <div>
                  <p><strong>Test Details:</strong></p>
                  {formData.ibSubjectTests.map((test, index) => (
                    <div key={index} style={{marginLeft: '20px', marginBottom: '10px'}}>
                      <p><strong>Test {index + 1}:</strong> {test.subject} ({test.level}) - Score: {test.score}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cambridge Exams Preview */}
        {formData.testsToReport?.includes('cambridge') && (
          <div className="preview-section">
            <div className="preview-section-header">
              <h3>Cambridge Exams</h3>
              <button 
                className="edit-section-btn"
                onClick={() => onEditSection('cambridge')}
              >
                Edit
              </button>
            </div>
            <div className="preview-content">
              <p><strong>Number of exams:</strong> {formData.cambridgeTests ? formData.cambridgeTests.length : 0}</p>
              {formData.cambridgeTests && formData.cambridgeTests.length > 0 && (
                <div>
                  <p><strong>Exam Details:</strong></p>
                  {formData.cambridgeTests.map((exam, index) => (
                    <div key={index} style={{marginLeft: '20px', marginBottom: '10px'}}>
                      <p><strong>Exam {index + 1}:</strong> {exam.subject} ({exam.level}) - Grade: {exam.grade} - Year: {exam.year}</p>
                    </div>
                  ))}
                </div>
              )}
              {formData.cambridgeCertificateDetails?.level && (
                <p><strong>Certificate Level:</strong> {formData.cambridgeCertificateDetails.level} (Date: {formData.cambridgeCertificateDetails.date || 'Not specified'})</p>
              )}
            </div>
          </div>
        )}

        {/* TOEFL iBT Preview */}
        {formData.testsToReport?.includes('toefl-ibt') && (
          <div className="preview-section">
            <div className="preview-section-header">
              <h3>TOEFL iBT</h3>
              <button 
                className="edit-section-btn"
                onClick={() => onEditSection('toefl-ibt')}
              >
                Edit
              </button>
            </div>
            <div className="preview-content">
              <p><strong>Past TOEFL tests:</strong> {formData.toeflPastTests || 'Not answered'}</p>
              <p><strong>Future TOEFL sittings:</strong> {formData.toeflFutureSittings || 'Not answered'}</p>
              {formData.toeflHighestTotalScore && (
                <p><strong>Highest Total Score:</strong> {formData.toeflHighestTotalScore} (Date: {formData.toeflTotalScoreDate || 'Not specified'})</p>
              )}
            </div>
          </div>
        )}

        {/* PTE Academic Tests Preview */}
        {formData.testsToReport?.includes('pte-academic-tests') && (
          <div className="preview-section">
            <div className="preview-section-header">
              <h3>PTE Academic Tests</h3>
              <button 
                className="edit-section-btn"
                onClick={() => onEditSection('pte-academic-tests')}
              >
                Edit
              </button>
            </div>
            <div className="preview-content">
              <p><strong>Past PTE tests:</strong> {formData.ptePastTests || 'Not answered'}</p>
              <p><strong>Future PTE sittings:</strong> {formData.pteFutureSittings || 'Not answered'}</p>
              {formData.pteHighestTotalScore && (
                <p><strong>Highest Total Score:</strong> {formData.pteHighestTotalScore}</p>
              )}
            </div>
          </div>
        )}

        {/* IELTS Preview */}
        {formData.testsToReport?.includes('ielts') && (
          <div className="preview-section">
            <div className="preview-section-header">
              <h3>IELTS</h3>
              <button 
                className="edit-section-btn"
                onClick={() => onEditSection('ielts')}
              >
                Edit
              </button>
            </div>
            <div className="preview-content">
              <p><strong>Past IELTS tests:</strong> {formData.ieltsPastTests || 'Not answered'}</p>
              <p><strong>Future IELTS sittings:</strong> {formData.ieltsFutureSittings || 'Not answered'}</p>
              {formData.ieltsHighestOverallScore && (
                <p><strong>Highest Overall Score:</strong> {formData.ieltsHighestOverallScore} (Date: {formData.ieltsOverallScoreDate || 'Not specified'})</p>
              )}
            </div>
          </div>
        )}

        {/* Duolingo English Test Preview */}
        {formData.testsToReport?.includes('duolingo-english-test') && (
          <div className="preview-section">
            <div className="preview-section-header">
              <h3>Duolingo English Test</h3>
              <button 
                className="edit-section-btn"
                onClick={() => onEditSection('duolingo-english-test')}
              >
                Edit
              </button>
            </div>
            <div className="preview-content">
              <p><strong>Past Duolingo tests:</strong> {formData.duolingoPastTests || 'Not answered'}</p>
              <p><strong>Future Duolingo sittings:</strong> {formData.duolingoFutureSittings || 'Not answered'}</p>
              {formData.duolingoHighestTotalScore && (
                <p><strong>Highest Total Score:</strong> {formData.duolingoHighestTotalScore} (Date: {formData.duolingoTotalScoreDate || 'Not specified'})</p>
              )}
            </div>
          </div>
        )}
      </div>

      {message && message.text && (
        <div className={`preview-message ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="preview-actions">
        <button 
          className="preview-secondary-button"
          onClick={onBackToForm}
          disabled={saving}
        >
          ← Back to Form
        </button>
        <button 
          className="preview-primary-button"
          onClick={onFinalSubmit}
          disabled={saving}
        >
          {saving ? 'Submitting...' : 'Submit Testing'}
        </button>
      </div>
    </div>
  );
};

export default TestingPreview;