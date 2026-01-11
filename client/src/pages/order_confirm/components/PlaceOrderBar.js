import React from 'react';
import { useTranslation } from '../../../i18n/i18n';
import { formatPriceWithCurrency } from '../../../utils/currencyConverter';
import { cartUtils } from '../../../utils/cartUtils';

const PlaceOrderBar = ({ loading, finalTotal, onPlaceOrder }) => {
  const { t } = useTranslation();
  
  // Get cart currency for conversion
  const getCartCurrency = () => {
    const cartItems = cartUtils.getCartItems();
    if (cartItems.length > 0) {
      return cartItems[0].currency || 'ILS';
    }
    return 'ILS';
  };
  
  const totalStr = formatPriceWithCurrency(finalTotal, getCartCurrency());
  const buttonLabel = loading
    ? t('order.processing')
    : t('order.place_order_with_total').replace('{total}', totalStr);
  return (
    <div className="place-order-section">
      <button className="place-order-button" onClick={onPlaceOrder} disabled={loading}>
        {buttonLabel}
      </button>
    </div>
  );
};

export default PlaceOrderBar;
