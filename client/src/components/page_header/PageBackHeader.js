import React from 'react';
import BackButton from './BackButton';
import './PageBackHeader.css';

/**
 * Title row with a consistent back button for settings / secondary screens.
 */
const PageBackHeader = ({ title, fallbackTo = '/profile', onBack, variant = 'default' }) => {
  return (
    <div className={`page-back-header page-back-header--${variant}`}>
      <BackButton onClick={onBack} fallbackTo={fallbackTo} variant={variant === 'on-dark' ? 'light' : 'default'} />
      {title ? <h1 className="page-back-title">{title}</h1> : <span className="page-back-title-spacer" />}
    </div>
  );
};

export default PageBackHeader;
