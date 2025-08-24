import React from 'react';

const TipSummary = ({ tipAmount = 0 }) => {
  return (
    <div className="tip-amount-section">
      <div className="tip-amount-row">
        <span className="tip-label">Tip Amount</span>
        <span className="tip-amount">${tipAmount.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default TipSummary;
