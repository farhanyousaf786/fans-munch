import React from 'react';

const TipPresets = ({ options = [2, 4, 6, 8], selected, onChange }) => {
  const formatILS = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val || 0);
  
  return (
    <div className="tip-options">
      {options.map((amount) => (
        <button
          key={amount}
          className={`tip-option ${selected === amount ? 'selected' : ''}`}
          onClick={() => onChange(amount)}
        >
          {formatILS(amount)}
        </button>
      ))}
    </div>
  );
};

export default TipPresets;
