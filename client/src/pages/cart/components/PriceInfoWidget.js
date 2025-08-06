import React from 'react';
import './PriceInfoWidget.css';

const PriceInfoWidget = ({ 
  cartItems, 
  calculateSubtotal, 
  calculateDeliveryFee, 
  calculateTip, 
  calculateDiscount, 
  calculateTotal, 
  onPlaceOrder 
}) => {
  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="price-info-widget">
      <div className="price-info-content">
        {/* Price breakdown */}
        <div className="price-row">
          <span>Subtotal</span>
          <span>${calculateSubtotal().toFixed(2)}</span>
        </div>
        <div className="price-row">
          <span>Handling & Delivery</span>
          <span>${calculateDeliveryFee().toFixed(2)}</span>
        </div>
        <div className="price-row">
          <span>Tip</span>
          <span>${calculateTip().toFixed(2)}</span>
        </div>
        <div className="price-row">
          <span>Discount</span>
          <span>-${calculateDiscount().toFixed(2)}</span>
        </div>
        <div className="price-row total">
          <span>Total</span>
          <span>${calculateTotal().toFixed(2)}</span>
        </div>
        
        {/* Place Order Button */}
        <button className="place-order-button" onClick={onPlaceOrder}>
          Place Order
        </button>
      </div>
    </div>
  );
};

export default PriceInfoWidget;
