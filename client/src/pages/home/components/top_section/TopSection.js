import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdShoppingCart, MdKeyboardArrowRight } from 'react-icons/md';
import { stadiumStorage } from '../../../../utils/storage';
import SearchFilterWidget from '../search_filter/SearchFilterWidget';
import './TopSection.css';

const TopSection = (props) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStadium, setSelectedStadium] = useState(null);

  useEffect(() => {
    // Load selected stadium using storage utility
    const stadium = stadiumStorage.getSelectedStadium();
    if (stadium) {
      setSelectedStadium(stadium);
    }
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
    <div className="home-top-section">
      {/* Header with location and cart */}
      <div className="home-header">
        <div className="stadium-selector" onClick={handleStadiumClick}>
          <img src="/assets/icons/location.png" alt="Location" className="location-icon" />
          <div className="stadium-info">
            <div className="stadium-name-container">
              <span className="stadium-name">
                {selectedStadium ? selectedStadium.name : 'Stadium Selection'}
              </span>
              <MdKeyboardArrowRight size={20} className="dropdown-arrow" />
            </div>
          </div>
        </div>
        <button className="cart-button" onClick={handleCartClick}>
          <MdShoppingCart size={24} />
        </button>
      </div>

      {/* Welcome Message */}
      <div className="welcome-message">
        <h1>Good Morning,</h1>
        <h2>Ibn e Yousaf!</h2>
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
