import React from 'react';

const TipPresets = ({ options = [6,10,14,18], selected, onChange }) => {
  return (
    <div className="tip-options">
      {options.map((percentage) => (
        <button
          key={percentage}
          className={`tip-option ${selected === percentage ? 'selected' : ''}`}
          onClick={() => onChange(percentage)}
        >
          {percentage}%
        </button>
      ))}
    </div>
  );
};

export default TipPresets;
