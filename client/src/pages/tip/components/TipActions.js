import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

const TipActions = ({ onAddTip, onSkipTip, tipAmount = 0 }) => {
  const { t } = useTranslation();
  const formatILS = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(val || 0);
  return (
    <div className="tip-actions">
      <button className="add-tip-button" onClick={onAddTip}>
        {t('tip.add_tip')} ({formatILS(tipAmount)})
      </button>
      <button className="skip-tip-button" onClick={onSkipTip}>
        {t('tip.skip')}
      </button>
    </div>
  );
};

export default TipActions;
