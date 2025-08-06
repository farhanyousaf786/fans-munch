import React from 'react';
import { MdStar, MdAccessTime } from 'react-icons/md';
import './FoodInfo.css';

const FoodInfo = ({ food, rating, testimonials, orderCount }) => {
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
        <div className="food-price">${food?.price?.toFixed(2)}</div>
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
