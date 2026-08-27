import React from 'react';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import './ErrorState.css';
import { useTranslation } from '../../../i18n/i18n';

const ErrorState = ({ error, onBack, onRetry }) => {
  const { t, lang } = useTranslation();
  const isRTL = lang === 'he';

  return (
    <div className="food-detail-screen">
      <div className="food-detail-header">
        <button className="back-button" onClick={onBack} aria-label="Back" type="button">
          {isRTL ? <MdArrowForward /> : <MdArrowBack />}
        </button>
      </div>
      <div className="error-container">
        <p className="error-text">{error || t('food.not_found')}</p>
        <button className="retry-button" onClick={onRetry}>
          {t('food.try_again')}
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
