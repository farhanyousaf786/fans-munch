import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

const OrderSummary = ({ orderTotal = 0, deliveryFee = 0, tipData = { amount: 0, percentage: 0 }, finalTotal = 0 }) => {
  const { t } = useTranslation();
  const formatILS = (val) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(val || 0);
  return (
    <div className="order-summary-section">
      <h2 className="section-title">{t('order.summary_title')}</h2>

      <div className="summary-row">
        <span className="summary-label">{t('order.subtotal')}</span>
        <span className="summary-value">{formatILS(orderTotal)}</span>
      </div>

      <div className="summary-row">
        <span className="summary-label">{t('cart.delivery')}</span>
        <span className="summary-value">{formatILS(deliveryFee)}</span>
      </div>

      <div className="summary-row">
        <span className="summary-label">{t('order.tip')} ({tipData.percentage}%)</span>
        <span className="summary-value">{formatILS(tipData.amount)}</span>
      </div>

      <div className="summary-row total">
        <span className="summary-label">{t('order.total')}</span>
        <span className="summary-value">{formatILS(finalTotal)}</span>
      </div>
    </div>
  );
};

export default OrderSummary;
