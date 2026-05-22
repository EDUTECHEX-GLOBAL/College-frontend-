// src/components/writing-sections/PersonalEssaySection.js
import React, { useState, useEffect } from 'react';
import './PersonalEssay.css';

const PersonalEssaySection = ({ writingData, handleInputChange }) => {
  const { personalEssay } = writingData;
  const [wordCount, setWordCount] = useState(0);

  // Essay topics
  const essayTopics = [
    {
      value: 'topic1',
      label: "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story."
    },
    {
      value: 'topic2',
      label: "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?"
    },
    {
      value: 'topic3',
      label: "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?"
    },
    {
      value: 'topic4',
      label: "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?"
    },
    {
      value: 'topic5',
      label: "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others."
    },
    {
      value: 'topic6',
      label: "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?"
    },
    {
      value: 'topic7',
      label: "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design."
    }
  ];

  // Update word count whenever essay text changes
  useEffect(() => {
    const text = personalEssay.essayText || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const count = words.length;
    setWordCount(count);
    handleInputChange('personalEssay', 'wordCount', count);
  }, [personalEssay.essayText]);

  const handleEssayTextChange = (e) => {
    const text = e.target.value;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    
    // Limit to 650 words
    if (words.length <= 650) {
      handleInputChange('personalEssay', 'essayText', text);
    }
  };

  return (
    <div className="personal-essay-section">
      {/* Header */}
      <div className="personal-essay-header">
        <h2 className="personal-essay-title">Personal Essay</h2>
        <div className="personal-essay-status">Complete</div>
      </div>

      <div className="personal-essay-description">
        <div className="essay-warning">
         
        </div>
        <p>
          Here is the current list of colleges on your Dashboard and whether they require the Personal Essay.
        </p>
      </div>

      {/* Essay Requirement Checkbox */}
      <div className="essay-requirement">
        <label className="essay-checkbox-label">
          <input
            type="checkbox"
            checked={personalEssay.essayRequired || false}
            onChange={(e) => handleInputChange('personalEssay', 'essayRequired', e.target.checked)}
            className="essay-checkbox"
          />
          <span>I understand</span>
        </label>
        {/* ✅ FIXED: Only show error if checkbox is NOT checked */}
        {!personalEssay.essayRequired && (
          <p className="essay-requirement-text">Please complete this required question.</p>
        )}
      </div>

      {/* College Lists */}
      <div className="college-lists">
        <div className="college-list-section">
          <h3>Required</h3>
          <div className="college-list-empty">No colleges require personal essay</div>
        </div>
        <div className="college-list-section">
          <h3>Not Required</h3>
          <ul className="college-list">
            <li>University of Kansas</li>
          </ul>
        </div>
      </div>

      {/* Essay Instructions */}
      <div className="essay-instructions">
        <p>
          The essay demonstrates your ability to write clearly and concisely on a selected topic and helps you distinguish yourself in your own voice. What do you want the readers of your application to know about you apart from courses, grades, and test scores? Choose the option that best helps you answer that question and write an essay of no more than 650 words, using the prompt to inspire and structure your response. Remember: 650 words is your limit, not your goal. Use the full range if you need it, but don't feel obligated to do so. (The application won't accept a response shorter than 250 words.)
        </p>
      </div>

      {/* Essay Topics */}
      <div className="essay-topics">
        <h3 className="essay-topics-title">Select Essay Topic</h3>
        {essayTopics.map((topic, index) => (
          <div key={topic.value} className="essay-topic-option">
            <label className="essay-topic-label">
              <input
                type="radio"
                name="essayTopic"
                value={topic.value}
                checked={personalEssay.selectedTopic === topic.value}
                onChange={(e) => handleInputChange('personalEssay', 'selectedTopic', e.target.value)}
                className="essay-topic-radio"
              />
              <span className="essay-topic-text">{topic.label}</span>
            </label>
          </div>
        ))}
      </div>

      {/* Clear Answer Button */}
      <button 
        className="clear-answer-btn"
        onClick={() => handleInputChange('personalEssay', 'selectedTopic', '')}
      >
        Clear answer
      </button>

      {/* Essay Text Area */}
      <div className="essay-text-area-section">
        <h3>Write Your Essay</h3>
        <p className="essay-text-instructions">
          Please write an essay on the topic selected. You can type directly into the box, or you can paste text from another source.
        </p>
        <p className="essay-keyboard-shortcuts">
          Press Alt+Ctrl+F10 from the editor to navigate to the toolbar, or Alt+Ctrl+0 for a list of <a href="#" className="keyboard-link">keyboard shortcuts</a>.
        </p>
        
        <div className="essay-editor">
          <div className="essay-toolbar">
            <button className="toolbar-btn" title="Bold"><strong>B</strong></button>
            <button className="toolbar-btn" title="Italic"><em>I</em></button>
            <button className="toolbar-btn" title="Underline"><u>U</u></button>
            <button className="toolbar-btn" title="Full Screen">⛶</button>
          </div>
          <textarea
            className="essay-textarea"
            placeholder="Start writing your essay here..."
            value={personalEssay.essayText || ''}
            onChange={handleEssayTextChange}
            maxLength={5000}
          />
          <div className="essay-word-count">
            <span className="word-count-display">({wordCount}/650 words)</span>
            <span className="min-max-text">Min 250 / Max 650</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalEssaySection;
