import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAccessTime } from 'react-icons/md';
import './MenuList.css';

// Local asset images to use as random placeholders for food items
const assetPlaceholders = [
  process.env.PUBLIC_URL + '/assets/images/on-boarding-1.png',
  process.env.PUBLIC_URL + '/assets/images/on-boarding-2.png',
  process.env.PUBLIC_URL + '/assets/images/on-boarding-3.png',
];

function getPlaceholderByKey(key) {
  const str = String(key || 'food');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % assetPlaceholders.length;
  return assetPlaceholders[idx];
}

function MenuList({ menuItems = [], loading = false, error = null, searchTerm = '' }) {
  const navigate = useNavigate();

  const handleFoodClick = (food) => {
    // Navigate to food detail page (matching Flutter app behavior)
    console.log('🍽️ Navigating to food detail:', food.name);
    navigate(`/food/${food.id}`);
  };



  // Get section title based on search state
  const getSectionTitle = () => {
    if (searchTerm.trim()) {
      return `Search Results (${menuItems.length})`;
    }
    return 'Popular Menu';
  };

  // Loading state
  if (loading) {
    return (
      <div className="menu-list">
        <div className="section-header">
          <h2 className="section-title">{getSectionTitle()}</h2>
        </div>
        <div className="menu-loading">
          <div className="menu-shimmer-container">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="menu-shimmer-card">
                <div className="shimmer-image"></div>
                <div className="shimmer-content">
                  <div className="shimmer-line"></div>
                  <div className="shimmer-line short"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && menuItems.length === 0) {
    const emptyMessage = searchTerm.trim() 
      ? `No results found for "${searchTerm}"`
      : 'No menu items available';
    
    return (
      <div className="menu-list">
        <div className="section-header">
          <h2 className="section-title">{getSectionTitle()}</h2>
        </div>
        <div className="menu-empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-list">
      <div className="section-header">
        <h2 className="section-title">{getSectionTitle()}</h2>
        {!searchTerm && (
          <button className="see-all-button" onClick={() => navigate('/menu')}>
            <span>See All</span>
          </button>
        )}
        {error && (
          <p className="section-subtitle error-text">{error}</p>
        )}
      </div>
      
      {/* Horizontal scrolling container - matching Flutter app */}
      <div className="menu-horizontal-container">
        <div className="menu-horizontal-scroll">
          {menuItems.map((food) => (
            <div 
              key={food.id} 
              className="menu-card-horizontal"
              onClick={() => handleFoodClick(food)}
            >
              {/* Food Image - 120px height like Flutter app */}
              <div className="menu-image-horizontal">
                <img 
                  src={food.getPrimaryImage() || getPlaceholderByKey(food.id || food.name)} 
                  alt={food.name}
                  onError={(e) => {
                    e.currentTarget.src = getPlaceholderByKey(food.id || food.name);
                  }}
                />
                
                {/* Food type badges */}
                {food.getFoodTypeBadges().length > 0 && (
                  <div className="food-type-badges">
                    {food.getFoodTypeBadges().map((badge, index) => (
                      <span key={index} className="food-type-badge">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Food Details - matching Flutter app padding */}
              <div className="menu-content-horizontal">
                <h3 className="menu-name-horizontal">{food.name}</h3>
                <p className="menu-price-horizontal">{food.getFormattedPrice()}</p>
                
                {/* Preparation time */}
                <div className="menu-prep-time">
                  <MdAccessTime className="time-icon-small" />
                  <span>{food.getPreparationTimeText()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuList;
