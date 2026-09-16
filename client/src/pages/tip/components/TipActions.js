import React from 'react';
import { useTranslation } from '../../../i18n/i18n';
import { formatPriceWithCurrency } from '../../../utils/currencyConverter';
import { getPreferredCurrency } from '../../../services/currencyPreferenceService';

const TipActions = ({ onAddTip, onSkipTip, tipAmount = 0 }) => {
  const { t } = useTranslation();
  const preferredCurrency = getPreferredCurrency();
  
  return (
    <div className="tip-actions">
      <button type="button" className="add-tip-button" onClick={onAddTip}>
        {t('tip.add_tip')} ({formatPriceWithCurrency(tipAmount, preferredCurrency)})
      </button>
      <button type="button" className="skip-tip-button" onClick={onSkipTip}>
        {t('tip.skip')}
      </button>
    </div>
  );
};

export default TipActions;
