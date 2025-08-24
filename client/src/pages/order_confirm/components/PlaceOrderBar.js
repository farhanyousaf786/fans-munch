import React from 'react';

const PlaceOrderBar = ({ loading, finalTotal, onPlaceOrder }) => {
  return (
    <div className="place-order-section">
      <button className="place-order-button" onClick={onPlaceOrder} disabled={loading}>
        {loading ? 'Processing...' : `Place Order - $${finalTotal.toFixed(2)}`}
      </button>
    </div>
  );
};

export default PlaceOrderBar;
