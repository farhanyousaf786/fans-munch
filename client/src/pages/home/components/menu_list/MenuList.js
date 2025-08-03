import React, { useState, useEffect } from 'react';
import { MdAdd, MdAccessTime } from 'react-icons/md';
import foodRepository from '../../../../repositories/foodRepository';
import { stadiumStorage } from '../../../../utils/storage';
import './MenuList.css';

const MenuList = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get selected stadium to filter menu items
      const selectedStadium = stadiumStorage.getSelectedStadium();
      
      let result;
      if (selectedStadium && selectedStadium.id) {
        // Fetch menu items for specific stadium (matching Flutter app)
        result = await foodRepository.getStadiumMenu(selectedStadium.id, 10);
      } else {
        // Fallback to all menu items
        result = await foodRepository.getAllMenuItems();
      }
      
      if (result.success) {
        setMenuItems(result.foods);
      } else {
        setError(result.error || 'Failed to load menu items');
        setMenuItems([]);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFoodClick = (food) => {
    // In real app, this would navigate to food detail page
    console.log('Navigate to food detail:', food);
  };

  const handleAddToCart = (food) => {
    // In real app, this would add food to cart
    console.log('Added to cart:', food);
  };

  // Loading state
  if (loading) {
    return (
      <div className="menu-list">
        <div className="section-header">
          <h2 className="section-title">Popular Menu</h2>
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
    return (
      <div className="menu-list">
        <div className="section-header">
          <h2 className="section-title">Popular Menu</h2>
        </div>
        <div className="menu-empty">
          <p>No menu items available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-list">
      <div className="section-header">
        <h2 className="section-title">Popular Menu</h2>
        {error && (
          <p className="section-subtitle error-text">
            {error} - Showing demo data
          </p>
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
                  src={food.getPrimaryImage()} 
                  alt={food.name}
                  onError={(e) => {
                    e.target.src = '/api/placeholder/160/120';
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
              
              {/* Add to cart button */}
              <button 
                className="add-to-cart-btn-horizontal"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(food);
                }}
              >
                <MdAdd className="add-icon-small" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuList;
