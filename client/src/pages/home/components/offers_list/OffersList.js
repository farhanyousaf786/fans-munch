import React from 'react';
import { MdAccessTime, MdAdd } from 'react-icons/md';
import './OffersList.css';

function OffersList({ offers = [], loading = false, error = null, searchTerm = '' }) {
  // Get section title based on search state
  const getSectionTitle = () => {
    if (searchTerm.trim()) {
      return `Offer Results (${offers.length})`;
    }
    return 'Special Offers';
  };

  // Handle offer click
  const handleOfferClick = (offer) => {
    console.log('Navigate to offer detail:', offer);
  };

  // Handle add to cart
  const handleAddToCart = (offer) => {
    console.log('Added offer to cart:', offer);
  };

  // Loading state
  if (loading) {
    return (
      <div className="offers-list">
        <div className="section-header">
          <h2 className="section-title">{getSectionTitle()}</h2>
        </div>
        <div className="offers-loading">
          <div className="offers-shimmer-container">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="offer-shimmer-card">
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
  if (!loading && offers.length === 0) {
    const emptyMessage = searchTerm.trim() 
      ? `No offers found for "${searchTerm}"`
      : 'No special offers available';
    
    return (
      <div className="offers-list">
        <div className="section-header">
          <h2 className="section-title">{getSectionTitle()}</h2>
        </div>
        <div className="offers-empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="offers-list">
      <div className="section-header">
        <h2 className="section-title">{getSectionTitle()}</h2>
        {error && (
          <p className="section-subtitle error-text">
            {error}
          </p>
        )}
      </div>
      
      {/* Horizontal scrolling container - matching Flutter app */}
      <div className="offers-horizontal-container">
        <div className="offers-horizontal-scroll">
          {offers.map((offer) => (
            <div 
              key={offer.id} 
              className="offer-card-horizontal"
              onClick={() => handleOfferClick(offer)}
            >
              {/* Offer Image */}
              <div className="offer-image-horizontal">
                <img 
                  src={offer.getPrimaryImage()} 
                  alt={offer.name}
                  onError={(e) => {
                    e.target.src = '/api/placeholder/200/150';
                  }}
                />
                
                {/* Discount Badge */}
                <div className="discount-badge-horizontal">
                  {offer.getDiscountBadgeText()}
                </div>
                
                {/* Food Type Badges */}
                {offer.getFoodTypeBadges().length > 0 && (
                  <div className="food-type-badges-horizontal">
                    {offer.getFoodTypeBadges().map((badge, index) => (
                      <span key={index} className="food-type-badge-horizontal">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Offer Content */}
              <div className="offer-content-horizontal">
                <h3 className="offer-name-horizontal">{offer.name}</h3>
                
                {/* Price Section */}
                <div className="offer-price-section">
                  <span className="original-price-horizontal">
                    {offer.getFormattedPrice()}
                  </span>
                  <span className="discounted-price-horizontal">
                    {offer.getFormattedDiscountedPrice()}
                  </span>
                </div>
                
                {/* Preparation Time */}
                <div className="offer-prep-time">
                  <MdAccessTime className="time-icon-small" />
                  <span>{offer.preparationTime} min</span>
                </div>
              </div>
              
              {/* Add to Cart Button */}
              <button 
                className="add-to-cart-btn-horizontal"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(offer);
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

export default OffersList;
