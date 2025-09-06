import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

const OrderSummary = ({ orderTotal = 0, tipData = { amount: 0, percentage: 0 }, finalTotal = 0 }) => {
  const { t } = useTranslation();
  return (
    <div className="order-summary-section">
      <h2 className="section-title">{t('order.summary_title')}</h2>

      <div className="summary-row">
        <span className="summary-label">{t('order.subtotal')}</span>
        <span className="summary-value">${orderTotal.toFixed(2)}</span>
      </div>

      <div className="summary-row">
        <span className="summary-label">{t('order.tip')} ({tipData.percentage}%)</span>
        <span className="summary-value">${tipData.amount.toFixed(2)}</span>
      </div>

      <div className="summary-row total">
        <span className="summary-label">{t('order.total')}</span>
        <span className="summary-value">${finalTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default OrderSummary;
