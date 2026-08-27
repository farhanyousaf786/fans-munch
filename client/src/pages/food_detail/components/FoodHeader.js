import React from 'react';
import { MdArrowBack, MdArrowForward, MdRestaurant, MdFavoriteBorder, MdFavorite } from 'react-icons/md';
import { useTranslation } from '../../../i18n/i18n';
import './FoodHeader.css';

const FoodHeader = ({ food, onBack, isFavorite, onToggleFavorite }) => {
  const { lang } = useTranslation();
  const isRTL = lang === 'he';

  return (
    <div className="food-detail-header">
      <button className="fd-back-button" onClick={onBack} aria-label="Back" type="button">
        {isRTL ? <MdArrowForward /> : <MdArrowBack />}
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
