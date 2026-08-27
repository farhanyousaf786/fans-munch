import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { useTranslation } from '../../i18n/i18n';
import './PageBackHeader.css';

/**
 * Consistent circular back control with RTL-aware arrow icons.
 */
const BackButton = ({
  onClick,
  fallbackTo = '/profile',
  className = '',
  variant = 'default', // default | light | hero
  ariaLabel = 'Back',
}) => {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const isRTL = lang === 'he';

  const handleClick = () => {
    if (typeof onClick === 'function') {
      onClick();
      return;
    }
    try {
      if (window.history.length > 1) {
        navigate(-1);
        return;
      }
    } catch (_) {}
    navigate(fallbackTo);
  };

  const classes = ['fm-back-btn', variant !== 'default' ? `fm-back-btn--${variant}` : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} onClick={handleClick} aria-label={ariaLabel}>
      {isRTL ? <MdArrowForward /> : <MdArrowBack />}
    </button>
  );
};

export default BackButton;
