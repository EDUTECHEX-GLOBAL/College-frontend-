import React, { useState, useEffect, useRef } from 'react';
import LANGUAGES from '../../data/languages';

import './LanguageSection.css';

const LanguageSection = ({ formData, handleInputChange, handleLanguageChange, addLanguage, removeLanguage }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchInput, setSearchInput] = useState({});
  const dropdownRefs = useRef([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside ALL dropdown containers
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
    // Update the language in the form data
    handleLanguageChange(index, 'language', language);
    
    // Clear the search input for this field
    setSearchInput(prev => ({
      ...prev,
      [index]: ''
    }));
    
    // Close the dropdown
    setOpenDropdown(null);
  };

  // Handle search input change
  const handleSearchChange = (index, value) => {
    setSearchInput(prev => ({
      ...prev,
      [index]: value
    }));
    
    // Always open dropdown when typing
    setOpenDropdown(index);
  };

  // Handle input focus
  const handleInputFocus = (index) => {
    setOpenDropdown(index);
    // Initialize search input if not exists
    if (!searchInput.hasOwnProperty(index)) {
      setSearchInput(prev => ({
        ...prev,
        [index]: ''
      }));
    }
  };

  // Get display value for input
  const getDisplayValue = (index) => {
    // If user is typing in search, show that
    if (searchInput[index] !== undefined && searchInput[index] !== '') {
      return searchInput[index];
    }
    // Otherwise show the selected language from formData
    return formData.languages[index]?.language || '';
  };

  // Get filtered languages for the currently open dropdown
  const getCurrentFilteredLanguages = (index) => {
    if (openDropdown === index) {
      return getFilteredLanguages(searchInput[index] || '');
    }
    return [];
  };

  return (
    <div className="language-section-component">
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
                
                {/* Dropdown List */}
                {openDropdown === index && (
                  <div className="language-dropdown">
                    {getCurrentFilteredLanguages(index).length > 0 ? (
                      getCurrentFilteredLanguages(index).map((language) => (
                        <div
                          key={language}
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent event bubbling
                            handleSelectLanguage(index, language);
                          }}
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
                <label>
                  <input
                    type="checkbox"
                    checked={lang.proficiency.firstLanguage || false}
                    onChange={(e) =>
                      handleLanguageChange(index, 'proficiency.firstLanguage', e.target.checked)
                    }
                  />
                  First Language
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={lang.proficiency.speak || false}
                    onChange={(e) =>
                      handleLanguageChange(index, 'proficiency.speak', e.target.checked)
                    }
                  />
                  Speak
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={lang.proficiency.read || false}
                    onChange={(e) =>
                      handleLanguageChange(index, 'proficiency.read', e.target.checked)
                    }
                  />
                  Read
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={lang.proficiency.write || false}
                    onChange={(e) =>
                      handleLanguageChange(index, 'proficiency.write', e.target.checked)
                    }
                  />
                  Write
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={lang.proficiency.spokenAtHome || false}
                    onChange={(e) =>
                      handleLanguageChange(index, 'proficiency.spokenAtHome', e.target.checked)
                    }
                  />
                  Spoken at Home
                </label>
              </div>
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
        {formData.languages.length < 5 &&
          formData.languages.length < formData.languagesProficient && (
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
};

export default LanguageSection;