import React from 'react';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { useTranslation } from '../../../i18n/i18n';

const TipHeader = ({ onBack }) => {
  const { lang } = useTranslation();
  const isRTL = lang === 'he';

  return (
    <div className="tip-header">
      <button className="back-button" onClick={onBack} aria-label="Back" type="button">
        {isRTL ? <MdArrowForward size={22} /> : <MdArrowBack size={22} />}
      </button>
    </div>
  );
};

export default TipHeader;
