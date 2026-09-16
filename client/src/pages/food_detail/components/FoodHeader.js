import React, { useMemo } from 'react';
import { MdArrowBack, MdArrowForward, MdFavoriteBorder, MdFavorite } from 'react-icons/md';
import { useTranslation } from '../../../i18n/i18n';
import { getFoodImageUrl, getLocalizedName } from '../../../utils/localization';
import './FoodHeader.css';

const FoodHeader = ({ food, comboItems = null, onBack, isFavorite, onToggleFavorite }) => {
  const { lang } = useTranslation();
  const isRTL = lang === 'he';
  const imageUrl = useMemo(() => getFoodImageUrl(food, comboItems), [food, comboItems]);
  const displayName = getLocalizedName(food, lang, food?.name || 'Food');

  return (
    <div className="food-detail-header">
      <button className="fd-back-button" onClick={onBack} aria-label="Back" type="button">
        {isRTL ? <MdArrowForward /> : <MdArrowBack />}
      </button>
      <button className={`fd-fav-button ${isFavorite ? 'liked' : ''}`} onClick={onToggleFavorite} aria-label="Favorite">
        {isFavorite ? <MdFavorite /> : <MdFavoriteBorder />}
      </button>
      <div className="food-image-container">
        <img
          src={imageUrl}
          alt={displayName}
          className="food-image"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = `${process.env.PUBLIC_URL || ''}/assets/images/on-boarding-1.png`;
          }}
        />
        <div className="image-fade" />
      </div>
      <div className="header-curve"></div>
    </div>
  );
};

export default FoodHeader;
