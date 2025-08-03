import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdKeyboardArrowRight, MdShoppingCart } from 'react-icons/md';
import { stadiumStorage, userStorage } from '../../../../utils/storage';
import './TopSection.css';

const TopSection = () => {
  const navigate = useNavigate();
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [userName, setUserName] = useState('User');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Load selected stadium using storage utility
    const stadium = stadiumStorage.getSelectedStadium();
    if (stadium) {
      setSelectedStadium(stadium);
    }

    // Load user name using storage utility
    const userData = userStorage.getUserData();
    if (userData) {
      setUserName(userData.firstName || 'User');
    }

    // Set greeting based on current time
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    if (currentHour < 12) {
      setGreeting('Good Morning');
    } else if (currentHour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <div className="top-section">
      {/* Stadium Selector */}
      <div className="stadium-section">
        <button 
          className="stadium-selector"
          onClick={() => navigate('/stadium-selection')}
        >
          <div className="stadium-info">
            <h2 className="stadium-name">
              {selectedStadium ? selectedStadium.name : 'Select Stadium'}
            </h2>
            <p className="stadium-location">
              {selectedStadium ? selectedStadium.location : 'Choose your location'}
            </p>
          </div>
          <MdKeyboardArrowRight className="dropdown-arrow" />
        </button>
      </div>
      
      {/* User Greeting */}
      <div className="greeting-section">
        <span className="greeting-text">{greeting}, {userName}!</span>
      </div>
      
      {/* Cart Icon */}
      <div className="cart-section">
        <button 
          className="cart-button"
          onClick={() => navigate('/cart')}
        >
          <MdShoppingCart className="cart-icon" />
          <span className="cart-badge">0</span>
        </button>
      </div>
    </div>
  );
};

export default TopSection;
