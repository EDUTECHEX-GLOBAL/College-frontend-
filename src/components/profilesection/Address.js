import React from 'react';
import './Address.css'; // Add this import

const AddressSection = ({ formData, handleInputChange }) => (
  <div className="address-section"> {/* Changed class name */}
    <h2>Address</h2>
    <div className="section-status">
      {formData.profileCompletion.address ? 'Complete' : 'In Progress'}
    </div>
    <div className="form-content">
      <div className="form-group">
        <label className="required">Address Line 1</label>
        <input
          type="text"
          name="addressLine1"
          value={formData.addressLine1}
          onChange={handleInputChange}
          placeholder="Street address"
          required
        />
      </div>

      <div className="form-group">
        <label>Address Line 2</label>
        <input
          type="text"
          name="addressLine2"
          value={formData.addressLine2}
          onChange={handleInputChange}
          placeholder="Apartment, suite, etc. (optional)"
        />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="required">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="required">State/Province</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="required">ZIP/Postal Code</label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="required">Country</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
    </div>
  </div>
);

export default AddressSection;