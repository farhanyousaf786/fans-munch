import React from 'react';
import { useTranslation } from '../../../i18n/i18n';
import { formatPriceWithCurrency } from '../../../utils/currencyConverter';
import { getPreferredCurrency } from '../../../services/currencyPreferenceService';

const TipSummary = ({ tipAmount = 0, onCustomTip }) => {
  const { t } = useTranslation();
  const preferredCurrency = getPreferredCurrency();
  
  return (
    <div className="tip-amount-section">
      <div className="tip-amount-row">
        <span className="tip-label">{t('tip.tip_amount')}</span>
        <span className="tip-amount">{formatPriceWithCurrency(tipAmount, preferredCurrency)}</span>
        {onCustomTip && (
          <button type="button" className="custom-tip-link" onClick={onCustomTip}>{t('tip.custom_tip')}</button>
        )}
      </div>
    </div>
  );
};

export default TipSummary;
