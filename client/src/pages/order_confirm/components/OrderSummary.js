import React from 'react';

const OrderSummary = ({ orderTotal = 0, tipData = { amount: 0, percentage: 0 }, finalTotal = 0 }) => {
  return (
    <div className="order-summary-section">
      <h2 className="section-title">Order Summary</h2>

      <div className="summary-row">
        <span className="summary-label">Subtotal</span>
        <span className="summary-value">${orderTotal.toFixed(2)}</span>
      </div>

      <div className="summary-row">
        <span className="summary-label">Tip ({tipData.percentage}%)</span>
        <span className="summary-value">${tipData.amount.toFixed(2)}</span>
      </div>

      <div className="summary-row total">
        <span className="summary-label">Total</span>
        <span className="summary-value">${finalTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default OrderSummary;
