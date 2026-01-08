import React from 'react';
import './DemographicsSection.css'; // Add this import

const DemographicsSection = ({ formData, handleInputChange, handleArrayChange }) => (
  <div className="demographics-section"> {/* Changed class name */}
    <h2>Demographics</h2>
    <div className="section-status">
      {formData.profileCompletion.demographics ? 'Complete' : 'In Progress'}
    </div>
    <div className="form-content">
      <div className="form-group">
        <label>Gender</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={formData.gender === 'female'}
              onChange={handleInputChange}
            />
            Female
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={formData.gender === 'male'}
              onChange={handleInputChange}
            />
            Male
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="nonbinary"
              checked={formData.gender === 'nonbinary'}
              onChange={handleInputChange}
            />
            Nonbinary
          </label>
        </div>
      </div>


      <div className="form-group">
        <label>Pronouns</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="pronouns"
              value="he-him"
              checked={formData.pronouns === 'he-him'}
              onChange={handleInputChange}
            />
            He/Him
          </label>
          <label>
            <input
              type="radio"
              name="pronouns"
              value="she-her"
              checked={formData.pronouns === 'she-her'}
              onChange={handleInputChange}
            />
            She/Her
          </label>
          <label>
            <input
              type="radio"
              name="pronouns"
              value="they-them"
              checked={formData.pronouns === 'they-them'}
              onChange={handleInputChange}
            />
            They/Them
          </label>
        </div>
      </div>

      {/* <div className="form-group">
        <label>U.S. Armed Forces status</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="armedForcesStatus"
              value="none"
              checked={formData.armedForcesStatus === 'none'}
              onChange={handleInputChange}
            />
            None
          </label>
          <label>
            <input
              type="radio"
              name="armedForcesStatus"
              value="currently-serving"
              checked={formData.armedForcesStatus === 'currently-serving'}
              onChange={handleInputChange}
            />
            Currently Serving
          </label>
          <label>
            <input
              type="radio"
              name="armedForcesStatus"
              value="previously-served"
              checked={formData.armedForcesStatus === 'previously-served'}
              onChange={handleInputChange}
            />
            Previously Served
          </label>
          <label>
            <input
              type="radio"
              name="armedForcesStatus"
              value="current-dependent"
              checked={formData.armedForcesStatus === 'current-dependent'}
              onChange={handleInputChange}
            />
            Current Dependent
          </label>
        </div>
      </div> */}

      {/* <div className="form-group">
        <label>Are you Hispanic or Latino/a/x?</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="hispanicOrLatino"
              value="yes"
              checked={formData.hispanicOrLatino === 'yes'}
              onChange={handleInputChange}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="hispanicOrLatino"
              value="no"
              checked={formData.hispanicOrLatino === 'no'}
              onChange={handleInputChange}
            />
            No
          </label>
        </div>
      </div> */}

      <div className="form-group">
        <label>Regardless of your answer to the prior question, please indicate how you identify yourself. (You may select one or more)</label>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.ethnicity.includes('american-indian-alaska-native')}
              onChange={() => handleArrayChange('ethnicity', 'american-indian-alaska-native')}
            />
            American Indian or Alaska Native
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.ethnicity.includes('asian')}
              onChange={() => handleArrayChange('ethnicity', 'asian')}
            />
            Asian
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.ethnicity.includes('black-african-american')}
              onChange={() => handleArrayChange('ethnicity', 'black-african-american')}
            />
            Black or African American
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.ethnicity.includes('native-hawaiian-pacific-islander')}
              onChange={() => handleArrayChange('ethnicity', 'native-hawaiian-pacific-islander')}
            />
            Native Hawaiian or Other Pacific Islander
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.ethnicity.includes('white')}
              onChange={() => handleArrayChange('ethnicity', 'white')}
            />
            White
          </label>
        </div>
      </div>
    </div>
  </div>
);

export default DemographicsSection;