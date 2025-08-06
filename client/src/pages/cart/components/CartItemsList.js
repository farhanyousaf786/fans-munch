import React from 'react';
import CartItem from './CartItem';
import './CartItemsList.css';

const CartItemsList = ({ cartItems, onUpdateQuantity, onAddToCart, onRemoveFromCart }) => {
  return (
    <div className="cart-items-list">
      {cartItems.map((item, index) => (
        <CartItem
          key={item.id}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
        />
      ))}
    </div>
  );
};

export default CartItemsList;
