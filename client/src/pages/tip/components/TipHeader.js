import React from 'react';

const TipHeader = ({ onBack }) => {
  return (
    <div className="tip-header">
      <button className="back-button" onClick={onBack} aria-label="Back">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
    </div>
  );
};

export default TipHeader;
