import React from 'react';
import { useNavigate } from 'react-router-dom';
import { storageManager } from '../../utils/storage';
import './ProfileScreen.css';

const ProfileScreen = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    console.log('🚪 User signing out...');
    
    // Clear all storage data using the storage manager
    storageManager.clearAllStorage();
    
    // Navigate back to auth screen
    navigate('/auth');
    
    console.log('✅ Sign out completed');
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
