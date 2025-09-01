import React from 'react';
import { MdArrowBack, MdRestaurant, MdFavoriteBorder, MdFavorite } from 'react-icons/md';
import './FoodHeader.css';

const FoodHeader = ({ food, onBack, isFavorite, onToggleFavorite }) => {
  return (
    <div className="food-detail-header">
      <button className="fd-back-button" onClick={onBack}>
        <MdArrowBack />
      </button>
      <button className={`fd-fav-button ${isFavorite ? 'liked' : ''}`} onClick={onToggleFavorite} aria-label="Favorite">
        {isFavorite ? <MdFavorite /> : <MdFavoriteBorder />}
      </button>
      <div className="food-image-container">
        {food?.images && food.images.length > 0 ? (
          <img 
            src={food.images[0]} 
            alt={food.name}
            className="food-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="food-image-placeholder" style={{ display: food?.images?.length > 0 ? 'none' : 'flex' }}>
          <MdRestaurant className="placeholder-icon" />
        </div>
        <div className="image-fade" />
      </div>
      <div className="header-curve"></div>
    </div>
  );
};

export default FoodHeader;
