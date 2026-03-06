import React from 'react';
import './Geography.css'; // Add this import

const GeographySection = ({ formData, handleInputChange }) => (
  <div className="geography-section"> {/* Changed class name */}
    <h2>Geography and Nationality</h2>
    <div className="section-status">
      {formData.profileCompletion.geography ? 'Complete' : 'In Progress'}
    </div>
    <div className="form-content">
      <div className="form-group">
        <label>Birth Country/Region/Territory</label>
        <input
          type="text"
          name="birthCountry"
          value={formData.birthCountry}
          onChange={handleInputChange}
          placeholder="Enter birth country"
        />
      </div>

      <div className="form-group">
        <label>City of Birth</label>
        <input
          type="text"
          name="cityOfBirth"
          value={formData.cityOfBirth}
          onChange={handleInputChange}
          placeholder="Enter city of birth"
        />
      </div>

      <div className="form-group">
        <label>Number of years you have lived in the United States</label>
        <input
          type="number"
          name="yearsInUS"
          value={formData.yearsInUS}
          onChange={handleInputChange}
          min="0"
          max="100"
        />
      </div>

      <div className="form-group">
        <label className="required">Select your citizenship status</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="citizenshipStatus"
              value="us-citizen-national"
              checked={formData.citizenshipStatus === 'us-citizen-national'}
              onChange={handleInputChange}
            />
            U.S. citizen or U.S. national
          </label>
          <label>
            <input
              type="radio"
              name="citizenshipStatus"
              value="us-dual-citizen"
              checked={formData.citizenshipStatus === 'us-dual-citizen'}
              onChange={handleInputChange}
            />
            U.S. dual citizen
          </label>
          <label>
            <input
              type="radio"
              name="citizenshipStatus"
              value="us-permanent-resident"
              checked={formData.citizenshipStatus === 'us-permanent-resident'}
              onChange={handleInputChange}
            />
            U.S. permanent resident (green card holder)
          </label>
          <label>
            <input
              type="radio"
              name="citizenshipStatus"
              value="citizen-non-us-country"
              checked={formData.citizenshipStatus === 'citizen-non-us-country'}
              onChange={handleInputChange}
            />
            Citizen of non-U.S. country
          </label>
          <label>
            <input
              type="radio"
              name="citizenshipStatus"
              value="us-resident"
              checked={formData.citizenshipStatus === 'us-resident'}
              onChange={handleInputChange}
            />
            U.S. resident
          </label>
        </div>
      </div>
    </div>
  </div>
);

export default GeographySection;