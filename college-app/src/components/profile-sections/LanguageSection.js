import React from 'react';
import './LanguageSection.css'; // Add this import

const LanguageSection = ({ formData, handleInputChange, handleLanguageChange, addLanguage, removeLanguage }) => (
  <div className="language-section-component"> {/* Changed class name to avoid conflict */}
    <h2>Language</h2>
    <div className="section-status">
      {formData.profileCompletion.language ? 'Complete' : 'In Progress'}
    </div>
    <div className="form-content">
      <div className="form-group">
        <label className="required">Number of languages you are proficient in</label>
        <select
          name="languagesProficient"
          value={formData.languagesProficient}
          onChange={handleInputChange}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
        </select>
      </div>

      {formData.languages.slice(0, formData.languagesProficient).map((lang, index) => (
        <div key={index} className="language-section">
          <div className="form-group">
            <label className="required">Select Language</label>
            <input
              type="text"
              value={lang.language}
              onChange={(e) => handleLanguageChange(index, 'language', e.target.value)}
              placeholder="Enter language"
              required
            />
          </div>

          <div className="form-group">
            <label className="required">Language Proficiency</label>
            <div className="checkbox-group horizontal">
              <label>
                <input
                  type="checkbox"
                  checked={lang.proficiency.firstLanguage}
                  onChange={(e) => handleLanguageChange(index, 'proficiency.firstLanguage', e.target.checked)}
                />
                First Language
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={lang.proficiency.speak}
                  onChange={(e) => handleLanguageChange(index, 'proficiency.speak', e.target.checked)}
                />
                Speak
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={lang.proficiency.read}
                  onChange={(e) => handleLanguageChange(index, 'proficiency.read', e.target.checked)}
                />
                Read
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={lang.proficiency.write}
                  onChange={(e) => handleLanguageChange(index, 'proficiency.write', e.target.checked)}
                />
                Write
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={lang.proficiency.spokenAtHome}
                  onChange={(e) => handleLanguageChange(index, 'proficiency.spokenAtHome', e.target.checked)}
                />
                Spoken at Home
              </label>
            </div>
          </div>

          {index > 0 && (
            <button
              type="button"
              className="remove-button"
              onClick={() => removeLanguage(index)}
            >
              Remove Language
            </button>
          )}
        </div>
      ))}

      {formData.languages.length < 5 && formData.languages.length < formData.languagesProficient && (
        <button
          type="button"
          className="add-button"
          onClick={addLanguage}
        >
          + Add Another Language
        </button>
      )}
    </div>
  </div>
);

export default LanguageSection;