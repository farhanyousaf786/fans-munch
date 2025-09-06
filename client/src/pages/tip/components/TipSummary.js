import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

const TipSummary = ({ tipAmount = 0, onCustomTip }) => {
  const { t } = useTranslation();
  return (
    <div className="tip-amount-section">
      <div className="tip-amount-row">
        <span className="tip-label">{t('tip.tip_amount')}</span>
        <span className="tip-amount">${tipAmount.toFixed(2)}</span>
        {onCustomTip && (
          <button type="button" className="custom-tip-link" onClick={onCustomTip}>{t('tip.custom_tip')}</button>
        )}
      </div>
    </div>
  );
};

export default TipSummary;
