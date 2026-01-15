import React, { useEffect } from 'react';
import { useTranslation } from '../../../i18n/i18n';
import { formatPriceWithCurrency } from '../../../utils/currencyConverter';
import { cartUtils } from '../../../utils/cartUtils';

const OrderSummary = ({ orderTotal = 0, deliveryFee = 0, tipData = { amount: 0, percentage: 0 }, finalTotal = 0, deliveryType = null }) => {
  const { t, lang } = useTranslation();
  
  // Force re-render when language changes
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  useEffect(() => {
    console.log('🌐 OrderSummary language:', lang);
    console.log('🌐 Delivery translation:', t('cart.delivery'));
    forceUpdate();
  }, [lang, t]);

  // Get cart currency for conversion
  const getCartCurrency = () => {
    const cartItems = cartUtils.getCartItems();
    if (cartItems.length > 0) {
      return cartItems[0].currency || 'ILS';
    }
    return 'ILS';
  };

  // Only show delivery fee if a delivery type is selected
  const showDeliveryFee = deliveryType === 'inside' || deliveryType === 'outside';

  return (
    <div className="order-summary-section">
      <h2 className="section-title">{t('order.summary_title')}</h2>

      <div className="summary-row">
        <span className="summary-label">{t('order.subtotal')}</span>
        <span className="summary-value">{formatPriceWithCurrency(orderTotal, getCartCurrency())}</span>
      </div>

      {showDeliveryFee && (
        <div className="summary-row">
          <span className="summary-label">{t('cart.delivery')}</span>
          <span className="summary-value">{formatPriceWithCurrency(deliveryFee, getCartCurrency())}</span>
        </div>
      )}

      <div className="summary-row">
        <span className="summary-label">{t('order.tip')}</span>
        <span className="summary-value">{formatPriceWithCurrency(tipData.amount, getCartCurrency())}</span>
      </div>

      <div className="summary-row total">
        <span className="summary-label">{t('order.total')}</span>
        <span className="summary-value">{formatPriceWithCurrency(finalTotal, getCartCurrency())}</span>
      </div>
    </div>
  );
};

export default OrderSummary;
