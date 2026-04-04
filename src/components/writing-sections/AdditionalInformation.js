import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdditionalInformation.css';

const AdditionalInformation = () => {
  const navigate = useNavigate();
  const [shareCircumstances, setShareCircumstances]       = useState(null);
  const [shareQualifications, setShareQualifications]     = useState(null);
  const [circumstancesText, setCircumstancesText]         = useState('');
  const [qualificationsText, setQualificationsText]       = useState('');
  const [circumstancesWordCount, setCircumstancesWordCount] = useState(0);
  const [qualificationsWordCount, setQualificationsWordCount] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const API_URL = process.env.REACT_APP_API_URL;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const circumstancesList = [
    "Access to a safe and quiet study space",
    "Access to reliable technology and internet",
    "Community disruption (violence, protests, teacher strikes, etc.)",
    "Discrimination",
    "Family disruptions (divorce, incarceration, job loss, health, loss of a family member, addiction, etc.)",
    "Family or other obligations (care-taking, financial support, etc.)",
    "Housing instability, displacement, or homelessness",
    "Military deployment or activation",
    "Natural disasters",
    "Physical health and mental well-being",
    "War, conflict, or other hardships"
  ];

  useEffect(() => {
    const words = circumstancesText.trim() ? circumstancesText.trim().split(/\s+/).length : 0;
    setCircumstancesWordCount(words);
  }, [circumstancesText]);

  useEffect(() => {
    const words = qualificationsText.trim() ? qualificationsText.trim().split(/\s+/).length : 0;
    setQualificationsWordCount(words);
  }, [qualificationsText]);

  useEffect(() => {
    loadAdditionalInfoData();
  }, []);

  const loadAdditionalInfoData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/writing`, {
        headers: getAuthHeaders()
      });
      if (response.data.success && response.data.writing.additionalInformation) {
        const { additionalInformation } = response.data.writing;
        setShareCircumstances(additionalInformation.shareCircumstances);
        setShareQualifications(additionalInformation.shareQualifications);
        setCircumstancesText(additionalInformation.circumstancesText || '');
        setQualificationsText(additionalInformation.qualificationsText || '');
      }
    } catch (error) {
      console.error('Error loading additional information data:', error);
    }
  };

  const getWordCountColor = (count, max) => (count > max ? '#dc2626' : '#16a34a');

  const handleClearCircumstances  = () => { setShareCircumstances(null);  setCircumstancesText(''); };
  const handleClearQualifications = () => { setShareQualifications(null); setQualificationsText(''); };

  const buildPayload = () => ({
    circumstances:   { share: shareCircumstances,  text: circumstancesText },
    qualifications:  { share: shareQualifications, text: qualificationsText }
  });

  const handleSaveDraft = async () => {
    setLoading(true);
    setSaveStatus('Saving...');
    try {
      const response = await axios.put(
        `${API_URL}/api/writing/additional-information`,
        buildPayload(),
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        setSaveStatus('Draft saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveStatus(error.response?.data?.message
        ? `Error: ${error.response.data.message}`
        : 'Error saving draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (shareCircumstances === null || shareQualifications === null) {
      setSaveStatus('Please answer both questions');
      return;
    }
    if (shareCircumstances === 'yes' && circumstancesWordCount > 250) {
      setSaveStatus('Circumstances description cannot exceed 250 words');
      return;
    }
    if (shareQualifications === 'yes' && qualificationsWordCount > 300) {
      setSaveStatus('Qualifications description cannot exceed 300 words');
      return;
    }

    setLoading(true);
    setSaveStatus('Saving and completing...');
    try {
      const response = await axios.put(
        `${API_URL}/api/writing/additional-information`,
        buildPayload(),
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        setSaveStatus('Additional information saved successfully! Redirecting...');
        setTimeout(() => navigate('/firstyear/dashboard/'), 1500);
      }
    } catch (error) {
      console.error('Error saving additional information:', error);
      setSaveStatus(error.response?.data?.message
        ? `Error: ${error.response.data.message}`
        : 'Error saving information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── reusable text editor block ──────────────────────────── */
  const TextEditor = ({ value, onChange, placeholder, rows, wordCount, maxWords, label }) => (
    <div className="editor-container">
      <div className="editor-header">
        <h4>{label}</h4>
        <div className="word-count" style={{ color: getWordCountColor(wordCount, maxWords) }}>
          {wordCount}/{maxWords} words
          {wordCount > maxWords && <span className="word-count-warning"> (Exceeds limit)</span>}
        </div>
      </div>
      <textarea
        className="additional-textarea"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={loading}
        autoComplete="off"
        spellCheck
      />
      <div className="editor-toolbar">
        <div className="toolbar-buttons">
          <button className="toolbar-btn" title="Bold"        disabled={loading}>B</button>
          <button className="toolbar-btn" title="Italic"      disabled={loading}>I</button>
          <button className="toolbar-btn" title="Underline"   disabled={loading}>U</button>
          <button className="toolbar-btn" title="Bullet List" disabled={loading}>•</button>
        </div>
        <div className="toolbar-hint">
          Press Alt/Opt+F10 to navigate to the toolbar, or Alt/Opt+O for a list of keyboard shortcuts.
        </div>
      </div>
    </div>
  );

  /* ── reusable Yes/No radio group ─────────────────────────── */
  const YesNoGroup = ({ name, value, onChange, onClear }) => (
    <>
      <div className="radio-group">
        {['yes', 'no'].map(opt => (
          <label key={opt} className="radio-option">
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={onChange}
              disabled={loading}
            />
            <span className="radio-custom"></span>
            <span className="radio-label">{opt === 'yes' ? 'Yes' : 'No'}</span>
          </label>
        ))}
      </div>
      {value && (
        <button className="clear-answer-btn" onClick={onClear} disabled={loading}>
          Clear answer
        </button>
      )}
    </>
  );

  return (
    <div className="additional-information">
      <div className="additional-header">
        <h2>Additional Information</h2>
        <div className="additional-subtitle">
          Please use this space to tell us anything else you want us to know that you have not had the
          opportunity to describe elsewhere in your application.
        </div>
      </div>

      {saveStatus && (
        <div className={`save-status ${saveStatus.includes('Error') ? 'error' : saveStatus.includes('saved') || saveStatus.includes('Saved') ? 'success' : 'info'}`}>
          {saveStatus}
        </div>
      )}

      <div className="additional-info-content">
        {/* College Requirements */}
        <div className="college-requirements">
          <div className="requirements-summary">
            <div className="requirement-item">
              <span className="requirement-label">Courses &amp; Grades:</span>
              <span className="requirement-value">0 college(s) require</span>
            </div>
          </div>
        </div>

        {/* Circumstances Section */}
        <div className="circumstances-section">
          <h3>Circumstances you've experienced</h3>

          <div className="circumstances-list">
            <p>Sometimes a student's application and achievements may be impacted by challenges or other
            circumstances. This could involve:</p>
            <ul>
              {circumstancesList.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <p>
              If you're comfortable sharing, this information can help colleges better understand the context
              of your application. Colleges may use this information to provide you and your fellow students
              with support and resources.
            </p>
          </div>

          <div className="question-section">
            <p><strong>Would you like to share any details about challenges or other circumstances you've experienced?*</strong></p>
            <YesNoGroup
              name="circumstances"
              value={shareCircumstances}
              onChange={(e) => setShareCircumstances(e.target.value)}
              onClear={handleClearCircumstances}
            />
          </div>

          {shareCircumstances === 'yes' && (
            <TextEditor
              value={circumstancesText}
              onChange={(e) => setCircumstancesText(e.target.value)}
              placeholder="Please describe the challenges or circumstances and how they have impacted you."
              rows={8}
              wordCount={circumstancesWordCount}
              maxWords={250}
              label="Please describe the challenges or circumstances and how they have impacted you.*"
            />
          )}
        </div>

        {/* Qualifications Section */}
        <div className="qualifications-section">
          <h3>Additional qualifications</h3>

          <div className="question-section">
            <p><strong>Would you like to share any additional details or qualifications not reflected in the application?*</strong></p>
            <YesNoGroup
              name="qualifications"
              value={shareQualifications}
              onChange={(e) => setShareQualifications(e.target.value)}
              onClear={handleClearQualifications}
            />
          </div>

          {shareQualifications === 'yes' && (
            <TextEditor
              value={qualificationsText}
              onChange={(e) => setQualificationsText(e.target.value)}
              placeholder="Please provide any additional information you wish to share."
              rows={8}
              wordCount={qualificationsWordCount}
              maxWords={300}
              label="Please provide any additional information you wish to share.*"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="editor-actions">
          <button className="save-draft-btn" onClick={handleSaveDraft} disabled={loading}>
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            className="continue-btn"
            onClick={handleContinue}
            disabled={loading || shareCircumstances === null || shareQualifications === null}
          >
            {loading ? 'Saving...' : 'Complete Writing Section'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInformation;