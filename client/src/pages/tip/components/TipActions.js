import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

const TipActions = ({ onAddTip, onSkipTip, tipAmount = 0 }) => {
  const { t } = useTranslation();
  return (
    <div className="tip-actions">
      <button className="add-tip-button" onClick={onAddTip}>
        {t('tip.add_tip')} (${tipAmount.toFixed(2)})
      </button>
      <button className="skip-tip-button" onClick={onSkipTip}>
        {t('tip.skip')}
      </button>
    </div>
  );
};

export default TipActions;
