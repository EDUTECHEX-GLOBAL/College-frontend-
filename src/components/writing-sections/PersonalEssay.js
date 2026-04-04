import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PersonalEssay.css';

const API_URL = process.env.REACT_APP_API_URL;

const essayPrompts = [
  { id: 1, text: "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story." },
  { id: 2, text: "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?" },
  { id: 3, text: "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?" },
  { id: 4, text: "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?" },
  { id: 5, text: "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others." },
  { id: 6, text: "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?" },
  { id: 7, text: "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design." },
];

const userColleges = [
  { id: 1, name: 'Harvard University', requiresEssay: true },
  { id: 2, name: 'University of Kansas', requiresEssay: false },
];

const PersonalEssay = () => {
  const navigate = useNavigate();
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [essayText, setEssayText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [showRequirements, setShowRequirements] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const collegesRequiringEssay    = userColleges.filter(c => c.requiresEssay);
  const collegesNotRequiringEssay = userColleges.filter(c => !c.requiresEssay);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  // Word count
  useEffect(() => {
    setWordCount(essayText.trim() ? essayText.trim().split(/\s+/).length : 0);
  }, [essayText]);

  // Load existing essay
  useEffect(() => {
    const loadEssayData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/writing`, { headers: getAuthHeaders() });
        if (response.data.success && response.data.writing.personalEssay) {
          const { personalEssay } = response.data.writing;
          if (personalEssay.selectedPrompt) {
            setSelectedPrompt(essayPrompts.find(p => p.id === personalEssay.selectedPrompt) || null);
          }
          setEssayText(personalEssay.essayContent || '');
          setUnderstood(personalEssay.understandingAcknowledged || false);
        }
      } catch (error) {
        console.error('Error loading essay data:', error);
      }
    };
    loadEssayData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getWordCountColor = () => {
    if (wordCount < 250 || wordCount > 650) return '#dc2626';
    return '#16a34a';
  };

  const buildPayload = () => ({
    selectedPrompt: selectedPrompt?.id,
    essayContent: essayText,
    understandingAcknowledged: understood,
  });

  const handleSaveDraft = async () => {
    if (!selectedPrompt) { setSaveStatus('Please select an essay prompt first'); return; }
    setLoading(true);
    setSaveStatus('Saving...');
    try {
      const response = await axios.put(`${API_URL}/api/writing/personal-essay`, buildPayload(), { headers: getAuthHeaders() });
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
    if (!selectedPrompt)  { setSaveStatus('Please select an essay prompt'); return; }
    if (wordCount > 650)  { setSaveStatus('Essay cannot exceed 650 words'); return; }
    if (!understood)      { setSaveStatus('Please acknowledge the understanding statement'); return; }

    setLoading(true);
    setSaveStatus('Saving and continuing...');
    try {
      const response = await axios.put(`${API_URL}/api/writing/personal-essay`, buildPayload(), { headers: getAuthHeaders() });
      if (response.data.success) {
        setSaveStatus('Saved successfully! Redirecting...');
        setTimeout(() => navigate('/firstyear/dashboard/writing/additional-information'), 1000);
      }
    } catch (error) {
      console.error('Error saving essay:', error);
      setSaveStatus(error.response?.data?.message
        ? `Error: ${error.response.data.message}`
        : 'Error saving essay. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveStatusClass = saveStatus.includes('Error') ? 'error'
    : saveStatus.includes('saved') || saveStatus.includes('Saved') ? 'success'
    : 'info';

  return (
    <div className="personal-essay">
      <div className="essay-header">
        <h2>Personal Essay</h2>
        <div className="essay-subtitle">
          Some colleges require submission of the personal essay with your application.
          You may submit a personal essay to any college, even if it is not required by that college.
        </div>
      </div>

      {saveStatus && (
        <div className={`save-status ${saveStatusClass}`}>{saveStatus}</div>
      )}

      {/* College Requirements */}
      <div className="college-requirements">
        <div className="requirements-header">
          <h3>College Requirements</h3>
          <button
            className="toggle-requirements"
            onClick={() => setShowRequirements(!showRequirements)}
          >
            {showRequirements ? 'Hide' : 'Show'} Requirements
          </button>
        </div>

        <div className="requirements-summary">
          <div className="requirement-item">
            <span className="requirement-label">Personal Essay:</span>
            <span className="requirement-value">{collegesRequiringEssay.length} college(s) require</span>
          </div>
          <div className="requirement-item">
            <span className="requirement-label">Courses &amp; Grades:</span>
            <span className="requirement-value">0 college(s) require</span>
          </div>
        </div>

        {showRequirements && (
          <div className="requirements-details">
            <div className="colleges-lists">
              <div className="colleges-requiring">
                <h4>Required</h4>
                <ul>
                  {collegesRequiringEssay.length === 0
                    ? <li className="no-colleges">No colleges require the personal essay</li>
                    : collegesRequiringEssay.map(c => <li key={c.id}>• {c.name}</li>)}
                </ul>
              </div>
              <div className="colleges-not-requiring">
                <h4>Not Required</h4>
                <ul>
                  {collegesNotRequiringEssay.length === 0
                    ? <li className="no-colleges">All colleges require the personal essay</li>
                    : collegesNotRequiringEssay.map(c => <li key={c.id}>• {c.name}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Essay Prompts */}
      <div className="essay-prompts">
        <h3>Essay Prompts</h3>
        <div className="prompts-description">
          The essay demonstrates your ability to write clearly and concisely on a selected topic
          and helps you distinguish yourself in your own voice. What do you want the readers of
          your application to know about you apart from courses, grades, and test scores? Choose
          the option that best helps you answer that question and write an essay of no more than
          650 words, using the prompt to inspire and structure your response. Remember: 650 words
          is your limit, not your goal. Use the full range if you need it, but don't feel
          obligated to do so. (The application won't accept a response shorter than 250 words.)
        </div>

        <div className="prompts-list">
          {essayPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`prompt-item ${selectedPrompt?.id === prompt.id ? 'selected' : ''}`}
              onClick={() => setSelectedPrompt(prompt)}
            >
              <div className="prompt-radio">
                <div className={`radio-circle ${selectedPrompt?.id === prompt.id ? 'selected' : ''}`} />
              </div>
              <div className="prompt-text">{prompt.text}</div>
            </div>
          ))}
        </div>

        {selectedPrompt && (
          <div className="selected-prompt-display">
            <h4>Selected Prompt:</h4>
            <div className="selected-prompt-text">{selectedPrompt.text}</div>
            <button className="clear-prompt-button" onClick={() => setSelectedPrompt(null)}>
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Essay Editor — shown only after a prompt is chosen */}
      {selectedPrompt && (
        <div className="essay-editor">
          <div className="editor-header">
            <h3>Write Your Essay</h3>
            <div className="word-count" style={{ color: getWordCountColor() }}>
              {wordCount} / 650 words
              {wordCount < 250 && (
                <span className="word-count-warning"> (Minimum 250 words required)</span>
              )}
            </div>
          </div>

          <div className="selected-prompt">
            <strong>Prompt: </strong>{selectedPrompt.text}
          </div>

          <div className="editor-container">
            <textarea
              className="essay-textarea"
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Please write an essay on the selected topic. You can type directly into the box, or paste text from another source."
              rows={20}
              disabled={loading}
            />
            <div className="editor-toolbar">
              <div className="toolbar-buttons">
                {['B', 'I', 'U', '•'].map((btn, i) => (
                  <button key={i} className="toolbar-btn" disabled={loading}>{btn}</button>
                ))}
              </div>
              <div className="toolbar-hint">
                Press Alt/Opt+F10 to navigate to the toolbar, or Alt/Opt+O for keyboard shortcuts.
              </div>
            </div>
          </div>

          <div className="editor-actions">
            <button className="save-draft-btn" onClick={handleSaveDraft} disabled={loading}>
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
            <button className="continue-btn" onClick={handleContinue} disabled={loading}>
              {loading ? 'Saving...' : 'Continue to Additional Information'}
            </button>
          </div>
        </div>
      )}

      {/* Understanding Checkbox */}
      <div className="understanding-section">
        <label className="understanding-checkbox">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            disabled={loading}
          />
          <span className="checkmark"></span>
          I understand that if not required by a college, I will be given the option during
          submission to include my essay or not for that college.
        </label>
      </div>
    </div>
  );
};

export default PersonalEssay;