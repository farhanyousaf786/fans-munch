import React from 'react';
import { MdAdd, MdRemove, MdDelete, MdShoppingCart } from 'react-icons/md';
import './CartItem.css';

const CartItem = ({ item, onUpdateQuantity, onAddToCart, onRemoveFromCart }) => {
  const formatILS = (val) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(val || 0);
  return (
    <div className="cart-item-wrapper">
      {/* Cart Item (matches Flutter CartItem widget) */}
      <div className="cart-item">
        {/* Item Info Section */}
        <div className="item-info">
          <div className="item-header">
            <h4 className="item-name">{item.name}</h4>
            <div className="quantity-controls">
              <button 
                className="quantity-btn remove"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              >
                <MdRemove size={16} />
              </button>
              <span className="quantity-display">{String(item.quantity).padStart(2, '0')}</span>
              <button 
                className="quantity-btn add"
                onClick={() => onAddToCart(item.id)}
              >
                <MdAdd size={16} />
              </button>
            </div>
          </div>
          
          <div className="item-price-section">
            <span className="item-price">{formatILS(item.price)}</span>
          </div>
        </div>

        {/* Item Image */}
        <div className="item-image-container">
          {item.images && item.images.length > 0 ? (
            <img 
              src={item.images[0]} 
              alt={item.name}
              className="item-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="image-placeholder" style={{ display: item.images && item.images.length > 0 ? 'none' : 'flex' }}>
            <MdShoppingCart size={40} />
          </div>
        </div>
      </div>
      
      {/* Swipe to delete functionality (matches Flutter Dismissible) */}
      <button 
        className="delete-button"
        onClick={() => onRemoveFromCart(item.id)}
        title="Remove item"
      >
        <MdDelete size={20} />
      </button>
    </div>
  );
};

export default CartItem;
