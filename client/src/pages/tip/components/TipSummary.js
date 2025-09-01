import React from 'react';

const TipSummary = ({ tipAmount = 0, onCustomTip }) => {
  return (
    <div className="tip-amount-section">
      <div className="tip-amount-row">
        <span className="tip-label">Tip Amount</span>
        <span className="tip-amount">${tipAmount.toFixed(2)}</span>
        {onCustomTip && (
          <button type="button" className="custom-tip-link" onClick={onCustomTip}>Custom Tip</button>
        )}
      </div>
    </div>
  );
};

export default TipSummary;
