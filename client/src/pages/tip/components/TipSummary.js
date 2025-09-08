import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

const TipSummary = ({ tipAmount = 0, onCustomTip }) => {
  const { t } = useTranslation();
  const formatILS = (val) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(val || 0);
  return (
    <div className="tip-amount-section">
      <div className="tip-amount-row">
        <span className="tip-label">{t('tip.tip_amount')}</span>
        <span className="tip-amount">{formatILS(tipAmount)}</span>
        {onCustomTip && (
          <button type="button" className="custom-tip-link" onClick={onCustomTip}>{t('tip.custom_tip')}</button>
        )}
      </div>
    </div>
  );
};

export default TipSummary;
