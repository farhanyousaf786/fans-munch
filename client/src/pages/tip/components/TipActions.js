import React from 'react';

const TipActions = ({ onAddTip, onSkipTip, tipAmount = 0 }) => {
  return (
    <div className="tip-actions">
      <button className="add-tip-button" onClick={onAddTip}>
        Add Tip (${tipAmount.toFixed(2)})
      </button>
      <button className="skip-tip-button" onClick={onSkipTip}>
        Skip
      </button>
    </div>
  );
};

export default TipActions;
