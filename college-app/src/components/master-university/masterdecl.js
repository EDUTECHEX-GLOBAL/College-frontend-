import React, { useState, useEffect, useRef } from 'react';
import './masterdecl.css';

const MasterDeclaration = ({ data, updateData }) => {
  const [agreed, setAgreed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const isInitialMount = useRef(true);

  // ✅ Sync from parent on mount only
  useEffect(() => {
    if (typeof data === 'boolean') {
      setAgreed(data);
    }
  }, []); // ✅ mount only

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setAgreed(isChecked);
    setShowWarning(!isChecked); // ✅ show warning only if unchecked
    // ✅ No updateData here — let the effect handle it
  };

  // ✅ Notify parent when agreed changes — no setShowWarning, no isFormValid inside
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    updateData(agreed); // ✅ simple, clean, no side effects
  }, [agreed, updateData]); // ✅ correct deps

  return (
    <div className="masterdecl-form">
      <div className="masterdecl-header">
        <h2 className="masterdecl-title">Declaration</h2>
        <p className="masterdecl-subtitle">Please read and confirm the following declaration</p>
      </div>

      <div className={`masterdecl-checkbox ${showWarning ? 'masterdecl-warning-border' : ''}`}>
        <input
          type="checkbox"
          id="declarationCheckbox"
          checked={agreed}
          onChange={handleCheckboxChange}
        />
        <label htmlFor="declarationCheckbox">
          I confirm that all information provided in this application is true, accurate, and complete to the best of my knowledge.
        </label>
      </div>

      {showWarning && (
        <div className="masterdecl-warning">
          <span>You must confirm the declaration before submitting your application.</span>
        </div>
      )}

      <div className="masterdecl-info">
        <div>
          <strong>Legal Notice:</strong> Providing false or misleading information may result in rejection of your application,
          revocation of admission, or dismissal from the university.
        </div>
      </div>
    </div>
  );
};

export default MasterDeclaration;