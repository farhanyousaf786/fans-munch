import React from 'react';

const TipCustomInput = ({ value, onChange }) => {
  return (
    <div className="custom-tip-section">
      <label className="custom-tip-label">Custom tip (%)</label>
      <input
        type="number"
        className="custom-tip-input"
        placeholder="Enter custom percentage"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        max="100"
      />
    </div>
  );
};

export default TipCustomInput;
