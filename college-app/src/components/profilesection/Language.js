import React, { useState, useRef, useEffect } from 'react';
import LANGUAGES from '../../data/languages'; // Import language list
import './Language.css';

const LanguageSection = ({ formData, handleInputChange, handleLanguageChange, addLanguage, removeLanguage }) => {
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open
  const [searchInput, setSearchInput] = useState({}); // Store search text for each language field
  const dropdownRefs = useRef([]);
  const inputRefs = useRef([]);

  // Filter languages based on search input
  const getFilteredLanguages = (searchText) => {
    return LANGUAGES.filter(lang =>
      lang.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  // Handle language selection from dropdown
  const handleSelectLanguage = (index, language) => {
    handleLanguageChange(index, 'language', language);
    setOpenDropdown(null);
    setSearchInput(prev => ({ ...prev, [index]: '' }));
  };

  // Handle search input change
  const handleSearchChange = (index, value) => {
    setSearchInput(prev => ({ ...prev, [index]: value }));
    setOpenDropdown(index); // Open dropdown when typing
  };

  // Handle input focus
  const handleInputFocus = (index) => {
    setOpenDropdown(index);
    // Initialize search input if it doesn't exist
    if (!searchInput.hasOwnProperty(index)) {
      setSearchInput(prev => ({ ...prev, [index]: '' }));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside all dropdowns and their corresponding inputs
      let isOutside = true;
      
      dropdownRefs.current.forEach((ref, index) => {
        if (ref && ref.contains(event.target)) {
          isOutside = false;
        }
        // Also check if click is on the input
        if (inputRefs.current[index] && inputRefs.current[index].contains(event.target)) {
          isOutside = false;
        }
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

  // Get display value for input
  const getDisplayValue = (index) => {
    // If user is typing, show search text
    if (searchInput[index] !== undefined && searchInput[index] !== '') {
      return searchInput[index];
    }
    // Otherwise show the selected language
    return formData.languages[index]?.language || '';
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
            {/* Language Selection with Autocomplete Dropdown */}
            <div className="form-group">
              <label className="required">Select Language</label>
              <div className="language-input-wrapper">
                <input
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  value={getDisplayValue(index)}
                  onChange={(e) => handleSearchChange(index, e.target.value)}
                  onFocus={() => handleInputFocus(index)}
                  placeholder="Start typing language name..."
                  className="language-input"
                  autoComplete="off"
                  required
                />

                {/* Dropdown List */}
                {openDropdown === index && (
                  <div 
                    className="language-dropdown"
                    ref={el => dropdownRefs.current[index] = el}
                  >
                    {getFilteredLanguages(searchInput[index] || '').length > 0 ? (
                      getFilteredLanguages(searchInput[index] || '').map((language) => (
                        <div
                          key={language}
                          className="dropdown-item"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input blur
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
};

export default LanguageSection;