import React from 'react';
import { MdArrowBack } from 'react-icons/md';
import './LoadingState.css';

const LoadingState = ({ onBack }) => {
  return (
    <div className="food-detail-screen">
      <div className="food-detail-header">
        <button className="back-button" onClick={onBack}>
          <MdArrowBack />
        </button>
      </div>
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading food details...</p>
      </div>
    </div>
  );
};

export default LoadingState;
