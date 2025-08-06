import React from 'react';
import CartHeader from './CartHeader';
import './CartLoadingState.css';

const CartLoadingState = ({ isFromHome = false }) => {
  return (
    <div className="cart-screen">
      <div className="cart-container">
        <CartHeader isFromHome={isFromHome} />
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading cart...</p>
        </div>
      </div>
    </div>
  );
};

export default CartLoadingState;
