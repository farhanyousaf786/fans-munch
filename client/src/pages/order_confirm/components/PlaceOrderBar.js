import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

const PlaceOrderBar = ({ loading, finalTotal, onPlaceOrder }) => {
  const { t } = useTranslation();
  const totalStr = `$${finalTotal.toFixed(2)}`;
  const buttonLabel = loading
    ? t('order.processing')
    : t('order.place_order_with_total').replace('${total}', totalStr);
  return (
    <div className="place-order-section">
      <button className="place-order-button" onClick={onPlaceOrder} disabled={loading}>
        {buttonLabel}
      </button>
    </div>
  );
};

export default PlaceOrderBar;
