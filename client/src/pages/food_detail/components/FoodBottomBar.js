import React, { useState } from 'react';
import { MdAdd, MdRemove } from 'react-icons/md';
import './FoodBottomBar.css';
import { useTranslation } from '../../../i18n/i18n';

const FoodBottomBar = ({ onAddToCart }) => {
  const { t, lang } = useTranslation();
  const isRTL = lang === 'he';

  // Handle add to cart
  const handleAddToCart = async () => {
    try { 
      await onAddToCart && onAddToCart(1); 
    } catch (_) {}
  };

  return (
    <div className="food-detail-bottom-bar" dir={isRTL ? 'rtl' : 'ltr'}>
      <button 
        className="add-to-cart-btn-full"
        onClick={handleAddToCart}
      >
        {t('cart.add_to_cart')}
      </button>
    </div>
  );
};

export default FoodBottomBar;
