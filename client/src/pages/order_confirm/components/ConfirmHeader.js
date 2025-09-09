import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

const ConfirmHeader = ({ title }) => {
  const { t } = useTranslation();
  const resolvedTitle = title || t('order.confirm_title');
  return (
    <div className="order-confirm-header">
      <h1 className="order-confirm-title">{resolvedTitle}</h1>
    </div>
  );
};

export default ConfirmHeader;
