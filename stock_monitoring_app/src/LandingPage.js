// LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css'; // We will create this CSS file for styling

function LandingPage() {
  const navigate = useNavigate();

  // Navigate to the login/signup page (SignIn.js)
  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <div className="landing-page">
      <div className="content">
        <h1 className="title">NYSE Tracker</h1>
        <p className="subtitle">Stay on top of the latest stock prices with real-time data and alerts.</p>
        <div className="button-container">
          <button className="button" onClick={handleSignIn}>Login</button>
          <button className="button" onClick={handleSignIn}>Sign Up</button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
