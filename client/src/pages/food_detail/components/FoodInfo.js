import React from 'react';
import { MdStar, MdAccessTime } from 'react-icons/md';
import './FoodInfo.css';
import { useTranslation } from '../../../i18n/i18n';

const FoodInfo = ({ food, rating, testimonials, orderCount }) => {
  const { t } = useTranslation();
  const formatILS = (val) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(val || 0);
  // Check if this is an offer item with discount
  const hasDiscount = food?.discountPercentage && food.discountPercentage > 0;
  const discountedPrice = hasDiscount ? food.price * (1 - food.discountPercentage / 100) : food?.price;
  
  return (
    <div className="food-info-section">
      <div className="food-title-row">
        <h1 className="food-name">{food?.name}</h1>
        <div className="food-rating">
          <MdStar className="star-icon" />
          <span className="rating-value">{rating.toFixed(1)}</span>
          <span className="rating-count">({testimonials.length})</span>
        </div>
      </div>
      
      <div className="food-meta">
        <div className="food-price-container">
          {hasDiscount ? (
            <>
              <div className="discounted-price">{formatILS(discountedPrice)}</div>
              <div className="original-price">{formatILS(food?.price)}</div>
              <div className="discount-badge">{Math.round(food.discountPercentage)}% {t('food.off')}</div>
            </>
          ) : (
            <div className="food-price">{formatILS(food?.price)}</div>
          )}
        </div>
        <div className="food-prep-time">
          <MdAccessTime className="time-icon" />
          <span>{food?.preparationTime || 15} {t('food.min')}</span>
        </div>
        <div className="order-count">{orderCount} {t('food.orders')}</div>
      </div>
    </div>
  );
};

export default FoodInfo;
