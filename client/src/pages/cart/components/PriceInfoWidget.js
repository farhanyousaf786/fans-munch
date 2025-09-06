import React from 'react';
import './PriceInfoWidget.css';
import { useTranslation } from '../../../i18n/i18n';

const PriceInfoWidget = ({ 
  cartItems, 
  calculateSubtotal, 
  calculateDeliveryFee, 
  calculateTip, 
  calculateDiscount, 
  calculateTotal, 
  onPlaceOrder 
}) => {
  const { t } = useTranslation();
  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="price-info-widget">
      <div className="price-info-content">
        {/* Price breakdown */}
        <div className="price-row">
          <span>{t('cart.subtotal')}</span>
          <span>${calculateSubtotal().toFixed(2)}</span>
        </div>
        <div className="price-row">
          <span>{t('cart.delivery')}</span>
          <span>${calculateDeliveryFee().toFixed(2)}</span>
        </div>
        <div className="price-row">
          <span>{t('cart.tip')}</span>
          <span>${calculateTip().toFixed(2)}</span>
        </div>
        <div className="price-row">
          <span>{t('cart.discount')}</span>
          <span>-${calculateDiscount().toFixed(2)}</span>
        </div>
        <div className="price-row total">
          <span>{t('cart.total')}</span>
          <span>${calculateTotal().toFixed(2)}</span>
        </div>
        
        {/* Place Order Button */}
        <button className="place-order-button" onClick={onPlaceOrder}>
          {t('cart.place_order')}
        </button>
      </div>
    </div>
  );
};

export default PriceInfoWidget;
