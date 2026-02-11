import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ApplicationAddress.css";

const API_URL = "http://localhost:5000/api/application/address";

const ApplicationAddress = () => {
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    currentAddress: "",
    permanentAddress: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    nationalIdFile: null,
  });

  /* =====================================================
     FETCH ADDRESS DATA ON LOAD
  ===================================================== */
  useEffect(() => {
    fetchAddress();
  }, []);

  const fetchAddress = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.data) {
        setFormData({
          ...res.data.data,
          nationalIdFile: res.data.data.nationalIdFile || null,
        });
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  /* =====================================================
     HANDLE INPUT CHANGE
  ===================================================== */
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =====================================================
     SAVE ADDRESS
  ===================================================== */
  const saveAddress = async () => {
    try {
      await axios.post(API_URL, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Address saved successfully ✅");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save address");
    }
  };

  /* =====================================================
     UPLOAD NATIONAL ID
  ===================================================== */
  const handleFileUpload = async (file) => {
    if (!file) return;

    const data = new FormData();
    data.append("file", file);

    try {
      const res = await axios.post(
        `${API_URL}/upload/nationalId`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("National ID uploaded ✅");

      setFormData((prev) => ({
        ...prev,
        nationalIdFile: {
          fileName: file.name,
          fileUrl: res.data.fileUrl,
          size: file.size,
        },
      }));
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    }
  };

  /* =====================================================
     REMOVE NATIONAL ID
  ===================================================== */
  const removeNationalId = async () => {
    try {
      await axios.delete(`${API_URL}/nationalId`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFormData((prev) => ({
        ...prev,
        nationalIdFile: null,
      }));

      alert("National ID removed ✅");
    } catch (error) {
      console.error("Remove error:", error);
    }
  };

  /* =====================================================
     COPY ADDRESS
  ===================================================== */
  const handleSameAsCurrent = () => {
    setFormData((prev) => ({
      ...prev,
      permanentAddress: prev.currentAddress,
    }));
  };

  /* =====================================================
     UI
  ===================================================== */
  return (
    <form className="form-section" onSubmit={(e) => e.preventDefault()}>
      <div className="section-header">
        <div className="section-number">2</div>
        <div>
          <h2 className="section-title">Address & Identification</h2>
          <p className="section-subtitle">
            Provide your current and permanent address details
          </p>
        </div>
      </div>

      <div className="form-grid">
        {/* Current Address */}
        <div className="form-group">
          <label className="form-label required">Current Address</label>
          <textarea
            className="form-textarea"
            value={formData.currentAddress}
            onChange={(e) =>
              handleInputChange("currentAddress", e.target.value)
            }
            rows="3"
            required
          />
        </div>

        {/* Permanent Address */}
        <div className="form-group">
          <div className="address-header">
            <label className="form-label required">
              Permanent Address
            </label>
            <button
              type="button"
              className="copy-address-btn"
              onClick={handleSameAsCurrent}
            >
              Same as Current
            </button>
          </div>
          <textarea
            className="form-textarea"
            value={formData.permanentAddress}
            onChange={(e) =>
              handleInputChange("permanentAddress", e.target.value)
            }
            rows="3"
            required
          />
        </div>

        {/* City */}
        <div className="form-group">
          <label className="form-label required">City</label>
          <input
            type="text"
            className="form-input"
            value={formData.city}
            onChange={(e) =>
              handleInputChange("city", e.target.value)
            }
            required
          />
        </div>

        {/* State */}
        <div className="form-group">
          <label className="form-label required">State</label>
          <input
            type="text"
            className="form-input"
            value={formData.state}
            onChange={(e) =>
              handleInputChange("state", e.target.value)
            }
            required
          />
        </div>

        {/* Country */}
        <div className="form-group">
          <label className="form-label required">Country</label>
          <select
            className="form-select"
            value={formData.country}
            onChange={(e) =>
              handleInputChange("country", e.target.value)
            }
            required
          >
            <option value="">Select Country</option>
            <option value="USA">USA</option>
            <option value="India">India</option>
            <option value="UK">UK</option>
          </select>
        </div>

        {/* Postal Code */}
        <div className="form-group">
          <label className="form-label required">Postal Code</label>
          <input
            type="text"
            className="form-input"
            value={formData.postalCode}
            onChange={(e) =>
              handleInputChange("postalCode", e.target.value)
            }
            required
          />
        </div>
      </div>

      {/* National ID Upload */}
      <div className="form-group">
        <label className="form-label">
          National ID (Alternative to Passport)
        </label>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) =>
            handleFileUpload(e.target.files[0])
          }
        />

        {formData.nationalIdFile && (
          <div className="file-item">
            <span>
              {formData.nationalIdFile.fileName}
            </span>
            <button
              type="button"
              onClick={removeNationalId}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        className="save-btn"
        onClick={saveAddress}
      >
        Save & Continue
      </button>
    </form>
  );
};

export default ApplicationAddress;
