import React from 'react';
import { MdShoppingCart } from 'react-icons/md';
import './CartEmptyState.css';

const CartEmptyState = () => {
  return (
    <div className="empty-cart">
      <MdShoppingCart size={100} className="empty-cart-icon" />
      <h3 className="empty-cart-title">Cart is empty</h3>
    </div>
  );
};

export default CartEmptyState;
