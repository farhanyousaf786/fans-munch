import React from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { useTranslation } from '../../../i18n/i18n';

const ConfirmHeader = ({ title, onBack }) => {
  const { t } = useTranslation();
  const resolvedTitle = title || t('order.confirm_title');
  return (
    <div className="order-confirm-header">
      <button className="back-button" onClick={onBack} aria-label={t('common.back')}>
        <IoArrowBack size={24} />
      </button>
      <h1 className="order-confirm-title">{resolvedTitle}</h1>
    </div>
  );
};

export default ConfirmHeader;
