import React from 'react';
import { useTranslation } from '../../../i18n/i18n';
import { formatPriceWithCurrency } from '../../../utils/currencyConverter';

const TipActions = ({ onAddTip, onSkipTip, tipAmount = 0 }) => {
  const { t } = useTranslation();
  return (
    <div className="tip-actions">
      <button className="add-tip-button" onClick={onAddTip}>
        {t('tip.add_tip')} ({formatPriceWithCurrency(tipAmount, 'ILS')})
      </button>
      <button className="skip-tip-button" onClick={onSkipTip}>
        {t('tip.skip')}
      </button>
    </div>
  );
};

export default TipActions;
