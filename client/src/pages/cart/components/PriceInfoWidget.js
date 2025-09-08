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
  // Lightweight client-side conversion. You can replace rates with a live API if desired.
  const FX_RATES = {
    // value is how many target currency units for 1 ILS
    USD: 0.27,
    EUR: 0.25,
  };
  const formatCurrency = (valILS, code) => {
    const rate = FX_RATES[code] || 1;
    const value = (valILS || 0) * rate;
    const locale = code === 'USD' ? 'en-US' : code === 'EUR' ? 'de-DE' : 'he-IL';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(value);
  };

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

        {/* Converted totals row */}
        <div className="currency-row">
          <span className="currency-badge usd">{formatCurrency(calculateTotal(), 'USD')}</span>
          <span className="currency-badge ils">{formatILS(calculateTotal())}</span>
          <span className="currency-badge eur">{formatCurrency(calculateTotal(), 'EUR')}</span>
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
