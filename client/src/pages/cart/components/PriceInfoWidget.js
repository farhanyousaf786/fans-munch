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

  const formatILS = (val) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(val || 0);

  return (
    <div className="price-info-widget">
      <div className="price-info-content">
        {/* Price breakdown */}
        <div className="price-row">
          <span>{t('cart.subtotal')}</span>
          <span>{formatILS(calculateSubtotal())}</span>
        </div>
        <div className="price-row">
          <span>{t('cart.delivery')}</span>
          <span>{formatILS(calculateDeliveryFee())}</span>
        </div>
        
       
        <div className="price-row total">
          <span>{t('cart.total')}</span>
          <span>{formatILS(calculateTotal())}</span>
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
