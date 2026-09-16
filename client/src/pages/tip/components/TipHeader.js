import React from 'react';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { useTranslation } from '../../../i18n/i18n';

const TipHeader = ({ onBack }) => {
  const { lang, t } = useTranslation();
  const isRTL = lang === 'he';

  return (
    <div className="tip-header">
      <button className="tip-back-button" onClick={onBack} aria-label={t('common.back') || 'Back'} type="button">
        {isRTL ? <MdArrowForward size={22} /> : <MdArrowBack size={22} />}
      </button>
    </div>
  );
};

export default TipHeader;
