import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import bgImage from "../assets/homebgimg.png";
import logo from "../assets/Edutech-logo.svg"; // ✅ Added logo import

const Home = () => {
  const navigate = useNavigate();

  // Navigate to Create Account page
  const handleCreateAccount = () => {
    navigate("/create-account");
  };

  // Navigate to Start Application page (same as Create Account)
  const handleStartApplication = () => {
    navigate("/create-account");
  };

  // ✅ Navigate to Sign In page
  const handleSignIn = () => {
    navigate("/sign-in");
  };

  return (
    <div
      className="home-wrapper"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* ===== Header Section ===== */}
      <header className="header">
        <div className="logo">
          <img src={logo} alt="EduTechEX Logo" className="logo-img" />
        </div>

        <div className="header-buttons">
          {/* ✅ Added navigation for Sign In */}
          <button className="header-btn" onClick={handleSignIn}>
            Sign I
          </button>
          <button className="header-btn" onClick={handleCreateAccount}>
            Create Account
          </button>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="home-content">
        <h1 className="headline">Your future starts here</h1>
        <p className="description">
          Apply to college for the first time or transfer to complete your
          degree. Navigate your entire college application journey with{" "}
          <span className="highlight">College App</span>.
        </p>
        <button className="cta-button" onClick={handleStartApplication}>
          Start your application
        </button>
      </main>
    </div>
  );
};

export default Home;
