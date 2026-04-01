// src/components/LanguageSection.js
import React, { useState, useEffect, useRef } from 'react';
import LANGUAGES from '../../data/languages';
import './LanguageSection.css';

const LanguageSection = ({ 
  formData = {}, 
  handleInputChange, 
  handleLanguageChange, 
  addLanguage, 
  removeLanguage,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchInput, setSearchInput] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const dropdownRefs = useRef([]);

  // Validate form completion
  useEffect(() => {
    const hasLanguagesProficient = formData.languagesProficient && formData.languagesProficient !== '';
    let allLanguagesValid = true;
    
    if (hasLanguagesProficient && formData.languages) {
      const proficientCount = parseInt(formData.languagesProficient);
      const languagesToCheck = formData.languages.slice(0, proficientCount);
      
      allLanguagesValid = languagesToCheck.every(lang => 
        lang.language && 
        lang.language.trim() !== '' &&
        (lang.proficiency.firstLanguage || 
         lang.proficiency.speak || 
         lang.proficiency.read || 
         lang.proficiency.write || 
         lang.proficiency.spokenAtHome)
      );
    }
    
    setIsFormValid(hasLanguagesProficient && allLanguagesValid);
  }, [formData.languagesProficient, formData.languages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutside = dropdownRefs.current.every(ref => {
        return ref && !ref.contains(event.target);
      });
      
      if (isOutside) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter languages based on search input
  const getFilteredLanguages = (searchText) => {
    if (!searchText) return LANGUAGES;
    return LANGUAGES.filter(lang =>
      lang.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  // Handle language selection from dropdown
  const handleSelectLanguage = (index, language) => {
    handleLanguageChange(index, 'language', language);
    setSearchInput(prev => ({ ...prev, [index]: '' }));
    setOpenDropdown(null);
  };

  // Handle search input change
  const handleSearchChange = (index, value) => {
    setSearchInput(prev => ({ ...prev, [index]: value }));
    setOpenDropdown(index);
  };

  // Handle input focus
  const handleInputFocus = (index) => {
    setOpenDropdown(index);
    if (!searchInput.hasOwnProperty(index)) {
      setSearchInput(prev => ({ ...prev, [index]: '' }));
    }
  };

  // Handle clear language field
  const handleClearLanguage = (index) => {
    handleLanguageChange(index, 'language', '');
    setSearchInput(prev => ({ ...prev, [index]: '' }));
  };

  // Handle clear all proficiency checkboxes
  const handleClearProficiency = (index) => {
    handleLanguageChange(index, 'proficiency.firstLanguage', false);
    handleLanguageChange(index, 'proficiency.speak', false);
    handleLanguageChange(index, 'proficiency.read', false);
    handleLanguageChange(index, 'proficiency.write', false);
    handleLanguageChange(index, 'proficiency.spokenAtHome', false);
  };

  // Handle clear all languages
  const handleClearAllLanguages = () => {
    const fieldsToClear = ['languagesProficient'];
    if (clearRelatedFields) {
      clearRelatedFields('languages', fieldsToClear);
    } else if (clearAnswer) {
      clearAnswer('languagesProficient');
      clearAnswer('languages');
    }
  };

  // Get display value for input
  const getDisplayValue = (index) => {
    if (searchInput[index] !== undefined && searchInput[index] !== '') {
      return searchInput[index];
    }
    return formData.languages?.[index]?.language || '';
  };

  // Get filtered languages for the currently open dropdown
  const getCurrentFilteredLanguages = (index) => {
    if (openDropdown === index) {
      return getFilteredLanguages(searchInput[index] || '');
    }
    return [];
  };

  // Check if any language has data
  const hasAnyLanguageData = () => {
    return formData.languagesProficient && 
           formData.languages && 
           formData.languages.some(lang => lang.language);
  };

  const proficientCount = parseInt(formData.languagesProficient) || 0;

  return (
    <div className="language-section-component">
      <div className="language-header">
        <h2>Language</h2>
        <div className="section-description">
          Tell us about the languages you are proficient in
        </div>
      </div>
      
      <div className="section-status-wrapper">
        <div className={`section-status ${isFormValid ? 'complete' : 'in-progress'}`}>
          <span className="status-indicator"></span>
          {isFormValid ? 'Complete' : 'In Progress'}
        </div>
      </div>

      <div className="form-content">
        <div className="form-group">
          <label className="required">Number of languages you are proficient in</label>
          <div className="select-container">
            <select
              name="languagesProficient"
              value={formData.languagesProficient || ''}
              onChange={handleInputChange}
              className="language-select"
            >
              <option value="">Select number</option>
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            {formData.languagesProficient && (
              <button 
                type="button" 
                className="clear-field-btn"
                onClick={() => handleClearAllLanguages()}
                aria-label="Clear selection"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {formData.languages && formData.languages.slice(0, proficientCount).map((lang, index) => (
          <div key={index} className="language-section">
            {/* Language Selection with Autocomplete */}
            <div className="form-group">
              <label className="required">Select Language</label>
              <div 
                className="language-input-wrapper"
                ref={el => dropdownRefs.current[index] = el}
              >
                <input
                  type="text"
                  value={getDisplayValue(index)}
                  onChange={(e) => handleSearchChange(index, e.target.value)}
                  onFocus={() => handleInputFocus(index)}
                  placeholder="Start typing language name..."
                  className="language-input"
                  autoComplete="off"
                />
                {lang.language && (
                  <button 
                    type="button" 
                    className="clear-field-btn"
                    onClick={() => handleClearLanguage(index)}
                    aria-label="Clear language"
                  >
                    ×
                  </button>
                )}
                
                {/* Dropdown List */}
                {openDropdown === index && (
                  <div className="language-dropdown">
                    {getCurrentFilteredLanguages(index).length > 0 ? (
                      getCurrentFilteredLanguages(index).map((language) => (
                        <div
                          key={language}
                          className="dropdown-item"
                          onClick={() => handleSelectLanguage(index, language)}
                        >
                          {language}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item disabled">No languages found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Language Proficiency Checkboxes */}
            <div className="form-group">
              <label className="required">Language Proficiency</label>
              <div className="checkbox-group horizontal">
                {[
                  { key: 'firstLanguage', label: 'First Language' },
                  { key: 'speak', label: 'Speak' },
                  { key: 'read', label: 'Read' },
                  { key: 'write', label: 'Write' },
                  { key: 'spokenAtHome', label: 'Spoken at Home' }
                ].map(proficiency => (
                  <label key={proficiency.key}>
                    <input
                      type="checkbox"
                      checked={lang.proficiency?.[proficiency.key] || false}
                      onChange={(e) =>
                        handleLanguageChange(index, `proficiency.${proficiency.key}`, e.target.checked)
                      }
                    />
                    <span className="checkbox-label">{proficiency.label}</span>
                  </label>
                ))}
              </div>
              {(lang.proficiency?.firstLanguage || 
                lang.proficiency?.speak || 
                lang.proficiency?.read || 
                lang.proficiency?.write || 
                lang.proficiency?.spokenAtHome) && (
                <button 
                  type="button" 
                  className="clear-link"
                  onClick={() => handleClearProficiency(index)}
                >
                  Clear all proficiency selections
                </button>
              )}
            </div>

            {/* Remove Button */}
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

        {/* Add Language Button */}
        {formData.languages && formData.languages.length < 5 &&
          formData.languages.length < proficientCount && (
            <button
              type="button"
              className="add-button"
              onClick={addLanguage}
            >
              + Add Another Language
            </button>
          )}

        {/* Clear All Button */}
        {hasAnyLanguageData() && (
          <div className="clear-all-container">
            <button type="button" className="clear-all-link" onClick={handleClearAllLanguages}>
              Clear all language fields
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSection;