import React from 'react';
import './FoodDescription.css';
import { useTranslation } from '../../../i18n/i18n';

const FoodDescription = ({ description }) => {
  const { t } = useTranslation();
  return (
    <div className="section">
      <h2 className="section-title">{t('food.description')}</h2>
      <p className="food-description">
        {description || t('food.no_description')}
      </p>
    </div>
  );
};

export default FoodDescription;
