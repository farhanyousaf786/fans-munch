import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdShoppingCart, MdKeyboardArrowRight, MdKeyboardArrowLeft } from 'react-icons/md';
import { stadiumStorage, userStorage } from '../../../../utils/storage';
import SearchFilterWidget from '../search_filter/SearchFilterWidget';
import './TopSection.css';
import { useTranslation } from '../../../../i18n/i18n';

const TopSection = (props) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [userData, setUserData] = useState(null);
  const { t, lang } = useTranslation();
  
  // Compute dynamic greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('home.greeting_morning');
    if (hour >= 12 && hour < 17) return t('home.greeting_afternoon');
    if (hour >= 17 && hour < 21) return t('home.greeting_evening');
    return t('home.greeting_night');
  };

  useEffect(() => {
    // Load selected stadium using storage utility
    const stadium = stadiumStorage.getSelectedStadium();
    if (stadium) {
      setSelectedStadium(stadium);
    }

    // Load user data
    const user = userStorage.getUserData();
    setUserData(user);
  }, []);

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleStadiumClick = () => {
    navigate('/stadium-selection');
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    // The search is now handled by the parent component
    if (props.onSearch) {
      props.onSearch(query);
    }
  };

  const handleFilterClick = () => {
    // Handle filter button click if needed
    console.log('Filter button clicked');
  };

  return (
    <div className={`home-top-section ${lang === 'he' ? 'rtl' : ''}`} dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {/* Header with location and cart */}
      <div className="home-header">
        <div className="stadium-selector" onClick={handleStadiumClick}>
          <span className="loc-badge">
            <img src="/assets/icons/location.png" alt="Location" className="location-icon" />
          </span>
          <div className="stadium-info">
            <div className="stadium-name-container">
              <span className="stadium-name">
                {selectedStadium ? selectedStadium.name : t('home.select_stadium')}
              </span>
              {lang === 'he' ? (
                <MdKeyboardArrowLeft size={20} className="dropdown-arrow" />
              ) : (
                <MdKeyboardArrowRight size={20} className="dropdown-arrow" />
              )}
            </div>
          </div>
        </div>
        <button className="cart-button" onClick={handleCartClick}>
          <MdShoppingCart size={24} />
        </button>
      </div>

      {/* Welcome Message */}
      <div className="welcome-message">
        <h1>{getGreeting()}</h1>
        <h2>{userData ? `${userData.firstName} ${userData.lastName}!` : 'Guest!'}</h2>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <SearchFilterWidget 
          onChanged={handleSearchChange}
          onFilterTap={handleFilterClick}
        />
      </div>
    </div>
  );
};

export default TopSection;
