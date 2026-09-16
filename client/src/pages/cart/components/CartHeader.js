import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdArrowForward, MdDeleteSweep } from 'react-icons/md';
import './CartHeader.css';
import { useTranslation } from '../../../i18n/i18n';

const CartHeader = ({
  isFromHome = false,
  onBack,
  fallbackTo = '/home',
  onClearCart = null,
  showClearCart = false,
}) => {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const isRTL = lang === 'he';

  const bgUrl = process.env.PUBLIC_URL + '/assets/images/on-boarding-1.png';

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }
    if (fallbackTo) {
      navigate(fallbackTo);
      return;
    }
    navigate(-1);
  };

  return (
    <div className="cart-hero" style={{ backgroundImage: `url(${bgUrl})` }}>
      {!isFromHome && (
        <button className="cart-back-button" onClick={handleBack} aria-label="Back" type="button">
          {isRTL ? <MdArrowForward /> : <MdArrowBack />}
        </button>
      )}
      {showClearCart && typeof onClearCart === 'function' && (
        <button
          type="button"
          className="cart-clear-button"
          onClick={onClearCart}
          aria-label={t('cart.clear_cart')}
        >
          <MdDeleteSweep size={18} />
          <span>{t('cart.clear_cart')}</span>
        </button>
      )}
      <div className="cart-hero-overlay" />
      <h1 className="cart-hero-title">{t('cart.add_to_cart')}</h1>
    </div>
  );
};

export default CartHeader;
