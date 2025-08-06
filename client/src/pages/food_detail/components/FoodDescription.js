import React from 'react';
import './FoodDescription.css';

const FoodDescription = ({ description }) => {
  return (
    <div className="section">
      <h2 className="section-title">Description</h2>
      <p className="food-description">
        {description || 'No description available'}
      </p>
    </div>
  );
};

export default FoodDescription;
