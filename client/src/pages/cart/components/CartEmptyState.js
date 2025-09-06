import React from 'react';
import { MdShoppingCart } from 'react-icons/md';
import './CartEmptyState.css';
import { useTranslation } from '../../../i18n/i18n';

const CartEmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="empty-cart">
      <MdShoppingCart size={100} className="empty-cart-icon" />
      <h3 className="empty-cart-title">{t('cart.empty')}</h3>
    </div>
  );
};

export default CartEmptyState;
