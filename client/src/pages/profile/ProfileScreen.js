import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileScreen.css';

const ProfileScreen = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    // Clear all localStorage data
    localStorage.clear();
    // Navigate back to auth screen
    navigate('/auth');
  };

  return (
    <div className="profile-screen">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
        </div>

        {/* Sign Out Button */}
        <div className="signout-section">
          <button className="signout-button" onClick={handleSignOut}>
            <span className="signout-icon">🚪</span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
