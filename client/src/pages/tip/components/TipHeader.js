import React from 'react';

const TipHeader = ({ onBack }) => {
  return (
    <div className="tip-header">
      <button className="back-button" onClick={onBack} aria-label="Back">←</button>
    </div>
  );
};

export default TipHeader;
