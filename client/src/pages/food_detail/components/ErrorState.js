import React from 'react';
import { MdArrowBack } from 'react-icons/md';
import './ErrorState.css';

const ErrorState = ({ error, onBack, onRetry }) => {
  return (
    <div className="food-detail-screen">
      <div className="food-detail-header">
        <button className="back-button" onClick={onBack}>
          <MdArrowBack />
        </button>
      </div>
      <div className="error-container">
        <p className="error-text">{error || 'Food not found'}</p>
        <button className="retry-button" onClick={onRetry}>
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
