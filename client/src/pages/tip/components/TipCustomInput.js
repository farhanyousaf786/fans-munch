import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

const TipCustomInput = ({ value, onChange, inputRef }) => {
  const { t } = useTranslation();
  return (
    <div className="custom-tip-section">
      <label className="custom-tip-label">{t('tip.custom_tip_label')}</label>
      <input
        type="number"
        className="custom-tip-input"
        placeholder={t('tip.custom_tip_placeholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        max="500"
        ref={inputRef}
      />
    </div>
  );
};

export default TipCustomInput;
