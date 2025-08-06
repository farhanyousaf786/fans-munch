import React from 'react';
import { MdFavorite, MdFavoriteBorder, MdShoppingCart } from 'react-icons/md';
import './FoodBottomBar.css';

const FoodBottomBar = ({ isFavorite, onToggleFavorite, onAddToCart }) => {
  return (
    <div className="food-detail-bottom-bar">
      <button 
        className={`favorite-button ${isFavorite ? 'liked' : ''}`}
        onClick={onToggleFavorite}
      >
        {isFavorite ? <MdFavorite /> : <MdFavoriteBorder />}
      </button>
      
      <button className="add-to-cart-button" onClick={onAddToCart}>
        <MdShoppingCart className="cart-icon" />
        <span>Add to Cart</span>
      </button>
    </div>
  );
};

export default FoodBottomBar;
