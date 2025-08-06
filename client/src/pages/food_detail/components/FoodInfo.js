import React from 'react';
import { MdStar, MdAccessTime } from 'react-icons/md';
import './FoodInfo.css';

const FoodInfo = ({ food, rating, testimonials, orderCount }) => {
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
              <div className="discounted-price">${discountedPrice?.toFixed(2)}</div>
              <div className="original-price">${food?.price?.toFixed(2)}</div>
              <div className="discount-badge">{Math.round(food.discountPercentage)}% OFF</div>
            </>
          ) : (
            <div className="food-price">${food?.price?.toFixed(2)}</div>
          )}
        </div>
        <div className="food-prep-time">
          <MdAccessTime className="time-icon" />
          <span>{food?.preparationTime || 15} min</span>
        </div>
        <div className="order-count">{orderCount} orders</div>
      </div>
    </div>
  );
};

export default FoodInfo;
