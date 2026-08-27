import React from 'react';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { useTranslation } from '../../../i18n/i18n';
import './LoadingState.css';

const LoadingState = ({ onBack }) => {
  const { lang } = useTranslation();
  const isRTL = lang === 'he';

  return (
    <div className="food-detail-screen">
      <div className="food-detail-header">
        <button className="back-button" onClick={onBack} aria-label="Back" type="button">
          {isRTL ? <MdArrowForward /> : <MdArrowBack />}
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
