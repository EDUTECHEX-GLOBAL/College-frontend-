import React from "react";
import "./CreateAccount.css";
import { Link, useNavigate } from "react-router-dom";

const CreateAccount = () => {
  const navigate = useNavigate();

  // Navigate to First Year Account Page
  const handleFirstYearClick = () => {
    navigate("/create-account/first-year");
  };

  // Navigate to Transfer Student Account Page
  const handleTransferStudentClick = () => {
    navigate("/create-account/transfer");
  };

  // Navigate to Masters Account Page (placeholder for future)
  const handleMastersClick = () => {
    alert("Masters account page coming soon!");
    // navigate("/create-account/masters");
  };

  // Handle close button click
  const handleClose = () => {
    navigate("/");
  };

  return (
    <div className="create-account-wrapper">
      <div className="account-card">
        {/* Close Button */}
        <button 
          className="close-btn" 
          onClick={handleClose}
          title="Close"
        >
          ✕
        </button>

        <h2 className="title">Let's get started!</h2>
        <p className="subtitle">
          Welcome to <strong>EduTechEX </strong>! Please tell us how you will
          use the system so we can prepare your account.
        </p>

        {/* ✅ Updated login link to go to Sign In page */}
        <p className="login-text">
          Already have an account?{" "}
          <Link to="/sign-in" className="login-link">
            Go to the Sign In page.
          </Link>
        </p>

        <div className="account-options">
          <button className="option-btn" onClick={handleFirstYearClick}>
            First Year Student
          </button>
          <button className="option-btn" onClick={handleTransferStudentClick}>
            Transfer Student
          </button>
          <button className="option-btn" onClick={handleMastersClick}>
            Masters
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;